// AdminAuthGuard.jsx - Simplified version

"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { getAdminToken, isAdminTokenValid, clearAdminTokens } from '../utils/auth';

const publicRoutes = ['/admin/login', '/admin/forgot-password'];

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated'
  const checkDone = useRef(false);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (checkDone.current) return;
    checkDone.current = true;

    const check = () => {
      const token = getAdminToken();
      const isValid = token && isAdminTokenValid();

      console.log(`AuthGuard [${pathname}]:`, { hasToken: !!token, isValid, isPublicRoute });

      if (isPublicRoute) {
        // On login page
        if (isValid) {
          // Already logged in, redirect to dashboard
          window.location.replace('/admin/dashboard');
          return;
        }
        // Show login page
        setStatus('unauthenticated');
        return;
      }

      // Protected route
      if (!isValid) {
        // Not logged in, redirect to login
        clearAdminTokens();
        window.location.replace('/admin/login');
        return;
      }

      // Logged in, show protected content
      setStatus('authenticated');
    };

    // Small delay for hydration
    setTimeout(check, 50);
  }, [pathname, isPublicRoute]);

  // Still checking
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Public route (login page)
  if (isPublicRoute && status === 'unauthenticated') {
    return <>{children}</>;
  }

  // Protected route with auth
  if (!isPublicRoute && status === 'authenticated') {
    return <>{children}</>;
  }

  // Fallback loading (during redirect)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}