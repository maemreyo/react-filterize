import { useEffect } from 'react';
import { FilterConfig, FilterValues } from '../../types';
import { deserializeFilters } from '../../utils/serialization';

export const useFilterSync = <TConfig extends FilterConfig[]>({
  filters,
  options,
  urlManager,
  storageManager,
  setFilters,
  setFilterSource,
  config,
}) => {
  // URL synchronization
  useEffect(() => {
    if (options.syncUrl) {
      const handleUrlChange = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedFilters = urlParams.get(options.urlKey);

        if (encodedFilters) {
          const urlFilters = deserializeFilters(
            encodedFilters,
            options.encode,
            config
          );
          setFilters(urlFilters as Partial<FilterValues<TConfig>>);
          setFilterSource('url');
        } else if (options.storage.type !== 'none') {
          // Fallback to storage if URL is empty
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

  // Update URL when filters change
  useEffect(() => {
    if (urlManager && options.filterSource !== 'url') {
      urlManager.updateUrl(filters);
    }
  }, [filters, options.filterSource]);

  // Storage synchronization
  useEffect(() => {
    const saveToStorage = async () => {
      if (options.filterSource !== 'url' && options.storage.type !== 'none') {
        await storageManager.save({
          filters,
          timestamp: Date.now(),
        });
      }
    };

    saveToStorage();
  }, [filters, options]);
};
