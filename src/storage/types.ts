export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
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
