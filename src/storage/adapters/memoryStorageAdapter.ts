import { StorageAdapter } from '../types';

export class MemoryStorageAdapter implements StorageAdapter {
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
    return this.storage.get(this.getKey(key)) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(this.getKey(key), value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(this.getKey(key));
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}
