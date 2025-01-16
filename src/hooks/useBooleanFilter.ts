import { useState, useCallback } from 'react';
import { FilterValue } from '../types';

interface UseBooleanFilterProps {
  defaultValue: FilterValue<'boolean'>;
  validation?: (value: FilterValue<'boolean'>) => boolean | Promise<boolean>;
}

export const useBooleanFilter = ({
  defaultValue = false,
  validation,
}: UseBooleanFilterProps) => {
  const [value, setValue] = useState<FilterValue<'boolean'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'boolean'>) => {
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
    [validation]
  );

  const toggleValue = useCallback(() => {
    updateValue(!value);
  }, [value, updateValue]);

  const clearValue = useCallback(() => {
    setValue(defaultValue);
    setIsValid(true);
  }, [defaultValue]);

  return {
    value,
    updateValue,
    toggleValue,
    clearValue,
    isValid,
  };
};
