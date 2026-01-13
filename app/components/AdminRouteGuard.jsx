"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import useAdminAuth from "../../hooks/useAdminAuth";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminAuthGuard({ children }) {
  const pathname = usePathname();
  const { isAdmin, loading } = useAdminAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const publicAdminRoutes = ["/admin/login", "/admin/forgot-password", "/admin/register"];
  const isPublicRoute = publicAdminRoutes.some(route => pathname.startsWith(route));

  // Server-side render ke liye
  if (!isClient) {
    return null;
  }

  // Agar public route hai to directly children render karo
  if (isPublicRoute) {
    return children;
  }

  // Agar loading ho
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Agar authenticated nahi hai
  if (!isAdmin && !isPublicRoute) {
    // Redirect to login without causing loop
    if (typeof window !== 'undefined') {
      window.location.href = `/admin/login?redirect=${encodeURIComponent(pathname)}`;
    }
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <LoadingSpinner text="Redirecting to login..." />
      </div>
    );
  }

  // Agar authenticated hai
  return children;
}