import { useQueryFilter } from './useQueryFilter';
import { useRangeFilter } from './useRangeFilter';
import { useSelectFilter } from './useSelectFilter';
import { FilterConfig, FilterTypes } from '../types';

const useFilterHooks = <T extends FilterTypes>(
  filtersConfig: FilterConfig<T>[]
) => {
  const filterHooks: Record<string, any> = {};

  filtersConfig.forEach(config => {
    switch (config.type) {
      case 'query':
        filterHooks[config.key] = useQueryFilter({
          defaultValue: config.defaultValue as string,
          debounce: config.debounce,
          validation: config.validation,
          transform: config.transform,
        });
        break;
      case 'dateRange':
      case 'numberRange':
        filterHooks[config.key] = useRangeFilter({
          defaultValue: config.defaultValue as [any, any],
          validation: config.validation,
        });
        break;
      case 'select':
      case 'multiSelect':
        filterHooks[config.key] = useSelectFilter({
          defaultValue: config.defaultValue,
          validation: config.validation,
          isMulti: config.type === 'multiSelect',
        });
        break;
      // case 'custom':
      //   filterHooks[config.key] = useCustomFilter({
      //     defaultValue: config.defaultValue,
      //     validation: config.validation,
      //   });
      //   break;
      default:
        throw new Error(`Unsupported filter type: ${config.type}`);
    }
  });

  return filterHooks;
};

export default useFilterHooks;
