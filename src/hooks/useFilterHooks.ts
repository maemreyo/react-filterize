// @ts-nocheck
import { useTextFilter } from './useTextFilter';
import { useNumberFilter } from './useNumberFilter';
import { useBooleanFilter } from './useBooleanFilter';
import { useQueryFilter } from './useQueryFilter';
import { useRangeFilter } from './useRangeFilter';
import { useSelectFilter } from './useSelectFilter';
import { useDateFilter } from './useDateFilter';
import { useTimeFilter } from './useTimeFilter';
import { useSliderFilter } from './useSliderFilter';
import { useRatingFilter } from './useRatingFilter';
import { useTagsFilter } from './useTagsFilter';
import { useColorFilter } from './useColorFilter';
import { FilterConfig, FilterTypes, FILTER_TYPES, FilterTypeToValue, FilterTypeOptions } from '../types';

type FilterHook<T extends FilterTypes> = {
  value: FilterTypeToValue[T];
  updateValue: (value: FilterTypeToValue[T]) => Promise<void>;
  clearValue: () => void;
  isValid: boolean;
  options?: FilterTypeOptions[T];
};

// Helper type to enforce type safety for hooks
type FilterHookCreator<T extends FilterTypes> = (config: FilterConfig<T>) => FilterHook<T>;

const useFilterHooks = <T extends FilterTypes>(
  filtersConfig: FilterConfig<T>[]
) => {
  const filterHooks: Record<string, any> = {};

  filtersConfig.forEach(config => {
    switch (config.type) {
      case FILTER_TYPES.TEXT:
        filterHooks[config.key] = useTextFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.NUMBER:
        filterHooks[config.key] = useNumberFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.BOOLEAN:
        filterHooks[config.key] = useBooleanFilter({
          defaultValue: config.defaultValue,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.SELECT:
      case FILTER_TYPES.MULTI_SELECT:
        filterHooks[config.key] = useSelectFilter({
          defaultValue: config.defaultValue,
          options: config.options || { options: [] },
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.DATE_RANGE:
      case FILTER_TYPES.NUMBER_RANGE:
        filterHooks[config.key] = useRangeFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.DATE:
        filterHooks[config.key] = useDateFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.TIME:
        filterHooks[config.key] = useTimeFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.DATETIME:
        // Use date filter with additional time handling
        filterHooks[config.key] = useDateFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.RADIO:
        // Use select filter since radio is essentially a single select
        filterHooks[config.key] = useSelectFilter({
          defaultValue: config.defaultValue,
          options: config.options || { options: [] },
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.CHECKBOX:
        // Use multi-select filter since checkbox is essentially a multi select
        filterHooks[config.key] = useSelectFilter({
          defaultValue: config.defaultValue,
          options: config.options || { options: [] },
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.SLIDER:
        filterHooks[config.key] = useSliderFilter({
          defaultValue: config.defaultValue,
          options: config.options as any, // Since slider requires options
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.RANGE_SLIDER:
        // Use range filter with slider options
        filterHooks[config.key] = useRangeFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.RATING:
        filterHooks[config.key] = useRatingFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.TAGS:
        filterHooks[config.key] = useTagsFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.COLOR:
        filterHooks[config.key] = useColorFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        });
        break;

      case FILTER_TYPES.QUERY:
        filterHooks[config.key] = useQueryFilter({
          defaultValue: config.defaultValue,
          options: config.options,
          debounce: config.debounce,
          validation: config.validation,
          transform: config.transform,
        });
        break;

      case FILTER_TYPES.CUSTOM:
        // Custom filters should be handled by the consumer
        filterHooks[config.key] = {
          value: config.defaultValue,
          isValid: true,
        };
        break;

      default:
        throw new Error(`Unsupported filter type: ${config.type}`);
    }
  });

  return filterHooks;
};

export default useFilterHooks;
