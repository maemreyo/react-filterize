import { UrlConfig } from '../types/url';

export class UrlManager {
  private config: Required<UrlConfig>;

  private defaultConfig: Required<UrlConfig> = {
    key: 'filters',
    encode: true,
    mergeParams: true,
    namespace: '',
    serialize: filters => JSON.stringify(filters),
    deserialize: query => JSON.parse(query),
    transformers: {},
  };

  constructor(config: UrlConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  private getParamKey(): string {
    return this.config.namespace
      ? `${this.config.namespace}-${this.config.key}`
      : this.config.key;
  }

  private encodeValue(value: string): string {
    return this.config.encode ? encodeURIComponent(value) : value;
  }

  private decodeValue(value: string): string {
    return this.config.encode ? decodeURIComponent(value) : value;
  }

  private transformValue(key: string, value: any): any {
    const transformer = this.config.transformers[key];
    return transformer ? transformer(value) : value;
  }

  private getCurrentUrlParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }

  private isEmptyObject(obj: Record<string, any>): boolean {
    return obj && Object.keys(obj).length === 0;
  }

  private updateBrowserUrl(urlParams: URLSearchParams): void {
    const search = urlParams.toString();
    const newUrl = `${window.location.pathname}${search ? '?' + search : ''}${
      window.location.hash
    }`;
    window.history.pushState({}, '', newUrl);
  }

  public updateUrl(filters: Record<string, any>): void {
    // Don't update URL if filters is empty
    if (!filters || this.isEmptyObject(filters)) {
      this.clearUrl();
      return;
    }

    const urlParams = this.getCurrentUrlParams();
    const paramKey = this.getParamKey();

    // Transform and serialize filters
    const transformedFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        // Skip null, undefined, empty string values
        if (value === null || value === undefined || value === '') {
          return acc;
        }
        return {
          ...acc,
          [key]: this.transformValue(key, value),
        };
      },
      {}
    );

    // Don't update URL if all values were filtered out
    if (this.isEmptyObject(transformedFilters)) {
      this.clearUrl();
      return;
    }

    try {
      const serializedFilters = this.config.serialize(transformedFilters);
      // Don't encode if filters are empty
      if (serializedFilters === '{}') {
        this.clearUrl();
        return;
      }

      const encodedFilters = this.encodeValue(serializedFilters);

      // Clear existing namespace params if not merging
      if (!this.config.mergeParams) {
        urlParams.forEach((_, key) => {
          if (key.startsWith(this.config.namespace)) {
            urlParams.delete(key);
          }
        });
      }

      urlParams.set(paramKey, encodedFilters);
      this.updateBrowserUrl(urlParams);
    } catch (error) {
      console.error('Error updating URL with filters:', error);
    }
  }

  public getFiltersFromUrl(): Record<string, any> | null {
    const urlParams = this.getCurrentUrlParams();
    const paramKey = this.getParamKey();
    const encodedFilters = urlParams.get(paramKey);

    if (!encodedFilters) {
      return null;
    }

    try {
      const decodedFilters = this.decodeValue(encodedFilters);
      const parsedFilters = this.config.deserialize(decodedFilters);

      // Return null if empty object
      return this.isEmptyObject(parsedFilters) ? null : parsedFilters;
    } catch (error) {
      console.error('Error parsing filters from URL:', error);
      this.clearUrl(); // Clear invalid URL params
      return null;
    }
  }

  public clearUrl(): void {
    const urlParams = this.getCurrentUrlParams();
    const paramKey = this.getParamKey();

    if (!this.config.mergeParams) {
      // Clear all params in namespace
      urlParams.forEach((_, key) => {
        if (key.startsWith(this.config.namespace)) {
          urlParams.delete(key);
        }
      });
    } else {
      // Only clear specific param
      urlParams.delete(paramKey);
    }

    // Remove URL parameters if they're all empty
    if (Array.from(urlParams.entries()).length === 0) {
      this.updateBrowserUrl(new URLSearchParams());
    } else {
      this.updateBrowserUrl(urlParams);
    }
  }
}
