import { useState, useCallback, useRef } from 'react';
import { FilterAnalytics } from '../types';

export const useFilterAnalytics = () => {
  const [analytics, setAnalytics] = useState<FilterAnalytics>({
    filterUsage: {},
    combinations: {},
    performance: {
      avgResponseTime: 0,
      totalRequests: 0,
      cacheHitRate: 0,
      totalCacheHits: 0,
    },
  });

  const startTimeRef = useRef<Record<string, number>>({});

  // Track when a filter starts being used
  const startFilterTracking = useCallback((filterKey: string) => {
    startTimeRef.current[filterKey] = Date.now();
  }, []);

  // Track filter usage
  const trackFilterUsage = useCallback((filters: Record<string, any>) => {
    setAnalytics(prev => {
      const newAnalytics = { ...prev };
      const combinationKey = JSON.stringify(Object.keys(filters).sort());

      // Update filter usage metrics
      Object.keys(filters).forEach(filterKey => {
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
      });

      // Update combination tracking
      newAnalytics.combinations[combinationKey] =
        (prev.combinations[combinationKey] || 0) + 1;

      return newAnalytics;
    });
  }, []);

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
          (acc, curr) => acc + curr.avgDuration,
          0
        ) / Object.keys(analytics.filterUsage).length,
    };
  }, [analytics]);

  // Reset analytics
  const resetAnalytics = useCallback(() => {
    setAnalytics({
      filterUsage: {},
      combinations: {},
      performance: {
        avgResponseTime: 0,
        totalRequests: 0,
        cacheHitRate: 0,
        totalCacheHits: 0,
      },
    });
    startTimeRef.current = {};
  }, []);

  return {
    startFilterTracking,
    trackFilterUsage,
    trackPerformance,
    getAnalyticsReport,
    resetAnalytics,
  };
};
