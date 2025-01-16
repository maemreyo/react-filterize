import { StorageConfig } from '../storage/types';

export const ValueTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  FILE: 'file',
  STRING_ARRAY: 'string[]',
  NUMBER_ARRAY: 'number[]',
  DATE_ARRAY: 'date[]',
  FILE_ARRAY: 'file[]',
} as const;

export interface OutputValueType {
  [ValueTypes.STRING]: string;
  [ValueTypes.NUMBER]: number;
  [ValueTypes.BOOLEAN]: boolean;
  [ValueTypes.DATE]: Date;
  [ValueTypes.FILE]: File;
  [ValueTypes.STRING_ARRAY]: string[] | NullableArray<string>;
  [ValueTypes.NUMBER_ARRAY]: number[] | NullableArray<number>;
  [ValueTypes.DATE_ARRAY]: Date[] | NullableArray<Date>;
  [ValueTypes.FILE_ARRAY]: File[] | NullableArray<File>;
}

export type ValueTypeKey = typeof ValueTypes[keyof typeof ValueTypes];

type NullableArray<T> = Array<T | null> | null | undefined;

type InferValueType<T> = T extends string
  ? typeof ValueTypes.STRING
  : T extends number
  ? typeof ValueTypes.NUMBER
  : T extends boolean
  ? typeof ValueTypes.BOOLEAN
  : T extends Date
  ? typeof ValueTypes.DATE
  : T extends File
  ? typeof ValueTypes.FILE
  : T extends (string | null)[]
  ? typeof ValueTypes.STRING_ARRAY
  : T extends (number | null)[]
  ? typeof ValueTypes.NUMBER_ARRAY
  : T extends (Date | null)[]
  ? typeof ValueTypes.DATE_ARRAY
  : T extends (File | null)[]
  ? typeof ValueTypes.FILE_ARRAY
  : never;

type Nullable<T> = T | null | undefined;

type DefaultValue =
  | string
  | number
  | boolean
  | Date
  | File
  | NullableArray<string>
  | NullableArray<number>
  | NullableArray<Date>
  | NullableArray<File>
  | null
  | undefined;

export interface BaseFilterConfig {
  key: string;
  label?: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  debounce?: number;
}

export interface FilterConfigWithType<T extends ValueTypeKey>
  extends BaseFilterConfig {
  type: T;
  defaultValue?: OutputValueType[T];
  dependencies?: Record<string, (value: OutputValueType[T]) => any>;
  transform?: (value: OutputValueType[T]) => any;
}


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


export type FilterConfig<T = any> =
  | FilterConfigWithType<ValueTypeKey>
  | FilterConfigWithoutType<DefaultValue>;

function isStringArray(arr: unknown[]): arr is (string | null)[] {
  return arr.some(item => item !== null && typeof item === 'string');
}

function isNumberArray(arr: unknown[]): arr is (number | null)[] {
  return arr.some(item => item !== null && typeof item === 'number');
}

function isDateArray(arr: unknown[]): arr is (Date | null)[] {
  return arr.some(item => item !== null && item instanceof Date);
}

function isFileArray(arr: unknown[]): arr is (File | null)[] {
  return arr.some(item => item !== null && item instanceof File);
}

function inferValueTypeFromValue(value: DefaultValue): ValueTypeKey {
  if (value === null || value === undefined) {
    return ValueTypes.STRING;
  }

  if (Array.isArray(value)) {
    if (isDateArray(value)) return ValueTypes.DATE_ARRAY;
    if (isNumberArray(value)) return ValueTypes.NUMBER_ARRAY;
    if (isFileArray(value)) return ValueTypes.FILE_ARRAY;
    return ValueTypes.STRING_ARRAY; 
  }

  if (typeof value === 'string') return ValueTypes.STRING;
  if (typeof value === 'number') return ValueTypes.NUMBER;
  if (typeof value === 'boolean') return ValueTypes.BOOLEAN;
  if (value instanceof Date) return ValueTypes.DATE;
  if (value instanceof File) return ValueTypes.FILE;

  return ValueTypes.STRING;
}

export function createFilterConfig<
  T extends DefaultValue,
  Type extends ValueTypeKey = InferValueType<NonNullable<T>>
>(
  config: Omit<FilterConfigWithoutType<T>, 'type'> & { type?: Type }
): FilterConfig {
  const inferredType =
    config.type || inferValueTypeFromValue(config.defaultValue);
  return {
    ...config,
    type: inferredType,
  } as FilterConfig;
}


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

export type ExtractFilterValue<T> = T extends FilterConfig<infer V> ? V : never;

export type FilterOutput<T extends FilterConfig> = T extends FilterConfigWithType<infer Type>
  ? OutputValueType[Type]
  : T extends FilterConfigWithoutType<infer Value>
  ? Value
  : never;

export type FilterValues<T extends FilterConfig[]> = {
  [K in T[number] as K['key']]: FilterOutput<K>;
};

export interface UseFilterizeProps<TConfig extends FilterConfig[]> {
  filtersConfig: [...TConfig];
  fetchData: (filters: Partial<FilterValues<TConfig>>) => Promise<any>;
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

export interface FilterHistory<T> {
  past: FilterHistoryState<T>[];
  present: FilterHistoryState<T>;
  future: FilterHistoryState<T>[];
}

export interface FilterHistoryState<T> {
  filters: T;
  timestamp: number;
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

export interface UseFilterAnalyticsReturn<TConfig extends FilterConfig[]> {
  filterUsage: Record<keyof FilterValues<TConfig>, FilterUsageMetrics>;
  combinations: Record<string, number>;
  performance: {
    avgResponseTime: number;
    totalRequests: number;
    cacheHitRate: number;
    totalCacheHits: number;
  };
}

export interface UseFilterizeReturn<TConfig extends FilterConfig[]> {
  filters: Partial<FilterValues<TConfig>>;
  updateFilter: <K extends keyof FilterValues<TConfig>>(
    key: K,
    value: FilterValues<TConfig>[K]
  ) => void;
  loading: boolean;
  error: Error | null;
  data: any;
  exportFilters: () => {
    filters: string;
  };
  importFilters: (data: { 
    filters: string; 
    groups?: string[];
  }) => void;
  analytics: {
    filterUsage: Record<keyof FilterValues<TConfig>, FilterUsageMetrics>;
    combinations: Record<string, number>;
    performance: {
      avgResponseTime: number;
      totalRequests: number;
      cacheHitRate: number;
      totalCacheHits: number;
    };
  } | null;
  fetchData: () => Promise<void>;
  storage: {
    clear: () => Promise<void>;
  };
  history: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    current: FilterHistoryState<Partial<FilterValues<TConfig>>>;
    past: FilterHistoryState<Partial<FilterValues<TConfig>>>[];
    future: FilterHistoryState<Partial<FilterValues<TConfig>>>[];
  };
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
