// @ts-nocheck
import {
  FilterConfig,
  CoreOutputValueTypes,
  OutputValueType,
  FilterHook,
} from '../types';
import {
  useDateFilterBase,
  useNumberFilterBase,
  useStringFilterBase,
  useBooleanFilterBase,
  useStringArrayFilterBase,
  useNumberArrayFilterBase,
} from './base';
import {
  useRangeFilter
} from './useRangeFilter'
const useFilterHooks = <T extends CoreOutputValueTypes>(
  filtersConfig: FilterConfig<T>[]
) => {
  const filterHooks: Record<string, FilterHook<T>> = {} as Record<
    string,
    FilterHook<T>
  >;

  filtersConfig.forEach(config => {
    switch (config.outputType) {
      case 'string':
        filterHooks[config.key] = useStringFilterBase({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        }) as FilterHook<T>;
        break;
      case 'number':
        filterHooks[config.key] = useNumberFilterBase({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        }) as FilterHook<T>;
        break;
      case 'boolean':
        filterHooks[config.key] = useBooleanFilterBase({
          defaultValue: config.defaultValue,
          validation: config.validation,
        }) as FilterHook<T>;
        break;
      case 'date':
        filterHooks[config.key] = useDateFilterBase({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        }) as FilterHook<T>;
        break;
      case 'string[]':
        filterHooks[config.key] = useStringArrayFilterBase({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        }) as FilterHook<T>;
        break;
      case 'number[]':
        filterHooks[config.key] = useNumberArrayFilterBase({
          defaultValue: config.defaultValue,
          options: config.options,
          validation: config.validation,
        }) as FilterHook<T>;
        break;
      case 'range<number>':
        filterHooks[config.key] = (useRangeFilter({
          defaultValue: config.defaultValue as OutputValueType['range<number>'],
          options: config.options,
          validation: config.validation,
        }) as unknown) as FilterHook<T>;
        break;
      case 'range<date>':
        filterHooks[config.key] = (useRangeFilter({
          defaultValue: config.defaultValue as OutputValueType['range<date>'],
          options: config.options,
          validation: config.validation,
        }) as unknown) as FilterHook<T>;
        break;
      default:
        // Generic type handling or error for unsupported types
        throw new Error(`Unsupported output type: ${config.outputType}`);
    }
  });

  return filterHooks;
};

export default useFilterHooks;
