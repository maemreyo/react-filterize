import { StorageAdapter, SyncStorageAdapter } from '../types';

export class LocalStorageAdapter implements SyncStorageAdapter {
  private prefix: string;

  constructor(prefix: string = '') {
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
    return localStorage.getItem(this.getKey(key));
  }

  setItemSync(key: string, value: string): void {
    localStorage.setItem(this.getKey(key), value);
  }

  removeItemSync(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clearSync(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}
