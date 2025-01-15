import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFilterAnalytics } from './useFilterAnalytics';
import { serializeFilters, deserializeFilters } from '../utils/serialization';
import { validateFilters } from '../utils/validation';
import { getPresetFilters } from '../utils/presets';
import { FilterTypes, UseFilterizeProps, FilterTypeToValue } from '../types';
import { StorageManager } from '../storage/adapters/storageManager';
import useFilterHooks from './useFilterHooks';

export const useFilterize = <T extends FilterTypes>({
  filtersConfig,
  fetchData,
  options = {},
  presets,
  groups,
}: UseFilterizeProps<T>) => {
  const {
    syncWithUrl = false,
    storage = { type: 'none' as const },
    enableAnalytics = false,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    autoFetch = true,
  } = options;

  // Initialize storage manager
  const storageManager = useMemo(() => {
    return new StorageManager(storage);
  }, [storage]);

  // State management
  const [filters, setFilters] = useState<Record<string, any>>({});
  console.log('[useFilterize] filters:', filters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>(
    () => {
      const initialStates: Record<string, boolean> = {};
      if (groups) {
        Object.entries(groups).forEach(([key, group]) => {
          initialStates[key] = !group.collapsed; // inverted because collapsed means !expanded
        });
      }
      return initialStates;
    }
  );

  // Load initial state from storage
  useEffect(() => {
    const loadStoredData = async () => {
      const storedData = await storageManager.load();
      if (storedData) {
        setFilters(storedData.filters);
        setActiveGroups(storedData.activeGroups);
        setGroupStates(storedData.groupStates);
      }
    };

    loadStoredData();
  }, []);

  // Save state to storage when it changes
  useEffect(() => {
    const saveData = async () => {
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
      return groups?.[groupKey as any]?.filters || [];
    },
    [groups]
  );

  const toggleGroup = useCallback(
    (groupKey: string) => {
      setActiveGroups(prev => {
        const isActive = prev.includes(groupKey);
        if (isActive) {
          // Clear filters in this group
          const groupFilters = getGroupFilters(groupKey);
          setFilters(prev => {
            const newFilters = { ...prev };
            groupFilters.forEach(filterKey => {
              delete newFilters[filterKey];
            });
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
    setGroupStates(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const isGroupCollapsed = useCallback(
    (groupKey: string) => {
      return !groupStates[groupKey];
    },
    [groupStates]
  );

  // Get group metadata
  const getGroupMetadata = useCallback(
    (groupKey: string) => {
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
      return activeGroups.includes(groupId);
    },
    [activeGroups]
  );

  // URL synchronization
  useEffect(() => {
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFilters = deserializeFilters(urlParams.get('filters') || '');
      const urlGroups = urlParams.get('groups')?.split(',') || [];
      const urlGroupStates = urlParams.get('groupStates');

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

        return newFilters;
      });
    },
    [syncWithUrl, activeGroups, groupStates]
  );

  // Data fetching with cache
  const fetchFilteredData = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        // Get active filters based on active groups
        const activeFilters = { ...filters };
        if (groups) {
          Object.keys(filters).forEach(key => {
            const isInActiveGroup = activeGroups.some(groupId =>
              groups[groupId as any]?.filters.includes(key)
            );
            if (!isInActiveGroup) {
              delete activeFilters[key];
            }
          });
        }

        // Generate cache key
        const cacheKey = JSON.stringify(activeFilters);

        // Check cache
        const cachedResult = cache.current.get(cacheKey);
        if (
          cachedResult &&
          Date.now() - cachedResult.timestamp < cacheTimeout
        ) {
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
          analytics.trackFilterUsage(activeFilters);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [
      // filters,
      // activeGroups,
      // groups,
      // filtersConfig,
      // fetchData,
      // cacheTimeout,
      // enableAnalytics,
      // analytics,
    ]
  );

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      fetchFilteredData();
    }
  }, [fetchFilteredData, autoFetch]);

  // Apply preset filters
  const applyPreset = useCallback(
    (presetKey: string) => {
      const presetFilters = getPresetFilters(presetKey, presets);
      if (presetFilters) {
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
    return {
      filters: serializeFilters(filters),
      groups: activeGroups,
    };
  }, [filters, activeGroups]);

  // Import filters
  const importFilters = useCallback(
    (data: { filters: string; groups?: string[] }) => {
      const importedFilters = deserializeFilters(data.filters);
      setFilters(importedFilters);
      if (data.groups) {
        setActiveGroups(data.groups);
      }
    },
    []
  );

  // Clear storage
  const clearStorage = useCallback(async () => {
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
