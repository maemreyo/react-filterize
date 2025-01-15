import { FilterConfig, FilterTypes } from '../types';

export const validateFilters = async (
  filters: Record<string, any>,
  configs: FilterConfig<FilterTypes>[]
): Promise<boolean> => {
  try {
    const validationResults = await Promise.all(
      configs.map(async config => {
        const value = filters[config.key];

        // Skip validation if value is undefined/null and there's no default
        if (value == null && config.defaultValue == null) {
          return true;
        }

        // Use provided validation function if it exists
        if (config.validation) {
          return await Promise.resolve(config.validation(value));
        }

        // Default validations based on filter type
        switch (config.type) {
          case 'query':
            return typeof value === 'string';

          case 'select':
            return value != null;

          case 'multiSelect':
            return Array.isArray(value);

          case 'dateRange':
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value.every(v => v instanceof Date)
            );

          case 'numberRange':
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value.every(v => typeof v === 'number')
            );

          default:
            return true;
        }
      })
    );

    return validationResults.every(Boolean);
  } catch (error) {
    console.error('Error validating filters:', error);
    return false;
  }
};
