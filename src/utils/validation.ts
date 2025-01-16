import {
  FilterConfig,
  CoreOutputValueTypes,
  OutputValueType,
  FilterOptions,
  AllowedStringOptions,
  MultiSelectOptions,
  SelectOptions,
  SingleValue,
} from '../types';

// Helper function to validate array values
const validateArray = <T extends SingleValue>(
  value: T[],
  options: SelectOptions<T> | MultiSelectOptions<T> | undefined
): boolean => {
  if (!Array.isArray(value)) {
    return false;
  }

  // Validate based on specific options if provided
  if (options) {
    if ('maxSelect' in options && options.maxSelect !== undefined) {
      if (value.length > options.maxSelect) return false;
    }
    if ('minSelect' in options && options.minSelect !== undefined) {
      if (value.length < options.minSelect) return false;
    }
    // Option: options.options: Array<{ value: T; label: string }>
    // In case options has `options` property, validate each element
    if ('options' in options && options.options) {
      return value.every(item =>
        options.options.some(option => option.value === item)
      );
    }
  }

  return true;
};

// Helper function to validate range values
const validateRange = <T>(
  value: [T, T],
  options: FilterOptions['range<number>'] | FilterOptions['range<date>']
): boolean => {
  if (!Array.isArray(value) || value.length !== 2) {
    return false;
  }

  const [min, max] = value;

  // Validate based on specific options if provided
  if (
    'min' in options &&
    options.min !== undefined &&
    typeof min === 'number' &&
    typeof options.min === 'number'
  ) {
    if (min < options.min) return false;
  }
  if (
    'max' in options &&
    options.max !== undefined &&
    typeof max === 'number' &&
    typeof options.max === 'number'
  ) {
    if (max > options.max) return false;
  }
  if ('minDate' in options && options.minDate && min instanceof Date) {
    if (min.getTime() < options.minDate.getTime()) return false;
  }

  if ('maxDate' in options && options.maxDate && max instanceof Date) {
    if (max.getTime() > options.maxDate.getTime()) return false;
  }

  return true;
};

// Validation rules for each output type
const validationRules: {
  [K in CoreOutputValueTypes]: (
    value: OutputValueType[K],
    options: FilterOptions[AllowedStringOptions<K>] | undefined
  ) => boolean | Promise<boolean>;
} = {
  string: (value, options) => {
    if (typeof value !== 'string') return false;
    if (options) {
      if ('maxLength' in options && options.maxLength !== undefined) {
        if (value.length > options.maxLength) return false;
      }
      if ('minLength' in options && options.minLength !== undefined) {
        if (value.length < options.minLength) return false;
      }
      if ('pattern' in options && options.pattern) {
        if (!new RegExp(options.pattern).test(value)) return false;
      }
    }

    return true;
  },
  number: (value, options) => {
    if (typeof value !== 'number') return false;
    if (
      options &&
      'min' in options &&
      options.min !== undefined &&
      typeof options.min === 'number' &&
      value < options.min
    )
      return false;
    if (
      options &&
      'max' in options &&
      options.max !== undefined &&
      typeof options.max === 'number' &&
      value > options.max
    )
      return false;

    return true;
  },
  boolean: value => typeof value === 'boolean',
  date: value => value instanceof Date,
  // @ts-ignore
  'string[]': (
    value: OutputValueType['string[]'],
    options: FilterOptions['string[]']
  ) => {
    if (options) {
      // check if options are of type SelectOptions, MultiSelectOptions, or TagOptions to handle each type correctly
      if ('options' in options) {
        return validateArray(
          value,
          options as SelectOptions<string> | MultiSelectOptions<string>
        );
      }
      // Handle TagsOptions validation separately if needed.
      if ('maxTags' in options && options.maxTags !== undefined) {
        if (value.length > options.maxTags) return false;
      }
    }

    return true;
  },
  // @ts-ignore
  'number[]': (
    value: OutputValueType['number[]'],
    options: FilterOptions['number[]']
  ) => {
    if (options) {
      // check if options are of type SelectOptions, MultiSelectOptions to handle each type correctly
      if ('options' in options) {
        return validateArray(
          value,
          options as SelectOptions<number> | MultiSelectOptions<number>
        );
      }
      // Handle SliderOptions validation separately if needed.
      if ('min' in options && options.min !== undefined) {
        if (value.some(item => item < options.min!)) return false;
      }
      if ('max' in options && options.max !== undefined) {
        if (value.some(item => item > options.max!)) return false;
      }
    }
    return true;
  },
  'range<number>': (value, options) => validateRange(value, options as any),
  'range<date>': (value, options) => validateRange(value, options as any),
};

export const validateFilters = async <T extends CoreOutputValueTypes>(
  filters: Record<string, OutputValueType[T]>,
  configs: FilterConfig<T>[]
): Promise<boolean> => {
  console.log('Starting validation of filters...');
  console.log('Filters:', filters);
  console.log('Filter Configs:', configs);

  try {
    const validationResults = await Promise.all(
      configs.map(async config => {
        console.log(`Validating filter with key "${config.key}"`);

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

        // Skip validation for this specific filter if its outputType is not a key of validationRules
        // This ensures that we only validate filters that have corresponding validation rules
        if (!Object.keys(validationRules).includes(config.outputType)) {
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

        // Get the validation rule based on output type
        const validate =
          validationRules[config.outputType as keyof typeof validationRules];

        // Validate the value using the determined validation function
        console.log(
          `Using default validation for output type "${config.outputType}" for key "${config.key}".`
        );

        if (isOutputValueType(value, config.outputType)) {
          const isValid = await Promise.resolve(
            // @ts-ignore
            validate(value, config.options)
          );
          console.log(
            `Validation result for key "${config.key}" with output type "${config.outputType}":`,
            isValid
          );

          return isValid;
        }
        return true;
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

function isOutputValueType<K extends keyof typeof validationRules>(
  value: any,
  outputType: K
): value is OutputValueType[K] {
  switch (outputType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
      return value instanceof Date;
    case 'string[]':
    case 'number[]':
      return Array.isArray(value);
    case 'range<date>':
      return (
        Array.isArray(value) &&
        value.length === 2 &&
        value.every(v => v instanceof Date)
      );
    case 'range<number>':
      return (
        Array.isArray(value) &&
        value.length === 2 &&
        value.every(v => typeof v === 'number')
      );
    default:
      return false;
  }
}
