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
import { UrlManager } from '../utils/url';
import { FetchState } from '../utils/state';
import { FetchConfig } from '../utils/fetch';
import { isEmpty } from '../utils/object';

export const useFilterize = <TConfig extends FilterConfig[]>({
  config: fConfig,
  options = {},
  fetch,
}: UseFilterizeProps<TConfig>): UseFilterizeReturn<TConfig> => {
  // Memoize default configs
  const memoizedDefaultsConfig = useMemo(
    () => ({
      initialValues: {},
      resetValues: {},
      onReset: undefined,
      ...options.defaults,
    }),
    [options.defaults]
  );

  // Get initial values from different sources with priority
  const getInitialValues = useCallback(() => {
    // 1. Config-level defaults (from FilterConfig.defaultValue)
    const configDefaults = fConfig.reduce((acc, filter) => {
      if (filter.defaultValue !== undefined) {
        // @ts-ignore
        acc[filter.key] = filter.defaultValue;
      }
      return acc;
    }, {} as Partial<FilterValues<TConfig>>);

    // 2. Override with initialValues from DefaultValuesConfig if provided
    return {
      ...configDefaults,
      ...memoizedDefaultsConfig.initialValues,
    };
  }, [fConfig, memoizedDefaultsConfig.initialValues]);

  // Get reset values
  const getResetValues = useCallback(() => {
    if (memoizedDefaultsConfig.onReset) {
      return memoizedDefaultsConfig.onReset();
    }

    // If no custom reset handler, use resetValues or fall back to initialValues
    return {
      ...getInitialValues(),
      ...memoizedDefaultsConfig.resetValues,
    };
  }, [memoizedDefaultsConfig, getInitialValues]);

  // Initialize URL manager if URL sync is enabled
  const urlManager = useMemo(() => {
    if (!options.url) return null;
    return new UrlManager(typeof options.url === 'boolean' ? {} : options.url);
  }, [options.url]);

  const memoizedFiltersConfig = useMemo(() => fConfig, []);

  // Memoized fetch options with defaults
  const memoizedFetchOptions = useMemo(
    () =>
      ({
        debounceTime: 300,
        fetchOnEmpty: false,
        dependencies: [],
        shouldFetch: () => true,
        requiredFilters: [],
        ...options.fetch,
      } as FetchConfig),
    [options.fetch]
  );

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
  const [fetchState, setFetchState] = useState<FetchState>({
    isInitialFetch: true,
    lastFetchedAt: null,
    preventedFetchCount: 0,
    lastPreventedAt: null,
    missingRequiredFilters: [],
  });

  const storageManager = useMemo(() => new StorageManager(storage), [storage]);

  // Helper to check required filters
  const validateRequiredFilters = useCallback(
    (currentFilters: Partial<FilterValues<TConfig>>): string[] => {
      return (
        memoizedFetchOptions.requiredFilters?.filter(
          // @ts-ignore
          key => currentFilters[key] == null || currentFilters[key] === ''
        ) || []
      );
    },
    [memoizedFetchOptions.requiredFilters]
  );

  // State management
  const [filters, setFilters] = useState<Partial<FilterValues<TConfig>>>(() => {
    // 1. Try URL params first
    if (urlManager) {
      const urlFilters = urlManager.getFiltersFromUrl();
      if (urlFilters && !isEmpty(urlFilters)) {
        setFilterSource('url');
        return urlFilters as Partial<FilterValues<TConfig>>;
      }
    }

    // 2. Try storage
    const storedData = storageManager.loadSync();
    if (storedData?.filters && !isEmpty(storedData.filters)) {
      setFilterSource('storage');
      return storedData.filters as Partial<FilterValues<TConfig>>;
    }

    // 3. Use initial values
    setFilterSource('default');
    return getInitialValues();
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

  // Update URL when filters change
  useEffect(() => {
    if (urlManager && filterSource !== 'url') {
      urlManager.updateUrl(filters);
    }
  }, [filters, filterSource]);

  // Listen to URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (!urlManager) return;

    const handleUrlChange = () => {
      const urlFilters = urlManager.getFiltersFromUrl();
      if (urlFilters) {
        setFilters(urlFilters as Partial<FilterValues<TConfig>>);
        setFilterSource('url');
      } else if (storage.type !== 'none') {
        const storedData = storageManager.loadSync();
        if (storedData?.filters) {
          setFilters(storedData.filters as Partial<FilterValues<TConfig>>);
          setFilterSource('storage');
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [urlManager]);

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

  // Enhanced fetchFilteredData
  const fetchFilteredData = useCallback(async () => {
    try {
      // Skip if there are no filters and fetchOnEmpty is false
      const shouldSkipEmpty =
        !memoizedFetchOptions.fetchOnEmpty && Object.keys(filters).length === 0;

      if (shouldSkipEmpty) {
        setFetchState(prev => ({
          ...prev,
          preventedFetchCount: prev.preventedFetchCount + 1,
          lastPreventedAt: Date.now(),
        }));
        memoizedFetchOptions.onFetchPrevented?.(filters);
        return;
      }

      // Check required filters
      const missingFilters = validateRequiredFilters(filters);
      if (missingFilters.length > 0) {
        setFetchState(prev => ({
          ...prev,
          missingRequiredFilters: missingFilters,
          preventedFetchCount: prev.preventedFetchCount + 1,
          lastPreventedAt: Date.now(),
        }));
        memoizedFetchOptions.onMissingRequired?.(missingFilters);
        return;
      }

      // Check shouldFetch condition
      // @ts-ignore
      const shouldProceed = await memoizedFetchOptions.shouldFetch(filters);
      if (!shouldProceed) {
        setFetchState(prev => ({
          ...prev,
          preventedFetchCount: prev.preventedFetchCount + 1,
          lastPreventedAt: Date.now(),
        }));
        memoizedFetchOptions.onFetchPrevented?.(filters);
        return;
      }

      setLoading(true);
      setError(null);

      // Transform filters before fetch if needed
      let transformedFilters = {
        ...filters,
      };
      if (memoizedFetchOptions.beforeFetch) {
        // @ts-ignore
        transformedFilters = await memoizedFetchOptions.beforeFetch(
          transformedFilters
        );
      }

      const cacheKey = JSON.stringify(transformedFilters);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (cachedResult && Date.now() - cachedResult.timestamp < cacheTimeout) {
        setData(cachedResult.data);
        setFetchState(prev => ({
          ...prev,
          isInitialFetch: false,
          lastFetchedAt: cachedResult.timestamp,
          missingRequiredFilters: [],
        }));
        return;
      }

      // Process filters with dependency checks
      const processedFilters = await Promise.all(
        Object.entries(transformedFilters).map(async ([key, value]) => {
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

      const finalFilters = Object.fromEntries(processedFilters);

      // Fetch with retry logic
      const result = await withRetry(async () => {
        const data = await fetch(finalFilters);
        return options.transform?.output
          ? options.transform.output(data)
          : data;
      }, retryConfig);

      // Update cache and state
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        source: filterSource,
      });

      setData(result);
      setFetchState(prev => ({
        ...prev,
        isInitialFetch: false,
        lastFetchedAt: Date.now(),
        missingRequiredFilters: [],
      }));
    } catch (err) {
      setError(err as Error);
      setFetchState(prev => ({
        ...prev,
        isInitialFetch: false,
      }));
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    memoizedFetchOptions,
    filterSource,
    cacheTimeout,
    fConfig,
    fetch,
    options.transform,
    retryConfig,
    validateRequiredFilters,
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
    const resetValues = getResetValues();
    setFilters(resetValues as any);
    setFilterSource('default');

    // Update URL if needed
    if (urlManager) {
      if (!isEmpty(resetValues)) {
        urlManager.updateUrl(resetValues);
      } else {
        urlManager.clearUrl();
      }
    }

    // Update storage if needed
    if (!isEmpty(resetValues)) {
      storageManager.save({
        filters: resetValues,
        timestamp: Date.now(),
      });
    } else {
      clearStorage();
    }
  }, [getResetValues, urlManager, clearStorage]);

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
    validateRequiredFilters,
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
