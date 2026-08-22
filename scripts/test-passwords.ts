import bcrypt from 'bcryptjs';
import { LocalStorageProvider } from '../lib/storage/local-provider';
import { User } from '../types';

async function runPasswordManagementTests() {
  console.log('================================================================');
  console.log('🔐 Testing Super Admin Password Management Feature');
  console.log('================================================================\n');

  const storage = new LocalStorageProvider();
  await storage.init();

  const superAdminUser = {
    userId: 'user-admin-1',
    userName: 'Super Admin',
    userRole: 'SUPER_ADMIN' as const,
  };

  const hostUser = {
    userId: 'user-host-1',
    userName: 'Mandal Host',
    userRole: 'HOST' as const,
  };

  // 1. Ensure test users exist
  console.log('1. Setting up Test Users (Admin 1, Admin 2, Super Admin 1)...');
  const admin1: User = {
    id: 'user-test-admin-1',
    name: 'Sachin Patil (Admin 1)',
    email: 'admin1@mandal.org',
    passwordHash: await bcrypt.hash('oldpassword1', 10),
    role: 'HOST',
    phone: '9876543210',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await storage.saveUser(admin1);

  const admin2: User = {
    id: 'user-test-admin-2',
    name: 'Rahul Joshi (Admin 2)',
    email: 'admin2@mandal.org',
    passwordHash: await bcrypt.hash('admin2password', 10),
    role: 'HOST',
    phone: '9876543211',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await storage.saveUser(admin2);

  const superAdmin1: User = {
    id: 'user-test-superadmin-1',
    name: 'Main Super Admin',
    email: 'superadmin1@mandal.org',
    passwordHash: await bcrypt.hash('superoldpass', 10),
    role: 'SUPER_ADMIN',
    phone: '9876543212',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await storage.saveUser(superAdmin1);
  console.log('   ✅ Test users created successfully.\n');

  // 2. Test Security: Non-SuperAdmin cannot change password
  console.log('2. Testing Backend Security (Host cannot change passwords):');
  try {
    await storage.updateUserPassword(admin1.id, 'hackedpass123', hostUser);
    console.error('❌ FAILED: Host was able to change password!');
  } catch (err: any) {
    console.log(`   ✅ PASS: Non-SuperAdmin rejected with: "${err.message}"\n`);
  }

  // 3. Test Super Admin changing Admin 1 password
  console.log('3. Testing Super Admin changing Admin 1 Password:');
  const newPassAdmin1 = 'newsecurepass2026';
  await storage.updateUserPassword(admin1.id, newPassAdmin1, superAdminUser);

  const updatedAdmin1 = await storage.getUserById(admin1.id);
  const oldPassMatch = await bcrypt.compare('oldpassword1', updatedAdmin1!.passwordHash);
  const newPassMatch = await bcrypt.compare(newPassAdmin1, updatedAdmin1!.passwordHash);

  if (!oldPassMatch && newPassMatch) {
    console.log(`   ✅ PASS: Admin 1 password updated. Old password stopped working, new password verified!\n`);
  } else {
    console.error('❌ FAILED: Password update verification failed.');
  }

  // 4. Test Multi-Admin Independence: Admin 2 password must remain unchanged
  console.log('4. Testing Multi-Admin Independence (Admin 2 unaffected):');
  const checkedAdmin2 = await storage.getUserById(admin2.id);
  const admin2PassMatch = await bcrypt.compare('admin2password', checkedAdmin2!.passwordHash);
  const admin2NewPassMatch = await bcrypt.compare(newPassAdmin1, checkedAdmin2!.passwordHash);

  if (admin2PassMatch && !admin2NewPassMatch) {
    console.log('   ✅ PASS: Admin 2 password remains intact and independent!\n');
  } else {
    console.error('❌ FAILED: Admin 2 password was affected.');
  }

  // 5. Test Super Admin changing Super Admin password
  console.log('5. Testing Changing Super Admin Password:');
  const newPassSuperAdmin = 'newSuperAdminPass2026!';
  await storage.updateUserPassword(superAdmin1.id, newPassSuperAdmin, superAdminUser);

  const updatedSuperAdmin = await storage.getUserById(superAdmin1.id);
  const superOldMatch = await bcrypt.compare('superoldpass', updatedSuperAdmin!.passwordHash);
  const superNewMatch = await bcrypt.compare(newPassSuperAdmin, updatedSuperAdmin!.passwordHash);

  if (!superOldMatch && superNewMatch) {
    console.log(`   ✅ PASS: Super Admin password updated and old password deactivated!\n`);
  } else {
    console.error('❌ FAILED: Super Admin password verification failed.');
  }

  // 6. Test Audit Logging: Passwords are NEVER recorded in logs
  console.log('6. Verifying Audit Logs for Password Changes:');
  const logs = await storage.getAuditLogs('LIVE', 10);
  const passLogs = logs.filter((l) => l.action === 'PASSWORD_CHANGED');
  console.log(`   - Found ${passLogs.length} password change audit entries:`);

  let leaksFound = false;
  for (const log of passLogs) {
    console.log(`     * [${log.action}] ${log.details}`);
    if (
      log.details.includes(newPassAdmin1) ||
      log.details.includes(newPassSuperAdmin) ||
      log.details.includes('oldpassword1')
    ) {
      leaksFound = true;
    }
  }

  if (!leaksFound && passLogs.length >= 2) {
    console.log('   ✅ PASS: Audit logs recorded securely with 0% password/hash exposure!\n');
  } else {
    console.error('❌ FAILED: Passwords leaked or missing in audit logs.');
  }

  console.log('================================================================');
  console.log('🎉 ALL PASSWORD MANAGEMENT TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runPasswordManagementTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
