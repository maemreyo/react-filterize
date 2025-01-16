import { useState, useCallback } from 'react';
import { FilterValue, NumberOptions } from '../types';

interface UseNumberFilterProps {
  defaultValue: FilterValue<'number'>;
  options?: NumberOptions;
  validation?: (value: FilterValue<'number'>) => boolean | Promise<boolean>;
}

export const useNumberFilter = ({
  defaultValue = 0,
  options = {},
  validation,
}: UseNumberFilterProps) => {
  const [value, setValue] = useState<FilterValue<'number'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'number'>) => {
      // Validate against options
      if (
        (options.min !== undefined && newValue < options.min) ||
        (options.max !== undefined && newValue > options.max)
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
