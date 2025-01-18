import { useState, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { FilterConfig, FilterSource } from '../../types';
import { withRetry } from '../../utils/retry';
import { FetchState } from '../../utils/state';

export const useFetchState = <TConfig extends FilterConfig[]>({
  filters,
  config,
  options,
  fetch,
  filterSource,
  validateRequiredFilters,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const [fetchState, setFetchState] = useState<FetchState>({
    isInitialFetch: true,
    lastFetchedAt: null,
    preventedFetchCount: 0,
    lastPreventedAt: null,
    missingRequiredFilters: [],
  });

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

  const fetchFilteredData = useCallback(async () => {
    console.log('fetchFilteredData called with filters:', filters);

    try {
      // Check empty filters condition
      const shouldSkipEmpty =
        !options.fetch.fetchOnEmpty && Object.keys(filters).length === 0;

      console.log('shouldSkipEmpty:', shouldSkipEmpty, {
        fetchOnEmpty: options.fetch.fetchOnEmpty,
        filtersLength: Object.keys(filters).length,
      });

      if (shouldSkipEmpty) {
        console.log('Skipping fetch due to empty filters');
        setFetchState(prev => ({
          ...prev,
          preventedFetchCount: prev.preventedFetchCount + 1,
          lastPreventedAt: Date.now(),
        }));
        options.fetch.onFetchPrevented?.(filters);
        return;
      }

      // Check required filters
      const missingFilters = validateRequiredFilters(filters);
      console.log('missingFilters:', missingFilters);

      if (missingFilters.length > 0) {
        console.log(
          'Skipping fetch due to missing required filters:',
          missingFilters
        );
        setFetchState(prev => ({
          ...prev,
          missingRequiredFilters: missingFilters,
          preventedFetchCount: prev.preventedFetchCount + 1,
          lastPreventedAt: Date.now(),
        }));
        options.fetch.onMissingRequired?.(missingFilters);
        return;
      }

      // Check shouldFetch condition
      const shouldProceed = await options.fetch.shouldFetch?.(filters);
      console.log('shouldProceed:', shouldProceed);

      if (!shouldProceed) {
        console.log('Skipping fetch due to shouldFetch condition');
        setFetchState(prev => ({
          ...prev,
          preventedFetchCount: prev.preventedFetchCount + 1,
          lastPreventedAt: Date.now(),
        }));
        options.fetch.onFetchPrevented?.(filters);
        return;
      }

      setLoading(true);
      setError(null);

      let transformedFilters = { ...filters };
      if (options.fetch.beforeFetch) {
        transformedFilters = await options.fetch.beforeFetch(
          transformedFilters
        );
      }

      const cacheKey = JSON.stringify(transformedFilters);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < options.cacheTimeout
      ) {
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
          const filterConfig = config.find(c => c.key === key);
          if (filterConfig?.dependencies) {
            const dependencyResults = await Promise.all(
              Object.entries(filterConfig.dependencies).map(
                async ([depKey, processor]) => {
                  // @ts-ignore
                  const processedValue = await processor(value);
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

      // Actual API call
      console.log('Making API call with filters:', filters);
      const result = await withRetry(async () => {
        const data = await fetch(filters);
        return options.transform?.output
          ? options.transform.output(data)
          : data;
      }, options.retry);

      console.log('Fetch completed successfully:', result);

      setData(result);
      setFetchState(prev => ({
        ...prev,
        isInitialFetch: false,
        lastFetchedAt: Date.now(),
        missingRequiredFilters: [],
      }));
    } catch (err) {
      console.error('Fetch failed:', err);
      setError(err as Error);
      setFetchState(prev => ({
        ...prev,
        isInitialFetch: false,
      }));
    } finally {
      setLoading(false);
    }
  }, [filters, options, filterSource, config, fetch, validateRequiredFilters]);

  const debouncedFetch = useMemo(
    () => debounce(fetchFilteredData, options.fetch.debounceTime),
    [fetchFilteredData, options.fetch.debounceTime]
  );

  return {
    loading,
    error,
    data,
    fetchState,
    fetchFilteredData,
    debouncedFetch,
  };
};
