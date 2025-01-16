// @ts-nocheck
import { useState, useCallback, useMemo } from 'react';
import {
  FilterHook,
  FilterValue,
  DateRangeOptions,
  TimeOptions,
  NumberOptions,
  SelectOptions,
  MultiSelectOptions,
  SliderOptions,
  RatingOptions,
  TagsOptions,
  ColorOptions,
  QueryOptions,
  TextOptions,
  OutputValueType,
  CoreOutputValueTypes,
} from '../../types';
import { useRangeFilter } from '../useRangeFilter';
import { useSelectFilter } from '../useSelectFilter';

interface UseDateFilterProps {
  defaultValue: OutputValueType['date'];
  options?: DateRangeOptions;
  validation?: (value: OutputValueType['date']) => boolean | Promise<boolean>;
}

export const useDateFilterBase = ({
  defaultValue = new Date(),
  options = {},
  validation,
}: UseDateFilterProps): FilterHook<'date'> => {
  const [value, setValue] = useState<OutputValueType['date']>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: OutputValueType['date']) => {
      // Validate against options
      if (
        (options.minDate && newValue < options.minDate) ||
        (options.maxDate && newValue > options.maxDate)
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

interface UseNumberFilterProps {
  defaultValue: OutputValueType['number'];
  options?: NumberOptions;
  validation?: (value: OutputValueType['number']) => boolean | Promise<boolean>;
}

export const useNumberFilterBase = ({
  defaultValue = 0,
  options = {},
  validation,
}: UseNumberFilterProps): FilterHook<'number'> => {
  const [value, setValue] = useState<OutputValueType['number']>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: OutputValueType['number']) => {
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

interface UseStringFilterProps {
  defaultValue: OutputValueType['string'];
  options?: TextOptions | QueryOptions;
  validation?: (value: OutputValueType['string']) => boolean | Promise<boolean>;
}

export const useStringFilterBase = ({
  defaultValue = '',
  options = {},
  validation,
}: UseStringFilterProps): FilterHook<'string'> => {
  const [value, setValue] = useState<OutputValueType['string']>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: OutputValueType['string']) => {
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

      if ('maxLength' in options && newValue.length > options.maxLength) {
        setIsValid(false);
        return;
      }

      if ('minLength' in options && newValue.length < options.minLength) {
        setIsValid(false);
        return;
      }

      if ('pattern' in options && options.pattern) {
        const regex = new RegExp(options.pattern);
        if (!regex.test(newValue)) {
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

interface UseStringArrayFilterProps {
  defaultValue: OutputValueType['string[]'];
  options?: TagsOptions;
  validation?: (
    value: OutputValueType['string[]']
  ) => boolean | Promise<boolean>;
}

export const useStringArrayFilterBase = ({
  defaultValue = [],
  options = {},
  validation,
}: UseStringArrayFilterProps): FilterHook<'string[]'> => {
  const [value, setValue] = useState<OutputValueType['string[]']>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: OutputValueType['string[]']) => {
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

      // Validate against options
      if (options.maxTags && newValue.length > options.maxTags) {
        setIsValid(false);
        return;
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

interface UseBooleanFilterProps {
  defaultValue: OutputValueType['boolean'];
  validation?: (
    value: OutputValueType['boolean']
  ) => boolean | Promise<boolean>;
}

export const useBooleanFilterBase = ({
  defaultValue = false,
  validation,
}: UseBooleanFilterProps): FilterHook<'boolean'> => {
  const [value, setValue] = useState<OutputValueType['boolean']>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: OutputValueType['boolean']) => {
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
  };
};

interface UseNumberArrayFilterProps {
  defaultValue: OutputValueType['number[]'];
  options?: SliderOptions | SelectOptions<number> | MultiSelectOptions<number>;
  validation?: (
    value: OutputValueType['number[]']
  ) => boolean | Promise<boolean>;
}

export const useNumberArrayFilterBase = <T extends CoreOutputValueTypes>({
  defaultValue,
  options,
  validation,
}: UseNumberArrayFilterProps): FilterHook<T> => {
  if (options && 'min' in options && 'max' in options) {
    return (useRangeFilter({
      defaultValue,
      options,
      validation,
    }) as unknown) as FilterHook<T>;
  } else {
    return (useSelectFilter({
      defaultValue,
      options,
      validation,
    }) as unknown) as FilterHook<T>;
  }
};
