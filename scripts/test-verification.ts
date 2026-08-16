import fs from 'fs';
import path from 'path';
import { LocalStorageProvider } from '../lib/storage/local-provider';

async function runVerification() {
  console.log('--- STARTING COMPREHENSIVE MANDAL VERIFICATION TESTS ---');

  // 1. Check i18n JSONs
  const mrJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/i18n/mr.json'), 'utf8'));
  const enJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/i18n/en.json'), 'utf8'));

  console.log('✓ Checking translation dictionaries...');
  if (!mrJson.nav.dashboard || !enJson.nav.dashboard) {
    throw new Error('Missing nav.dashboard in translation dictionaries');
  }
  if (!mrJson.pending.totalPendingAmount || !enJson.pending.totalPendingAmount) {
    throw new Error('Missing pending.totalPendingAmount in translation dictionaries');
  }
  console.log('✓ mr.json & en.json valid and properly structured.');

  // 2. Check Home Page identity text
  const homeContent = fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8');
  if (!homeContent.includes('॥ श्री गणेशाय नमः ॥ • सन २०२६')) {
    throw new Error('Missing exact religious greeting in app/page.tsx');
  }
  if (!homeContent.includes('मोरया गणेशोत्सव मंडळ')) {
    throw new Error('Missing exact Mandal name in app/page.tsx');
  }
  if (!homeContent.includes('तापडिया नगर अकोला 444001')) {
    throw new Error('Missing exact identity address in app/page.tsx');
  }
  if (!homeContent.includes('॥ गणपती बाप्पा मोरया ॥')) {
    throw new Error('Missing exact slogan in app/page.tsx');
  }
  if (!homeContent.includes('यंदाच्या गणेशोत्सवासाठी मंडळातर्फे सर्व भाविक भक्तांचे सहर्ष स्वागत! आपली देणगी / वर्गणी अधिकृत डिजिटल पावतीद्वारे')) {
    throw new Error('Missing exact Marathi welcome text in app/page.tsx');
  }
  console.log('✓ Public Home Page Hero order & exact Marathi identity content verified.');

  // 3. Check LocalStorageProvider logic directly
  console.log('\n--- TESTING STORAGE PROVIDER LOGIC ---');
  const storage = new LocalStorageProvider();
  await storage.init();

  const testMode = 'TEST';
  await storage.clearTestData();

  let summary = await storage.getCollectionSummary(testMode);
  console.log(`Initial TEST Summary: Total Collection = ₹${summary.totalCollection}, Due/Pending Amount = ₹${summary.pendingAmount}`);
  if (summary.totalCollection !== 0 || summary.pendingAmount !== 0) {
    throw new Error('Test data should start at 0');
  }

  // TEST 3: Create ₹501 DUE payment (Due Pavti)
  console.log('\n--- TEST 3: Create ₹501 DUE payment & verify Due Pavti auto-generation ---');
  const donor1 = await storage.saveDonor({
    id: 'donor-test-1',
    name: 'राहुल पाटील (Rahul Patil)',
    mobile: '9876543210',
    address: 'तापडिया नगर, अकोला',
    totalContributed: 0,
    pavtiCount: 0,
    mode: testMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, testMode);

  const duePay1 = await storage.savePayment({
    id: `pay-test-due-1`,
    donorId: donor1.id,
    donorName: donor1.name,
    donorMobile: donor1.mobile,
    donorAddress: donor1.address,
    expectedAmount: 501,
    receivedAmount: 0,
    remainingAmount: 501,
    status: 'DUE',
    paymentMethod: 'CASH',
    date: '2026-08-17',
    hostId: 'host-1',
    hostName: 'Rahul Kadam (Host)',
    mode: testMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, testMode);

  summary = await storage.getCollectionSummary(testMode);
  console.log(`Summary: Total Collection = ₹${summary.totalCollection}, Total Due = ₹${summary.pendingAmount}`);
  if (summary.totalCollection !== 0) throw new Error('Due payment must NOT increase total collection');
  if (summary.pendingAmount !== 501) throw new Error('Due amount should be ₹501');

  // Verify Due Pavti auto-generated without receipt number
  const pavtisAfterDue = await storage.getPavtis(testMode);
  const duePavti = pavtisAfterDue.find(p => p.paymentId === duePay1.id);
  if (!duePavti) throw new Error('Due Pavti was not generated');
  if (duePavti.receiptNumber !== '') throw new Error(`Due Pavti must not have a receipt number, got: ${duePavti.receiptNumber}`);
  if (duePavti.status !== 'DUE') throw new Error(`Due Pavti status must be DUE, got: ${duePavti.status}`);
  console.log('✓ TEST 3 PASSED: ₹501 Due payment saved. Collection = ₹0, Due = ₹501, Due Pavti generated without official number.');

  // TEST 4: Create direct PAID ₹1001 Cash payment
  console.log('\n--- TEST 4: Create direct PAID ₹1001 Cash payment ---');
  const { formatted: r1, numeric: n1 } = await storage.getNextReceiptNumber(testMode);
  const paidPay1 = await storage.savePayment({
    id: `pay-test-paid-1`,
    receiptNumber: r1,
    numericReceiptNumber: n1,
    donorId: 'donor-test-2',
    donorName: 'सचिन जोशी (Sachin Joshi)',
    donorMobile: '9876543211',
    expectedAmount: 1001,
    receivedAmount: 1001,
    remainingAmount: 0,
    status: 'PAID',
    paymentMethod: 'CASH',
    date: '2026-08-17',
    hostId: 'host-1',
    hostName: 'Host 1',
    mode: testMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, testMode);

  summary = await storage.getCollectionSummary(testMode);
  console.log(`Summary: Total Collection = ₹${summary.totalCollection}, Cash = ₹${summary.cashCollection}, Total Due = ₹${summary.pendingAmount}`);
  if (summary.totalCollection !== 1001) throw new Error('Total collection should be 1001');
  if (summary.cashCollection !== 1001) throw new Error('Cash collection should be 1001');
  if (summary.pendingAmount !== 501) throw new Error('Due amount should still be 501');
  console.log('✓ TEST 4 PASSED: ₹1001 Cash payment recorded. Collection = ₹1001, Due = ₹501.');

  // TEST 5: Mark ₹501 Due payment as PAID via markPaymentAsPaid
  console.log('\n--- TEST 5: Mark ₹501 Due payment as PAID (Atomic conversion, single Pavti update) ---');
  const initialPavtiCount = (await storage.getPavtis(testMode)).length;

  const { payment: convertedPayment, pavti: convertedPavti } = await storage.markPaymentAsPaid(duePay1.id, {
    receivedAmount: 501,
    paymentMethod: 'UPI',
    transactionReference: 'UPI/123456789012',
    notes: 'PhonePe द्वारे जमा',
    paymentDate: '2026-08-17',
    hostId: 'host-1',
    hostName: 'Rahul Kadam',
  }, testMode);

  const finalPavtiCount = (await storage.getPavtis(testMode)).length;
  summary = await storage.getCollectionSummary(testMode);

  console.log(`Summary after mark-paid: Total Collection = ₹${summary.totalCollection}, Cash = ₹${summary.cashCollection}, UPI = ₹${summary.upiCollection}, Total Due = ₹${summary.pendingAmount}`);
  console.log(`Converted Pavti: #${convertedPavti.receiptNumber}, Status = ${convertedPavti.status}, Amount = ₹${convertedPavti.amount}`);

  if (summary.pendingAmount !== 0) throw new Error(`Total Due should be 0, got ${summary.pendingAmount}`);
  if (summary.totalCollection !== 1502) throw new Error(`Total Collection should be 1502 (1001 + 501), got ${summary.totalCollection}`);
  if (summary.upiCollection !== 501) throw new Error(`UPI Collection should be 501, got ${summary.upiCollection}`);
  if (finalPavtiCount !== initialPavtiCount) throw new Error('Marking as paid must NOT create duplicate Pavti records');
  if (!convertedPavti.receiptNumber) throw new Error('Converted Pavti must now have an official receipt number');
  if (convertedPavti.status !== 'PAID') throw new Error('Converted Pavti status must now be PAID');
  console.log('✓ TEST 5 PASSED: Converted DUE → PAID without creating duplicate Pavti. Total Due is ₹0, Total Collection is ₹1502.');

  // TEST 6: Donor Deletion & Archiving Protection
  console.log('\n--- TEST 6: Donor Deletion & Archiving Protection ---');
  // Donor 1 has financial history (duePay1 which is now paid) -> Should ARCHIVE
  const archResult = await storage.deleteOrArchiveDonor(donor1.id, testMode);
  if (archResult.action !== 'ARCHIVED') throw new Error(`Donor with history should be ARCHIVED, got ${archResult.action}`);
  const archivedDonor = await storage.getDonorById(donor1.id, testMode);
  if (!archivedDonor?.isArchived) throw new Error('Donor isArchived flag not set');

  // Create Donor with NO history -> Should DELETE cleanly
  const emptyDonor = await storage.saveDonor({
    id: 'donor-empty-test',
    name: 'नवीन देणगीदार (New Accidental Donor)',
    mobile: '9999999999',
    totalContributed: 0,
    pavtiCount: 0,
    mode: testMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, testMode);

  const delResult = await storage.deleteOrArchiveDonor(emptyDonor.id, testMode);
  if (delResult.action !== 'DELETED') throw new Error(`Donor without history should be DELETED, got ${delResult.action}`);
  const deletedDonor = await storage.getDonorById(emptyDonor.id, testMode);
  if (deletedDonor !== null) throw new Error('Deleted donor still exists');
  console.log('✓ TEST 6 PASSED: Member with history safely archived; member with zero history cleanly deleted.');

  // TEST 7: Super Admin Complete Data Reset
  console.log('\n--- TEST 7: Super Admin Complete Data Reset ---');
  await storage.resetAllData('RESET', testMode, {
    userId: 'user-admin-1',
    userName: 'Super Admin',
    userRole: 'SUPER_ADMIN',
  });

  const resetSummary = await storage.getCollectionSummary(testMode);
  const resetDonors = await storage.getDonors(testMode);
  const resetPayments = await storage.getPayments(testMode);
  const resetPavtis = await storage.getPavtis(testMode);

  if (resetSummary.totalCollection !== 0 || resetDonors.length !== 0 || resetPayments.length !== 0 || resetPavtis.length !== 0) {
    throw new Error('Data reset did not clear all records');
  }
  console.log('✓ TEST 7 PASSED: Complete Data Reset executed successfully.');

  console.log('\n===========================================');
  console.log('ALL COMPREHENSIVE VERIFICATION TESTS PASSED!');
  console.log('===========================================');
}

runVerification().catch(err => {
  console.error('VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
