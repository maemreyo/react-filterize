import { useState, useCallback } from 'react';
import { FilterValue, ColorOptions } from '../types';

interface UseColorFilterProps {
  defaultValue: FilterValue<'color'>;
  options?: ColorOptions;
  validation?: (value: FilterValue<'color'>) => boolean | Promise<boolean>;
}

export const useColorFilter = ({
  defaultValue = '#000000',
  options = {},
  validation,
}: UseColorFilterProps) => {
  const [value, setValue] = useState<FilterValue<'color'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const validateColorFormat = (color: string): boolean => {
    const format = options.format || 'hex';
    const patterns = {
      hex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      rgb: /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
      hsl: /^hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/,
    };

    return patterns[format].test(color);
  };

  const updateValue = useCallback(
    async (newValue: FilterValue<'color'>) => {
      // Validate color format
      if (!validateColorFormat(newValue)) {
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
