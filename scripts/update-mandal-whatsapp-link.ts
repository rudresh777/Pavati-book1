import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { getStorageProvider } from '../lib/storage';

async function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  try {
    const raw = await fs.readFile(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  } catch {}
}

async function updateDirectSupabase() {
  await loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as any },
  });

  console.log('Fetching mandal_settings from Supabase...');
  const { data, error } = await client.from('mandal_settings').select('*');
  console.log('Existing rows:', data, 'Error:', error);

  if (data && data.length > 0) {
    for (const row of data) {
      console.log(`Updating row ID: ${row.id}`);
      const { error: updateErr } = await client
        .from('mandal_settings')
        .update({
          whatsapp_group_link: 'https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      console.log('Update result for row:', updateErr || 'SUCCESS');
    }
  }

  // Also update local storage provider
  const storage = getStorageProvider();
  await storage.init();
  const currentLocal = await storage.getSettings();
  await storage.saveSettings({
    ...currentLocal,
    whatsappGroupLink: 'https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL',
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Storage provider updated successfully.');
}

updateDirectSupabase().catch((err) => {
  console.error('Update error:', err);
  process.exit(1);
});
