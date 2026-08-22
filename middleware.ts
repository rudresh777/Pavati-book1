import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Login bypassed for easy development & instant access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pavti/:path*',
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

