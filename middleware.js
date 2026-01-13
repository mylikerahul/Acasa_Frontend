// middleware.js - ROOT FOLDER ME (not in app folder)
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // ✅ Skip static files, API routes, and login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/admin/login' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // ✅ Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // ✅ Get token from cookie (both httpOnly and regular)
  const token = request.cookies.get('adminToken')?.value;
  
  // ❌ No token - redirect to login
  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // ✅ Verify token format and expiry
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check expiry
    if (payload.exp && now >= payload.exp) {
      // Token expired - clear and redirect
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('adminToken');
      return response;
    }
    
    // Check if admin type
    if (payload.usertype?.toLowerCase() !== 'admin' && payload.userType !== 'admin') {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('adminToken');
      return response;
    }
    
    // ✅ Token valid - allow access
    return NextResponse.next();
    
  } catch (error) {
    // Invalid token - redirect to login
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('adminToken');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*']
};