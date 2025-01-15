import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQueryFilterProps {
  defaultValue?: string;
  debounce?: number;
  transform?: (value: string) => any;
  validation?: (value: string) => boolean;
}

export const useQueryFilter = ({
  defaultValue = '',
  debounce = 300,
  transform,
  validation,
}: UseQueryFilterProps = {}) => {
  const [query, setQuery] = useState<string>(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(defaultValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  // Handle debounced query updates
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      let transformedValue = query;

      // Apply transformation if provided
      if (transform) {
        transformedValue = transform(query);
      }

      // Apply validation if provided
      if (validation) {
        const validationResult = validation(transformedValue);
        setIsValid(validationResult);

        if (!validationResult) {
          return;
        }
      }

      setDebouncedQuery(transformedValue);
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
