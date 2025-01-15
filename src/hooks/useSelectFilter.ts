import { useState, useCallback, useMemo } from 'react';

interface UseSelectFilterProps<T> {
  defaultValue?: T;
  options?: T[];
  isMulti?: boolean;
  validation?: (value: T | T[]) => boolean;
}

export const useSelectFilter = <T>({
  defaultValue,
  options = [],
  isMulti = false,
  validation,
}: UseSelectFilterProps<T>) => {
  const [selected, setSelected] = useState<T | T[] | undefined>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateSelection = useCallback(
    (newValue: T | T[] | undefined) => {
      // Handle multi-select case
      if (isMulti && Array.isArray(newValue)) {
        if (validation) {
          const validationResult = validation(newValue);
          setIsValid(validationResult);

          if (!validationResult) {
            return;
          }
        }
        setSelected(newValue);
      }
      // Handle single-select case
      else if (!isMulti && !Array.isArray(newValue)) {
        if (validation) {
          const validationResult = validation(newValue as T);
          setIsValid(validationResult);

          if (!validationResult) {
            return;
          }
        }
        setSelected(newValue);
      }
    },
    [isMulti, validation]
  );

  const clearSelection = useCallback(() => {
    setSelected(undefined);
    setIsValid(true);
  }, []);

  // Helper functions for multi-select
  const addSelection = useCallback(
    (item: T) => {
      if (isMulti) {
        setSelected(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const newSelection = [...prevArray, item];

          if (validation) {
            const validationResult = validation(newSelection);
            setIsValid(validationResult);

            if (!validationResult) {
              return prev;
            }
          }

          return newSelection;
        });
      }
    },
    [isMulti, validation]
  );

  const removeSelection = useCallback(
    (item: T) => {
      if (isMulti) {
        setSelected(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const newSelection = prevArray.filter(i => i !== item);

          if (validation) {
            const validationResult = validation(newSelection);
            setIsValid(validationResult);

            if (!validationResult) {
              return prev;
            }
          }

          return newSelection;
        });
      }
    },
    [isMulti, validation]
  );

  const toggleSelection = useCallback(
    (item: T) => {
      if (isMulti) {
        setSelected(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const exists = prevArray.includes(item);
          const newSelection = exists
            ? prevArray.filter(i => i !== item)
            : [...prevArray, item];

          if (validation) {
            const validationResult = validation(newSelection);
            setIsValid(validationResult);

            if (!validationResult) {
              return prev;
            }
          }

          return newSelection;
        });
      }
    },
    [isMulti, validation]
  );

  // Computed properties
  const hasSelection = useMemo(() => {
    if (isMulti) {
      return Array.isArray(selected) && selected.length > 0;
    }
    return selected !== undefined;
  }, [selected, isMulti]);

  return {
    selected,
    updateSelection,
    clearSelection,
    isValid,
    options,
    // Multi-select specific properties
    addSelection: isMulti ? addSelection : undefined,
    removeSelection: isMulti ? removeSelection : undefined,
    toggleSelection: isMulti ? toggleSelection : undefined,
    hasSelection,
    isMulti,
  };
};
