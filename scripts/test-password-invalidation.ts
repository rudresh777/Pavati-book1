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
import { UserRole } from '../types';

async function runTest() {
  console.log('================================================================');
  console.log('🔒 Testing Password Invalidation & Expiration Verification');
  console.log('================================================================\n');

  const storage = getStorageProvider();
  await storage.init();

  const superAdmin = {
    userId: 'user-admin-1',
    userName: 'सुपर ॲडमिन',
    userRole: 'SUPER_ADMIN' as UserRole,
  };

  const targetEmail = 'host@mandal.org';
  const targetUser = await storage.getUserByEmail(targetEmail);
  if (!targetUser) {
    console.error('❌ Target user host@mandal.org not found');
    process.exit(1);
  }

  const oldPassword = 'host123';
  const newPassword = 'NewSecurePass2026!';

  console.log(`1. Changing password for "${targetUser.name}" (${targetEmail}) to: "${newPassword}"...`);
  const changeResult = await storage.updateUserPassword(targetUser.id, newPassword, superAdmin);
  console.log('   Password update result:', changeResult ? 'SUCCESS' : 'FAILED');

  // Test Login with OLD password via API
  console.log(`\n2. Attempting login with OLD password ("${oldPassword}")...`);
  const oldLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: oldPassword }),
  });
  console.log(`   Status: ${oldLoginRes.status}`);
  const oldLoginData = await oldLoginRes.json();
  if (oldLoginRes.status === 401) {
    console.log('   ✅ PASS: Old password rejected as unauthorized!');
  } else {
    console.error('   ❌ FAIL: Old password was accepted! Response:', oldLoginData);
    process.exit(1);
  }

  // Test Login with NEW password via API
  console.log(`\n3. Attempting login with NEW password ("${newPassword}")...`);
  const newLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: newPassword }),
  });
  console.log(`   Status: ${newLoginRes.status}`);
  const newLoginData = await newLoginRes.json();
  if (newLoginRes.status === 200 && newLoginData.success) {
    console.log('   ✅ PASS: New password logged in successfully!');
  } else {
    console.error('   ❌ FAIL: New password login failed! Response:', newLoginData);
    process.exit(1);
  }

  // Restore password back to host123
  console.log(`\n4. Restoring password back to "${oldPassword}"...`);
  await storage.updateUserPassword(targetUser.id, oldPassword, superAdmin);

  // Verify expired newPassword is now rejected
  console.log(`\n5. Verifying "${newPassword}" is now rejected...`);
  const expiredRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: newPassword }),
  });
  console.log(`   Status: ${expiredRes.status}`);
  if (expiredRes.status === 401) {
    console.log('   ✅ PASS: Expired password rejected!');
  } else {
    console.error('   ❌ FAIL: Expired password was accepted!');
    process.exit(1);
  }

  // Verify restored password works
  console.log(`\n6. Verifying restored password ("${oldPassword}") works...`);
  const restoredRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: oldPassword }),
  });
  console.log(`   Status: ${restoredRes.status}`);
  if (restoredRes.status === 200) {
    console.log('   ✅ PASS: Restored password works properly!');
  } else {
    console.error('   ❌ FAIL: Restored password failed!');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL PASSWORD EXPIRATION & INVALIDATION TESTS PASSED!');
  console.log('================================================================\n');
}

runTest();
