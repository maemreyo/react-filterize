import {
  FilterConfig,
  ValueTypeKey,
  OutputValueType,
  FilterValues,
} from '../types';

// Helper functions to check specific types
function isString(value: any): value is string {
  return typeof value === 'string';
}

function isNumber(value: any): value is number {
  return typeof value === 'number';
}

function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

function isDate(value: any): value is Date {
  return value instanceof Date;
}

function isFile(value: any): value is File {
  return value instanceof File;
}

function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isNumberArray(value: any): value is number[] {
  return Array.isArray(value) && value.every(isNumber);
}

function isDateArray(value: any): value is Date[] {
  return Array.isArray(value) && value.every(isDate);
}

function isFileArray(value: any): value is File[] {
  return Array.isArray(value) && value.every(isFile);
}

export const validateFilters = async <TConfig extends FilterConfig[]>(
  filters: Partial<FilterValues<TConfig>>,
  configs: TConfig
): Promise<boolean> => {
  try {
    const validationResults = await Promise.all(
      configs.map(async config => {
        const value = filters[config.key as keyof typeof filters];

        // Skip validation if filter is not in filters object
        if (!(config.key in filters)) {
          return true;
        }

        // Skip validation if value is undefined/null and there's no default
        if (value == null && config.defaultValue == null) {
          return true;
        }

        // @ts-ignore
        return isValidFilterValue(value, config.type);
      })
    );

    return validationResults.every(Boolean);
  } catch (error) {
    console.error('Error validating filters:', error);
    return false;
  }
};

// Type guard for checking if a value matches its declared type
export function isValidFilterValue<K extends ValueTypeKey>(
  value: any,
  type: K
): value is OutputValueType[K] {
  switch (type) {
    case 'string':
      return isString(value);
    case 'number':
      return isNumber(value);
    case 'boolean':
      return isBoolean(value);
    case 'date':
      return isDate(value);
    case 'file':
      return isFile(value);
    case 'string[]':
      return isStringArray(value);
    case 'number[]':
      return isNumberArray(value);
    case 'date[]':
      return isDateArray(value);
    case 'file[]':
      return isFileArray(value);
    default:
      // Handle cases where 'type' is not one of the known ValueTypeKeys
      // Consider logging an error or throwing an exception for invalid types
      console.warn(`Unknown filter type: ${type}`);
      return false;
  }
}
