import { ValueTypes, FilterConfig } from '../types';

// Helper function to convert value based on type
const convertValueByType = (value: any, type?: string) => {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case ValueTypes.NUMBER:
      return Number(value);
    case ValueTypes.BOOLEAN:
      return value === 'true';
    case ValueTypes.DATE:
      return new Date(value);
    case ValueTypes.NUMBER_ARRAY:
      return Array.isArray(value) ? value.map(v => Number(v)) : value;
    case ValueTypes.DATE_ARRAY:
      return Array.isArray(value) ? value.map(v => new Date(v)) : value;
    case ValueTypes.STRING:
    case ValueTypes.STRING_ARRAY:
    default:
      return value;
  }
};

export const convertInputValue = (value: any, type?: string) => {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case ValueTypes.NUMBER:
      // Convert to number but handle empty string
      return value === '' ? null : Number(value);
    case ValueTypes.BOOLEAN:
      return value === 'true' || value === true;
    case ValueTypes.DATE:
      return value instanceof Date ? value : new Date(value);
    case ValueTypes.NUMBER_ARRAY:
      return Array.isArray(value)
        ? value.map(v => (v === null ? null : Number(v)))
        : value;
    case ValueTypes.DATE_ARRAY:
      return Array.isArray(value)
        ? value.map(v => (v === null ? null : new Date(v)))
        : value;
    case ValueTypes.STRING:
    case ValueTypes.STRING_ARRAY:
    default:
      return value;
  }
};

export const serializeFilters = (
  filters: Record<string, any>,
  encodeUrlFilters: boolean = true
): string => {
  try {
    // Handle special types like Date before serialization
    const processedFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value instanceof Date) {
          acc[key] = value.toISOString();
        } else if (Array.isArray(value) && value[0] instanceof Date) {
          acc[key] = value.map(date => date.toISOString());
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    if (encodeUrlFilters) {
      return btoa(JSON.stringify(processedFilters));
    } else {
      const queryString = new URLSearchParams();
      Object.entries(processedFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryString.set(key, String(value));
        }
      });
      return queryString.toString();
    }
  } catch (error) {
    console.error('Error serializing filters:', error);
    return '';
  }
};

export const deserializeFilters = (
  serialized: string,
  encodeUrlFilters: boolean = true,
  fConfig?: FilterConfig[]
): Record<string, any> => {
  try {
    if (!serialized) return {};

    let parsed: Record<string, any> = {};

    // Deserialize filters according to encoding setting
    if (encodeUrlFilters) {
      parsed = JSON.parse(atob(serialized));
    } else {
      const urlParams = new URLSearchParams(serialized);
      urlParams.forEach((value, key) => {
        parsed[key] = value;
      });
    }

    // Convert values based on filter config types
    if (fConfig) {
      return Object.entries(parsed).reduce((acc, [key, value]) => {
        const config = fConfig.find(c => c.key === key);
        if (config) {
          acc[key] = convertValueByType(value, config.type);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
    }

    // Fallback to basic date handling if no config provided
    return Object.entries(parsed).reduce((acc, [key, value]) => {
      if (
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)
      ) {
        acc[key] = new Date(value);
      } else if (
        Array.isArray(value) &&
        typeof value[0] === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value[0])
      ) {
        acc[key] = value.map(dateStr => new Date(dateStr));
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  } catch (error) {
    console.error('Error deserializing filters:', error);
    return {};
  }
};
