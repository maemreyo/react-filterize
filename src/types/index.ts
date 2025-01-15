export type FilterTypes =
  | 'query'
  | 'select'
  | 'multiSelect'
  | 'dateRange'
  | 'numberRange'
  | 'custom';

export interface FilterTypeToValue {
  query: string;
  select: string;
  multiSelect: string[];
  dateRange: [Date, Date];
  numberRange: [number, number];
  custom: any;
}

export interface FilterConfig<T extends FilterTypes> {
  key: string;
  type: T;
  defaultValue: FilterTypeToValue[T];
  label?: string;
  debounce?: number;
  validation?: (value: FilterTypeToValue[T]) => boolean | Promise<boolean>;
  dependencies?: Record<string, (value: FilterTypeToValue[T]) => any>;
  transform?: (value: FilterTypeToValue[T]) => any;
}

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
    persistFilters?: boolean;
    enableAnalytics?: boolean;
    cacheTimeout?: number;
    autoFetch?: boolean;
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
