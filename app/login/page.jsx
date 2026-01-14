"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Home,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const setUserToken = (token, remember = false) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("userToken", token);
  storage.setItem("userTokenTimestamp", Date.now().toString());
};

const setUserData = (user, remember = false) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("userData", JSON.stringify(user));
};

const getUserToken = () => {
  return localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
};

const clearUserAuth = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("userTokenTimestamp");
  sessionStorage.removeItem("userToken");
  sessionStorage.removeItem("userData");
  sessionStorage.removeItem("userTokenTimestamp");
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        const token = getUserToken();

        if (!token) {
          setLoading(false);
          return;
        }

        console.log("🔐 [AUTH CHECK] Verifying token...");

        const response = await axios.get(`${API_URL}/api/v1/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
          timeout: 5000,
        });

        if (response.data.success && response.data.user) {
          console.log("✅ [AUTH CHECK] User authenticated");
          setIsAuthenticated(true);
          // Redirect to dashboard
          setTimeout(() => {
            window.location.replace("/dashboard");
          }, 100);
          return;
        }

        clearUserAuth();
        setLoading(false);
      } catch (error) {
        console.log("⚠️ [AUTH CHECK] Not authenticated");
        clearUserAuth();
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { loading, isAuthenticated };
};

const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials, rememberMe = false) => {
    setLoading(true);

    try {
      console.log("🔄 [LOGIN] Sending request...");

      const response = await axios.post(
        `${API_URL}/api/v1/users/login`,
        credentials,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        }
      );

      console.log("✅ [LOGIN] Response:", response.status);

      if (!response.data.success) {
        throw new Error(response.data.message || "Login failed");
      }

      if (!response.data.token) {
        throw new Error("No authentication token received");
      }

      // Verify it's a regular user (not admin)
      const userType = response.data.user?.usertype?.toLowerCase();
      if (userType === "admin") {
        throw new Error("Admin accounts must use the admin login portal");
      }

      console.log("✅ [LOGIN] User authenticated:", response.data.user.email);

      // Save token and user data
      setUserToken(response.data.token, rememberMe);
      setUserData(response.data.user, rememberMe);

      toast.success(`Welcome back, ${response.data.user.name || "User"}!`);

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ [LOGIN] Error:", error);

      let message = "Login failed. Please try again.";
      const status = error.response?.status;

      if (status === 401) {
        message = "Invalid email or password";
      } else if (status === 403) {
        message = error.response.data?.message || "Access denied";
      } else if (error.code === "ECONNABORTED") {
        message = "Request timeout. Please check your connection.";
      } else if (error.message === "Network Error") {
        message = "Network error. Please check your internet.";
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, []);

  const handleGoogleAuth = useCallback(async (credential, rememberMe = false) => {
    setLoading(true);

    try {
      console.log("🔄 [GOOGLE] Authenticating...");

      const response = await axios.post(
        `${API_URL}/api/v1/users/google-auth`,
        {
          credential: credential,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        }
      );

      console.log("✅ [GOOGLE] Response:", response.status);

      if (!response.data.success) {
        throw new Error(response.data.message || "Google authentication failed");
      }

      if (!response.data.token) {
        throw new Error("No authentication token received");
      }

      // Verify it's a regular user (not admin)
      const userType = response.data.user?.usertype?.toLowerCase();
      if (userType === "admin") {
        throw new Error("Admin accounts must use the admin login portal");
      }

      console.log("✅ [GOOGLE] User authenticated:", response.data.user.email);

      // Save token and user data
      setUserToken(response.data.token, true); // Always remember for Google
      setUserData(response.data.user, true);

      toast.success(`Welcome, ${response.data.user.name || "User"}!`);

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ [GOOGLE] Error:", error);

      let message = "Google sign-in failed";
      const status = error.response?.status;

      if (status === 403) {
        message = error.response.data?.message || "Access denied";
      } else if (status === 401) {
        message = "Google authentication failed. Please try again.";
      } else if (status === 400) {
        message = error.response.data?.message || "Invalid request";
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, []);

  return { login, handleGoogleAuth, loading };
};

const useGoogleAuth = (onSuccess, onError) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        initializeGoogle();
        return;
      }

      const existingScript = document.getElementById("google-signin-script");
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.id = "google-signin-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("✅ [GOOGLE] SDK loaded");
        setIsGoogleLoaded(true);
        initializeGoogle();
      };

      script.onerror = () => {
        console.error("❌ [GOOGLE] Failed to load SDK");
        onError?.("Failed to load Google Sign-In");
      };

      document.body.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !GOOGLE_CLIENT_ID) {
        console.error("❌ [GOOGLE] Missing configuration");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              console.log("✅ [GOOGLE] Credential received");
              onSuccess?.(response.credential);
            } else {
              console.error("❌ [GOOGLE] No credential");
              onError?.("No credential received from Google");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        console.log("✅ [GOOGLE] SDK initialized");
      } catch (error) {
        console.error("❌ [GOOGLE] Init error:", error);
        onError?.("Failed to initialize Google Sign-In");
      }
    };

    loadGoogleScript();

    return () => {
      const script = document.getElementById("google-signin-script");
      if (script) {
        script.remove();
      }
    };
  }, [onSuccess, onError]);

  const triggerGoogleSignIn = useCallback(() => {
    if (!window.google?.accounts?.id) {
      console.error("❌ [GOOGLE] SDK not loaded");
      onError?.("Google SDK not loaded. Please refresh the page.");
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log("⚠️ [GOOGLE] Prompt not displayed, rendering button");
          
          const buttonDiv = document.createElement("div");
          buttonDiv.style.position = "fixed";
          buttonDiv.style.top = "-9999px";
          document.body.appendChild(buttonDiv);

          window.google.accounts.id.renderButton(buttonDiv, {
            type: "standard",
            theme: "outline",
            size: "large",
          });

          setTimeout(() => {
            const button = buttonDiv.querySelector("div[role='button']");
            if (button) {
              button.click();
            }
            setTimeout(() => buttonDiv.remove(), 1000);
          }, 100);
        } else if (notification.isSkippedMoment()) {
          console.log("⚠️ [GOOGLE] User closed the prompt");
          onError?.("Google sign-in was cancelled");
        }
      });
    } catch (error) {
      console.error("❌ [GOOGLE] Trigger error:", error);
      onError?.("Failed to open Google Sign-In");
    }
  }, [onError]);

  return { isGoogleLoaded, triggerGoogleSignIn };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { login, handleGoogleAuth, loading } = useLogin();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("user_remembered_email");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const { isGoogleLoaded, triggerGoogleSignIn } = useGoogleAuth(
    async (credential) => {
      setGoogleLoading(true);
      setIsRedirecting(true);

      const result = await handleGoogleAuth(credential, true);

      if (result.success) {
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 500);
      } else {
        setGoogleLoading(false);
        setIsRedirecting(false);
      }
    },
    (error) => {
      console.error("Google Auth Error:", error);
      toast.error(error || "Google sign-in failed");
      setGoogleLoading(false);
      setIsRedirecting(false);
    }
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem("user_remembered_email");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      return toast.error("Email is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Please enter a valid email address");
    }

    if (!password) {
      return toast.error("Password is required");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    // Save email if remember me
    if (rememberMe) {
      localStorage.setItem("user_remembered_email", email.toLowerCase());
    } else {
      localStorage.removeItem("user_remembered_email");
    }

    setIsRedirecting(true);

    const result = await login(
      {
        email: email.toLowerCase(),
        password: password,
      },
      rememberMe
    );

    if (result.success) {
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 500);
    } else {
      setIsRedirecting(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!isGoogleLoaded) {
      toast.error("Google SDK is loading. Please wait a moment.");
      return;
    }

    setGoogleLoading(true);
    triggerGoogleSignIn();

    // Fallback timeout
    setTimeout(() => {
      if (googleLoading) {
        setGoogleLoading(false);
      }
    }, 10000);
  };

  const isLoading = loading || googleLoading;

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOADING STATES
  // ═══════════════════════════════════════════════════════════════════════════════

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: "rgb(68,138,255)" }}
          />
          <p className="text-slate-500">
            {isAuthenticated ? "Redirecting to dashboard..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(68,138,255,0.1)" }}
          >
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "rgb(68,138,255)" }}
            />
          </div>
          <p className="text-slate-700 font-medium">Login successful!</p>
          <p className="text-slate-400 text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOGIN FORM
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={180}
              height={60}
              priority
              className="h-14 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Sign in to continue to your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || !isGoogleLoaded}
            className="w-full h-12 flex items-center justify-center gap-3
              bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700
              hover:bg-slate-50 hover:border-slate-300 
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 mb-6"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-4 text-xs text-slate-400 uppercase tracking-wider font-medium bg-white">
              or continue with email
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Email/Password Form */}
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
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-xl
                    focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
                    transition-all text-slate-800 placeholder:text-slate-400"
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
                  disabled={isLoading}
                  className="w-full h-12 pl-12 pr-12 border border-slate-200 rounded-xl
                    focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
                    transition-all text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMe}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer
                    focus:ring-2 focus:ring-blue-400
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ accentColor: "rgb(68,138,255)" }}
                />
                <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  Remember me
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-medium hover:underline transition-colors"
                style={{ color: "rgb(68,138,255)" }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2
                text-white rounded-xl font-medium
                hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg"
              style={{
                backgroundColor: "rgb(68,138,255)",
                boxShadow: "0 4px 14px 0 rgba(68,138,255,0.39)",
              }}
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

        {/* Register Link */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-semibold hover:underline"
            style={{ color: "rgb(68,138,255)" }}
          >
            Create Account
          </Link>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 
              hover:text-slate-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-600">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-600">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}