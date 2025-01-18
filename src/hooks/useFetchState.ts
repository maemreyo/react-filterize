import { useState, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { FilterConfig, FilterSource } from '../types';
import { withRetry } from '../utils/retry';
import { FetchState } from '../utils/state';

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
    console.log('Current config:', config);
    console.log('Current options:', options);

    try {
      // Check empty filters condition
      const shouldSkipEmpty =
        !options.fetch.fetchOnEmpty && Object.keys(filters).length === 0;

      console.log('shouldSkipEmpty check:', {
        fetchOnEmpty: options.fetch.fetchOnEmpty,
        filtersLength: Object.keys(filters).length,
        shouldSkip: shouldSkipEmpty,
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
      console.log('Required filters validation:', {
        missingFilters,
        currentFilters: filters,
      });

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
      let shouldProceed = true;
      try {
        shouldProceed = (await options.fetch.shouldFetch?.(filters)) ?? true;
        console.log('shouldFetch evaluation:', { shouldProceed, filters });
      } catch (shouldFetchError) {
        console.error('Error in shouldFetch evaluation:', shouldFetchError);
        shouldProceed = false;
      }

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
      try {
        if (options.fetch.beforeFetch) {
          console.log('Applying beforeFetch transformation');
          transformedFilters = await options.fetch.beforeFetch(
            transformedFilters
          );
          console.log('Transformed filters:', transformedFilters);
        }
      } catch (transformError) {
        console.error('Error in beforeFetch transformation:', transformError);
        throw transformError;
      }

      const cacheKey = JSON.stringify(transformedFilters);
      console.log('Cache check with key:', cacheKey);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < options.cacheTimeout
      ) {
        console.log('Cache hit! Using cached data');
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
      console.log('Processing filters with dependencies. Config:', config);
      try {
        if (!transformedFilters) {
          throw new Error('transformedFilters is undefined or null');
        }

        const processedFilters = await Promise.all(
          Object.entries(transformedFilters).map(async ([key, value]) => {
            console.log('Processing filter:', { key, value });
            const filterConfig = config.find(c => c.key === key);

            if (filterConfig?.dependencies) {
              console.log(
                'Found dependencies for key:',
                key,
                filterConfig.dependencies
              );
              try {
                const dependencyResults = await Promise.all(
                  Object.entries(filterConfig.dependencies).map(
                    async ([depKey, processor]) => {
                      console.log('Processing dependency:', { depKey, value });
                      // @ts-ignore
                      const processedValue = await processor(value);
                      return [depKey, processedValue];
                    }
                  )
                );
                return [key, Object.fromEntries(dependencyResults)];
              } catch (depError) {
                console.error(
                  'Error processing dependencies for key:',
                  key,
                  depError
                );
                throw depError;
              }
            }
            return [key, value];
          })
        );

        const finalFilters = Object.fromEntries(processedFilters);
        console.log('Final processed filters:', finalFilters);

        // Actual API call
        console.log('Making API call with filters:', finalFilters);
        const result = await withRetry(async () => {
          const data = await fetch(filters);
          console.log('Raw API response:', data);

          if (options.transform?.output) {
            console.log('Applying output transformation');
            const transformed = options.transform.output(data);
            console.log('Transformed output:', transformed);
            return transformed;
          }
          return data;
        }, options.retry);

        console.log('Fetch completed successfully:', result);

        // Update cache
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
      } catch (processError) {
        console.error('Error in filter processing:', processError);
        throw processError;
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      console.error(
        'Error stack:',
        err instanceof Error ? err.stack : 'No stack available'
      );
      console.error('Current state:', {
        filters,
        config,
        options,
        filterSource,
      });
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
