import { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  FilterConfig,
  UseFilterizeProps,
  UseFilterizeReturn,
  FilterValues,
} from '../types';
import { StorageManager } from '../utils/storage/adapters/storageManager';
import { detectCircularDependencies } from '../utils/dependency';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { UrlManager } from '../utils/url';
import { useEnhancedFilterHistory } from './useEnhancedHistory';
import { useFetchState } from './useFetchState';
import { useFilterSync } from './useFilterSync';
import { useFilterValues } from './useFilterValues';
import { isEmpty } from 'lodash';
import { areDepArraysEqual, areObjectsEqual } from '../utils/object';

export const useFilterize = <TConfig extends FilterConfig[]>({
  config: fConfig,
  options = {},
  fetch,
}: UseFilterizeProps<TConfig>): UseFilterizeReturn<TConfig> => {
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

  const urlManager = useMemo(() => {
    if (!options.url) return null;
    return new UrlManager(typeof options.url === 'boolean' ? {} : options.url);
  }, [options.url]);

  const storageManager = useMemo(
    () => new StorageManager(memoizedOptions.storage),
    [memoizedOptions.storage]
  );

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

  const {
    filters,
    filterSource,
    updateFilter,
    setFilters,
    setFilterSource,
    reset,
    bulkUpdateFilter,
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

  useEffect(() => {
    detectCircularDependencies(fConfig);
  }, []);

  const isFirstMount = useRef(true);

  const hasFetchedRef = useRef(false);

  const prevFiltersRef = useRef<any>(null);

  const prevDepsRef = useRef<any[]>([]);

  const depsRef = useRef<any[]>(memoizedOptions.fetch.dependencies || []);

  useEffect(() => {
    const currentDeps = memoizedOptions.fetch.dependencies || [];

    const depsChanged = !areDepArraysEqual(prevDepsRef.current, currentDeps);

    if (depsChanged) {
      prevDepsRef.current = JSON.parse(JSON.stringify(currentDeps));
      depsRef.current = currentDeps;

      if (
        !isFirstMount.current &&
        hasFetchedRef.current &&
        memoizedOptions.autoFetch
      ) {
        console.log('Dependencies changed, triggering fetch');
        debouncedFetch();
      }
    }
  }, [
    memoizedOptions.fetch.dependencies,
    debouncedFetch,
    memoizedOptions.autoFetch,
  ]);

  useEffect(() => {
    if (isFirstMount.current) {
      console.log('Initial mount, setting up fetch');

      if (memoizedOptions.autoFetch) {
        console.log('Auto-fetching on initial mount');
        debouncedFetch();
        hasFetchedRef.current = true;
      }

      isFirstMount.current = false;
      prevFiltersRef.current = { ...filters };
      return;
    }

    const filtersChanged = !areObjectsEqual(prevFiltersRef.current, filters);

    if (filtersChanged && memoizedOptions.autoFetch) {
      console.log('Filters changed, triggering fetch');
      debouncedFetch();
      hasFetchedRef.current = true;
      prevFiltersRef.current = { ...filters };
    }
  }, [filters, memoizedOptions.autoFetch, debouncedFetch]);

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

  return {
    filters,
    updateFilter,
    bulkUpdateFilter,
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
