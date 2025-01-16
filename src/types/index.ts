import { StorageConfig } from '../storage/types';

// ==============================================
// ============== Basic Value Types =============
// ==============================================

// Basic primitive types
export type SingleValue = string | number | boolean;
export type RangeValue<T> = [T, T];
export type ArrayValue<T> = T[];

// ==============================================
// ============== Output Value Types ============
// ==============================================

// Instead of mapping filter types to their value types, we now define the core output value types directly.
export interface OutputValueType {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
  'string[]': ArrayValue<string>;
  'number[]': ArrayValue<number>;
  'range<number>': RangeValue<number>;
  'range<date>': RangeValue<Date>;
}

// ==============================================
// ================= Filter Config ===============
// ==============================================

// Base filter config interface
export interface BaseFilterConfig {
  key: string;
  label?: string;
  description?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  debounce?: number;
}

// This type will be used to simplify other type definitions.
export type CoreOutputValueTypes = keyof OutputValueType;


export type FilterOptionsKeys = keyof FilterOptions;

export type AllowedStringOptions<T extends CoreOutputValueTypes> = Extract<
  T extends 'range<number>' | 'range<date>'
    ? T
    : T extends 'string[]' | 'number[]'
    ? T
    : T,
  FilterOptionsKeys
>;

export type FilterOpts<T extends CoreOutputValueTypes> = AllowedStringOptions<
  T
> extends keyof FilterOptions
  ? FilterOptions[AllowedStringOptions<T>]
  : never;

// Enhanced FilterConfig interface with proper type inference
export interface FilterConfig<T extends CoreOutputValueTypes>
  extends BaseFilterConfig {
  // Instead of filter types, we use output types
  outputType: T;
  defaultValue: OutputValueType[T];
  // Using mapped type and conditional type to only require `options` for non-boolean filters.
  options?: FilterOpts<T>;
  validation?: (value: OutputValueType[T]) => boolean | Promise<boolean>;
  dependencies?: Record<string, (value: OutputValueType[T]) => any>;
  transform?: (value: OutputValueType[T]) => any;
}

// ==============================================
// ============== Filter Hooks ==================
// ==============================================

// Redefine FilterHook to use OutputValueType
export type FilterHook<T extends CoreOutputValueTypes> = {
  value: OutputValueType[T];
  updateValue: (value: OutputValueType[T]) => Promise<void>;
  clearValue: () => void;
  isValid: boolean;
  options?: FilterOpts<T>;
};

// ==============================================
// ============== Filter Options ================
// ==============================================

// Options interface for each filter type
export interface TextOptions {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
}

export interface NumberOptions {
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectOptions<T extends SingleValue = SingleValue> {
  options: Array<{ value: T; label: string }>;
  allowEmpty?: boolean;
}

export interface MultiSelectOptions<T extends SingleValue = SingleValue> {
  options: Array<{ value: T; label: string }>;
  maxSelect?: number;
  minSelect?: number;
}

export interface DateRangeOptions {
  minDate?: Date;
  maxDate?: Date;
  format?: string;
}

export interface TimeOptions {
  format?: '12h' | '24h';
  step?: number;
}

export interface SliderOptions {
  min: number;
  max: number;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}

export interface RatingOptions {
  max?: number;
  allowHalf?: boolean;
}

export interface TagsOptions {
  maxTags?: number;
  suggestions?: string[];
}

export interface ColorOptions {
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: string[];
}

export interface QueryOptions {
  maxLength?: number;
  placeholder?: string;
}

// ==============================================
// ========== Filter Options Mapping =============
// ==============================================
export interface FilterOptions {
  string: TextOptions | QueryOptions;
  number: NumberOptions | SliderOptions;
  date: DateRangeOptions;
  'string[]': SelectOptions | MultiSelectOptions<string> | TagsOptions;
  'number[]': SelectOptions | MultiSelectOptions<number> | SliderOptions;
  'range<number>': NumberOptions | SliderOptions;
  'range<date>': DateRangeOptions;
}

// ==============================================
// =============== Filter Group ==================
// ==============================================

export interface FilterGroup {
  key: string;
  label: string;
  filters: string[];
  collapsed?: boolean;
  description?: string;
}

// ==============================================
// =========== UseFilterize Props ===============
// ==============================================

export interface UseFilterizeProps<T extends CoreOutputValueTypes> {
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
  presets?: FilterPresets;
  groups?: FilterGroup[];
}

// ==============================================
// ================== Presets ===================
// ==============================================

export interface FilterPresets {
  dateRanges: {
    today: () => [Date, Date];
    lastWeek: () => [Date, Date];
    lastMonth: () => [Date, Date];
    custom: (start: Date, end: Date) => [Date, Date];
  };
  sorts: {
    nameAsc: SortConfig;
    nameDesc: SortConfig;
    dateAsc: SortConfig;
    dateDesc: SortConfig;
  };
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// ==============================================
// ================== Analytics =================
// ==============================================
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

// ==============================================
// ================== Utilities ===================
// ==============================================

export interface FilterHistory {
  past: FilterHistoryState[];
  present: FilterHistoryState;
  future: FilterHistoryState[];
}

export interface FilterHistoryState {
  filters: Record<string, any>;
  activeGroups: string[];
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
