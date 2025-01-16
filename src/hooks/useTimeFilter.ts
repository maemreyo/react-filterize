import { useState, useCallback } from 'react';
import { FilterValue, TimeOptions } from '../types';

interface UseTimeFilterProps {
  defaultValue: FilterValue<'time'>;
  options?: TimeOptions;
  validation?: (value: FilterValue<'time'>) => boolean | Promise<boolean>;
}

export const useTimeFilter = ({
  defaultValue = '00:00',
  options = {},
  validation,
}: UseTimeFilterProps) => {
  const [value, setValue] = useState<FilterValue<'time'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'time'>) => {
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
