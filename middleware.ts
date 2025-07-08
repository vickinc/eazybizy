import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production')
const JWT_ISSUER = 'portalpro-app'
const JWT_AUDIENCE = 'portalpro-users'

export async function middleware(request: NextRequest) {
  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/companies',
    '/clients', 
    '/invoices',
    '/products',
    '/vendors',
    '/bookkeeping',
    '/transactions',
    '/calendar',
    '/notes',
    '/business-cards',
    '/settings',
  ]

  // Public routes that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/',
  ]

  const { pathname } = request.nextUrl

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  // Get auth token from cookie
  const token = request.cookies.get('auth-token')?.value

  // Verify token if present
  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      })
      isAuthenticated = true
    } catch (error) {
      // Token is invalid or expired
      console.error('Token verification failed:', error)
    }
  }

  // If it's a protected route and user is not authenticated, redirect to login
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isPublicPath && pathname.startsWith('/auth/') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}