import { useState, useCallback } from 'react';
import { FilterValue, DateRangeOptions } from '../types';

interface UseDateFilterProps {
  defaultValue: FilterValue<'date'>;
  options?: DateRangeOptions;
  validation?: (value: FilterValue<'date'>) => boolean | Promise<boolean>;
}

export const useDateFilter = ({
  defaultValue = new Date(),
  options = {},
  validation,
}: UseDateFilterProps) => {
  const [value, setValue] = useState<FilterValue<'date'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'date'>) => {
      // Validate against options
      if (
        (options.minDate && newValue < options.minDate) ||
        (options.maxDate && newValue > options.maxDate)
      ) {
        setIsValid(false);
        return;
      }

      if (validation) {
        try {
          const validationResult = await Promise.resolve(validation(newValue));
          setIsValid(validationResult);
          if (!validationResult) return;
        } catch (error) {
          setIsValid(false);
          return;
        }
      }

      setValue(newValue);
      setIsValid(true);
    },
    [options, validation]
  );

  const clearValue = useCallback(() => {
    setValue(defaultValue);
    setIsValid(true);
  }, [defaultValue]);

  return {
    value,
    updateValue,
    clearValue,
    isValid,
    options,
  };
};
