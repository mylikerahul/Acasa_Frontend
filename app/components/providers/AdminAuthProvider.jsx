// components/providers/AdminAuthProvider.jsx - FIXED
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getAdminUser,
  setAdminUser,
  clearAdminTokens,
  getAdminFromToken,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultContext = {
  admin: null,
  isAuthenticated: false,
  loading: false, // ✅ Changed to false by default
  error: null,
  logout: () => {},
  refreshAdmin: () => {},
};

const AdminAuthContext = createContext(defaultContext);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    return defaultContext;
  }
  return context;
};

const PUBLIC_ROUTES = ["/admin/login", "/admin/forgot-password"];

export function AdminAuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Start with false
  const [error, setError] = useState(null);

  const hasInitialized = useRef(false);
  const isFetching = useRef(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // ✅ Quick local auth check (no API call)
  const checkLocalAuth = useCallback(() => {
    const token = getAdminToken();
    const isValid = isAdminTokenValid();

    if (!token || !isValid) {
      setAdmin(null);
      setIsAuthenticated(false);
      return false;
    }

    // Get user from storage
    const storedUser = getAdminUser() || getAdminFromToken();
    if (storedUser) {
      setAdmin(storedUser);
      setIsAuthenticated(true);
      return true;
    }

    return false;
  }, []);

  // ✅ Initialize auth (FAST)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log("🔐 AdminAuthProvider: Initializing...");

    // ✅ Quick check without loading state
    const hasLocalAuth = checkLocalAuth();

    if (isPublicRoute) {
      // On login page
      if (hasLocalAuth) {
        console.log("✅ Already authenticated, redirecting to dashboard");
        router.replace("/admin/dashboard");
      }
      return;
    }

    // On protected route
    if (!hasLocalAuth) {
      console.log("❌ Not authenticated, redirecting to login");
      clearAdminTokens();
      router.replace("/admin/login");
      return;
    }

    console.log("✅ Local auth successful");
  }, [isPublicRoute, checkLocalAuth, router]);

  // ✅ Logout function
  const logout = useCallback(async () => {
    const token = getAdminToken();
    
    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/api/v1/users/logout`,
          {},
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000 
          }
        );
      } catch (err) {
        console.log("Logout API failed:", err.message);
      }
    }

    clearAdminTokens();
    setAdmin(null);
    setIsAuthenticated(false);
    hasInitialized.current = false;
    
    toast.success("Logged out successfully");
    window.location.href = "/admin/login";
  }, []);

  // ✅ Refresh admin (optional API call)
  const refreshAdmin = useCallback(async () => {
    if (isFetching.current || !isAuthenticated) return null;

    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) return null;

    isFetching.current = true;
    setLoading(true);

    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/v1/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (data.success && data.user?.usertype?.toLowerCase() === "admin") {
        const adminData = {
          id: data.user.id,
          name: data.user.full_name || data.user.name,
          email: data.user.email,
          avatar: data.user.image_icon,
          role: "admin",
        };
        
        setAdminUser(adminData);
        setAdmin(adminData);
        return adminData;
      }
      
      throw new Error("Not admin");
    } catch (err) {
      console.error("Refresh admin error:", err);
      if (err.response?.status === 401) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [isAuthenticated, logout]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        loading,
        error,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}