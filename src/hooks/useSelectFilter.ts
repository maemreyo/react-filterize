import { useState, useCallback, useMemo } from 'react';

interface UseSelectFilterProps<T> {
  defaultValue?: T | T[];
  options?: T[];
  isMulti?: boolean;
  validation?: (value: T | T[]) => boolean | Promise<boolean>;
}

export const useSelectFilter = <T>({
  defaultValue,
  options = [],
  isMulti = false,
  validation,
}: UseSelectFilterProps<T>) => {
  const [selected, setSelected] = useState<T | T[] | undefined>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const validateSelection = useCallback(
    async (value: T | T[]) => {
      if (!validation) return true;
      try {
        return await Promise.resolve(validation(value));
      } catch (error) {
        return false;
      }
    },
    [validation]
  );

  const updateSelection = useCallback(
    async (newValue: T | T[] | undefined) => {
      if (newValue === undefined) {
        setSelected(undefined);
        setIsValid(true);
        return;
      }

      // Handle multi-select case
      if (isMulti && Array.isArray(newValue)) {
        const validationResult = await validateSelection(newValue);
        setIsValid(validationResult);

        if (validationResult) {
          setSelected(newValue);
        }
      }
      // Handle single-select case
      else if (!isMulti && !Array.isArray(newValue)) {
        const validationResult = await validateSelection(newValue as T);
        setIsValid(validationResult);

        if (validationResult) {
          setSelected(newValue);
        }
      }
    },
    [isMulti, validateSelection]
  );

  const clearSelection = useCallback(() => {
    setSelected(undefined);
    setIsValid(true);
  }, []);

  // Helper functions for multi-select
  const addSelection = useCallback(
    async (item: T) => {
      if (isMulti) {
        const prevArray = Array.isArray(selected) ? selected : [];
        const newSelection = [...prevArray, item];

        const validationResult = await validateSelection(newSelection);
        setIsValid(validationResult);

        if (validationResult) {
          setSelected(newSelection);
        }
      }
    },
    [isMulti, selected, validateSelection]
  );

  const removeSelection = useCallback(
    async (item: T) => {
      if (isMulti) {
        const prevArray = Array.isArray(selected) ? selected : [];
        const newSelection = prevArray.filter(i => i !== item);

        const validationResult = await validateSelection(newSelection);
        setIsValid(validationResult);

        if (validationResult) {
          setSelected(newSelection);
        }
      }
    },
    [isMulti, selected, validateSelection]
  );

  const toggleSelection = useCallback(
    async (item: T) => {
      if (isMulti) {
        const prevArray = Array.isArray(selected) ? selected : [];
        const exists = prevArray.includes(item);
        const newSelection = exists
          ? prevArray.filter(i => i !== item)
          : [...prevArray, item];

        const validationResult = await validateSelection(newSelection);
        setIsValid(validationResult);

        if (validationResult) {
          setSelected(newSelection);
        }
      }
    },
    [isMulti, selected, validateSelection]
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
