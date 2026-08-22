import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

// Protected routes requiring at least HOST or SUPER_ADMIN
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/pavti/new',
  '/pending',
  '/donors',
  '/payments',
  '/expenses',
  '/announcements/manage',
  '/settings',
  '/audit-log',
];

// Super Admin exclusive routes
const SUPER_ADMIN_PREFIXES = [
  '/settings/mandal',
  '/settings/users',
  '/settings/passwords',
  '/settings/backup',
  '/audit-log',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. If authenticated user visits /login, redirect to /dashboard
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 2. Check if the path is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    // If not authenticated, redirect to /login
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Check Super Admin exclusive routes
    const isSuperAdminOnly = SUPER_ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isSuperAdminOnly && session.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pavti/new',
    '/pending/:path*',
    '/donors/:path*',
    '/payments/:path*',
    '/expenses/:path*',
    '/settings/:path*',
    '/audit-log/:path*',
    '/announcements/manage/:path*',
    '/login',
  ],
};
