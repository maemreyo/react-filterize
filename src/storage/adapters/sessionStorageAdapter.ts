import { StorageAdapter } from '../types';

export class SessionStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    return sessionStorage.getItem(this.getKey(key));
  }

  async setItem(key: string, value: string): Promise<void> {
    sessionStorage.setItem(this.getKey(key), value);
  }

  async removeItem(key: string): Promise<void> {
    sessionStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => sessionStorage.removeItem(key));
  }
}
