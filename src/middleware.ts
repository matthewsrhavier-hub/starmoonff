import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Passagem total — autenticação feita via Supabase Auth no cliente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw\\.js|robots.txt).*)',
  ],
};
