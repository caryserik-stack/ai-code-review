import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/review', '/profile']

const AUTH_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt_token')?.value
  const { pathname } = request.nextUrl

  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  )
  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path))

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/review/new', request.url))
  }

  return NextResponse.next()
}


export const config = {
  matcher: ['/review/:path*', '/login', '/register'],
}