import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Redirect /admin to /adminlog if not authenticated
  if (pathname.startsWith('/admin') && pathname !== '/adminlog') {
    // Exclude /adminlog itself from this check if it starts with /admin (it doesn't, it's /adminlog)
    if (!token) {
      return NextResponse.redirect(new URL('/adminlog', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      // Check if user is admin
      if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'PROPERTY_MANAGER' && payload.role !== 'BILLING_ADMIN') {
         // If logged in as tenant, maybe redirect to tenant dashboard or show error?
         // For now, redirect to admin login to force admin auth
         return NextResponse.redirect(new URL('/adminlog', request.url));
      }
    } catch (error) {
      // Invalid token
      return NextResponse.redirect(new URL('/adminlog', request.url));
    }
  }

  // 2. Redirect /adminlog to /admin/dashboard if already logged in as admin
  if (pathname === '/adminlog') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET);
        if (payload.role === 'SUPER_ADMIN' || payload.role === 'PROPERTY_MANAGER' || payload.role === 'BILLING_ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      } catch (error) {
        // Token invalid, allow access to login page
      }
    }
  }

  // 3. Protect /tenant routes
  if (pathname.startsWith('/tenant')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role !== 'tenant') {
         // If admin tries to access tenant pages, maybe allow? or redirect?
         // Usually separate. Let's redirect to admin dashboard if admin.
         return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    } catch (error) {
       return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Redirect /login to /tenant/dashboard if already logged in as tenant
  if (pathname === '/login') {
      if (token) {
        try {
          const { payload } = await jwtVerify(token, SECRET);
          if (payload.role === 'tenant') {
            return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
          }
        } catch (error) {
          // Token invalid
        }
      }
  }

  // 5. Redirect root to /login if not authenticated
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If authenticated, check role and redirect to appropriate dashboard
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role === 'SUPER_ADMIN' || payload.role === 'PROPERTY_MANAGER' || payload.role === 'BILLING_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (payload.role === 'tenant') {
        return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
      }
    } catch (error) {
      // Invalid token, still redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/adminlog', '/tenant/:path*', '/login'],
};
