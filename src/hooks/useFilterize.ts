import debounce from 'lodash/debounce';
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
      syncUrl: false,
      urlKey: 'filters',
      encode: true,
      storage: {
        type: 'none' as const,
      },
      cacheTimeout: 5 * 60 * 1000,
      autoFetch: true,
      ...options,
      fetch: {
        debounceTime: 300,
        fetchOnEmpty: false,
        defaultValues: {},
        dependencies: [],
        ...options.fetch,
      },
    }),
    [options]
  );

  const {
    syncUrl,
    urlKey,
    encode,
    storage,
    cacheTimeout,
    autoFetch,
    fetch: fetchOptions,
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
  const [fetchState, setFetchState] = useState({
    isInitialFetch: true,
    lastFetchedAt: null as number | null,
  });
  const storageManager = useMemo(() => new StorageManager(storage), [storage]);

  // Helper function to deserialize URL filters
  const deserializeUrlFilters = useCallback(
    (encodedFilters: string | null) => {
      if (!encodedFilters) return {};
      return deserializeFilters(
        encodedFilters,
        encode,
        memoizedFiltersConfig
      ) as Partial<FilterValues<TConfig>>;
    },
    [encode, memoizedFiltersConfig]
  );

  // State management
  const [filters, setFilters] = useState<Partial<FilterValues<TConfig>>>(() => {
    // Priority order: URL > Storage > Default
    if (syncUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedFilters = urlParams.get(urlKey);
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
      if (syncUrl) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(urlKey, serializeFilters(newFilters, encode));
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
      }
    },
    [syncUrl, urlKey, encode]
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
    if (syncUrl) {
      const handleUrlChange = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedFilters = urlParams.get(urlKey);

        if (encodedFilters) {
          const urlFilters = deserializeFilters(
            encodedFilters,
            encode,
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
  }, [syncUrl, urlKey, encode, memoizedFiltersConfig, storage]);

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
        if (syncUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set(urlKey, serializeFilters(newFilters, encode));
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.pushState({}, '', newUrl);
          setFilterSource('url');
        } else {
          setFilterSource('storage');
        }

        return newFilters;
      });
    },
    [memoizedFiltersConfig, syncUrl, urlKey, encode]
  );

  // Memoize fetch function
  const fetchFilteredData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeFilters = {
        ...filters,
      };

      const shouldSkipFetch =
        !fetchOptions.fetchOnEmpty &&
        Object.keys(activeFilters).length === 0 &&
        !fetchOptions.defaultValues;

      if (shouldSkipFetch) {
        return;
      }

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

      // Update cache and state
      cache.current.set(cacheKey, {
        data: result,
        source: filterSource,
        timestamp: Date.now(),
      });

      setData(result);
      setFetchState(prev => ({
        isInitialFetch: false,
        lastFetchedAt: Date.now(),
      }));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    filters,
  ]);

  const debouncedFetch = useMemo(
    () => debounce(fetchFilteredData, fetchOptions.debounceTime),
    [fetchFilteredData, fetchOptions.debounceTime]
  );

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      debouncedFetch();
    }
  }, [...(fetchOptions.dependencies || []), filters, autoFetch]);

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
        encode,
        memoizedFiltersConfig
      );
      setFilters(importedFilters as Partial<FilterValues<TConfig>>);
    },
    [encode, memoizedFiltersConfig]
  );

  const clearStorage = useCallback(async () => {
    await storageManager.clear();
    if (!syncUrl) {
      setFilters({});
      setFilterSource('default');
    }
  }, [storageManager, syncUrl]);

  const reset = useCallback(() => {
    setFilters((fetchOptions.defaultValues as any) || ({} as any));
    setFilterSource('default');

    if (syncUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete(urlKey);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, '', newUrl);
    }

    clearStorage();
  }, [fetchOptions, clearStorage, syncUrl, urlKey]);

  return {
    filters,
    updateFilter,
    loading,
    error,
    data,
    filterSource,
    reset,
    refetch: fetchFilteredData,
    fetchState,
    exportFilters,
    importFilters,
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
