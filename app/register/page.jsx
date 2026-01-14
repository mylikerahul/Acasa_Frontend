"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  User,
  Phone,
  ChevronDown,
  Home,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const SALUTATIONS = ["Mr.", "Ms.", "Mrs.", "Dr."];

const PHONE_CODES = [
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+91", flag: "🇮🇳", country: "India" },
  { code: "+92", flag: "🇵🇰", country: "Pakistan" },
  { code: "+1", flag: "🇺🇸", country: "USA" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+966", flag: "🇸🇦", country: "Saudi" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const clearUserAuth = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  sessionStorage.removeItem("userToken");
  sessionStorage.removeItem("userData");
};

const getUserToken = () => {
  return localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
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
      const token = getUserToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          timeout: 5000,
        });

        if (data.success && data.user) {
          setIsAuthenticated(true);
          window.location.replace("/dashboard");
          return;
        }
      } catch (error) {
        clearUserAuth();
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  return { loading, isAuthenticated };
};

const useRegister = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const register = useCallback(async (userData) => {
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/v1/users/register`,
        userData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        }
      );

      if (!data.success || !data.token) {
        throw new Error(data.message || "Registration failed");
      }

      toast.success("Account created! Redirecting to login...");

      // Redirect to login page instead of dashboard
      setTimeout(() => {
        router.push("/login");
      }, 1000);

      return { success: true, data };
    } catch (error) {
      let message = "Registration failed. Please try again.";
      const status = error.response?.status;

      if (status === 400) {
        message = error.response.data?.message || "Invalid data provided";
      } else if (status === 409 || error.response?.data?.message?.includes("already")) {
        message = "Email already registered. Please login instead.";
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
  }, [router]);

  const handleGoogleAuth = useCallback(async (credential) => {
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/v1/users/google-auth`,
        { credential },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 15000,
        }
      );

      if (!data.success || !data.token) {
        throw new Error(data.message || "Google authentication failed");
      }

      const userType = data.user?.usertype?.toLowerCase();
      if (userType === "admin") {
        throw new Error("Admin accounts must use the admin portal");
      }

      toast.success(`Welcome! Redirecting to login...`);

      // Redirect to login page
      setTimeout(() => {
        router.push("/login");
      }, 1000);

      return { success: true, data };
    } catch (error) {
      let message = "Google sign-up failed";
      const status = error.response?.status;

      if (status === 400 && error.response.data?.message?.includes("already")) {
        message = "Email already registered. Please login instead.";
      } else if (status === 403) {
        message = error.response.data?.message || "Access denied";
      } else if (status === 401) {
        message = "Google authentication failed. Please try again.";
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, [router]);

  return { register, handleGoogleAuth, loading };
};

