import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth')) {
    if (req.method === 'POST') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
      if (!checkRateLimit(ip)) {
        return NextResponse.json(
          { error: 'Too many requests. Try again later.' },
          { status: 429 }
        );
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/login')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (pathname.startsWith('/admin') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/admin/absences', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/auth/:path*'],
};
