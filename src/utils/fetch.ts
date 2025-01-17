export interface FetchConfig {
  /**
   * Dependencies array that will trigger a fetch when changed
   */
  dependencies?: any[];

  /**
   * Debounce time in milliseconds for fetch requests
   * @default 300
   */
  debounceTime?: number;

  /**
   * Default filters to use when resetting
   */
  defaultValues?: Record<string, any>;

  /**
   * Whether to fetch data when filters are empty
   * @default false
   */
  fetchOnEmpty?: boolean;

  /**
   * Filter keys that must have non-null values before fetching
   */
  requiredFilters?: string[];

  /**
   * Condition to determine if fetch should occur
   * @returns boolean or Promise<boolean>
   */
  shouldFetch?: (filters: Record<string, any>) => boolean | Promise<boolean>;

  /**
   * Transform filters before fetching
   * @returns transformed filters or Promise of transformed filters
   */
  beforeFetch?: (
    filters: Record<string, any>
  ) => Record<string, any> | Promise<Record<string, any>>;

  /**
   * Called when required filters are missing
   */
  onMissingRequired?: (missingFilters: string[]) => void;

  /**
   * Called when shouldFetch returns false
   */
  onFetchPrevented?: (filters: Record<string, any>) => void;
}
