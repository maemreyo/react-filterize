import { useState, useCallback } from 'react';
import { FilterValue, SliderOptions } from '../types';

interface UseSliderFilterProps {
  defaultValue: FilterValue<'slider'>;
  options: SliderOptions;
  validation?: (value: FilterValue<'slider'>) => boolean | Promise<boolean>;
}

export const useSliderFilter = ({
  defaultValue = 0,
  options,
  validation,
}: UseSliderFilterProps) => {
  const [value, setValue] = useState<FilterValue<'slider'>>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateValue = useCallback(
    async (newValue: FilterValue<'slider'>) => {
      // Validate against options
      if (newValue < options.min || newValue > options.max) {
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
