import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()

  // Skip security headers for Google OAuth test page
  if (request.nextUrl.pathname === '/test-google') {
    return response;
  }

  // Add security headers to prevent wallet injections
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Set Cross-Origin-Opener-Policy to allow Google OAuth communication
  // Use unsafe-none for development to allow Google OAuth popups
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  } else {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  }

  // Add Content Security Policy to block external scripts (including wallet extensions)
  // But keep it permissive for development and skip for Google OAuth test page
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname !== '/test-google') {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.google.com https://*.gstatic.com", // Allow our scripts and Google OAuth
      "style-src 'self' 'unsafe-inline' https://accounts.google.com https://*.google.com",
      "img-src 'self' data: https: https://*.google.com https://*.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' http://localhost:3005 https://vps.kabel1it.cz https://accounts.google.com https://*.google.com",
      "frame-src 'self' https://accounts.google.com https://*.google.com", // Allow Google OAuth frames
      "child-src 'self' https://accounts.google.com https://*.google.com", // Allow Google OAuth child frames
      "object-src 'none'", // Block objects
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
  }

  // Add custom header to indicate wallet blocking
  response.headers.set('X-Wallet-Injection-Blocked', 'true');
  response.headers.set('X-No-Crypto-Wallets', 'traditional-payments-only');

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
