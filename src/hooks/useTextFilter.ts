import { useState, useCallback } from 'react';
import { FilterHook, FilterValue, TextOptions } from '../types';

interface UseTextFilterProps {
  defaultValue: FilterValue<'text'>;
  options?: TextOptions;
  validation?: (value: FilterValue<'text'>) => boolean | Promise<boolean>;
}

export const useTextFilter = ({
  defaultValue,
  options,
  validation,
}: UseTextFilterProps): FilterHook<'text'> => {
  const [value, setValue] = useState<FilterValue<'text'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'text'>) => {
      if (validation) {
        const validationResult = await Promise.resolve(validation(newValue));
        setIsValid(validationResult);
        if (!validationResult) return;
      }
      setValue(newValue);
    },
    [validation]
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
