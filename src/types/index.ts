import { StorageConfig } from '../storage/types';

// Basic value types
export type SingleValue = string | number | boolean | Date | File;
export type ArrayValue<T> = T[];

// Output value type mapping
export interface OutputValueType {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
  file: File;
  'string[]': string[];
  'number[]': number[];
  'date[]': Date[];
  'file[]': File[];
}

// Core type keys
export type ValueTypeKey = keyof OutputValueType;

type InferValueType<T> = T extends string
  ? 'string'
  : T extends number
  ? 'number'
  : T extends boolean
  ? 'boolean'
  : T extends Date
  ? 'date'
  : T extends File
  ? 'file'
  : T extends string[]
  ? 'string[]'
  : T extends number[]
  ? 'number[]'
  : T extends Date[]
  ? 'date[]'
  : T extends File[]
  ? 'file[]'
  : never;

// Helper type to handle null/undefined
type Nullable<T> = T | null | undefined;

// Helper type for defaultValue
type DefaultValue = Nullable<
  | string
  | number
  | boolean
  | Date
  | File
  | string[]
  | number[]
  | Date[]
  | File[]
>;

// Base configuration without type and defaultValue
export interface BaseFilterConfig {
  key: string;
  label?: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  debounce?: number;
}

// Extended configuration with optional type
export interface FilterConfigWithType<T extends ValueTypeKey> 
  extends BaseFilterConfig {
  type: T;
  defaultValue?: Nullable<OutputValueType[T]>;
  dependencies?: Record<string, (value: OutputValueType[T]) => any>;
  transform?: (value: OutputValueType[T]) => any;
}

// Configuration with inferred type from defaultValue
export interface FilterConfigWithoutType<T extends DefaultValue> 
  extends BaseFilterConfig {
  defaultValue: T;
  type?: InferValueType<NonNullable<T>>;
  dependencies?: Record<
    string, 
    (value: T extends null | undefined ? any : T) => any
  >;
  transform?: (value: T extends null | undefined ? any : T) => any;
}

// Union type for all possible configurations
export type FilterConfig<T = any> = 
  | FilterConfigWithType<ValueTypeKey>
  | FilterConfigWithoutType<DefaultValue>;

// Type-safe filter config creator
export function createFilterConfig<
  T extends DefaultValue,
  Type extends ValueTypeKey = InferValueType<NonNullable<T>>
>(
  config: Omit<FilterConfigWithoutType<T>, 'type'> & { type?: Type }
): FilterConfig {
  const inferredType = config.type || inferValueTypeFromValue(config.defaultValue);
  return {
    ...config,
    type: inferredType,
  } as FilterConfig;
}

// Helper function to infer value type
function inferValueTypeFromValue(value: DefaultValue): ValueTypeKey {
  if (value === null || value === undefined) {
    return 'string'; // Default to string for null/undefined
  }

  if (Array.isArray(value)) {
    const firstItem = value[0];
    if (typeof firstItem === 'string') return 'string[]';
    if (typeof firstItem === 'number') return 'number[]';
    if (firstItem instanceof Date) return 'date[]';
    if (firstItem instanceof File) return 'file[]';
    return 'string[]'; // Default for empty arrays
  }

  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (value instanceof File) return 'file';

  return 'string'; // Default fallback
}

// Base filter hook type
export type FilterHook<T extends ValueTypeKey> = {
  value: OutputValueType[T];
  setValue: (value: OutputValueType[T]) => void;
  clear: () => void;
};

export interface FilterGroup {
  key: string;
  label: string;
  filters: string[];
  collapsed?: boolean;
  description?: string;
}

export interface UseFilterizeProps<T extends ValueTypeKey> {
  filtersConfig: FilterConfig<T>[];
  fetchData: (filters: Record<string, any>) => Promise<any>;
  options?: {
    syncWithUrl?: boolean;
    urlFiltersKey?: string;
    encodeUrlFilters?: boolean;
    enableAnalytics?: boolean;
    cacheTimeout?: number;
    autoFetch?: boolean;
    storage?: StorageConfig;
    retry?: RetryConfig;
    transform?: TransformConfig;
  };
}

export interface FilterUsageMetrics {
  count: number;
  lastUsed: Date;
  avgDuration: number;
  totalDuration: number;
}

export interface FilterAnalytics {
  filterUsage: Record<string, FilterUsageMetrics>;
  combinations: Record<string, number>;
  performance: {
    avgResponseTime: number;
    totalRequests: number;
    cacheHitRate: number;
    totalCacheHits: number;
  };
}

export interface FilterHistory {
  past: FilterHistoryState[];
  present: FilterHistoryState;
  future: FilterHistoryState[];
}

export interface FilterHistoryState {
  filters: Record<string, any>;
  timestamp: number;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: boolean;
}

export interface TransformConfig {
  input?: (data: any) => any;
  output?: (data: any) => any;
}
