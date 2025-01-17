export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface SyncStorageAdapter extends StorageAdapter {
  getItemSync: (key: string) => string | null;
  setItemSync: (key: string, value: string) => void;
  removeItemSync: (key: string) => void;
  clearSync: () => void;
}

// export interface StorageConfig {
//   type: 'local' | 'session' | 'memory' | 'none';
//   prefix?: string;
//   serializer?: {
//     serialize: (data: any) => string;
//     deserialize: (str: string) => any;
//   };
// }

// export interface StorageData {
//   filters: Record<string, any>;
//   timestamp: number;
// }

// types/storage.ts
export type StorageType = 'local' | 'session' | 'memory' | 'none';

export interface MigrationStrategy {
  /**
   * Transform stored data from old version to new version
   */
  transform: (data: any, fromVersion: string) => any;
  
  /**
   * Version this migration handles
   */
  fromVersion: string;
}

export interface StorageConfig {
  /**
   * Storage type to use
   * @default 'none'
   */
  type?: StorageType;

  /**
   * Storage key
   * @default 'filterize'
   */
  key?: string;

  /**
   * Data schema version
   */
  version?: string;

  /**
   * Migration strategies for version upgrades
   */
  migrations?: MigrationStrategy[];

  /**
   * Fields to include in storage (if empty, all fields are included)
   */
  include?: string[];

  /**
   * Fields to exclude from storage
   */
  exclude?: string[];

  /**
   * Whether to compress stored data
   * @default false
   */
  compress?: boolean;

  /**
   * Custom serialization functions
   */
  serialize?: (data: any) => string;
  deserialize?: (data: string) => any;

  /**
   * Called when migration completes
   */
  onMigrationComplete?: (
    oldVersion: string,
    newVersion: string,
    data: any
  ) => void;
}

export interface StorageData {
  filters: Record<string, any>;
  version?: string;
  timestamp: number;
  meta?: Record<string, any>;
}