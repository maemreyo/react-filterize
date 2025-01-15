import { StorageAdapter } from '../types';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(this.getKey(key));
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(this.getKey(key), value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}
