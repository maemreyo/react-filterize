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

// Base configuration for all filters
export interface BaseFilterConfig {
  key: string;
  label?: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  debounce?: number;
}

// Main filter configuration type
export interface FilterConfig<T extends ValueTypeKey> extends BaseFilterConfig {
  type: T;
  defaultValue: OutputValueType[T];
  dependencies?: Record<string, (value: OutputValueType[T]) => any>;
  transform?: (value: OutputValueType[T]) => any;
}

// Type-safe filter config creator
export function createFilterConfig<T extends ValueTypeKey>(
  config: FilterConfig<T>
): FilterConfig<T> {
  return config;
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
