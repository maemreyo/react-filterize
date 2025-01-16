import { useState, useCallback } from 'react';
import { FilterValue, TagsOptions } from '../types';

interface UseTagsFilterProps {
  defaultValue: FilterValue<'tags'>;
  options?: TagsOptions;
  validation?: (value: FilterValue<'tags'>) => boolean | Promise<boolean>;
}

export const useTagsFilter = ({
  defaultValue = [],
  options = {},
  validation,
}: UseTagsFilterProps) => {
  const [value, setValue] = useState<FilterValue<'tags'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'tags'>) => {
      // Validate against options
      if (options.maxTags && newValue.length > options.maxTags) {
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

  const addTag = useCallback(
    (tag: string) => {
      if (!value.includes(tag)) {
        updateValue([...value, tag]);
      }
    },
    [value, updateValue]
  );

  const removeTag = useCallback(
    (tag: string) => {
      updateValue(value.filter(t => t !== tag));
    },
    [value, updateValue]
  );

  const clearValue = useCallback(() => {
    setValue(defaultValue);
    setIsValid(true);
  }, [defaultValue]);

  return {
    value,
    updateValue,
    addTag,
    removeTag,
    clearValue,
    isValid,
    options,
  };
};
