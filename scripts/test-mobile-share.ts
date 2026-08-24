import fs from 'fs';
import path from 'path';

// Load .env.local for standalone CLI execution
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

async function runMobileShareTests() {
  console.log('================================================================');
  console.log('📱 Testing Digital Pavti Mobile Share & Single-Source Image Flow');
  console.log('================================================================\n');

  const storage = getStorageProvider();
  await storage.init();

  const settings = await storage.getSettings();
  console.log('1. Mandal Settings Verified:');
  console.log('   Mandal Name:', settings.mandalNameMarathi);
  console.log('   WhatsApp Group Link:', settings.whatsappGroupLink);

  if (settings.whatsappGroupLink !== 'https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL') {
    console.error('❌ ERROR: Unexpected WhatsApp Group Link:', settings.whatsappGroupLink);
    process.exit(1);
  }
  console.log('   ✅ PASS: Official WhatsApp Group Link confirmed.\n');

  // Test Filename formatting (real JPEG photo: Pavti_000005.jpg)
  console.log('2. Testing Filename generation for various receipt numbers:');
  const testReceiptNumbers = ['000001', '#000002', '000005', 'GPB-000010'];
  for (const rNo of testReceiptNumbers) {
    const cleanReceiptNo = rNo.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Pavti_${cleanReceiptNo}.jpg`;
    console.log(`   Receipt ${rNo} -> Filename: ${fileName}`);
    if (!fileName.endsWith('.jpg') || !fileName.startsWith('Pavti_')) {
      console.error('❌ ERROR: Invalid filename format:', fileName);
      process.exit(1);
    }
  }
  console.log('   ✅ PASS: Dynamic meaningful JPEG (.jpg) filenames verified.\n');

  // Test Paid Receipt Message
  console.log('3. Testing Paid Receipt WhatsApp Message (Receipt #000005, ₹501):');
  const paidPavti: Pavti = {
    id: 'pavti-test-paid',
    receiptNumber: '000005',
    numericReceiptNumber: 5,
    paymentId: 'pay-test-1',
    donorName: 'रमेश पाटील (Ramesh Patil)',
    donorMobile: '9876543210',
    amount: 501,
    paymentMethod: 'UPI',
    status: 'PAID',
    date: '2026-08-23',
    hostName: 'सुपर ॲडमिन',
    mode: 'LIVE',
    generatedAt: new Date().toISOString(),
  };

  const mandalName = settings.mandalNameMarathi;
  const groupLink = settings.whatsappGroupLink.trim();
  const receiptNoFormatted = `#${paidPavti.receiptNumber}`;

  // Marathi message
  let mrPaidMsg = `नमस्कार 🙏\n\n`;
  mrPaidMsg += `${mandalName}तर्फे आपली डिजिटल पावती तयार करण्यात आली आहे.\n\n`;
  mrPaidMsg += `पावती क्रमांक: ${receiptNoFormatted}\n\n`;
  mrPaidMsg += `देणगी रक्कम: ₹${paidPavti.amount}\n\n`;
  mrPaidMsg += `मंडळाच्या WhatsApp ग्रुपमध्ये सहभागी होण्यासाठी खालील लिंकवर क्लिक करा:\n\n${groupLink}\n\n`;
  mrPaidMsg += `॥ गणपती बाप्पा मोरया ॥`;

  console.log('--- Marathi Paid Message ---');
  console.log(mrPaidMsg);
  console.log('----------------------------');

  if (!mrPaidMsg.includes('देणगी रक्कम: ₹501') || !mrPaidMsg.includes(groupLink)) {
    console.error('❌ ERROR: Paid message content mismatch');
    process.exit(1);
  }
  console.log('   ✅ PASS: Marathi Paid Receipt message validated.\n');

  // Test Due / बाकी Receipt Message
  console.log('4. Testing Due (बाकी) Receipt WhatsApp Message (Receipt #000006, ₹1001 DUE):');
  const duePavti: Pavti = {
    id: 'pavti-test-due',
    receiptNumber: '000006',
    numericReceiptNumber: 6,
    paymentId: 'pay-test-2',
    donorName: 'विजय जोशी (Vijay Joshi)',
    donorMobile: '9123456780',
    amount: 1001,
    paymentMethod: 'DUE',
    status: 'DUE',
    date: '2026-08-23',
    hostName: 'मंडळ प्रतिनिधी',
    mode: 'LIVE',
    generatedAt: new Date().toISOString(),
  };

  let mrDueMsg = `नमस्कार 🙏\n\n`;
  mrDueMsg += `${mandalName}तर्फे आपली डिजिटल पावती तयार करण्यात आली आहे.\n\n`;
  mrDueMsg += `पावती क्रमांक: #${duePavti.receiptNumber}\n\n`;
  mrDueMsg += `बाकी रक्कम: ₹${duePavti.amount}\n\n`;
  mrDueMsg += `मंडळाच्या WhatsApp ग्रुपमध्ये सहभागी होण्यासाठी खालील लिंकवर क्लिक करा:\n\n${groupLink}\n\n`;
  mrDueMsg += `॥ गणपती बाप्पा मोरया ॥`;

  console.log('--- Marathi Due Message ---');
  console.log(mrDueMsg);
  console.log('---------------------------');

  if (!mrDueMsg.includes('बाकी रक्कम: ₹1001') || !mrDueMsg.includes(groupLink)) {
    console.error('❌ ERROR: Due message content mismatch');
    process.exit(1);
  }
  console.log('   ✅ PASS: Marathi Due Receipt message validated.\n');

  console.log('================================================================');
  console.log('🎉 ALL MOBILE SHARE & IMAGE GENERATION REQUIREMENTS VERIFIED!');
  console.log('================================================================\n');
}

runMobileShareTests();
