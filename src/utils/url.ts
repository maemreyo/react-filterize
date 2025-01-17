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

  public updateUrl(filters: Record<string, any>): void {
    const urlParams = this.getCurrentUrlParams();
    const paramKey = this.getParamKey();

    // Transform and serialize filters
    const transformedFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: this.transformValue(key, value),
      }),
      {}
    );

    const serializedFilters = this.config.serialize(transformedFilters);
    const encodedFilters = this.encodeValue(serializedFilters);

    // Update URL params
    if (!this.config.mergeParams) {
      urlParams.forEach((_, key) => {
        if (key.startsWith(this.config.namespace)) {
          urlParams.delete(key);
        }
      });
    }

    urlParams.set(paramKey, encodedFilters);

    // Update browser URL
    const newUrl = `${window.location.pathname}?${urlParams.toString()}${
      window.location.hash
    }`;
    window.history.pushState({}, '', newUrl);
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
      return this.config.deserialize(decodedFilters);
    } catch (error) {
      console.error('Error parsing filters from URL:', error);
      return null;
    }
  }

  public clearUrl(): void {
    const urlParams = this.getCurrentUrlParams();
    const paramKey = this.getParamKey();
    urlParams.delete(paramKey);

    const newUrl = `${window.location.pathname}?${urlParams.toString()}${
      window.location.hash
    }`;
    window.history.pushState({}, '', newUrl);
  }
}
