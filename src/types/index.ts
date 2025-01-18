import { StorageConfig } from '../storage/types';
import { FetchConfig } from '../utils/fetch';
import { FetchState } from '../utils/state';
import { inferValueTypeFromValue } from '../utils/typing';
import { UrlConfig } from './url';

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
export type NullableArray<T> = Array<T | null> | null | undefined;
export type Nullable<T> = T | null | undefined;

export type DefaultValue =
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

// Filter Config Types
export interface BaseFilterConfig {
  key: string;
  label?: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}

export interface FilterConfigWithType<T extends ValueTypeKey>
  extends BaseFilterConfig {
  type: T;
  defaultValue?: OutputValueType[T];
  dependencies?: Record<
    string,
    (value: OutputValueType[T]) => Promise<any> | any
  >;
  transform?: (value: OutputValueType[T]) => any;
}

export interface FilterConfigWithDefaultValue<T extends DefaultValue>
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
  | FilterConfigWithDefaultValue<DefaultValue>;

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

export type ExtractKeys<T> = T extends FilterConfig ? T['key'] : never;
export type GetConfigForKey<
  T extends FilterConfig[],
  K extends string
> = Extract<T[number], { key: K }>;
export type FilterValues<T extends FilterConfig[]> = {
  [P in ExtractKeys<T[number]>]: FilterOutput<GetConfigForKey<T, P>>;
};

export interface DefaultValuesConfig {
  initialValues?: Record<string, any>;
  resetValues?: Record<string, any>;
  onReset?: () => Record<string, any>;
}

export interface UseFilterizeOptions<TConfig extends FilterConfig[]> {
  url?: UrlConfig | boolean;
  storage?: StorageConfig;
  cacheTimeout?: number;
  autoFetch?: boolean;
  retry?: RetryConfig;
  transform?: TransformConfig;
  fetch?: FetchConfig;
  defaults?: DefaultValuesConfig;
}

export interface UseFilterizeProps<TConfig extends FilterConfig[]> {
  config: TConfig;
  fetch: (filters: Partial<FilterValues<TConfig>>) => Promise<any>;
  options?: UseFilterizeOptions<TConfig>;
}

export function addFilter<T extends ValueTypeKey>(
  config: FilterConfigWithType<T>
): FilterConfig;
export function addFilter<T extends DefaultValue>(
  config: Omit<FilterConfigWithDefaultValue<T>, 'type'> & {
    type?: InferValueType<NonNullable<T>>;
  }
): FilterConfig;
export function addFilter(config: any): FilterConfig {
  if ('type' in config) {
    return config as FilterConfigWithType<ValueTypeKey>;
  }

  const inferredType = inferValueTypeFromValue(config.defaultValue);
  return {
    ...config,
    type: config.type || inferredType,
  } as FilterConfigWithDefaultValue<DefaultValue>;
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

export type FilterOutput<
  T extends FilterConfig
> = T extends FilterConfigWithType<infer Type>
  ? OutputValueType[Type]
  : T extends FilterConfigWithDefaultValue<infer Value>
  ? Value
  : never;

export type FilterSource = 'url' | 'storage' | 'default' | 'none';

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

export interface UseFilterizeReturn<TConfig extends FilterConfig[]> {
  filters: Partial<FilterValues<TConfig>>;
  updateFilter: <K extends keyof FilterValues<TConfig>>(
    key: K,
    value: FilterValues<TConfig>[K]
  ) => void;
  loading: boolean;
  error: Error | null;
  data: any;
  filterSource: FilterSource;
  exportFilters: () => {
    filters: string;
  };
  importFilters: (data: { filters: string; groups?: string[] }) => void;
  refetch: () => Promise<void>;
  storage: {
    clear: () => Promise<void>;
  };
  reset: () => void;
  history: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    current: FilterHistoryState<Partial<FilterValues<TConfig>>>;
    past: FilterHistoryState<Partial<FilterValues<TConfig>>>[];
    future: FilterHistoryState<Partial<FilterValues<TConfig>>>[];
  };
  fetchState: FetchState;
  validateRequiredFilters: any;
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
