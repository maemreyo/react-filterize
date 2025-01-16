import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFilterAnalytics } from './useFilterAnalytics';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { validateFilters } from '../utils/validation';
import {
  UseFilterizeProps,
  RetryConfig,
  ValueTypeKey,
  OutputValueType,
} from '../types';
import { StorageManager } from '../storage/adapters/storageManager';
import { DataTransformer } from '../utils/transform';
import { useFilterHistory } from './useFilterHistory';
import { withRetry } from '../utils/retry';
import { detectCircularDependencies } from '../utils/dependency';

export const useFilterize = <T extends ValueTypeKey>({
  filtersConfig,
  fetchData,
  options = {},
}: UseFilterizeProps<T>) => {
  console.log('[useFilterize] Initializing useFilterize hook');

  const {
    syncWithUrl = false,
    storage = { type: 'none' as const },
    enableAnalytics = false,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    autoFetch = true,
  } = options;

  const retryConfig = useMemo<RetryConfig>(
    () => ({
      attempts: options.retry?.attempts ?? 3,
      delay: options.retry?.delay ?? 1000,
      backoff: options.retry?.backoff ?? true,
    }),
    [options.retry]
  );

  const transformer = useMemo(
    () =>
      new DataTransformer({
        input: options.transform?.input,
        output: options.transform?.output,
      }),
    [options.transform]
  );

  // Initialize storage manager
  const storageManager = useMemo(() => {
    return new StorageManager(storage);
  }, [storage]);

  // State management
  const [filters, setFilters] = useState<
    Partial<Record<string, OutputValueType[T]>>
  >(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      return deserializeFilters(urlParams.get('filters') || '');
    }
    return {};
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  // Initialize history management
  const {
    history,
    push: pushHistory,
    undo: undoHistory,
    redo: redoHistory,
    canUndo,
    canRedo,
  } = useFilterHistory({
    filters,
    timestamp: Date.now(),
  });

  // Update history when filters change
  useEffect(() => {
    pushHistory({
      filters,
      timestamp: Date.now(),
    });
  }, [filters]);

  // Check for circular dependencies on initialization
  useEffect(() => {
    detectCircularDependencies(filtersConfig);
  }, [filtersConfig]);

  // History management methods
  const undo = useCallback(() => {
    undoHistory();
    const previousState = history.past[history.past.length - 1];
    if (previousState) {
      setFilters(previousState.filters);

      if (syncWithUrl) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('filters', serializeFilters(previousState.filters));
        window.history.pushState({}, '', `?${urlParams.toString()}`);
      }
    }
  }, [history.past, syncWithUrl, undoHistory]);

  const redo = useCallback(() => {
    redoHistory();
    const nextState = history.future[0];
    if (nextState) {
      setFilters(nextState.filters);

      if (syncWithUrl) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('filters', serializeFilters(nextState.filters));
        window.history.pushState({}, '', `?${urlParams.toString()}`);
      }
    }
  }, [history.future, syncWithUrl, redoHistory]);

  // Load initial state from storage
  useEffect(() => {
    const loadStoredData = async () => {
      const storedData = await storageManager.load();
      if (storedData) {
        setFilters(storedData.filters);
      }
    };

    loadStoredData();
  }, []);

  // Save state to storage when it changes
  useEffect(() => {
    const saveData = async () => {
      await storageManager.save({
        filters,
        timestamp: Date.now(),
      });
    };

    saveData();
  }, [filters, storageManager]);

  // Cache management
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(
    new Map()
  );

  // Analytics
  const analytics = enableAnalytics ? useFilterAnalytics() : null;

  // URL synchronization
  useEffect(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFilters = deserializeFilters(urlParams.get('filters') || '');

      setFilters(urlFilters);
    }
  }, [syncWithUrl]);

  // Update synchronization
  const updateFilter = useCallback(
    <K extends string>(
      key: K,
      value: Partial<Record<string, OutputValueType[T]>>[K]
    ) => {
      setFilters(prev => {
        const newFilters = {
          ...prev,
          [key]: value,
        };

        if (syncWithUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('filters', serializeFilters(newFilters));
          window.history.pushState({}, '', `?${urlParams.toString()}`);
        }

        return newFilters;
      });
    },
    [syncWithUrl]
  );

  // Data fetching with cache
  const fetchFilteredData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeFilters = { ...filters };
      const cacheKey = JSON.stringify(activeFilters);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (cachedResult && Date.now() - cachedResult.timestamp < cacheTimeout) {
        setData(cachedResult.data);
        return;
      }

      // Validate filters
      const isValid = await validateFilters<T>(
        activeFilters as any,
        filtersConfig
      );
      if (!isValid) {
        throw new Error('Invalid filter configuration');
      }

      // Process dependencies
      const processedFilters = await Promise.all(
        Object.entries(activeFilters).map(async ([key, value]) => {
          const config = filtersConfig.find(c => c.key === key);

          if (config?.dependencies) {
            const dependencyResults = await Promise.all(
              Object.entries(config.dependencies).map(
                async ([depKey, processor]) => {
                  const processedValue = await processor(value as any);
                  return [depKey, processedValue];
                }
              )
            );

            return [key, Object.fromEntries(dependencyResults)];
          }

          return [key, value];
        })
      );

      const preparedFilters = Object.fromEntries(processedFilters);
      const transformedFilters = transformer.transformInput(preparedFilters);

      // Fetch data with retry
      const result = await withRetry(async () => {
        const rawData = await fetchData(transformedFilters);
        return transformer.transformOutput(rawData);
      }, retryConfig);

      // Update cache
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);

      // Track analytics if enabled
      if (enableAnalytics && analytics) {
        analytics.trackFilterUsage(activeFilters);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    cacheTimeout,
    filtersConfig,
    transformer,
    fetchData,
    retryConfig,
    enableAnalytics,
    analytics,
  ]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      fetchFilteredData();
    }
  }, [fetchFilteredData, autoFetch]);

  // Export filters
  const exportFilters = useCallback(() => {
    return {
      filters: serializeFilters(filters),
    };
  }, [filters]);

  // Import filters
  const importFilters = useCallback(
    (data: { filters: string; groups?: string[] }) => {
      const importedFilters = deserializeFilters(data.filters);
      setFilters(importedFilters);
    },
    []
  );

  const clearStorage = useCallback(async () => {
    await storageManager.clear();
    setFilters({});

    pushHistory({
      filters: {},
      timestamp: Date.now(),
    });
  }, [storageManager, pushHistory]);

  return {
    filters,
    updateFilter,
    loading,
    error,
    data,
    exportFilters,
    importFilters,
    analytics: enableAnalytics ? analytics : null,
    fetchData: fetchFilteredData,
    storage: {
      clear: clearStorage,
    },
    history: {
      undo,
      redo,
      canUndo,
      canRedo,
      current: history.present,
      past: history.past,
      future: history.future,
    },
  };
};
