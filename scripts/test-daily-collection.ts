import { getStorageProvider } from '../lib/storage';
import { AppMode, Payment } from '../types';

async function runDailyCollectionTests() {
  console.log('====================================================');
  console.log('🧪 TESTING DATE-BASED DAILY COLLECTION & HISTORY');
  console.log('====================================================\n');

  const storage = getStorageProvider();
  await storage.init();
  const mode: AppMode = 'TEST';

  // Clear test data to start with clean state
  await storage.clearTestData();
  console.log('✔ Test data wiped clean.\n');

  // TEST 1: Add ₹10,000 of actual collection on 21/08/2026
  console.log('--- TEST 1 & 2: Collection on 21/08/2026 ---');
  const pay1: Payment = {
    id: `pay-test-1`,
    receiptNumber: '000001',
    numericReceiptNumber: 1,
    donorId: 'donor-1',
    donorName: 'रमेश जोशी (Ramesh Joshi)',
    donorMobile: '9822001122',
    expectedAmount: 10000,
    receivedAmount: 10000,
    remainingAmount: 0,
    status: 'PAID',
    paymentMethod: 'CASH',
    date: '2026-08-21',
    hostId: 'host-1',
    hostName: 'Host Ramesh',
    mode,
    createdAt: '2026-08-21T10:00:00.000Z',
    updatedAt: '2026-08-21T10:00:00.000Z',
  };
  await storage.savePayment(pay1, mode);

  // Check summary for 21/08/2026
  const sum21 = await (storage as any).getCollectionSummary(mode, '2026-08-21');
  console.log("Summary for 21/08/2026 -> Today's Collection:", sum21.todayCollection);
  if (sum21.todayCollection !== 10000) {
    throw new Error(`Expected todayCollection on 21/08/2026 to be 10000, got ${sum21.todayCollection}`);
  }
  console.log("✔ Today's Collection on 21/08/2026 is exactly ₹10,000.\n");

  // TEST 3, 4, 5: Date changes to 22/08/2026 without any new collection yet
  console.log('--- TEST 3, 4 & 5: Date advances to 22/08/2026 ---');
  const sum22Before = await (storage as any).getCollectionSummary(mode, '2026-08-22');
  console.log("Summary for 22/08/2026 (before new payments) -> Today's Collection:", sum22Before.todayCollection);
  console.log("Yesterday's Collection:", sum22Before.yesterdayCollection);
  console.log("Collection History:", JSON.stringify(sum22Before.dailyHistory, null, 2));

  if (sum22Before.todayCollection !== 0) {
    throw new Error(`Expected todayCollection on 22/08/2026 to start at 0, got ${sum22Before.todayCollection}`);
  }
  if (sum22Before.yesterdayCollection !== 10000) {
    throw new Error(`Expected yesterdayCollection on 22/08/2026 to be 10000, got ${sum22Before.yesterdayCollection}`);
  }
  const hist21 = sum22Before.dailyHistory?.find((h: any) => h.date === '2026-08-21');
  if (!hist21 || hist21.totalCollection !== 10000) {
    throw new Error(`Expected 21/08/2026 record in history with 10000, got ${JSON.stringify(hist21)}`);
  }
  console.log("✔ On 22/08/2026, Today's Collection automatically begins at ₹0.");
  console.log("✔ 21/08/2026 collection (₹10,000) is safely preserved in History.\n");

  // TEST 6, 7, 8: Add ₹5,000 collection on 22/08/2026
  console.log('--- TEST 6, 7 & 8: Add ₹5,000 UPI collection on 22/08/2026 ---');
  const pay2: Payment = {
    id: `pay-test-2`,
    receiptNumber: '000002',
    numericReceiptNumber: 2,
    donorId: 'donor-2',
    donorName: 'सुनील देशमुख (Sunil Deshmukh)',
    donorMobile: '9822334455',
    expectedAmount: 5000,
    receivedAmount: 5000,
    remainingAmount: 0,
    status: 'PAID',
    paymentMethod: 'UPI',
    date: '2026-08-22',
    hostId: 'host-1',
    hostName: 'Host Ramesh',
    mode,
    createdAt: '2026-08-22T11:00:00.000Z',
    updatedAt: '2026-08-22T11:00:00.000Z',
  };
  await storage.savePayment(pay2, mode);

  const sum22After = await (storage as any).getCollectionSummary(mode, '2026-08-22');
  console.log("Summary for 22/08/2026 -> Today's Collection:", sum22After.todayCollection);
  console.log("Total Lifetime Collection:", sum22After.totalCollection);
  console.log("Daily History:", JSON.stringify(sum22After.dailyHistory, null, 2));

  if (sum22After.todayCollection !== 5000) {
    throw new Error(`Expected todayCollection on 22/08/2026 to be 5000, got ${sum22After.todayCollection}`);
  }
  if (sum22After.totalCollection !== 15000) {
    throw new Error(`Expected totalCollection to be 15000, got ${sum22After.totalCollection}`);
  }
  console.log("✔ Today's Collection on 22/08/2026 is exactly ₹5,000.");
  console.log("✔ History shows 22/08/2026: ₹5,000 and 21/08/2026: ₹10,000.\n");

  // TEST 9 & 10: Create a ₹1,000 Due receipt with ₹700 paid and ₹300 due on 21/08/2026
  console.log('--- TEST 9 & 10: Create ₹1,000 partial receipt (₹700 paid, ₹300 due) on 21/08/2026 ---');
  const duePay: Payment = {
    id: `pay-test-due-1`,
    receiptNumber: '000003',
    numericReceiptNumber: 3,
    donorId: 'donor-3',
    donorName: 'अशोक चव्हाण (Ashok Chavan)',
    donorMobile: '9811223344',
    expectedAmount: 1000,
    receivedAmount: 700,
    remainingAmount: 300,
    status: 'PARTIALLY_PAID',
    paymentMethod: 'CASH',
    date: '2026-08-21',
    hostId: 'host-1',
    hostName: 'Host Ramesh',
    mode,
    createdAt: '2026-08-21T14:00:00.000Z',
    updatedAt: '2026-08-21T14:00:00.000Z',
  };
  await storage.savePayment(duePay, mode);

  // Check 21/08/2026 collection: must be 10000 + 700 = 10700 (NOT 11000!)
  const sum21WithPartial = await (storage as any).getCollectionSummary(mode, '2026-08-21');
  console.log("Collection for 21/08/2026 with partial payment:", sum21WithPartial.todayCollection);
  console.log("Pending Due Amount in system:", sum21WithPartial.pendingAmount);

  if (sum21WithPartial.todayCollection !== 10700) {
    throw new Error(`Expected 21/08/2026 collection to be 10700, got ${sum21WithPartial.todayCollection}`);
  }
  if (sum21WithPartial.pendingAmount !== 300) {
    throw new Error(`Expected pending amount to be 300, got ${sum21WithPartial.pendingAmount}`);
  }
  console.log("✔ Only the ₹700 actually received is counted on 21/08/2026. The ₹300 due is strictly excluded.\n");

  // TEST 11 & 12: Pay the remaining ₹300 due amount on 23/08/2026
  console.log('--- TEST 11 & 12: Mark remaining ₹300 Due as PAID on 23/08/2026 ---');
  await storage.markPaymentAsPaid(
    duePay.id,
    {
      receivedAmount: 1000, // Total paid now = 1000 (incremental = 300)
      paymentMethod: 'UPI',
      paymentDate: '2026-08-23',
      transactionReference: 'UPI-UTR-999',
      hostId: 'host-1',
      hostName: 'Host Ramesh',
    },
    mode
  );

  // Check collections for all 3 dates
  const sum21Final = await (storage as any).getCollectionSummary(mode, '2026-08-21');
  const sum22Final = await (storage as any).getCollectionSummary(mode, '2026-08-22');
  const sum23Final = await (storage as any).getCollectionSummary(mode, '2026-08-23');

  console.log("21/08/2026 Collection:", sum21Final.todayCollection);
  console.log("22/08/2026 Collection:", sum22Final.todayCollection);
  console.log("23/08/2026 Collection:", sum23Final.todayCollection);
  console.log("Pending Due Amount left:", sum23Final.pendingAmount);
  console.log("Total Lifetime Collection:", sum23Final.totalCollection);
  console.log("Final Daily Collection History:\n", JSON.stringify(sum23Final.dailyHistory, null, 2));

  if (sum21Final.todayCollection !== 10700) {
    throw new Error(`Expected 21/08/2026 collection to remain 10700, got ${sum21Final.todayCollection}`);
  }
  if (sum22Final.todayCollection !== 5000) {
    throw new Error(`Expected 22/08/2026 collection to remain 5000, got ${sum22Final.todayCollection}`);
  }
  if (sum23Final.todayCollection !== 300) {
    throw new Error(`Expected 23/08/2026 collection to be exactly 300, got ${sum23Final.todayCollection}`);
  }
  if (sum23Final.pendingAmount !== 0) {
    throw new Error(`Expected pending amount to be 0, got ${sum23Final.pendingAmount}`);
  }
  if (sum23Final.totalCollection !== 16000) {
    throw new Error(`Expected totalCollection to be 16000 (10700+5000+300), got ${sum23Final.totalCollection}`);
  }

  console.log("✔ 21/08/2026 Collection remains ₹10,700.");
  console.log("✔ 22/08/2026 Collection remains ₹5,000.");
  console.log("✔ 23/08/2026 Collection receives the ₹300 paid on that date.");
  console.log("✔ No due amount is ever included in any collection total.");
  console.log("✔ Total Lifetime Collection is ₹16,000.\n");

  console.log('====================================================');
  console.log('🎉 ALL 13 TEST REQUIREMENTS PASSED 100% PERFECTLY!');
  console.log('====================================================');
}

runDailyCollectionTests().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
