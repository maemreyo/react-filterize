import { StorageConfig } from '../storage/types';

// Basic primitive types
export type SingleValue = string | number | boolean;
export type RangeValue<T> = [T, T];
export type ArrayValue<T> = T[];

// Filter type identifiers
export const FILTER_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  DATE_RANGE: 'dateRange',
  NUMBER_RANGE: 'numberRange',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  SLIDER: 'slider',
  RANGE_SLIDER: 'rangeSlider',
  RATING: 'rating',
  TAGS: 'tags',
  COLOR: 'color',
  QUERY: 'query',
  CUSTOM: 'custom',
} as const;

export type FilterTypes = typeof FILTER_TYPES[keyof typeof FILTER_TYPES];

// Mapping of filter types to their value types
export interface FilterTypeToValue {
  [FILTER_TYPES.TEXT]: string;
  [FILTER_TYPES.NUMBER]: number;
  [FILTER_TYPES.BOOLEAN]: boolean;
  [FILTER_TYPES.SELECT]: SingleValue;
  [FILTER_TYPES.MULTI_SELECT]: ArrayValue<SingleValue>;
  [FILTER_TYPES.DATE_RANGE]: RangeValue<Date>;
  [FILTER_TYPES.NUMBER_RANGE]: RangeValue<number>;
  [FILTER_TYPES.DATE]: Date;
  [FILTER_TYPES.TIME]: string;
  [FILTER_TYPES.DATETIME]: Date;
  [FILTER_TYPES.RADIO]: SingleValue;
  [FILTER_TYPES.CHECKBOX]: ArrayValue<SingleValue>;
  [FILTER_TYPES.SLIDER]: number;
  [FILTER_TYPES.RANGE_SLIDER]: RangeValue<number>;
  [FILTER_TYPES.RATING]: number;
  [FILTER_TYPES.TAGS]: ArrayValue<string>;
  [FILTER_TYPES.COLOR]: string;
  [FILTER_TYPES.QUERY]: string;
  [FILTER_TYPES.CUSTOM]: any;
}

export type FilterHook<T extends FilterTypes> = {
  value: FilterTypeToValue[T];
  updateValue: (value: FilterTypeToValue[T]) => Promise<void>;
  clearValue: () => void;
  isValid: boolean;
  options?: FilterTypeOptions[T];
};

// Helper type to enforce type safety for hooks
export type FilterHookCreator<T extends FilterTypes> = (
  config: FilterConfig<T>
) => FilterHook<T>;

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

export interface SelectOptions {
  options: Array<{ value: SingleValue; label: string }>;
  allowEmpty?: boolean;
}

export interface MultiSelectOptions {
  options: Array<{ value: SingleValue; label: string }>;
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

// Map filter types to their options
export interface FilterTypeOptions {
  [FILTER_TYPES.TEXT]: TextOptions;
  [FILTER_TYPES.NUMBER]: NumberOptions;
  [FILTER_TYPES.BOOLEAN]: Record<string, never>;
  [FILTER_TYPES.SELECT]: SelectOptions;
  [FILTER_TYPES.MULTI_SELECT]: MultiSelectOptions;
  [FILTER_TYPES.DATE_RANGE]: DateRangeOptions;
  [FILTER_TYPES.NUMBER_RANGE]: NumberOptions;
  [FILTER_TYPES.DATE]: DateRangeOptions;
  [FILTER_TYPES.TIME]: TimeOptions;
  [FILTER_TYPES.DATETIME]: DateRangeOptions;
  [FILTER_TYPES.RADIO]: SelectOptions;
  [FILTER_TYPES.CHECKBOX]: SelectOptions;
  [FILTER_TYPES.SLIDER]: SliderOptions;
  [FILTER_TYPES.RANGE_SLIDER]: SliderOptions;
  [FILTER_TYPES.RATING]: RatingOptions;
  [FILTER_TYPES.TAGS]: TagsOptions;
  [FILTER_TYPES.COLOR]: ColorOptions;
  [FILTER_TYPES.QUERY]: QueryOptions;
  [FILTER_TYPES.CUSTOM]: Record<string, any>;
}

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

// Enhanced FilterConfig interface with proper type inference
export interface FilterConfig<T extends FilterTypes> extends BaseFilterConfig {
  type: T;
  defaultValue: FilterTypeToValue[T];
  options?: FilterTypeOptions[T];
  validation?: (value: FilterTypeToValue[T]) => boolean | Promise<boolean>;
  dependencies?: Record<string, (value: FilterTypeToValue[T]) => any>;
  transform?: (value: FilterTypeToValue[T]) => any;
}

// Helper type to extract the value type for a given filter type
export type FilterValue<T extends FilterTypes> = FilterTypeToValue[T];

// Helper type to extract the options type for a given filter type
export type FilterOpts<T extends FilterTypes> = FilterTypeOptions[T];

export interface FilterGroup {
  key: string;
  label: string;
  filters: string[];
  collapsed?: boolean;
  description?: string;
}

export interface UseFilterizeProps<T extends FilterTypes> {
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
