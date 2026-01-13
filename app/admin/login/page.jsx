// app/admin/login/page.jsx
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
} from "lucide-react";
import {
  setAdminToken,
  setAdminUser,
  getAdminToken,
  isAdminTokenValid,
  clearAdminTokens,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Prevent multiple redirects
  const hasChecked = useRef(false);
  const isRedirecting = useRef(false);

  // ✅ Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("admin_remembered_email");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // ✅ Check existing auth (ONCE) - FASTER
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const check = () => {
      try {
        const token = getAdminToken();
        const isValid = isAdminTokenValid();

        console.log("🔐 Login page check:", { hasToken: !!token, isValid });

        if (token && isValid && !isRedirecting.current) {
          console.log("✅ Already authenticated - Redirecting immediately");
          isRedirecting.current = true;
          // ✅ Immediate redirect - no delay
          window.location.replace("/admin/dashboard");
          return;
        }

        // Clear invalid tokens
        if (token && !isValid) {
          clearAdminTokens();
        }

        setChecking(false);
      } catch (err) {
        console.error("Auth check error:", err);
        clearAdminTokens();
        setChecking(false);
      }
    };

    // ✅ Minimal delay for hydration
    requestAnimationFrame(check);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem("admin_remembered_email");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.email.trim()) {
      return toast.error("Email is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return toast.error("Invalid email format");
    }

    if (!form.password || form.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    const loadingToast = toast.loading("Signing in...");

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/v1/users/admin/login`,
        {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        }
      );

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.token) {
        throw new Error("No token received");
      }

      // Verify admin role
      const userType = data.user?.usertype?.toLowerCase();
      if (userType !== "admin") {
        throw new Error("Admin access required");
      }

      // ✅ Save credentials
      setAdminToken(data.token);
      setAdminUser(data.user);

      // ✅ Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("admin_remembered_email", form.email.trim().toLowerCase());
      } else {
        localStorage.removeItem("admin_remembered_email");
      }

      toast.success("Welcome back!", { id: loadingToast });

      // ✅ Immediate redirect using replace (faster, no history entry)
      isRedirecting.current = true;
      window.location.replace("/admin/dashboard");
      
    } catch (err) {
      console.error("Login error:", err);

      let message = "Login failed";
      const status = err.response?.status;

      if (status === 401) {
        message = "Invalid email or password";
      } else if (status === 403) {
        message = "Admin access denied";
      } else if (status === 429) {
        message = "Too many attempts. Try later.";
      } else if (err.message) {
        message = err.message;
      }

      toast.error(message, { id: loadingToast });
      setLoading(false);
    }
  };

  // ✅ Loading state
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: 'rgb(68,138,255)' }} />
          <p className="text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={180}
              height={60}
              priority
              className="h-14 w-auto"
            />
          </div>
          <p className="text-slate-500 text-sm">Sign in to admin dashboard</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-xl
                    focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 border border-slate-200 rounded-xl
                    focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
                disabled={loading}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 
                  focus:ring-blue-400 focus:ring-2 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ accentColor: 'rgb(68,138,255)' }}
              />
              <label 
                htmlFor="rememberMe" 
                className="ml-2 text-sm text-slate-600 cursor-pointer select-none"
              >
                Remember my email
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2
                text-white rounded-xl font-medium
                hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-blue-500/25"
              style={{ backgroundColor: 'rgb(68,138,255)' }}
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

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Protected admin area • Unauthorized access prohibited
        </p>
      </div>
    </div>
  );
}