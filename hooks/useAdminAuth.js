// components/providers/AdminAuthProvider.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

export function AdminAuthProvider({ children }) {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const isFetchingRef = useRef(false);
  const hasInitialized = useRef(false);

  // Fetch Admin Details
  const fetchAdmin = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;
    if (!force && admin && isAuthenticated) {
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const token = getAdminToken();
      
      if (!token || !isAdminTokenValid()) {
        throw new Error("Invalid token");
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 15000,
        }
      );

      if (response.data.success && response.data.user) {
        const userType = response.data.user.usertype?.toLowerCase();

        if (userType !== "admin") {
          throw new Error("Not admin");
        }

        setAdmin({
          id: response.data.user.id,
          name: response.data.user.full_name || response.data.user.name,
          email: response.data.user.email,
          role: "admin",
          userType: response.data.user.usertype,
          avatar: response.data.user.image_icon,
        });
        setIsAuthenticated(true);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin only.");
      }

      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      router.replace("/admin/login");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const sessionType = getCurrentSessionType();

    if (sessionType !== "admin") {
      setLoading(false);
      router.replace("/admin/login");
      return;
    }

    fetchAdmin(true);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const token = getAdminToken();
      
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/v1/users/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        ).catch(() => {});
      }
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      hasInitialized.current = false;
      toast.success("Logged out successfully");
      router.replace("/admin/login");
    }
  }, [router]);

  // Refresh
  const refreshAdmin = useCallback(() => {
    fetchAdmin(true);
  }, [fetchAdmin]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        loading,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}