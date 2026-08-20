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
  } catch {
    // ignore
  }
}

async function testConnection() {
  console.log('================================================================');
  console.log('🔍 Testing Supabase Connection');
  console.log('================================================================\n');

  await loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const storageProvider = process.env.STORAGE_PROVIDER?.trim();

  console.log('1. Checking Environment Variables in .env.local:');
  console.log(`   - STORAGE_PROVIDER: ${storageProvider || '(not set - defaults to local)'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configured (' + supabaseUrl + ')' : '❌ Not Configured (Empty)'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? '✅ Configured (Length: ' + anonKey.length + ')' : '❌ Not Configured (Empty)'}`);
  console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅ Configured (Length: ' + serviceKey.length + ')' : '❌ Not Configured (Empty)'}\n`);

  if (!supabaseUrl || (!anonKey && !serviceKey)) {
    console.log('❌ Result: Supabase credentials are missing in .env.local.');
    console.log('👉 Please open .env.local and add your Supabase Project URL and API keys.');
    console.log('   See SUPABASE_SETUP.md for full instructions.\n');
    return;
  }

  const keyToUse = serviceKey || anonKey!;
  console.log('2. Connecting to Supabase Cloud...');
  const supabase = createClient(supabaseUrl, keyToUse, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });

  console.log('3. Verifying Database Tables:');

  const tables = [
    'mandal_settings',
    'users',
    'donors',
    'payments',
    'pavtis',
    'announcements',
    'audit_logs',
    'receipt_counters',
  ];

  let allOk = true;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`   - Table '${table}': ❌ Error (${error.message})`);
        allOk = false;
      } else {
        console.log(`   - Table '${table}': ✅ Accessible (Total rows: ${count ?? 0})`);
      }
    } catch (err: any) {
      console.log(`   - Table '${table}': ❌ Failed (${err.message})`);
      allOk = false;
    }
  }

  console.log('\n4. Testing Atomic Receipt Number Function:');
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_next_receipt_number_atomic', { p_mode: 'TEST' });
    if (rpcError) {
      console.log(`   - Function 'get_next_receipt_number_atomic': ⚠️ Warning (${rpcError.message})`);
    } else {
      console.log(`   - Function 'get_next_receipt_number_atomic': ✅ Working (Generated test receipt: ${rpcData?.formatted || JSON.stringify(rpcData)})`);
    }
  } catch (err: any) {
    console.log(`   - Function test error: ${err.message}`);
  }

  console.log('\n================================================================');
  if (allOk) {
    console.log('🎉 SUCCESS: Supabase is properly configured and connected!');
    console.log('   Your Digital Pavti Book backend is 100% active on Supabase.');
  } else {
    console.log('⚠️  ATTENTION: Connection reached Supabase, but some tables or functions are missing.');
    console.log('   Please make sure to run the SQL in supabase/schema.sql in the Supabase SQL Editor.');
  }
  console.log('================================================================\n');
}

testConnection();
