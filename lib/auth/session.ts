import { cookies } from 'next/headers';
import { AuthSession } from '@/types';
import { signSessionToken, verifySessionToken } from './jwt';

export const SESSION_COOKIE_NAME = 'mandal_pavti_session';

export const DEFAULT_SUPER_ADMIN_SESSION: AuthSession = {
  userId: 'user-admin-1',
  name: 'सुपर ॲडमिन (Super Admin)',
  email: 'admin@mandal.org',
  role: 'SUPER_ADMIN',
};

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) return verified;
    }
  } catch {
    // ignore error in edge cases
  }
  return null;
}

export async function createSession(user: AuthSession): Promise<string> {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireSuperAdmin(): Promise<AuthSession> {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required');
  }
  return session;
}

