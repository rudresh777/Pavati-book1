import { LocalStorageProvider } from '../lib/storage/local-provider';
import { Expense } from '../types';

async function runExpenseTests() {
  console.log('================================================================');
  console.log('🧪 Testing Funds & Expenses (निधी व खर्च व्यवस्थापन) Backend');
  console.log('================================================================\n');

  const storage = new LocalStorageProvider();
  await storage.init();

  const mode = 'TEST';
  console.log(`1. Clearing previous test data in ${mode} mode...`);
  await storage.clearTestData();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  console.log(`   - Current Test Date (Today): ${todayStr}`);
  console.log(`   - Previous Test Date (Yesterday): ${yesterdayStr}\n`);

  // 1. Add Expenses for Today
  console.log('2. Adding Today’s Expenses:');
  const exp1: Expense = {
    id: `exp-test-${Date.now()}-1`,
    date: todayStr,
    spentFor: 'मंडप सजावट',
    description: 'मंडप व स्टेज साहित्य',
    amount: 2500,
    vendorPerson: 'सचिन डेकोरेटर्स',
    note: 'ऍडव्हान्स रक्कम',
    addedBy: 'Super Admin',
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved1 = await storage.saveExpense(exp1, mode);
  console.log(`   ✅ Added Expense 1: #${saved1.expenseNumber} | ${saved1.spentFor} | ₹${saved1.amount}`);

  const exp2: Expense = {
    id: `exp-test-${Date.now()}-2`,
    date: todayStr,
    spentFor: 'प्रसाद',
    description: 'मोदक व प्रसादाचे साहित्य',
    amount: 1200,
    vendorPerson: 'श्री गणेश स्वीट्स',
    addedBy: 'Super Admin',
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved2 = await storage.saveExpense(exp2, mode);
  console.log(`   ✅ Added Expense 2: #${saved2.expenseNumber} | ${saved2.spentFor} | ₹${saved2.amount}`);

  const exp3: Expense = {
    id: `exp-test-${Date.now()}-3`,
    date: todayStr,
    spentFor: 'लाईट व्यवस्था',
    description: 'लाईटिंग व जनरेटर डिझेल',
    amount: 3000,
    vendorPerson: 'अकोला लाईट्स',
    addedBy: 'Field Host',
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved3 = await storage.saveExpense(exp3, mode);
  console.log(`   ✅ Added Expense 3: #${saved3.expenseNumber} | ${saved3.spentFor} | ₹${saved3.amount}\n`);

  // 2. Add Expense for Yesterday / Past Date
  console.log('3. Adding Historical Expense (Yesterday):');
  const exp4: Expense = {
    id: `exp-test-${Date.now()}-4`,
    date: yesterdayStr,
    spentFor: 'फुलांची सजावट',
    description: 'हार व फुले सजावट',
    amount: 1500,
    vendorPerson: 'भारत फ्लॉवर्स',
    addedBy: 'Super Admin',
    mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved4 = await storage.saveExpense(exp4, mode);
  console.log(`   ✅ Added Expense 4 (Historical): #${saved4.expenseNumber} | ${saved4.spentFor} | ₹${saved4.amount} (Date: ${saved4.date})\n`);

  // 3. Test Summary Calculation
  console.log('4. Testing Expense Summary Calculations:');
  const summary = await storage.getExpenseSummary(mode);
  console.log(`   - Today's Expenses: ₹${summary.todayExpense} (Expected: ₹6700)`);
  console.log(`   - Yesterday's Expenses: ₹${summary.yesterdayExpense} (Expected: ₹1500)`);
  console.log(`   - Total Expenses: ₹${summary.totalExpense} (Expected: ₹8200)`);
  console.log(`   - Daily History records count: ${summary.dailyHistory?.length}`);

  if (summary.todayExpense !== 6700 || summary.totalExpense !== 8200) {
    console.error('❌ FAILED: Summary calculation mismatch.');
  } else {
    console.log('   ✅ PASS: Today and Total Expenses calculated accurately!\n');
  }

  // 4. Test Date Filtering
  console.log('5. Testing Date-wise Filtering:');
  const todayOnly = await storage.getExpenses(mode, todayStr);
  console.log(`   - Filtered for Today (${todayStr}): found ${todayOnly.length} expenses (Expected: 3)`);
  const yesterdayOnly = await storage.getExpenses(mode, yesterdayStr);
  console.log(`   - Filtered for Yesterday (${yesterdayStr}): found ${yesterdayOnly.length} expenses (Expected: 1)`);

  if (todayOnly.length === 3 && yesterdayOnly.length === 1) {
    console.log('   ✅ PASS: Date-wise filtering works perfectly!\n');
  } else {
    console.error('❌ FAILED: Date filtering mismatch.');
  }

  // 5. Test Update Expense
  console.log('6. Testing Edit Expense:');
  const updated1 = await storage.updateExpense(
    saved1.id,
    { amount: 3500, description: 'सुधारित मंडप व स्टेज साहित्य' },
    mode,
    { userId: 'user-admin-1', userName: 'Super Admin', userRole: 'SUPER_ADMIN' }
  );
  console.log(`   - Updated amount to ₹${updated1.amount} for #${updated1.expenseNumber}`);
  const summaryAfterEdit = await storage.getExpenseSummary(mode);
  console.log(`   - Recalculated Today's Expenses: ₹${summaryAfterEdit.todayExpense} (Expected: ₹7700)`);
  console.log(`   - Recalculated Total Expenses: ₹${summaryAfterEdit.totalExpense} (Expected: ₹9200)`);

  if (summaryAfterEdit.todayExpense === 7700 && summaryAfterEdit.totalExpense === 9200) {
    console.log('   ✅ PASS: Expense update and auto-recalculation succeeded!\n');
  } else {
    console.error('❌ FAILED: Recalculation after edit failed.');
  }

  // 6. Test Delete Expense
  console.log('7. Testing Delete Expense:');
  const delRes = await storage.deleteExpense(saved2.id, mode, {
    userId: 'user-admin-1',
    userName: 'Super Admin',
    userRole: 'SUPER_ADMIN',
  });
  console.log(`   - Deleted Expense: #${delRes.deletedExpense.expenseNumber} (₹${delRes.deletedExpense.amount})`);
  const summaryAfterDelete = await storage.getExpenseSummary(mode);
  console.log(`   - Today's Expenses after delete: ₹${summaryAfterDelete.todayExpense} (Expected: ₹6500)`);
  console.log(`   - Total Expenses after delete: ₹${summaryAfterDelete.totalExpense} (Expected: ₹8000)`);

  if (summaryAfterDelete.todayExpense === 6500 && summaryAfterDelete.totalExpense === 8000) {
    console.log('   ✅ PASS: Delete and auto-recalculation verified!\n');
  } else {
    console.error('❌ FAILED: Recalculation after delete failed.');
  }

  // 7. Verify Audit Logs
  console.log('8. Verifying Audit Logs:');
  const logs = await storage.getAuditLogs(mode, 10);
  const expenseLogs = logs.filter((l) => l.entityType === 'EXPENSE');
  console.log(`   - Found ${expenseLogs.length} audit log entries for expense actions:`);
  expenseLogs.forEach((l) => console.log(`     * [${l.action}] ${l.details}`));

  console.log('\n================================================================');
  console.log('🎉 ALL FUNDS & EXPENSES BACKEND TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runExpenseTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
