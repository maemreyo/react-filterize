import { StorageAdapter, StorageConfig, StorageData } from '../types';
import { LocalStorageAdapter } from './localStorageAdapter';
import { MemoryStorageAdapter } from './memoryStorageAdapter';
import { SessionStorageAdapter } from './sessionStorageAdapter';

export class StorageManager {
  private adapter: StorageAdapter;
  private serializer: StorageConfig['serializer'];

  constructor(config: StorageConfig) {
    this.adapter = this.createAdapter(config);
    this.serializer = config.serializer || {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    };
  }

  private createAdapter(config: StorageConfig): StorageAdapter {
    const prefix = config.prefix || '@filter/';

    switch (config.type) {
      case 'local':
        return new LocalStorageAdapter(prefix);
      case 'session':
        return new SessionStorageAdapter(prefix);
      case 'memory':
        return new MemoryStorageAdapter(prefix);
      case 'none':
      default:
        return new MemoryStorageAdapter(prefix);
    }
  }

  async save(data: StorageData): Promise<void> {
    try {
      const serialized = this.serializer?.serialize(data);
      await this.adapter.setItem('filterData', serialized!);
    } catch (error) {
      console.error('Failed to save filter data:', error);
    }
  }

  async load(): Promise<StorageData | null> {
    try {
      const serialized = await this.adapter.getItem('filterData');
      if (!serialized) return null;

      const data = this.serializer?.deserialize(serialized);
      return data;
    } catch (error) {
      console.error('Failed to load filter data:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.adapter.clear();
    } catch (error) {
      console.error('Failed to clear filter data:', error);
    }
  }
}
