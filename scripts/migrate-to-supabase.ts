import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Load .env.local if running standalone
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
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // ignore if .env.local doesn't exist
  }
}

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 Digital Pavti Book - Supabase Data Migration Tool');
  console.log('================================================================\n');

  await loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Error: Supabase credentials missing.');
    console.error('Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });

  const dbJsonPath = path.join(process.cwd(), 'data', 'mandal_database.json');
  let rawJson: string;

  try {
    rawJson = await fs.readFile(dbJsonPath, 'utf-8');
  } catch (err: any) {
    console.error(`❌ Error reading database file at ${dbJsonPath}:`, err.message);
    process.exit(1);
  }

  const db = JSON.parse(rawJson);
  console.log(`📂 Read data from: ${dbJsonPath}\n`);

  // 1. Migrate Settings
  if (db.settings) {
    console.log('⚙️  Migrating Mandal Settings...');
    const settingsPayload = {
      id: db.settings.id || 'mandal-settings-default',
      mandal_name_marathi: db.settings.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ',
      mandal_name_english: db.settings.mandalNameEnglish || 'Morya Ganeshotsav Mandal',
      reg_number: db.settings.regNumber || '',
      location_marathi: db.settings.locationMarathi || '',
      location_english: db.settings.locationEnglish || '',
      address_marathi: db.settings.addressMarathi || '',
      address_english: db.settings.addressEnglish || '',
      contact_number: db.settings.contactNumber || '',
      alternate_contact: db.settings.alternateContact || '',
      whatsapp_group_link: db.settings.whatsappGroupLink || '',
      default_whatsapp_message: db.settings.defaultWhatsAppMessage || '',
      year: db.settings.year || '२०२६',
      logo_url: db.settings.logoUrl || null,
      tagline_marathi: db.settings.taglineMarathi || '॥ श्री गणेशाय नमः ॥',
      slogan_marathi: db.settings.sloganMarathi || '॥ गणपती बाप्पा मोरया ॥',
      receipt_prefix: db.settings.receiptPrefix || '',
      starting_receipt_number: db.settings.startingReceiptNumber || 1,
      enable_partial_payments: db.settings.enablePartialPayments ?? true,
      enable_whatsapp_group_invite: db.settings.enableWhatsAppGroupInvite ?? true,
      designations: db.settings.designations || [],
      updated_at: db.settings.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('mandal_settings').upsert(settingsPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Settings error:', error.message);
    else console.log('  ✅ Mandal Settings migrated successfully.');
  }

  // 2. Migrate Users
  if (Array.isArray(db.users) && db.users.length > 0) {
    console.log(`\n👥 Migrating ${db.users.length} Users...`);
    const usersPayload = db.users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email.trim().toLowerCase(),
      password_hash: u.passwordHash,
      role: u.role,
      phone: u.phone || null,
      active: u.active ?? true,
      created_at: u.createdAt || new Date().toISOString(),
      updated_at: u.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('users').upsert(usersPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Users error:', error.message);
    else console.log(`  ✅ Migrated ${usersPayload.length} users.`);
  }

  // 3. Migrate Donors (Live + Test)
  const allDonors = [
    ...(db.liveData?.donors || []).map((d: any) => ({ ...d, mode: 'LIVE' })),
    ...(db.testData?.donors || []).map((d: any) => ({ ...d, mode: 'TEST' })),
  ];

  if (allDonors.length > 0) {
    console.log(`\n🙏 Migrating ${allDonors.length} Donors...`);
    const donorsPayload = allDonors.map((d: any) => ({
      id: d.id,
      name: d.name.trim(),
      mobile: d.mobile ? d.mobile.replace(/\D/g, '') : '',
      address: d.address || '',
      total_contributed: d.totalContributed || 0,
      pavti_count: d.pavtiCount || 0,
      last_payment_date: d.lastPaymentDate || null,
      mode: d.mode,
      notes: d.notes || null,
      is_archived: d.isArchived ?? false,
      created_at: d.createdAt || new Date().toISOString(),
      updated_at: d.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('donors').upsert(donorsPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Donors error:', error.message);
    else console.log(`  ✅ Migrated ${donorsPayload.length} donors.`);
  }

  // 4. Migrate Payments (Live + Test)
  const allPayments = [
    ...(db.liveData?.payments || []).map((p: any) => ({ ...p, mode: 'LIVE' })),
    ...(db.testData?.payments || []).map((p: any) => ({ ...p, mode: 'TEST' })),
  ];

  if (allPayments.length > 0) {
    console.log(`\n💳 Migrating ${allPayments.length} Payments...`);
    const paymentsPayload = allPayments.map((p: any) => ({
      id: p.id,
      receipt_number: p.receiptNumber || null,
      numeric_receipt_number: p.numericReceiptNumber || null,
      donor_id: p.donorId || null,
      donor_name: p.donorName,
      donor_mobile: p.donorMobile || '',
      donor_address: p.donorAddress || '',
      expected_amount: p.expectedAmount || 0,
      received_amount: p.receivedAmount || 0,
      remaining_amount: p.remainingAmount || 0,
      status: p.status,
      payment_method: p.paymentMethod,
      transaction_reference: p.transactionReference || '',
      date: p.date,
      host_id: p.hostId || null,
      host_name: p.hostName || '',
      notes: p.notes || '',
      mode: p.mode,
      created_at: p.createdAt || new Date().toISOString(),
      updated_at: p.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('payments').upsert(paymentsPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Payments error:', error.message);
    else console.log(`  ✅ Migrated ${paymentsPayload.length} payments.`);
  }

  // 5. Migrate Pavtis (Live + Test)
  const allPavtis = [
    ...(db.liveData?.pavtis || []).map((p: any) => ({ ...p, mode: 'LIVE' })),
    ...(db.testData?.pavtis || []).map((p: any) => ({ ...p, mode: 'TEST' })),
  ];

  if (allPavtis.length > 0) {
    console.log(`\n🧾 Migrating ${allPavtis.length} Pavtis...`);
    const pavtisPayload = allPavtis.map((p: any) => ({
      id: p.id,
      receipt_number: p.receiptNumber,
      numeric_receipt_number: p.numericReceiptNumber || null,
      payment_id: p.paymentId,
      donor_id: p.donorId || null,
      donor_name: p.donorName,
      donor_mobile: p.donorMobile || '',
      donor_address: p.donorAddress || '',
      amount: p.amount,
      amount_in_words_marathi: p.amountInWordsMarathi || '',
      amount_in_words_english: p.amountInWordsEnglish || '',
      payment_method: p.paymentMethod,
      status: p.status || 'PAID',
      transaction_reference: p.transactionReference || '',
      date: p.date,
      host_name: p.hostName || '',
      mode: p.mode,
      image_file_id: p.imageFileId || null,
      generated_at: p.generatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('pavtis').upsert(pavtisPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Pavtis error:', error.message);
    else console.log(`  ✅ Migrated ${pavtisPayload.length} pavtis.`);
  }

  // 6. Migrate Announcements
  if (Array.isArray(db.announcements) && db.announcements.length > 0) {
    console.log(`\n📢 Migrating ${db.announcements.length} Announcements...`);
    const annPayload = db.announcements.map((a: any) => ({
      id: a.id,
      title_marathi: a.titleMarathi,
      title_english: a.titleEnglish || '',
      content_marathi: a.contentMarathi,
      content_english: a.contentEnglish || '',
      date: a.date,
      time: a.time || '',
      active: a.active ?? true,
      status: a.status || 'PUBLISHED',
      priority: a.priority || 'NORMAL',
      event_date: a.eventDate || null,
      venue: a.venue || null,
      created_at: a.createdAt || new Date().toISOString(),
      updated_at: a.updatedAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('announcements').upsert(annPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Announcements error:', error.message);
    else console.log(`  ✅ Migrated ${annPayload.length} announcements.`);
  }

  // 7. Migrate Audit Logs
  const allLogs = [
    ...(db.liveData?.auditLogs || []).map((l: any) => ({ ...l, mode: 'LIVE' })),
    ...(db.testData?.auditLogs || []).map((l: any) => ({ ...l, mode: 'TEST' })),
    ...(db.auditLogs || []).map((l: any) => ({ ...l, mode: 'LIVE' })),
  ];

  if (allLogs.length > 0) {
    console.log(`\n📜 Migrating ${allLogs.length} Audit Logs...`);
    const logsPayload = allLogs.map((l: any) => ({
      id: l.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: l.userId || null,
      username: l.userName || l.username || 'System',
      user_role: l.userRole || 'HOST',
      action: l.action,
      entity_type: l.entityType || null,
      entity_id: l.entityId || null,
      details: l.details || '',
      mode: l.mode || 'LIVE',
      ip_address: l.ipAddress || null,
      timestamp: l.timestamp || new Date().toISOString(),
    }));

    const { error } = await supabase.from('audit_logs').upsert(logsPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Audit Logs error:', error.message);
    else console.log(`  ✅ Migrated ${logsPayload.length} audit logs.`);
  }

  // 8. Sync Receipt Counters
  console.log('\n🔢 Syncing Sequential Receipt Counters...');
  const maxLiveNumber = (db.liveData?.payments || [])
    .filter((p: any) => p.numericReceiptNumber)
    .reduce((max: number, p: any) => Math.max(max, p.numericReceiptNumber || 0), 0);

  const maxTestNumber = (db.testData?.payments || [])
    .filter((p: any) => p.numericReceiptNumber)
    .reduce((max: number, p: any) => Math.max(max, p.numericReceiptNumber || 0), 0);

  await supabase.from('receipt_counters').upsert([
    { mode: 'LIVE', last_number: Math.max(maxLiveNumber, db.liveData?.receiptCounter || 0), updated_at: new Date().toISOString() },
    { mode: 'TEST', last_number: Math.max(maxTestNumber, db.testData?.receiptCounter || 0), updated_at: new Date().toISOString() },
  ], { onConflict: 'mode' });

  console.log(`  ✅ Receipt Counters synchronized (LIVE: #${maxLiveNumber}, TEST: #${maxTestNumber}).`);

  console.log('\n================================================================');
  console.log('🎉 Migration Completed Successfully!');
  console.log('Your Digital Pavti Book is ready on Supabase.');
  console.log('================================================================\n');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
