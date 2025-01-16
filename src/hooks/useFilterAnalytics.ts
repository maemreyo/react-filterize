// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import { FilterConfig, FilterValues, FilterUsageMetrics } from '../types';

export interface UseFilterAnalyticsReturn<TConfig extends FilterConfig[]> {
  filterUsage: Record<keyof FilterValues<TConfig>, FilterUsageMetrics>;
  combinations: Record<string, number>;
  performance: {
    avgResponseTime: number;
    totalRequests: number;
    cacheHitRate: number;
    totalCacheHits: number;
  };
}

export const useFilterAnalytics = <TConfig extends FilterConfig[]>() => {
  const [analytics, setAnalytics] = useState<UseFilterAnalyticsReturn<TConfig>>(
    {
      filterUsage: {} as Record<
        keyof FilterValues<TConfig>,
        FilterUsageMetrics
      >,
      combinations: {},
      performance: {
        avgResponseTime: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        totalCacheHits: 0,
      },
    }
  );

  const startTimeRef = useRef<Record<keyof FilterValues<TConfig>, number>>(
    {} as Record<keyof FilterValues<TConfig>, number>
  );

  // Track when a filter starts being used
  const startFilterTracking = useCallback(
    (filterKey: keyof FilterValues<TConfig>) => {
      startTimeRef.current[filterKey] = Date.now();
    },
    []
  );

  // Track filter usage
  const trackFilterUsage = useCallback(
    (filters: Partial<FilterValues<TConfig>>) => {
      setAnalytics(prev => {
        const newAnalytics = {
          ...prev,
        };
        const combinationKey = JSON.stringify(Object.keys(filters).sort());

        // Update filter usage metrics
        (Object.keys(filters) as Array<keyof FilterValues<TConfig>>).forEach(
          filterKey => {
            const endTime = Date.now();
            const startTime = startTimeRef.current[filterKey] || endTime;
            const duration = endTime - startTime;

            const currentMetrics = prev.filterUsage[filterKey] || {
              count: 0,
              lastUsed: new Date(),
              avgDuration: 0,
              totalDuration: 0,
            };

            const newMetrics = {
              count: currentMetrics.count + 1,
              lastUsed: new Date(),
              totalDuration: currentMetrics.totalDuration + duration,
              avgDuration:
                (currentMetrics.totalDuration + duration) /
                (currentMetrics.count + 1),
            };

            newAnalytics.filterUsage[filterKey] = newMetrics;
          }
        );

        // Update combination tracking
        newAnalytics.combinations[combinationKey] =
          (prev.combinations[combinationKey] || 0) + 1;

        return newAnalytics;
      });
    },
    []
  );

  // Track response time and cache performance
  const trackPerformance = useCallback(
    (responseTime: number, cacheHit: boolean) => {
      setAnalytics(prev => {
        const newTotalRequests = prev.performance.totalRequests + 1;
        const newTotalCacheHits =
          prev.performance.totalCacheHits + (cacheHit ? 1 : 0);

        return {
          ...prev,
          performance: {
            avgResponseTime:
              (prev.performance.avgResponseTime *
                prev.performance.totalRequests +
                responseTime) /
              newTotalRequests,
            totalRequests: newTotalRequests,
            totalCacheHits: newTotalCacheHits,
            cacheHitRate: (newTotalCacheHits / newTotalRequests) * 100,
          },
        };
      });
    },
    []
  );

  // Get analytics report
  const getAnalyticsReport = useCallback(() => {
    return {
      ...analytics,
      mostUsedFilters: Object.entries(analytics.filterUsage)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5),
      mostCommonCombinations: Object.entries(analytics.combinations)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      averageFilterDuration:
        Object.values(analytics.filterUsage).reduce(
          (acc, curr: FilterUsageMetrics) => acc + curr.avgDuration,
          0
        ) / Object.keys(analytics.filterUsage).length,
    };
  }, [analytics]);

  // Reset analytics
  const resetAnalytics = useCallback(() => {
    setAnalytics({
      filterUsage: {} as Record<
        keyof FilterValues<TConfig>,
        FilterUsageMetrics
      >,
      combinations: {},
      performance: {
        avgResponseTime: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        totalCacheHits: 0,
      },
    });
    startTimeRef.current = {} as Record<keyof FilterValues<TConfig>, number>;
  }, []);

  return {
    filterUsage: analytics.filterUsage,
    combinations: analytics.combinations,
    performance: analytics.performance,
    startFilterTracking,
    trackFilterUsage,
    trackPerformance,
    getAnalyticsReport,
    resetAnalytics,
  };
};
