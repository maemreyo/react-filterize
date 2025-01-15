import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQueryFilterProps<T = string> {
  defaultValue?: string;
  debounce?: number;
  transform?: (value: string) => T;
  validation?: (value: T) => boolean | Promise<boolean>;
}

export const useQueryFilter = <T = string>({
  defaultValue = '',
  debounce = 300,
  transform,
  validation,
}: UseQueryFilterProps<T> = {}) => {
  const [query, setQuery] = useState<string>(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle debounced query updates
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      let transformedValue: T | string = query;

      // Apply transformation if provided
      if (transform) {
        transformedValue = transform(query);
      }

      // Apply validation if provided
      if (validation) {
        try {
          const validationResult = await Promise.resolve(
            validation(transformedValue as T)
          );
          setIsValid(validationResult);

          if (!validationResult) {
            return;
          }
        } catch (error) {
          setIsValid(false);
          return;
        }
      }

      setDebouncedQuery(query);
    }, debounce);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounce, transform, validation]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    setQuery,
    clearQuery,
    isValid,
  };
};
