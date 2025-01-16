import { useState, useEffect, useCallback, useRef } from 'react';
import { QueryOptions, FilterValue } from '../types';

interface UseQueryFilterProps {
  defaultValue: FilterValue<'query'>;
  options?: QueryOptions;
  debounce?: number;
  validation?: (value: FilterValue<'query'>) => boolean | Promise<boolean>;
  transform?: (value: FilterValue<'query'>) => any;
}

export const useQueryFilter = ({
  defaultValue = '',
  options = {},
  debounce = 300,
  transform,
  validation,
}: UseQueryFilterProps) => {
  const [query, setQuery] = useState<FilterValue<'query'>>(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState<FilterValue<'query'>>(
    defaultValue
  );
  const [isValid, setIsValid] = useState<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      let transformedValue = query;

      if (transform) {
        transformedValue = transform(query);
      }

      if (validation) {
        try {
          const validationResult = await Promise.resolve(
            validation(transformedValue)
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

      // Validate against options
      if (options.maxLength && query.length > options.maxLength) {
        setIsValid(false);
        return;
      }

      setDebouncedQuery(query);
    }, debounce);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounce, transform, validation, options]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setIsValid(true);
  }, []);

  return {
    query,
    debouncedQuery,
    setQuery,
    clearQuery,
    isValid,
  };
};