const useGoogleAuth = (onSuccess, onError) => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        initializeGoogle();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGoogleLoaded(true);
        initializeGoogle();
      };
      script.onerror = () => onError?.("Failed to load Google Sign-In");
      document.body.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !GOOGLE_CLIENT_ID) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              onSuccess?.(response.credential);
            } else {
              onError?.("No credential received from Google");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (error) {
        onError?.("Failed to initialize Google Sign-In");
      }
    };

    loadGoogleScript();
  }, [onSuccess, onError]);

  const triggerGoogleSignIn = useCallback(() => {
    if (!window.google?.accounts?.id) {
      onError?.("Google SDK not loaded. Please refresh the page.");
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
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
            button?.click();
            setTimeout(() => buttonDiv.remove(), 1000);
          }, 100);
        } else if (notification.isSkippedMoment()) {
          onError?.("Google sign-in was cancelled");
        }
      });
    } catch (error) {
      onError?.("Failed to open Google Sign-In");
    }
  }, [onError]);

  return { isGoogleLoaded, triggerGoogleSignIn };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "rgb(68,138,255)" }} />
      <p className="text-sm text-slate-500">Checking authentication...</p>
    </div>
  </div>
);

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  required,
  showPasswordToggle,
  onTogglePassword,
  showPassword,
  hint,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <div className="relative">
      {Icon && (
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full ${Icon ? "pl-12" : "pl-4"} ${showPasswordToggle ? "pr-12" : "pr-4"} py-3.5 border border-slate-200 rounded-xl text-sm outline-none text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-200`}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
    {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
  </div>
);

const SelectField = ({ label, value, onChange, options, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm outline-none appearance-none bg-white text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const PhoneInput = ({ code, onCodeChange, number, onNumberChange, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
    <div className="flex gap-2">
      <div className="relative w-28">
        <select
          value={code}
          onChange={onCodeChange}
          disabled={disabled}
          className="w-full px-3 py-3.5 border border-slate-200 rounded-xl text-sm outline-none appearance-none bg-white text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {PHONE_CODES.map(({ code, flag }) => (
            <option key={code} value={code}>
              {flag} {code}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      <div className="relative flex-1">
        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="tel"
          value={number}
          onChange={onNumberChange}
          placeholder="Enter phone number"
          disabled={disabled}
          className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm outline-none text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-200"
        />
      </div>
    </div>
  </div>
);

const Checkbox = ({ checked, onChange, disabled, children }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="mt-1 w-4 h-4 rounded border-slate-300 cursor-pointer focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ accentColor: "rgb(68,138,255)" }}
    />
    <span className="text-sm text-slate-600 leading-relaxed">{children}</span>
  </label>
);

const Divider = ({ text }) => (
  <div className="relative flex items-center my-8">
    <div className="flex-1 border-t border-slate-200" />
    <span className="px-4 text-xs text-slate-400 uppercase tracking-wider font-medium bg-white">{text}</span>
    <div className="flex-1 border-t border-slate-200" />
  </div>
);

const GoogleButton = ({ onClick, disabled, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
  >
    {loading ? (
      <>
        <Loader2 size={18} className="animate-spin text-slate-400" />
        Connecting to Google...
      </>
    ) : (
      <>
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RegisterPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { register, handleGoogleAuth, loading } = useRegister();

  const [form, setForm] = useState({
    salutation: "Mr.",
    name: "",
    email: "",
    phoneCode: "+971",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { isGoogleLoaded, triggerGoogleSignIn } = useGoogleAuth(
    async (credential) => {
      setGoogleLoading(true);
      await handleGoogleAuth(credential);
      setGoogleLoading(false);
    },
    (error) => {
      toast.error(error || "Google sign-up failed");
      setGoogleLoading(false);
    }
  );

  const handleChange = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const validateForm = useCallback(() => {
    const { name, email, phoneNumber, password, confirmPassword } = form;

    if (!name.trim()) {
      toast.error("Please enter your name");
      return false;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    if (!password) {
      toast.error("Please enter a password");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the Terms & Conditions");
      return false;
    }

    return true;
  }, [form, acceptedTerms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    await register({
      full_name: `${form.salutation} ${form.name}`.trim(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: `${form.phoneCode}${form.phoneNumber}`,
      password: form.password,
    });
  };

  const handleGoogleSignIn = () => {
    if (!isGoogleLoaded) {
      toast.error("Google SDK is loading. Please wait a moment.");
      return;
    }
    setGoogleLoading(true);
    triggerGoogleSignIn();
    setTimeout(() => setGoogleLoading(false), 10000);
  };

  const isSubmitting = loading || googleLoading;

  if (authLoading || isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image src="/logo.svg" alt="Logo" width={180} height={60} priority className="h-14 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1 text-sm">Join us to explore premium properties</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <GoogleButton onClick={handleGoogleSignIn} disabled={loading || !isGoogleLoaded} loading={googleLoading} />

          <Divider text="or sign up with email" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <SelectField label="Title" value={form.salutation} onChange={handleChange("salutation")} options={SALUTATIONS} disabled={isSubmitting} />
              <InputField label="Full Name" value={form.name} onChange={handleChange("name")} placeholder="Enter your name" icon={User} disabled={isSubmitting} required />
            </div>

            <InputField label="Email Address" type="email" value={form.email} onChange={handleChange("email")} placeholder="Enter your email" icon={Mail} disabled={isSubmitting} required />

            <PhoneInput code={form.phoneCode} onCodeChange={handleChange("phoneCode")} number={form.phoneNumber} onNumberChange={handleChange("phoneNumber")} disabled={isSubmitting} />

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Password" value={form.password} onChange={handleChange("password")} placeholder="Create password" icon={Lock} disabled={isSubmitting} required showPasswordToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
              <InputField label="Confirm Password" value={form.confirmPassword} onChange={handleChange("confirmPassword")} placeholder="Confirm password" icon={Lock} disabled={isSubmitting} required showPasswordToggle showPassword={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>
            <p className="text-xs text-slate-400 -mt-3">Password must be at least 6 characters</p>

            <Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} disabled={isSubmitting}>
              I accept the{" "}
              <Link href="/terms-and-conditions" className="font-medium underline underline-offset-2" style={{ color: "rgb(68,138,255)" }}>
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-medium underline underline-offset-2" style={{ color: "rgb(68,138,255)" }}>
                Privacy Policy
              </Link>
            </Checkbox>

            <button
              type="submit"
              disabled={isSubmitting || !acceptedTerms}
              className="w-full h-12 flex items-center justify-center gap-2 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              style={{ backgroundColor: "rgb(68,138,255)", boxShadow: "0 4px 14px 0 rgba(68,138,255,0.39)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "rgb(68,138,255)" }}>
            Sign In
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}