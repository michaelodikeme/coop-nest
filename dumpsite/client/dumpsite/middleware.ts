import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static paths that should always be accessible
  const staticPaths = ['/favicon.ico', '/assets', '/images'];
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/verify', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));

  // Get auth state from cookies
  const authToken = request.cookies.get('auth_token')?.value;

  // If no token and trying to access protected route
  if (!authToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If has token and trying to access auth routes (excluding root path)
  if (authToken && isPublicPath && pathname !== '/') {
    const role = request.cookies.get('user_role')?.value;
    const dashboardPath = role === 'MEMBER' ? '/member/dashboard' : '/admin/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.next();
}
 
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside public directory)
     * 4. /icons (inside public directory)
     * 5. all root files inside public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|icons|[\\w-]+\\.\\w+).*)',
  ],
};