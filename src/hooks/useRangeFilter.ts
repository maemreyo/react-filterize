import { useState, useCallback } from 'react';

interface UseRangeFilterProps<T extends number | Date> {
  defaultValue?: [T, T];
  min?: T;
  max?: T;
  step?: number;
  validation?: (range: [T, T]) => boolean;
}

export const useRangeFilter = <T extends number | Date>({
  defaultValue,
  min,
  max,
  step,
  validation,
}: UseRangeFilterProps<T>) => {
  const [range, setRange] = useState<[T, T] | undefined>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateRange = useCallback(
    (newRange: [T, T] | undefined) => {
      if (!newRange) {
        setRange(undefined);
        setIsValid(true);
        return;
      }

      // Validate min/max constraints
      if (min && (newRange[0] < min || newRange[1] < min)) {
        setIsValid(false);
        return;
      }

      if (max && (newRange[0] > max || newRange[1] > max)) {
        setIsValid(false);
        return;
      }

      // Ensure start is not after end
      if (newRange[0] > newRange[1]) {
        setIsValid(false);
        return;
      }

      // Apply custom validation if provided
      if (validation) {
        const validationResult = validation(newRange);
        setIsValid(validationResult);

        if (!validationResult) {
          return;
        }
      }

      setRange(newRange);
      setIsValid(true);
    },
    [min, max, validation]
  );

  const clearRange = useCallback(() => {
    setRange(undefined);
    setIsValid(true);
  }, []);

  return {
    range,
    updateRange,
    clearRange,
    isValid,
    min,
    max,
    step,
  };
};
