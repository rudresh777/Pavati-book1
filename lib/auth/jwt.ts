import { SignJWT, jwtVerify } from 'jose';
import { AuthSession } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'mandal-digital-pavti-book-secure-jwt-secret-key-2026-super-safe'
);

const TOKEN_EXPIRY = '7d';

export async function signSessionToken(payload: AuthSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as AuthSession['role'],
    };
  } catch {
    return null;
  }
}
