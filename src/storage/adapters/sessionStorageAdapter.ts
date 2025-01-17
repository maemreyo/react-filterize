// adapters/sessionStorageAdapter.ts
import { StorageAdapter, SyncStorageAdapter } from '../types';

export class SessionStorageAdapter implements SyncStorageAdapter {
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
    return sessionStorage.getItem(this.getKey(key));
  }

  setItemSync(key: string, value: string): void {
    sessionStorage.setItem(this.getKey(key), value);
  }

  removeItemSync(key: string): void {
    sessionStorage.removeItem(this.getKey(key));
  }

  clearSync(): void {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => sessionStorage.removeItem(key));
  }
}
