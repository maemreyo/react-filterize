// @ts-nocheck
import { useState, useCallback, useMemo } from 'react';
import { FilterValue, SelectOptions, MultiSelectOptions } from '../types';

interface UseSelectFilterProps<T extends 'select' | 'multiSelect'> {
  defaultValue: FilterValue<T>;
  options: T extends 'select' ? SelectOptions : MultiSelectOptions;
  validation?: (value: FilterValue<T>) => boolean | Promise<boolean>;
}

export const useSelectFilter = <T extends 'select' | 'multiSelect'>({
  defaultValue,
  options,
  validation,
}: UseSelectFilterProps<T>) => {
  const [selected, setSelected] = useState<FilterValue<T>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const isMulti = useMemo(() => Array.isArray(defaultValue), [defaultValue]);

  const validateSelection = useCallback(
    async (value: FilterValue<T>) => {
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
    async (newValue: FilterValue<T>) => {
      // Validate against options constraints
      if (isMulti && Array.isArray(newValue)) {
        const multiSelectOpts = options as MultiSelectOptions;
        if (
          (multiSelectOpts.maxSelect &&
            newValue.length > multiSelectOpts.maxSelect) ||
          (multiSelectOpts.minSelect &&
            newValue.length < multiSelectOpts.minSelect)
        ) {
          setIsValid(false);
          return;
        }
      }

      const validationResult = await validateSelection(newValue);
      setIsValid(validationResult);

      if (validationResult) {
        setSelected(newValue);
      }
    },
    [isMulti, options, validateSelection]
  );

  const clearSelection = useCallback(() => {
    setSelected(defaultValue);
    setIsValid(true);
  }, [defaultValue]);

  // Multi-select specific operations
  const addSelection = useCallback(
    async (item: FilterValue<'select'>) => {
      if (isMulti && Array.isArray(selected)) {
        const newSelection = [...selected, item] as FilterValue<T>;
        await updateSelection(newSelection);
      }
    },
    [isMulti, selected, updateSelection]
  );

  const removeSelection = useCallback(
    async (item: FilterValue<'select'>) => {
      if (isMulti && Array.isArray(selected)) {
        const newSelection = selected.filter(i => i !== item) as FilterValue<T>;
        await updateSelection(newSelection);
      }
    },
    [isMulti, selected, updateSelection]
  );

  const toggleSelection = useCallback(
    async (item: FilterValue<'select'>) => {
      if (isMulti && Array.isArray(selected)) {
        const exists = selected.includes(item);
        const newSelection = exists
          ? selected.filter(i => i !== item)
          : ([...selected, item] as FilterValue<T>);
        await updateSelection(newSelection);
      }
    },
    [isMulti, selected, updateSelection]
  );

  return {
    selected,
    updateSelection,
    clearSelection,
    isValid,
    options,
    addSelection: isMulti ? addSelection : undefined,
    removeSelection: isMulti ? removeSelection : undefined,
    toggleSelection: isMulti ? toggleSelection : undefined,
    hasSelection: isMulti
      ? (selected as unknown[]).length > 0
      : selected !== undefined,
    isMulti,
  };
};
