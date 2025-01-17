import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { validateFilters } from '../utils/validation';
import {
  UseFilterizeProps,
  RetryConfig,
  FilterConfig,
  UseFilterizeReturn,
  FilterValues,
} from '../types';
import { StorageManager } from '../storage/adapters/storageManager';
import { DataTransformer } from '../utils/transform';
import { useFilterHistory } from './useFilterHistory';
import { withRetry } from '../utils/retry';
import { detectCircularDependencies } from '../utils/dependency';

export const useFilterize = <TConfig extends FilterConfig[]>({
  filtersConfig,
  options = {},
  fetchData,
}: UseFilterizeProps<TConfig>): UseFilterizeReturn<TConfig> => {
  console.log('[useFilterize] Initializing useFilterize hook');

  // Memoize options object
  const memoizedOptions = useMemo(
    () => ({
      syncWithUrl: false,
      urlFiltersKey: 'filters',
      encodeUrlFilters: true,
      storage: { type: 'none' as const },
      cacheTimeout: 5 * 60 * 1000,
      autoFetch: true,
      ...options,
    }),
    [options]
  );

  const {
    syncWithUrl,
    urlFiltersKey,
    encodeUrlFilters,
    storage,
    cacheTimeout,
    autoFetch,
  } = memoizedOptions;

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

  const storageManager = useMemo(() => new StorageManager(storage), [storage]);

  // State management
  const [filters, setFilters] = useState<Partial<FilterValues<TConfig>>>(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedFilters = urlParams.get(urlFiltersKey);
      return encodedFilters
        ? (deserializeFilters(encodedFilters, encodeUrlFilters) as Partial<
            FilterValues<TConfig>
          >)
        : {};
    }
    return {};
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  // Memoize history management hooks
  const {
    history,
    push: pushHistory,
    undo: undoHistory,
    redo: redoHistory,
    canUndo,
    canRedo,
  } = useFilterHistory(
    useMemo(
      () => ({
        filters,
        timestamp: Date.now(),
      }),
      [filters]
    )
  );

  // Memoize update history function
  const updateHistoryForFilters = useCallback(
    (newFilters: Partial<FilterValues<TConfig>>) => {
      if (syncWithUrl) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(
          urlFiltersKey,
          serializeFilters(newFilters, encodeUrlFilters)
        );
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
      }
    },
    [syncWithUrl, urlFiltersKey, encodeUrlFilters]
  );

  // Update history when filters change
  useEffect(() => {
    pushHistory({
      filters,
      timestamp: Date.now(),
    });
  }, [filters, pushHistory]);

  // Check for circular dependencies on mount only
  useEffect(() => {
    detectCircularDependencies(filtersConfig);
  }, []); // Empty dependency array as this should only run once

  // Memoize undo/redo functions
  const undo = useCallback(() => {
    undoHistory();
    const previousState = history.past[history.past.length - 1];
    if (previousState) {
      setFilters(previousState.filters);
      updateHistoryForFilters(previousState.filters);
    }
  }, [history.past, undoHistory, updateHistoryForFilters]);

  const redo = useCallback(() => {
    redoHistory();
    const nextState = history.future[0];
    if (nextState) {
      setFilters(nextState.filters);
      updateHistoryForFilters(nextState.filters);
    }
  }, [history.future, redoHistory, updateHistoryForFilters]);

  // Load initial state from storage once
  useEffect(() => {
    const loadStoredData = async () => {
      const storedData = await storageManager.load();
      if (storedData) {
        setFilters(storedData.filters as Partial<FilterValues<TConfig>>);
      }
    };

    loadStoredData();
  }, []);

  // Save state to storage when filters change
  useEffect(() => {
    const saveData = async () => {
      await storageManager.save({
        filters,
        timestamp: Date.now(),
      });
    };

    saveData();
  }, [filters, storageManager]);

  // Cache management with useRef
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(
    new Map()
  );

  // URL synchronization
  useEffect(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedFilters = urlParams.get(urlFiltersKey);
      const urlFilters = encodedFilters
        ? deserializeFilters(encodedFilters, encodeUrlFilters)
        : {};
      setFilters(urlFilters as Partial<FilterValues<TConfig>>);
    }
  }, [syncWithUrl, urlFiltersKey, encodeUrlFilters]);

  // Memoize update filter function
  const updateFilter = useCallback(
    <K extends keyof FilterValues<TConfig>>(
      key: K,
      value: FilterValues<TConfig>[K]
    ) => {
      setFilters(prev => {
        const newFilters = {
          ...prev,
          [key as string]: value,
        } as Partial<FilterValues<TConfig>>;
        updateHistoryForFilters(newFilters);
        return newFilters;
      });
    },
    [syncWithUrl, urlFiltersKey, encodeUrlFilters, updateHistoryForFilters]
  );

  // Memoize fetch function
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
      const isValid = await validateFilters(activeFilters, filtersConfig);
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
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      fetchFilteredData();
    }
  }, [autoFetch, fetchFilteredData]);

  // Memoize export/import functions
  const exportFilters = useCallback(
    () => ({
      filters: serializeFilters(filters),
    }),
    [filters]
  );

  const importFilters = useCallback(
    (data: { filters: string; groups?: string[] }) => {
      const importedFilters = deserializeFilters(
        data.filters,
        encodeUrlFilters
      );
      setFilters(importedFilters as Partial<FilterValues<TConfig>>);
    },
    [encodeUrlFilters]
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
