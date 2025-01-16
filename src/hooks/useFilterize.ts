import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFilterAnalytics } from './useFilterAnalytics';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { validateFilters } from '../utils/validation';
import { getPresetFilters } from '../utils/presets';
import {
  FilterTypes,
  UseFilterizeProps,
  RetryConfig,
} from '../types';
import { StorageManager } from '../storage/adapters/storageManager';
import useFilterHooks from './useFilterHooks';
import { DataTransformer } from '../utils/transform';
import { useFilterHistory } from './useFilterHistory';
import { withRetry } from '../utils/retry';

export const useFilterize = <T extends FilterTypes>({
  filtersConfig,
  fetchData,
  options = {},
  presets,
  groups,
}: UseFilterizeProps<T>) => {
  console.log('[useFilterize] Initializing useFilterize hook');

  const {
    syncWithUrl = false,
    storage = { type: 'session' as const },
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

  console.log('[useFilterize] Options:', {
    syncWithUrl,
    storage,
    enableAnalytics,
    cacheTimeout,
    autoFetch,
  });

  // Initialize storage manager
  const storageManager = useMemo(() => {
    console.log('[useFilterize] Initializing StorageManager');
    return new StorageManager(storage);
  }, [storage]);

  // State management
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      return deserializeFilters(urlParams.get('filters') || '');
    }
    return {};
  });
  console.log('[useFilterize] Initial filters state:', filters);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>(
    () => {
      console.log('[useFilterize] Initializing groupStates');
      const initialStates: Record<string, boolean> = {};
      if (groups) {
        Object.entries(groups).forEach(([key, group]) => {
          initialStates[key] = !group.collapsed; // inverted because collapsed means !expanded
        });
      }
      return initialStates;
    }
  );

  const {
    history,
    push: pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFilterHistory({
    filters,
    activeGroups,
    timestamp: Date.now(),
  });

  // Load initial state from storage
  useEffect(() => {
    console.log(
      '[useFilterize] useEffect - Loading initial state from storage'
    );
    const loadStoredData = async () => {
      console.log('[useFilterize] Loading stored data');
      const storedData = await storageManager.load();
      if (storedData) {
        console.log('[useFilterize] Loaded stored data:', storedData);
        setFilters(storedData.filters);
        setActiveGroups(storedData.activeGroups);
        setGroupStates(storedData.groupStates);
      } else {
        console.log('[useFilterize] No stored data found');
      }
    };

    loadStoredData();
  }, []);

  // Save state to storage when it changes
  useEffect(() => {
    console.log('[useFilterize] useEffect - Saving state to storage');
    const saveData = async () => {
      console.log('[useFilterize] Saving data:', {
        filters,
        activeGroups,
        groupStates,
        timestamp: Date.now(),
      });
      await storageManager.save({
        filters,
        activeGroups,
        groupStates,
        timestamp: Date.now(),
      });
    };

    saveData();
  }, [filters, activeGroups, groupStates, storageManager]);

  // Group management
  const getGroupFilters = useCallback(
    (groupKey: string): string[] => {
      console.log('[useFilterize] getGroupFilters for group:', groupKey);
      return groups?.[groupKey as any]?.filters || [];
    },
    [groups]
  );

  const toggleGroup = useCallback(
    (groupKey: string) => {
      console.log('[useFilterize] toggleGroup for group:', groupKey);
      setActiveGroups(prev => {
        const isActive = prev.includes(groupKey);
        if (isActive) {
          // Clear filters in this group
          const groupFilters = getGroupFilters(groupKey);
          setFilters(prevFilters => {
            const newFilters = { ...prevFilters };
            groupFilters.forEach(filterKey => {
              delete newFilters[filterKey];
            });
            console.log(
              '[useFilterize] Filters after clearing group:',
              newFilters
            );
            return newFilters;
          });
          return prev.filter(id => id !== groupKey);
        } else {
          return [...prev, groupKey];
        }
      });
    },
    [getGroupFilters]
  );

  // Group collapse/expand state management
  const toggleGroupCollapse = useCallback((groupKey: string) => {
    console.log('[useFilterize] toggleGroupCollapse for group:', groupKey);
    setGroupStates(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const isGroupCollapsed = useCallback(
    (groupKey: string) => {
      console.log('[useFilterize] isGroupCollapsed for group:', groupKey);
      return !groupStates[groupKey];
    },
    [groupStates]
  );

  // Get group metadata
  const getGroupMetadata = useCallback(
    (groupKey: string) => {
      console.log('[useFilterize] getGroupMetadata for group:', groupKey);
      const group = groups?.[groupKey as any];
      if (!group) return null;

      return {
        key: groupKey,
        label: group.label,
        description: group.description,
        collapsed: isGroupCollapsed(groupKey),
        isActive: activeGroups.includes(groupKey),
      };
    },
    [groups, isGroupCollapsed, activeGroups]
  );

  // Cache management
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(
    new Map()
  );

  // Analytics
  const analytics = enableAnalytics ? useFilterAnalytics() : null;

  // Initialize filter hooks using useFilterHooks
  const filterHooks = useFilterHooks(filtersConfig);

  const isGroupActive = useCallback(
    (groupId: string) => {
      console.log('[useFilterize] isGroupActive for group:', groupId);
      return activeGroups.includes(groupId);
    },
    [activeGroups]
  );

  // URL synchronization
  useEffect(() => {
    if (syncWithUrl) {
      console.log('[useFilterize] useEffect - Syncing with URL');
      const urlParams = new URLSearchParams(window.location.search);
      const urlFilters = deserializeFilters(urlParams.get('filters') || '');
      const urlGroups = urlParams.get('groups')?.split(',') || [];
      const urlGroupStates = urlParams.get('groupStates');

      console.log('[useFilterize] URL filters:', urlFilters);
      console.log('[useFilterize] URL groups:', urlGroups);
      console.log('[useFilterize] URL groupStates:', urlGroupStates);

      setFilters(urlFilters);
      setActiveGroups(urlGroups);

      if (urlGroupStates) {
        try {
          setGroupStates(JSON.parse(urlGroupStates));
        } catch (e) {
          console.error('Failed to parse group states from URL');
        }
      }
    }
  }, [syncWithUrl]);

  // Update synchronization
  const updateFilter = useCallback(
    (key: string, value: any) => {
      console.log('[useFilterize] updateFilter for key:', key, 'value:', value);
      setFilters(prev => {
        const newFilters = {
          ...prev,
          [key]: value,
        };

        if (syncWithUrl) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('filters', serializeFilters(newFilters));
          urlParams.set('groups', activeGroups.join(','));
          urlParams.set('groupStates', JSON.stringify(groupStates));
          window.history.pushState({}, '', `?${urlParams.toString()}`);
        }

        console.log('[useFilterize] Filters after update:', newFilters);
        return newFilters;
      });
    },
    [syncWithUrl, activeGroups, groupStates]
  );

  // Data fetching with cache
  const fetchFilteredData = useCallback(async () => {
    console.log('[useFilterize] fetchFilteredData');
    try {
      setLoading(true);
      setError(null);

      // Get active filters
      const activeFilters = { ...filters };
      console.log('[useFilterize] Active filters:', activeFilters);

      // Generate cache key từ filters gốc
      const cacheKey = JSON.stringify(activeFilters);

      // Check cache
      const cachedResult = cache.current.get(cacheKey);
      if (cachedResult && Date.now() - cachedResult.timestamp < cacheTimeout) {
        console.log('[useFilterize] Using cached data');
        setData(cachedResult.data);
        return;
      }

      // Validate filters
      const isValid = await validateFilters<T>(activeFilters, filtersConfig);
      if (!isValid) {
        throw new Error('Invalid filter configuration');
      }

      // Process dependencies
      const processedFilters = await Promise.all(
        Object.entries(activeFilters).map(async ([key, value]) => {
          console.log(
            '[useFilterize] Processing filter:',
            key,
            'with value:',
            value
          );

          const config = filtersConfig.find(c => c.key === key);
          console.log('[useFilterize] Filter config for', key, ':', config);

          if (config?.dependencies) {
            const dependencyResults = await Promise.all(
              Object.entries(config.dependencies).map(
                async ([depKey, processor]) => {
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

      const preparedFilters = Object.fromEntries(processedFilters);
      console.log('[useFilterize] Processed filters:', preparedFilters);

      // Transform input data nếu có
      const transformedFilters = transformer.transformInput(preparedFilters);
      console.log('[useFilterize] Transformed filters:', transformedFilters);

      // Fetch data với retry
      const result = await withRetry(async () => {
        const rawData = await fetchData(transformedFilters);
        // Transform output data nếu có
        return transformer.transformOutput(rawData);
      }, retryConfig);

      // Update cache với data đã transform
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);

      // Track analytics nếu enabled
      if (enableAnalytics && analytics) {
        console.log('[useFilterize] Tracking analytics');
        analytics.trackFilterUsage(activeFilters);
        // analytics.trackPerformance(Date.now() - startTime, false);
      }
    } catch (err) {
      console.error('[useFilterize] Error fetching data:', err);
      setError(err as Error);
    } finally {
      console.log('[useFilterize] Fetching completed');
      setLoading(false);
    }
  }, [
    filters,
    // filtersConfig,
    // fetchData,
    // cacheTimeout,
    // enableAnalytics,
    // analytics,
    // transformer,
    // retryConfig,
  ]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      console.log('[useFilterize] useEffect - Auto-fetching data');
      fetchFilteredData();
    }
  }, [fetchFilteredData, autoFetch]);

  // Apply preset filters
  const applyPreset = useCallback(
    (presetKey: string) => {
      console.log('[useFilterize] applyPreset for preset:', presetKey);
      const presetFilters = getPresetFilters(presetKey, presets);
      if (presetFilters) {
        console.log('[useFilterize] Applying preset filters:', presetFilters);
        setFilters(prev => ({
          ...prev,
          ...presetFilters,
        }));
      }
    },
    [presets]
  );

  // Export filters
  const exportFilters = useCallback(() => {
    console.log('[useFilterize] exportFilters');
    return {
      filters: serializeFilters(filters),
      groups: activeGroups,
    };
  }, [filters, activeGroups]);

  // Import filters
  const importFilters = useCallback(
    (data: { filters: string; groups?: string[] }) => {
      console.log('[useFilterize] importFilters with data:', data);
      const importedFilters = deserializeFilters(data.filters);
      console.log('[useFilterize] Imported filters:', importedFilters);
      setFilters(importedFilters);
      if (data.groups) {
        setActiveGroups(data.groups);
      }
    },
    []
  );

  // Clear storage
  const clearStorage = useCallback(async () => {
    console.log('[useFilterize] clearStorage');
    await storageManager.clear();
    setFilters({});
    setActiveGroups([]);
    setGroupStates({});
  }, [storageManager]);

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
    activeGroups,
    toggleGroup,
    isGroupActive,
    fetchData: fetchFilteredData,
    groups: groups
      ? {
          toggleGroup,
          isGroupActive,
          toggleCollapse: toggleGroupCollapse,
          isCollapsed: isGroupCollapsed,
          getMetadata: getGroupMetadata,
          activeGroups,
          availableGroups: Object.keys(groups).map(key =>
            getGroupMetadata(key)
          ),
        }
      : null,
    storage: {
      clear: clearStorage,
    },
  };
};
