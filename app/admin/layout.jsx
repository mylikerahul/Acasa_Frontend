// app/admin/layout.jsx - FIX KARA HUA

"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  getAdminToken,
  isAdminTokenValid,
  clearAdminTokens,
} from "../../utils/auth";

const publicRoutes = ["/admin/login", "/admin/forgot-password"];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [status, setStatus] = useState("checking");
  const checkDone = useRef(false);
  const redirecting = useRef(false);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (checkDone.current || redirecting.current) return;
    checkDone.current = true;

    const check = () => {
      console.log("🔐 [LAYOUT] Route:", pathname);

      const token = getAdminToken();
      const isValid = token && !isAdminTokenValid();

      if (isPublicRoute) {
        if (token && !isValid) {
          console.log("✅ Already logged in, redirecting");
          redirecting.current = true;
          window.location.replace("/admin/dashboard");
          return;
        }
        setStatus("public");
        return;
      }

      if (!token || isValid) {
        console.log("❌ Not logged in");
        clearAdminTokens();
        redirecting.current = true;
        window.location.replace("/admin/login");
        return;
      }

      setStatus("authenticated");
    };

    setTimeout(check, 50);
  }, [pathname, isPublicRoute]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 
        flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}