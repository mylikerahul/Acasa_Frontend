"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  setAdminToken,
  setAdminUser,
  getAdminToken,
  isAdminTokenValid,
  clearAdminTokens,
  setAuthTimestamp,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLoginPage() {
  // Form state
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Security refs
  const hasChecked = useRef(false);
  const isRedirecting = useRef(false);
  const redirectTimeout = useRef(null);

  // ============================================
  // Load remembered email on mount
  // ============================================
  useEffect(() => {
    const savedEmail = localStorage.getItem("admin_remembered_email");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // ============================================
  // Check existing authentication (ONCE)
  // ============================================
  useEffect(() => {
    if (hasChecked.current || isRedirecting.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        // Small delay for Next.js hydration
        await new Promise((resolve) => setTimeout(resolve, 100));

        const token = getAdminToken();

        console.log("🔐 [LOGIN PAGE] Auth check start");
        console.log("🔐 [LOGIN PAGE] Token exists:", !!token);

        // No token = show login form
        if (!token) {
          console.log("✅ [LOGIN PAGE] No token, showing login");
          setChecking(false);
          return;
        }

        // Check token validity
        const isValid = isAdminTokenValid();
        console.log("🔐 [LOGIN PAGE] Token valid:", isValid);

        if (!isValid) {
          console.log("❌ [LOGIN PAGE] Token expired");
          clearAdminTokens();
          setChecking(false);
          return;
        }

        // ✅ Verify with backend before redirect
        console.log("🔄 [LOGIN PAGE] Verifying with backend...");

        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/v1/users/admin/verify-token`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
              timeout: 8000,
            }
          );

          if (response.data.success && response.data.isAuthenticated) {
            console.log("✅ [LOGIN PAGE] Backend verified, redirecting");
            isRedirecting.current = true;

            // Use window.location for hard redirect (avoids Next.js router issues)
            redirectTimeout.current = setTimeout(() => {
              window.location.replace("/admin/dashboard");
            }, 100);

            return;
          }
        } catch (verifyError) {
          console.log(
            "⚠️ [LOGIN PAGE] Backend verify failed:",
            verifyError.message
          );
          if (verifyError.response?.status === 401) {
            clearAdminTokens();
          }
        }

        setChecking(false);
      } catch (err) {
        console.error("❌ [LOGIN PAGE] Auth check error:", err);
        clearAdminTokens();
        setChecking(false);
      }
    };

    checkAuth();

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  // ============================================
  // Handle form input change
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ============================================
  // Handle remember me toggle
  // ============================================
  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem("admin_remembered_email");
    }
  };

  // ============================================
  // Handle form submission
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const email = form.email.trim();
    const password = form.password;

    // Email validation
    if (!email) {
      return toast.error("Email is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    // Password validation
    if (!password) {
      return toast.error("Password is required");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    const loadingToast = toast.loading("Signing in to admin panel...", {
      position: "top-center",
    });

    try {
      console.log("🔄 [LOGIN] Sending login request...");

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/admin/login`,
        {
          email: email.toLowerCase(),
          password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        }
      );

      console.log("✅ [LOGIN] Response received:", response.status);

      // Validate response
      if (!response.data.success) {
        throw new Error(response.data.message || "Login failed");
      }

      if (!response.data.token) {
        throw new Error("No authentication token received");
      }

      // Verify admin role
      const userType = response.data.user?.usertype?.toLowerCase();
      if (userType !== "admin") {
        throw new Error("Admin access required. Please use admin credentials.");
      }

      console.log("✅ [LOGIN] Admin verified:", response.data.user.email);

      // ✅ Save token and user data
      setAdminToken(response.data.token, rememberMe);
      setAdminUser(response.data.user);
      setAuthTimestamp();

      // ✅ Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("admin_remembered_email", email);
      } else {
        localStorage.removeItem("admin_remembered_email");
      }

      toast.success("Welcome back, Admin!", { id: loadingToast });

      console.log("🔄 [LOGIN] Redirecting to dashboard...");
      isRedirecting.current = true;

      // Use window.location for hard redirect
      setTimeout(() => {
        window.location.replace("/admin/dashboard");
      }, 500);
    } catch (err) {
      console.error("❌ [LOGIN] Error:", err);

      let message = "Login failed. Please try again.";
      const status = err.response?.status;

      if (status === 401) {
        message = "Invalid email or password";
      } else if (status === 403) {
        message = err.response.data?.message || "Admin access denied";
      } else if (status === 429) {
        message = "Too many login attempts. Please try again later.";
      } else if (err.code === "ECONNABORTED") {
        message = "Request timeout. Please check your connection.";
      } else if (err.message === "Network Error") {
        message = "Network error. Please check your internet connection.";
      } else if (err.message) {
        message = err.message;
      }

      toast.error(message, { id: loadingToast });
      setLoading(false);
    }
  };

  // ============================================
  // Loading screen
  // ============================================
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Verifying Authentication
          </h2>
          <p className="text-sm text-slate-500">
            Please wait while we check your session...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Login form
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Admin Panel Logo"
              width={180}
              height={60}
              priority
              className="h-14 w-auto"
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-xl
                    bg-slate-50 text-slate-900 placeholder-slate-400
                    focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 border border-slate-300 rounded-xl
                    bg-slate-50 text-slate-900 placeholder-slate-400
                    focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 
                    hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
                disabled={loading}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ accentColor: "#3B82F6" }}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                Remember my email for next time
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white font-semibold rounded-xl
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg hover:shadow-xl
                active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}