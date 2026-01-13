"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

// Public routes (no auth required)
const publicRoutes = ['/admin/login', '/admin/forgot-password'];

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAdminAuth();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (loading) return;

    // Not authenticated & trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    
    // Authenticated & trying to access login page
    if (isAuthenticated && isPublicRoute) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, loading, isPublicRoute, pathname, router]);

  // Enhanced loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Animated Shield Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <Shield className="w-16 h-16 text-blue-600 mx-auto relative animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>

          {/* Spinner */}
          <div className="relative mb-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          </div>

          {/* Text */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Verifying Access
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Please wait while we check your authentication status...
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-[bounce_1s_ease-in-out_0s_infinite]" />
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // Public route - show content immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected route - show only if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - show minimal loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  );
}