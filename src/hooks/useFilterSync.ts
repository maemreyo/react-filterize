import { useEffect, useRef } from 'react';
import { FilterConfig, FilterValues } from '../types';
import { deserializeFilters } from '../utils/serialization';
import { areFiltersEqual } from '../utils/object';

export const useFilterSync = <TConfig extends FilterConfig[]>({
  filters,
  options,
  urlManager,
  storageManager,
  setFilters,
  setFilterSource,
  config,
}) => {
  const isFirstRender = useRef(true);

  const prevFiltersRef = useRef(filters);

  useEffect(() => {
    if (options.url || options.url.key) {
      const handleUrlChange = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedFilters = urlParams.get(options.url.key);

        if (encodedFilters) {
          const urlFilters = deserializeFilters(
            encodedFilters,
            options.encode,
            config
          );
          setFilters(urlFilters as Partial<FilterValues<TConfig>>);
          setFilterSource('url');
        } else if (options.storage.type !== 'none') {
          const storedData = storageManager.loadSync();
          if (storedData?.filters) {
            setFilters(storedData.filters as Partial<FilterValues<TConfig>>);
            setFilterSource('storage');
          }
        }
      };

      window.addEventListener('popstate', handleUrlChange);
      return () => window.removeEventListener('popstate', handleUrlChange);
    }
  }, [options, config, storageManager]);

  useEffect(() => {
    if (
      !isFirstRender.current &&
      urlManager &&
      options.filterSource !== 'url'
    ) {
      urlManager.updateUrl(filters);
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [filters, options.filterSource, urlManager]);

  useEffect(() => {
    const filtersChanged = !areFiltersEqual(prevFiltersRef.current, filters);

    if (!isFirstRender.current && filtersChanged) {
      const saveToStorage = async () => {
        if (options.filterSource !== 'url' && options.storage.type !== 'none') {
          await storageManager.save({
            filters,
            timestamp: Date.now(),
          });
        }
      };

      saveToStorage();

      prevFiltersRef.current = { ...filters };
    }
  }, [filters, options, storageManager]);
};
