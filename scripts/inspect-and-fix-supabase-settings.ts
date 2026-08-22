import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

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

async function inspectAndFix() {
  await loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  console.log('--- Inspecting with ANON key ---');
  const anonClient = createClient(url, anonKey, { realtime: { transport: ws as any } });
  const { data: anonData, error: anonErr } = await anonClient.from('mandal_settings').select('*');
  console.log('Anon client query:', JSON.stringify(anonData, null, 2), 'Error:', anonErr);

  console.log('\n--- Inspecting with SERVICE key ---');
  const serviceClient = createClient(url, serviceKey, { realtime: { transport: ws as any } });
  const { data: servData, error: servErr } = await serviceClient.from('mandal_settings').select('*');
  console.log('Service client query:', JSON.stringify(servData, null, 2), 'Error:', servErr);

  console.log('\n--- Updating with SERVICE key ---');
  const { data: updateRes, error: updateErr } = await serviceClient
    .from('mandal_settings')
    .update({
      whatsapp_group_link: 'https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL',
      updated_at: new Date().toISOString(),
    })
    .neq('id', 'non-existent-id')
    .select();
  console.log('Update result:', JSON.stringify(updateRes, null, 2), 'Error:', updateErr);
}

inspectAndFix().catch(console.error);
