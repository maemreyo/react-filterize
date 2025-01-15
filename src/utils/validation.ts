import { FilterConfig, FilterTypes } from '../types';

export const validateFilters = async <T extends FilterTypes>(
  filters: Record<string, any>,
  configs: FilterConfig<T>[]
): Promise<boolean> => {
  console.log('Starting validation of filters...');
  console.log('Filters:', filters);
  console.log('Filter Configs:', configs);

  try {
    const validationResults = await Promise.all(
      configs.map(async (config, index) => {
        console.log(
          `Validating filter at index ${index}:`,
          config,
          'key',
          config.key
        );

        const value = filters[config.key];
        console.log(`Value for key "${config.key}":`, value);

        // Skip validation if filter is not in filters object
        if (!(config.key in filters)) {
          return true;
        }

        // Skip validation if value is undefined/null and there's no default
        if (value == null && config.defaultValue == null) {
          console.log(
            `Skipping validation for key "${config.key}" as value is null/undefined and no default value is provided.`
          );
          return true;
        }

        // Use provided validation function if it exists
        if (config.validation) {
          console.log(
            `Using custom validation function for key "${config.key}".`
          );
          const isValid = await Promise.resolve(config.validation(value));
          console.log(`Validation result for key "${config.key}":`, isValid);
          return isValid;
        }

        // Default validations based on filter type
        console.log(
          `Using default validation for filter type "${config.type}" for key "${config.key}".`
        );
        let isValid: boolean;

        switch (config.type) {
          case 'query':
            isValid = typeof value === 'string';
            break;

          case 'select':
            isValid = value != null;
            break;

          case 'multiSelect':
            isValid = Array.isArray(value);
            break;

          case 'dateRange':
            isValid =
              Array.isArray(value) &&
              value.length === 2 &&
              value.every(v => v instanceof Date);
            break;

          case 'numberRange':
            isValid =
              Array.isArray(value) &&
              value.length === 2 &&
              value.every(v => typeof v === 'number');
            break;

          default:
            isValid = true;
            break;
        }

        console.log(
          `Validation result for key "${config.key}" with type "${config.type}":`,
          isValid
        );
        return isValid;
      })
    );

    const finalValidationResult = validationResults.every(Boolean);
    console.log('Final validation result:', finalValidationResult);
    return finalValidationResult;
  } catch (error) {
    console.error('Error validating filters:', error);
    return false;
  }
};
