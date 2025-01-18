import { DefaultValue, ValueTypeKey, ValueTypes } from '../types';

export function inferValueTypeFromValue(value: DefaultValue): ValueTypeKey {
  if (value === null || value === undefined) return ValueTypes.STRING;

  if (Array.isArray(value)) {
    if (isDateArray(value)) return ValueTypes.DATE_ARRAY;
    if (isNumberArray(value)) return ValueTypes.NUMBER_ARRAY;
    if (isFileArray(value)) return ValueTypes.FILE_ARRAY;
    return ValueTypes.STRING_ARRAY;
  }

  if (typeof value === 'string') return ValueTypes.STRING;
  if (typeof value === 'number') return ValueTypes.NUMBER;
  if (typeof value === 'boolean') return ValueTypes.BOOLEAN;
  if (value instanceof Date) return ValueTypes.DATE;
  if (value instanceof File) return ValueTypes.FILE;

  return ValueTypes.STRING;
}

function isStringArray(arr: unknown[]): arr is (string | null)[] {
  return arr.some(item => item !== null && typeof item === 'string');
}

function isNumberArray(arr: unknown[]): arr is (number | null)[] {
  return arr.some(item => item !== null && typeof item === 'number');
}

function isDateArray(arr: unknown[]): arr is (Date | null)[] {
  return arr.some(item => item !== null && item instanceof Date);
}

function isFileArray(arr: unknown[]): arr is (File | null)[] {
  return arr.some(item => item !== null && item instanceof File);
}
