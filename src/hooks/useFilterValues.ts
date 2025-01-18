import { isEmpty } from 'lodash';
import { useState, useCallback, useMemo } from 'react';
import { FilterConfig, FilterSource, FilterValues } from '../types';
import { convertInputValue, serializeFilters } from '../utils/serialization';

export const useFilterValues = <TConfig extends FilterConfig[]>({
  config,
  options,
  urlManager,
  storageManager,
  getInitialValues,
  getResetValues,
}) => {
  const [filterSource, setFilterSource] = useState<FilterSource>('none');

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

  const updateFilter = useCallback(
    <K extends keyof FilterValues<TConfig>>(
      key: K,
      value: FilterValues<TConfig>[K]
    ) => {
      const filterConfig = config.find(c => c.key === key);
      const convertedValue = convertInputValue(value, filterConfig?.type);

      setFilters(prev => {
        const newFilters = {
          ...prev,
          [key]: convertedValue,
        } as Partial<FilterValues<TConfig>>;

        // Update URL if enabled
        if (options.url || options.url.key) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set(
            options.url.key,
            serializeFilters(newFilters, options.encode)
          );
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.pushState({}, '', newUrl);
          setFilterSource('url');
        } else {
          setFilterSource('storage');
        }

        return newFilters;
      });
    },
    [config, options]
  );

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
      storageManager.clear();
    }
  }, [getResetValues, urlManager, storageManager]);

  return {
    filters,
    filterSource,
    updateFilter,
    setFilters,
    setFilterSource,
    reset,
  };
};
