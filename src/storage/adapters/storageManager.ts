import { compress, decompress } from '../../utils/compression';
import { StorageConfig, StorageData } from '../types';

export class StorageManager {
  private config: Required<StorageConfig>;
  private storage: Storage | null;
  private memoryStorage: Map<string, string>;

  private defaultConfig: Required<StorageConfig> = {
    type: 'none',
    key: 'filterize',
    version: '1.0.0',
    migrations: [],
    include: [],
    exclude: [],
    compress: false,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    onMigrationComplete: () => {},
  };

  constructor(config: StorageConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.memoryStorage = new Map();

    // Initialize storage based on type
    switch (this.config.type) {
      case 'local':
        this.storage = window.localStorage;
        break;
      case 'session':
        this.storage = window.sessionStorage;
        break;
      case 'memory':
        this.storage = null; // Use memoryStorage
        break;
      default:
        this.storage = null;
    }
  }

  private async compressData(data: string): Promise<string> {
    return this.config.compress ? await compress(data) : data;
  }

  private async decompressData(data: string): Promise<string> {
    return this.config.compress ? await decompress(data) : data;
  }

  private filterData(data: Record<string, any>): Record<string, any> {
    // console.log('[StorageManager] Filtering data:', data);

    // Use empty arrays as default values
    const { include = [], exclude = [] } = this.config;

    // console.log('[StorageManager] Include:', include);
    // console.log('[StorageManager] Exclude:', exclude);
    // console.log('[StorageManager] Data keys:', Object.keys(data));

    if (include.length > 0) {
      return Object.fromEntries(
        Object.entries(data.filters).filter(([key]) => include.includes(key))
      );
    }

    if (exclude.length > 0) {
      return Object.fromEntries(
        Object.entries(data.filters).filter(([key]) => !exclude.includes(key))
      );
    }

    return data;
  }

  private async migrateData(
    data: StorageData,
    currentVersion: string
  ): Promise<StorageData> {
    if (!data.version || data.version === currentVersion) {
      return data;
    }

    const migrations = this.config.migrations
      .filter(m => m.fromVersion === data.version)
      .sort((a, b) => this.compareVersions(b.fromVersion, a.fromVersion));

    let migratedData = { ...data };

    for (const migration of migrations) {
      migratedData = await migration.transform(
        migratedData,
        migration.fromVersion
      );
    }

    migratedData.version = currentVersion;

    this.config.onMigrationComplete?.(
      data.version,
      currentVersion,
      migratedData
    );

    return migratedData;
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (partsA[i] > partsB[i]) return 1;
      if (partsA[i] < partsB[i]) return -1;
    }

    return 0;
  }

  public async save(data: Omit<StorageData, 'version'>): Promise<void> {
    if (this.config.type === 'none') return;

    const filteredData = this.filterData(data);
    // console.log('[StorageManager] Saving data:', filteredData);
    const storageData: StorageData = {
      filters: { ...filteredData },
      version: this.config.version,
      timestamp: Date.now(),
    };

    const serialized = this.config.serialize(storageData);
    const compressed = await this.compressData(serialized);

    if (this.storage) {
      this.storage.setItem(this.config.key, compressed);
    } else {
      this.memoryStorage.set(this.config.key, compressed);
    }
  }

  public async load(): Promise<StorageData | null> {
    if (this.config.type === 'none') return null;

    const compressed = this.storage
      ? this.storage.getItem(this.config.key)
      : this.memoryStorage.get(this.config.key);

    if (!compressed) return null;

    try {
      const decompressed = await this.decompressData(compressed);
      const data = this.config.deserialize(decompressed) as StorageData;

      return await this.migrateData(data, this.config.version);
    } catch (error) {
      console.error('Error loading storage:', error);
      return null;
    }
  }

  public loadSync(): StorageData | null {
    if (this.config.type === 'none') return null;

    const compressed = this.storage
      ? this.storage.getItem(this.config.key)
      : this.memoryStorage.get(this.config.key);

    if (!compressed) return null;

    try {
      const data = this.config.deserialize(compressed) as StorageData;
      // Note: Sync load doesn't support compression or migration
      return data;
    } catch {
      return null;
    }
  }

  public async clear(): Promise<void> {
    if (this.storage) {
      this.storage.removeItem(this.config.key);
    } else {
      this.memoryStorage.delete(this.config.key);
    }
  }

  public async clearAll(): Promise<void> {
    if (this.storage) {
      this.storage.clear();
    } else {
      this.memoryStorage.clear();
    }
  }
}
