import { StorageAdapter, SyncStorageAdapter } from '../types';

export class MemoryStorageAdapter implements SyncStorageAdapter {
  private storage: Map<string, string>;
  private prefix: string;

  constructor(prefix: string = '') {
    this.storage = new Map();
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    return this.getItemSync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.setItemSync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.removeItemSync(key);
  }

  async clear(): Promise<void> {
    this.clearSync();
  }

  getItemSync(key: string): string | null {
    return this.storage.get(this.getKey(key)) || null;
  }

  setItemSync(key: string, value: string): void {
    this.storage.set(this.getKey(key), value);
  }

  removeItemSync(key: string): void {
    this.storage.delete(this.getKey(key));
  }

  clearSync(): void {
    this.storage.clear();
  }
}
