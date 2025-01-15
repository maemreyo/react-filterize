import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryFilter } from './useQueryFilter';
import { useRangeFilter } from './useRangeFilter';
import { useSelectFilter } from './useSelectFilter';
import { useFilterAnalytics } from './useFilterAnalytics';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { validateFilters } from '../utils/validation';
import { getPresetFilters } from '../utils/presets';
import { FilterTypes, UseAdvancedFilterProps } from '../types';

export const useAdvancedFilter = <T extends FilterTypes>({
  filtersConfig,
  fetchData,
  options = {},
  presets,
  groups,
}: UseAdvancedFilterProps<T>) => {
  const {
    syncWithUrl = false,
    persistFilters = false,
    enableAnalytics = false,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
  } = options;

  // State management
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  // Cache management
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(
    new Map()
  );

  // Analytics
  const analytics = enableAnalytics ? useFilterAnalytics() : null;

  // Initialize specialized hooks for each filter type
  const filterHooks = useMemo(() => {
    return filtersConfig.reduce((acc, config) => {
      switch (config.type) {
        case 'query':
          acc[config.key] = useQueryFilter({
            defaultValue: config.defaultValue as string,
            debounce: config.debounce,
            transform: config.transform,
            validation: config.validation,
          });
          break;
        case 'dateRange':
        case 'numberRange':
          acc[config.key] = useRangeFilter({
            defaultValue: config.defaultValue as [any, any],
            validation: config.validation,
          });
          break;
        case 'select':
        case 'multiSelect':
          acc[config.key] = useSelectFilter({
            defaultValue: config.defaultValue,
            validation: config.validation,
          });
          break;
      }
      return acc;
    }, {} as Record<string, any>);
  }, [filtersConfig]);

  // URL synchronization
  useEffect(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFilters = deserializeFilters(urlParams.get('filters') || '');
      setFilters(urlFilters);
    }
  }, [syncWithUrl]);

  // Local storage persistence
  useEffect(() => {
    if (persistFilters) {
      const savedFilters = localStorage.getItem('advancedFilters');
      if (savedFilters) {
        setFilters(JSON.parse(savedFilters));
      }
    }
  }, [persistFilters]);

  // Handle filter changes
  const updateFilter = useCallback(
    (key: string, value: any) => {
      setFilters(prev => {
        const newFilters = { ...prev, [key]: value };

        // Update URL if sync is enabled
        if (syncWithUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('filters', serializeFilters(newFilters));
          window.history.pushState({}, '', `?${urlParams.toString()}`);
        }

        // Persist to local storage if enabled
        if (persistFilters) {
          localStorage.setItem('advancedFilters', JSON.stringify(newFilters));
        }

        return newFilters;
      });
    },
    [syncWithUrl, persistFilters]
  );

  // Data fetching with cache
  const fetchFilteredData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate cache key
      const cacheKey = JSON.stringify(filters);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (cachedResult && Date.now() - cachedResult.timestamp < cacheTimeout) {
        setData(cachedResult.data);
        return;
      }

      // Validate filters
      const isValid = await validateFilters(filters, filtersConfig);
      if (!isValid) {
        throw new Error('Invalid filter configuration');
      }

      // Process dependencies
      const processedFilters = await Promise.all(
        Object.entries(filters).map(async ([key, value]) => {
          const config = filtersConfig.find(c => c.key === key);
          if (config?.dependencies) {
            const dependencyResults = await Promise.all(
              Object.entries(config.dependencies).map(
                async ([depKey, processor]) => {
                  return [depKey, await processor(value)];
                }
              )
            );
            return [key, Object.fromEntries(dependencyResults)];
          }
          return [key, value];
        })
      );

      // Fetch data
      const result = await fetchData(Object.fromEntries(processedFilters));

      // Update cache
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);

      // Track analytics if enabled
      if (enableAnalytics && analytics) {
        analytics.trackFilterUsage(filters);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    filtersConfig,
    fetchData,
    cacheTimeout,
    enableAnalytics,
    analytics,
  ]);

  // Apply preset filters
  const applyPreset = useCallback(
    (presetKey: string) => {
      const presetFilters = getPresetFilters(presetKey, presets);
      if (presetFilters) {
        setFilters(prev => ({ ...prev, ...presetFilters }));
      }
    },
    [presets]
  );

  // Export filters
  const exportFilters = useCallback(() => {
    return serializeFilters(filters);
  }, [filters]);

  // Import filters
  const importFilters = useCallback((serializedFilters: string) => {
    const importedFilters = deserializeFilters(serializedFilters);
    setFilters(importedFilters);
  }, []);

  return {
    filters,
    updateFilter,
    loading,
    error,
    data,
    filterHooks,
    applyPreset,
    exportFilters,
    importFilters,
    analytics: enableAnalytics ? analytics : null,
  };
};
