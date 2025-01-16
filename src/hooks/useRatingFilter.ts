import { useState, useCallback } from 'react';
import { FilterValue, RatingOptions } from '../types';

interface UseRatingFilterProps {
  defaultValue: FilterValue<'rating'>;
  options?: RatingOptions;
  validation?: (value: FilterValue<'rating'>) => boolean | Promise<boolean>;
}

export const useRatingFilter = ({
  defaultValue = 0,
  options = {},
  validation,
}: UseRatingFilterProps) => {
  const [value, setValue] = useState<FilterValue<'rating'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'rating'>) => {
      // Validate against options
      if (options.max && newValue > options.max) {
        setIsValid(false);
        return;
      }

      if (options.allowHalf && !Number.isInteger(newValue * 2)) {
        setIsValid(false);
        return;
      }

      if (!options.allowHalf && !Number.isInteger(newValue)) {
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
