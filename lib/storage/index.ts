import { IStorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';
import { GoogleStorageProvider } from './google-provider';

// Singleton instance cache across server requests
let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (storageInstance) return storageInstance;

  const providerType = process.env.STORAGE_PROVIDER?.toLowerCase() || 'local';

  if (providerType === 'google') {
    storageInstance = new GoogleStorageProvider();
  } else {
    storageInstance = new LocalStorageProvider();
  }

  return storageInstance;
}

export * from './types';
export * from './local-provider';
export * from './google-provider';
