import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  serializeFilters,
  deserializeFilters,
  convertInputValue,
} from '../utils/serialization';
import { validateFilters } from '../utils/validation';
import {
  UseFilterizeProps,
  RetryConfig,
  FilterConfig,
  UseFilterizeReturn,
  FilterValues,
  FilterSource,
} from '../types';
import { StorageManager } from '../storage/adapters/storageManager';
import { DataTransformer } from '../utils/transform';
import { useFilterHistory } from './useFilterHistory';
import { withRetry } from '../utils/retry';
import { detectCircularDependencies } from '../utils/dependency';

export const useFilterize = <TConfig extends FilterConfig[]>({
  config: fConfig,
  options = {},
  fetch,
}: UseFilterizeProps<TConfig>): UseFilterizeReturn<TConfig> => {
  console.log('[useFilterize] Initializing useFilterize hook');

  const memoizedFiltersConfig = useMemo(() => fConfig, []);
  const memoizedOptions = useMemo(
    () => ({
      syncWithUrl: false,
      urlFiltersKey: 'filters',
      encodeUrlFilters: true,
      storage: {
        type: 'none' as const,
      },
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
  const [filterSource, setFilterSource] = useState<FilterSource>('none');
  const storageManager = useMemo(() => new StorageManager(storage), [storage]);

  // Helper function to deserialize URL filters
  const deserializeUrlFilters = useCallback(
    (encodedFilters: string | null) => {
      if (!encodedFilters) return {};
      return deserializeFilters(
        encodedFilters,
        encodeUrlFilters,
        memoizedFiltersConfig
      ) as Partial<FilterValues<TConfig>>;
    },
    [encodeUrlFilters, memoizedFiltersConfig]
  );

  // State management
  const [filters, setFilters] = useState<Partial<FilterValues<TConfig>>>(() => {
    // Priority order: URL > Storage > Default
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedFilters = urlParams.get(urlFiltersKey);
      if (encodedFilters) {
        setFilterSource('url');
        return deserializeUrlFilters(encodedFilters) as Partial<
          FilterValues<TConfig>
        >;
      }
    }

    // Try loading from storage if no URL parameters
    const storedData = storageManager.loadSync();
    if (storedData?.filters) {
      setFilterSource('storage');
      return storedData.filters as Partial<FilterValues<TConfig>>;
    }

    setFilterSource('default');
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
    detectCircularDependencies(fConfig);
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

  // // Save state to storage when filters change
  // useEffect(() => {
  //   const saveData = async () => {
  //     await storageManager.save({
  //       filters,
  //       timestamp: Date.now(),
  //     });
  //   };

  //   saveData();
  // }, [filters, storageManager]);

  // Cache management with useRef
  const cache = useRef<
    Map<
      string,
      {
        data: any;
        timestamp: number;
        source: FilterSource;
      }
    >
  >(new Map());

  // URL synchronization
  useEffect(() => {
    if (syncWithUrl) {
      const handleUrlChange = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedFilters = urlParams.get(urlFiltersKey);

        if (encodedFilters) {
          const urlFilters = deserializeFilters(
            encodedFilters,
            encodeUrlFilters,
            memoizedFiltersConfig
          );
          setFilters(urlFilters as Partial<FilterValues<TConfig>>);
          setFilterSource('url');
        } else if (storage.type !== 'none') {
          // Fallback to storage if URL is empty
          const storedData = storageManager.loadSync();
          if (storedData?.filters) {
            setFilters(storedData.filters as Partial<FilterValues<TConfig>>);
            setFilterSource('storage');
          }
        }
      };

      window.addEventListener('popstate', handleUrlChange);
      return () => window.removeEventListener('popstate', handleUrlChange);
    }
  }, [
    syncWithUrl,
    urlFiltersKey,
    encodeUrlFilters,
    memoizedFiltersConfig,
    storage,
  ]);

  // Storage synchronization
  useEffect(() => {
    const saveToStorage = async () => {
      if (filterSource !== 'url' && storage.type !== 'none') {
        await storageManager.save({
          filters,
          timestamp: Date.now(),
        });
      }
    };

    saveToStorage();
  }, [filters, filterSource, storage]);

  // Memoize update filter function
  const updateFilter = useCallback(
    <K extends keyof FilterValues<TConfig>>(
      key: K,
      value: FilterValues<TConfig>[K]
    ) => {
      const config = memoizedFiltersConfig.find(c => c.key === key);
      const convertedValue = convertInputValue(value, config?.type);

      setFilters(prev => {
        const newFilters = {
          ...prev,
          [key]: convertedValue,
        } as Partial<FilterValues<TConfig>>;

        // Update URL if enabled
        if (syncWithUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set(
            urlFiltersKey,
            serializeFilters(newFilters, encodeUrlFilters)
          );
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.pushState({}, '', newUrl);
          setFilterSource('url');
        } else {
          setFilterSource('storage');
        }

        return newFilters;
      });
    },
    [memoizedFiltersConfig, syncWithUrl, urlFiltersKey, encodeUrlFilters]
  );

  // Memoize fetch function
  const fetchFilteredData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeFilters = {
        ...filters,
      };
      const cacheKey = JSON.stringify(activeFilters);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (cachedResult && Date.now() - cachedResult.timestamp < cacheTimeout) {
        setData(cachedResult.data);
        return;
      }

      // Validate filters
      const isValid = await validateFilters(activeFilters, fConfig);
      if (!isValid) {
        throw new Error('Invalid filter configuration');
      }

      // Process dependencies
      const processedFilters = await Promise.all(
        Object.entries(activeFilters).map(async ([key, value]) => {
          const config = fConfig.find(c => c.key === key);

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
        const rawData = await fetch(transformedFilters);
        return transformer.transformOutput(rawData);
      }, retryConfig);

      // Update cache
      cache.current.set(cacheKey, {
        data: result,
        source: filterSource,
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
        encodeUrlFilters,
        memoizedFiltersConfig
      );
      setFilters(importedFilters as Partial<FilterValues<TConfig>>);
    },
    [encodeUrlFilters, memoizedFiltersConfig]
  );

  const clearStorage = useCallback(async () => {
    await storageManager.clear();
    if (!syncWithUrl) {
      setFilters({});
      setFilterSource('default');
    }
  }, [storageManager, syncWithUrl]);

  const reset = useCallback(() => {
    setFilters({});
    setFilterSource('default');

    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete(urlFiltersKey);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, '', newUrl);
    }

    clearStorage();
  }, [clearStorage, syncWithUrl, urlFiltersKey]);

  return {
    filters,
    updateFilter,
    loading,
    error,
    data,
    filterSource,
    exportFilters,
    importFilters,
    fetch: fetchFilteredData,
    storage: {
      clear: clearStorage,
    },
    reset,
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
