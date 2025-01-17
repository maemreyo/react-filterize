export interface UrlConfig {
  /**
   * Key prefix for URL parameters. Helps avoid conflicts when using multiple instances
   * @default 'filters'
   */
  key?: string;

  /**
   * Whether to encode/decode URL parameters
   * @default true
   */
  encode?: boolean;

  /**
   * Whether to merge with existing URL params (true) or override them (false)
   * @default true
   */
  mergeParams?: boolean;

  /**
   * Namespace for multiple filter instances on the same page
   * @example 'userFilters', 'productFilters'
   */
  namespace?: string;

  /**
   * Transform functions for specific filter keys
   * @example { date: (value) => value.toISOString() }
   */
  transformers?: Record<string, (value: any) => string>;

  /**
   * Custom serialization function
   * @param filters Current filter values
   * @returns Serialized string for URL
   */
  serialize?: (filters: Record<string, any>) => string;

  /**
   * Custom deserialization function
   * @param query URL query string
   * @returns Parsed filter values
   */
  deserialize?: (query: string) => Record<string, any>;
}
