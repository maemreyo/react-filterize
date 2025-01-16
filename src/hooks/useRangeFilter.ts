// @ts-nocheck
import { useState, useCallback } from 'react';
import { FilterValue, FilterTypes, FilterOpts } from '../types';

interface UseRangeFilterProps<T extends 'dateRange' | 'numberRange'> {
  defaultValue: FilterValue<T>;
  options?: FilterOpts<T>;
  validation?: (value: FilterValue<T>) => boolean | Promise<boolean>;
}

export const useRangeFilter = <T extends 'dateRange' | 'numberRange'>({
  defaultValue,
  options = {},
  validation,
}: UseRangeFilterProps<T>) => {
  const [range, setRange] = useState<FilterValue<T>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateRange = useCallback(
    async (newRange: FilterValue<T>) => {
      if (!newRange) {
        setRange(defaultValue);
        setIsValid(true);
        return;
      }

      // Type-specific validations
      if (options) {
        const [start, end] = newRange;

        if ('minDate' in options && options.minDate) {
          if (start < options.minDate || end < options.minDate) {
            setIsValid(false);
            return;
          }
        }

        if ('maxDate' in options && options.maxDate) {
          if (start > options.maxDate || end > options.maxDate) {
            setIsValid(false);
            return;
          }
        }

        if ('min' in options && typeof options.min === 'number') {
          if (start < options.min || end < options.min) {
            setIsValid(false);
            return;
          }
        }

        if ('max' in options && typeof options.max === 'number') {
          if (start > options.max || end > options.max) {
            setIsValid(false);
            return;
          }
        }
      }

      if (validation) {
        try {
          const validationResult = await Promise.resolve(validation(newRange));
          setIsValid(validationResult);

          if (!validationResult) {
            return;
          }
        } catch (error) {
          setIsValid(false);
          return;
        }
      }

      setRange(newRange);
      setIsValid(true);
    },
    [defaultValue, options, validation]
  );

  const clearRange = useCallback(() => {
    setRange(defaultValue);
    setIsValid(true);
  }, [defaultValue]);

  return {
    range,
    updateRange,
    clearRange,
    isValid,
    options,
  };
};
