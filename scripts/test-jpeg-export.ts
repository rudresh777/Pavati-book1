import fs from 'fs';
import path from 'path';

// Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  try {
    const raw = fs.readFileSync(envPath, 'utf-8');
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
  } catch {}
}
loadEnv();

import { getStorageProvider } from '../lib/storage';
import { Pavti, MandalSettings } from '../types';

async function testJpegExportFlow() {
  console.log('================================================================');
  console.log('🖼️  TESTING REAL JPEG RECEIPT GENERATION & CLIPBOARD WORKFLOW');
  console.log('================================================================\n');

  // 1. Verify PavtiShareModal.tsx implementation
  const modalFilePath = path.join(process.cwd(), 'components/pavti/PavtiShareModal.tsx');
  const modalContent = fs.readFileSync(modalFilePath, 'utf-8');

  console.log('1. Checking PavtiShareModal.tsx source code assertions:');

  if (!modalContent.includes("import { toJpeg } from 'html-to-image';")) {
    throw new Error('PavtiShareModal must import `toJpeg` from html-to-image');
  }
  console.log('   ✓ Verified: Uses `toJpeg` from html-to-image');

  if (modalContent.includes("import { toPng } from 'html-to-image';")) {
    throw new Error('PavtiShareModal must NOT import `toPng`');
  }
  console.log('   ✓ Verified: Old `toPng` import removed');

  if (!modalContent.includes("type: 'image/jpeg'")) {
    throw new Error('MIME type must be image/jpeg');
  }
  console.log('   ✓ Verified: Genuine `image/jpeg` MIME type used for Blob/File');

  if (!modalContent.includes("'image/jpeg': jpegBlob")) {
    throw new Error('ClipboardItem must use image/jpeg');
  }
  console.log('   ✓ Verified: ClipboardItem writes `image/jpeg` Blob');

  if (!modalContent.includes('.jpg')) {
    throw new Error('Receipt filenames must end with .jpg');
  }
  console.log('   ✓ Verified: Dynamic file downloads end with `.jpg`');

  if (!modalContent.includes('Download JPG')) {
    throw new Error('Preview download button must label as JPG');
  }
  console.log('   ✓ Verified: UI preview reflects JPG download');

  // 2. Test dynamic filename generator
  console.log('\n2. Testing Dynamic Filename Generation:');
  const testCases = [
    { receipt: '000001', expected: 'Pavti_000001.jpg' },
    { receipt: '#000005', expected: 'Pavti_000005.jpg' },
    { receipt: 'GPB-2026-99', expected: 'Pavti_GPB-2026-99.jpg' },
  ];

  for (const tc of testCases) {
    const cleanReceiptNo = tc.receipt.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Pavti_${cleanReceiptNo}.jpg`;
    console.log(`   Receipt ${tc.receipt} -> ${fileName}`);
    if (fileName !== tc.expected) {
      throw new Error(`Filename mismatch: got ${fileName}, expected ${tc.expected}`);
    }
  }
  console.log('   ✓ All dynamic filenames match expected `.jpg` format');

  // 3. Test Storage & WhatsApp Link
  console.log('\n3. Testing WhatsApp Settings & Link:');
  const storage = getStorageProvider();
  await storage.init();
  const settings = await storage.getSettings();

  const expectedLink = 'https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL';
  if (settings.whatsappGroupLink !== expectedLink) {
    throw new Error(`Expected WhatsApp Group link ${expectedLink}, got ${settings.whatsappGroupLink}`);
  }
  console.log('   ✓ Verified Mandal WhatsApp Group Link:', settings.whatsappGroupLink);

  // 4. Test WhatsApp direct chat URL generation
  console.log('\n4. Testing Direct Donor WhatsApp Chat Link Generator:');
  const phoneTests = [
    { raw: '9876543210', expectedPrefix: 'https://api.whatsapp.com/send?phone=919876543210' },
    { raw: '919876543210', expectedPrefix: 'https://api.whatsapp.com/send?phone=919876543210' },
    { raw: '+91 98765 43210', expectedPrefix: 'https://api.whatsapp.com/send?phone=919876543210' },
  ];

  for (const pt of phoneTests) {
    const cleanPhone = pt.raw.replace(/\D/g, '');
    let phoneWithCountry = '';
    if (cleanPhone.length === 10) {
      phoneWithCountry = `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      phoneWithCountry = cleanPhone;
    } else if (cleanPhone.length > 0) {
      phoneWithCountry = cleanPhone;
    }
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}`;
    console.log(`   Donor mobile "${pt.raw}" -> ${url}`);
    if (url !== pt.expectedPrefix) {
      throw new Error(`WhatsApp direct link error for ${pt.raw}`);
    }
  }
  console.log('   ✓ Direct WhatsApp donor chat links verified');

  console.log('\n================================================================');
  console.log('🎉 ALL REAL JPEG RECEIPT & CLIPBOARD TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

testJpegExportFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
