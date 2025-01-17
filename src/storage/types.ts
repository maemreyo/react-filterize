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

export interface StorageConfig {
  type: 'local' | 'session' | 'memory' | 'none';
  prefix?: string;
  serializer?: {
    serialize: (data: any) => string;
    deserialize: (str: string) => any;
  };
}

export interface StorageData {
  filters: Record<string, any>;
  timestamp: number;
}
