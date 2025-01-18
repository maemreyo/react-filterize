import { useMemo, useCallback, useEffect } from 'react';
import {
  FilterConfig,
  UseFilterizeProps,
  UseFilterizeReturn,
  FilterValues,
} from '../types';
import { StorageManager } from '../storage/adapters/storageManager';
import { detectCircularDependencies } from '../utils/dependency';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { UrlManager } from '../utils/url';
import { useEnhancedFilterHistory } from './useEnhancedHistory';
import { useFetchState } from './useFetchState';
import { useFilterSync } from './useFilterSync';
import { useFilterValues } from './useFilterValues';
import { isEmpty } from 'lodash';

export const useFilterize = <TConfig extends FilterConfig[]>({
  config: fConfig,
  options = {},
  fetch,
}: UseFilterizeProps<TConfig>): UseFilterizeReturn<TConfig> => {
  // Memoize configurations
  const memoizedDefaultsConfig = useMemo(
    () => ({
      initialValues: {},
      resetValues: {},
      onReset: undefined,
      ...options.defaults,
    }),
    [options.defaults]
  );

  const memoizedOptions = useMemo(
    () => ({
      cacheTimeout: 5 * 60 * 1000,
      autoFetch: true,
      ...options,
      url: {
        key: 'filters',
        encode: true,
        mergeParams: true,
        namespace: 'ogn-filters',
        transformers: {},
        ...(options.url && typeof options.url === 'boolean' ? {} : options.url),
      },
      storage: {
        type: 'none' as const,
        ...options.storage,
      },
      retry: {
        attempts: 3,
        delay: 1000,
        backoff: true,
        ...options.retry,
      },
      transform: {
        input: (data: any) => data,
        output: (data: any) => data,
        ...options.transform,
      },
      fetch: {
        dependencies: [],
        debounceTime: 300,
        fetchOnEmpty: true,
        requiredFilters: [],
        shouldFetch: () => true,
        beforeFetch: filters => filters,
        onMissingRequired: () => {},
        onFetchPrevented: () => {},
        ...options.fetch,
      },
    }),
    [options]
  );

  // Initialize managers
  const urlManager = useMemo(() => {
    if (!options.url) return null;
    return new UrlManager(typeof options.url === 'boolean' ? {} : options.url);
  }, [options.url]);

  const storageManager = useMemo(
    () => new StorageManager(memoizedOptions.storage),
    [memoizedOptions.storage]
  );

  // Helper functions
  const getInitialValues = useCallback(() => {
    const configDefaults = fConfig.reduce((acc, filter) => {
      if (filter.defaultValue !== undefined) {
        acc[filter.key] = filter.defaultValue;
      }
      return acc;
    }, {} as Partial<FilterValues<TConfig>>);

    return {
      ...configDefaults,
      ...memoizedDefaultsConfig.initialValues,
    };
  }, [fConfig, memoizedDefaultsConfig.initialValues]);

  const getResetValues = useCallback(() => {
    if (memoizedDefaultsConfig.onReset) {
      return memoizedDefaultsConfig.onReset();
    }
    return {
      ...getInitialValues(),
      ...memoizedDefaultsConfig.resetValues,
    };
  }, [memoizedDefaultsConfig, getInitialValues]);

  const validateRequiredFilters = useCallback(
    (currentFilters: Partial<FilterValues<TConfig>>): string[] => {
      return (
        memoizedOptions.fetch.requiredFilters?.filter(
          key => currentFilters[key] == null || currentFilters[key] === ''
        ) || []
      );
    },
    [memoizedOptions.fetch.requiredFilters]
  );

  // Use custom hooks
  const {
    filters,
    filterSource,
    updateFilter,
    setFilters,
    setFilterSource,
    reset,
  } = useFilterValues<TConfig>({
    config: fConfig,
    options: memoizedOptions,
    urlManager,
    storageManager,
    getInitialValues,
    getResetValues,
  });

  const {
    loading,
    error,
    data,
    fetchState,
    fetchFilteredData,
    debouncedFetch,
  } = useFetchState<TConfig>({
    filters,
    config: fConfig,
    options: memoizedOptions,
    fetch,
    filterSource,
    validateRequiredFilters,
  });

  useFilterSync<TConfig>({
    filters,
    options: memoizedOptions,
    urlManager,
    storageManager,
    setFilters,
    setFilterSource,
    config: fConfig,
  });

  const { history } = useEnhancedFilterHistory({
    filters,
    options: {
      ...memoizedOptions,
      setFilters,
    },
  });

  // Check for circular dependencies on mount
  useEffect(() => {
    detectCircularDependencies(fConfig);
  }, []);

  // Auto-fetch effect
  useEffect(() => {
    console.log('AutoFetch effect triggered', {
      autoFetch: memoizedOptions.autoFetch,
      filters,
      dependencies: memoizedOptions.fetch.dependencies,
    });

    if (memoizedOptions.autoFetch) {
      console.log('Calling debouncedFetch due to autoFetch');
      debouncedFetch();
    }
  }, [
    ...(memoizedOptions.fetch.dependencies || []),
    filters,
    memoizedOptions.autoFetch,
  ]);

  // Export/Import functions
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
        memoizedOptions.url.encode,
        fConfig
      );
      setFilters(importedFilters as Partial<FilterValues<TConfig>>);
    },
    [memoizedOptions.url.encode, fConfig, setFilters]
  );

  const clearStorage = useCallback(async () => {
    await storageManager.clear();
    if (!memoizedOptions.url || isEmpty(memoizedOptions.url)) {
      setFilters({});
      setFilterSource('default');
    }
  }, [storageManager, memoizedOptions.url, setFilters, setFilterSource]);

  // Return all the necessary values and functions
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
    history,
  };
};
