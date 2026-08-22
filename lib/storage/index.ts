import { IStorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';
import { GoogleStorageProvider } from './google-provider';
import { SupabaseStorageProvider } from './supabase-provider';

// Singleton instance cache across server requests
let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (storageInstance) return storageInstance;

  const providerType = process.env.STORAGE_PROVIDER?.toLowerCase() || 'local';

  if (providerType === 'supabase' || (process.env.NEXT_PUBLIC_SUPABASE_URL && providerType !== 'local' && providerType !== 'google')) {
    storageInstance = new SupabaseStorageProvider();
  } else if (providerType === 'google') {
    storageInstance = new GoogleStorageProvider();
  } else {
    storageInstance = new LocalStorageProvider();
  }

  return storageInstance!;
}

export * from './types';
export * from './local-provider';
export * from './google-provider';
export * from './supabase-provider';

