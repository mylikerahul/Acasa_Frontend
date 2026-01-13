"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Phone,
  MessageCircle,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronDown,
  Home,
  Building,
  FileText,
  Newspaper,
  Settings,
  HelpCircle,
  Shield,
  Activity,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const NAV_LINKS = Object.freeze([
  { name: "Buy", href: "/buy", icon: Building },
  { name: "Sell", href: "/sell", icon: Home },
  { name: "Off Plan", href: "/off-plan", icon: Building },
  { name: "Blogs", href: "/blogs", icon: Newspaper },
]);

const PROFILE_MENU_ITEMS = Object.freeze([
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Profile", href: "/profile", icon: User },
  { name: "My Properties", href: "/my-properties", icon: Building },
  { name: "Saved Searches", href: "/saved-searches", icon: Heart },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
]);

const USER_TYPE_CONFIG = Object.freeze({
  agent: { label: "Agent", badge: "🏢", color: "bg-blue-100 text-blue-800" },
  developer: { label: "Developer", badge: "🏗️", color: "bg-green-100 text-green-800" },
  user: { label: "User", badge: "👤", color: "bg-gray-100 text-gray-800" },
});

const DEFAULT_LOGO = "/logo.svg";
const CACHE_DURATION = 60000; // 1 minute

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const apiCache = new CacheManager();

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const showSuccess = (msg) => toast.success(msg, { 
  duration: 3000, 
  position: "top-right",
  style: { background: '#10B981', color: '#fff', fontWeight: '500' }
});

const showError = (msg) => toast.error(msg, { 
  duration: 4000, 
  position: "top-right",
  style: { background: '#EF4444', color: '#fff', fontWeight: '500' }
});

const showLoading = (msg) => toast.loading(msg, { position: "top-right" });

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const getAvatarUrl = (user) => {
  if (!user) return null;
  const avatar = user.avatarUrl || user.image_icon || user.picture || user.image;
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  return `${API_URL}/uploads/avatars/${avatar}`;
};

const getSettingsImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/uploads/settings/${path}`;
};

const getUserDisplayInfo = (user) => {
  if (!user) return { name: "User", initials: "U", details: null };
  
  const displayName = user.name || user.firstName || user.email?.split("@")[0] || "User";
  const details = USER_TYPE_CONFIG[user.usertype] || null;
  
  return {
    name: displayName,
    initials: displayName.charAt(0).toUpperCase(),
    details,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// API Request Hook with AbortController
function useAPI() {
  const abortControllerRef = useRef(null);

  const request = useCallback(async (endpoint, options = {}) => {
    if (options.cancelPrevious && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (options.cancelPrevious) {
      abortControllerRef.current = new AbortController();
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        signal: options.cancelPrevious ? abortControllerRef.current.signal : options.signal,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }
      throw error;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { request, cleanup };
}

// Public Settings Hook
function usePublicSettings() {
  const [settings, setSettings] = useState({
    logo: null,
    favicon: null,
    site_name: "",
    site_email: "",
    contact_phone: "",
  });
  const [loading, setLoading] = useState(true);
  const { request, cleanup } = useAPI();

  const fetchSettings = useCallback(async () => {
    // Check cache first
    const cached = apiCache.get("publicSettings");
    if (cached) {
      setSettings(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await request("/api/v1/settings/public");

      if (data.success && data.settings) {
        const general = data.settings.general || {};
        const contact = data.settings.contact || {};

        const newSettings = {
          logo: general.logo || null,
          favicon: general.favicon || null,
          site_name: general.site_name || "",
          site_email: general.site_email || "",
          contact_phone: contact.contact_phone || "",
        };

        setSettings(newSettings);
        apiCache.set("publicSettings", newSettings);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Settings fetch error:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchSettings();
    return cleanup;
  }, [fetchSettings, cleanup]);

  const logoUrl = useMemo(() => 
    settings.logo ? getSettingsImageUrl(settings.logo) : DEFAULT_LOGO,
    [settings.logo]
  );

  const faviconUrl = useMemo(() => 
    settings.favicon ? getSettingsImageUrl(settings.favicon) : null,
    [settings.favicon]
  );

  return {
    ...settings,
    logoUrl,
    faviconUrl,
    loading,
    refetch: fetchSettings,
  };
}

// Auth Hook
function useAuth() {
  const [state, setState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
    logoutLoading: false,
    googleLoading: false,
  });
  const router = useRouter();
  const { request, cleanup } = useAPI();

  const fetchUser = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true }));
      
      const data = await request("/api/v1/users/me");
      const userData = data.user || data.data || data;

      if (userData.usertype === "admin") {
        setState(s => ({ ...s, user: null, isAuthenticated: false, loading: false }));
        showError("Admin users cannot access this interface");
        return;
      }

      setState(s => ({
        ...s,
        user: userData,
        isAuthenticated: true,
        loading: false,
      }));
    } catch (error) {
      if (error.name !== "AbortError") {
        setState(s => ({ ...s, user: null, isAuthenticated: false, loading: false }));
      }
    }
  }, [request]);

  const logout = useCallback(async () => {
    if (state.logoutLoading) return false;
    
    setState(s => ({ ...s, logoutLoading: true }));
    const toastId = showLoading("Logging out...");

    try {
      await request("/api/v1/users/logout", { method: "POST" });
      
      setState(s => ({ ...s, user: null, isAuthenticated: false }));

      if (typeof window !== "undefined") {
        localStorage.removeItem("cartItems");
        localStorage.removeItem("user");
      }

      toast.dismiss(toastId);
      showSuccess("Logged out successfully!");
      return true;
    } catch (error) {
      toast.dismiss(toastId);
      setState(s => ({ ...s, user: null, isAuthenticated: false }));
      return false;
    } finally {
      setState(s => ({ ...s, logoutLoading: false }));
    }
  }, [state.logoutLoading, request]);

  const handleGoogleAuth = useCallback(async (googleToken) => {
    setState(s => ({ ...s, googleLoading: true }));

    try {
      const data = await request("/api/v1/users/google", {
        method: "POST",
        body: JSON.stringify({ token: googleToken }),
      });

      if (data.success) {
        const userData = data.user;

        if (userData.usertype === "admin") {
          showError("Admin users cannot access this interface");
          await logout();
          return { success: false };
        }

        setState(s => ({
          ...s,
          user: userData,
          isAuthenticated: true,
          googleLoading: false,
        }));
        
        showSuccess("Signed in with Google successfully!");
        router.push("/dashboard");
        return { success: true };
      }

      throw new Error(data.message || "Google authentication failed");
    } catch (error) {
      showError(error?.message || "Google authentication failed");
      return { success: false };
    } finally {
      setState(s => ({ ...s, googleLoading: false }));
    }
  }, [request, logout, router]);

  const setGoogleLoading = useCallback((loading) => {
    setState(s => ({ ...s, googleLoading: loading }));
  }, []);

  useEffect(() => {
    fetchUser();
    return cleanup;
  }, [fetchUser, cleanup]);

  const displayInfo = useMemo(() => getUserDisplayInfo(state.user), [state.user]);
  const avatarUrl = useMemo(() => getAvatarUrl(state.user), [state.user]);

  return {
    ...state,
    logout,
    handleGoogleAuth,
    setGoogleLoading,
    displayName: displayInfo.name,
    initials: displayInfo.initials,
    userDetails: displayInfo.details,
    avatarUrl,
    refetch: fetchUser,
  };
}

// Wishlist Hook
function useWishlist(isAuthenticated) {
  const [items, setItems] = useState([]);
  const { request, cleanup } = useAPI();

  const fetchItems = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        if (typeof window !== "undefined") {
          const localCart = localStorage.getItem("cartItems");
          if (localCart) setItems(JSON.parse(localCart));
        }
        return;
      }

      const data = await request("/api/v1/wishlist");
      setItems(data.items || data.wishlist || data.data || []);
    } catch (error) {
      if (error.name !== "AbortError") {
        if (typeof window !== "undefined") {
          const localCart = localStorage.getItem("cartItems");
          if (localCart) setItems(JSON.parse(localCart));
        }
      }
    }
  }, [isAuthenticated, request]);

  useEffect(() => {
    fetchItems();
    return cleanup;
  }, [fetchItems, cleanup]);

  useEffect(() => {
    const handleUpdate = () => fetchItems();
    
    if (typeof window !== "undefined") {
      window.addEventListener("cartUpdated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cartUpdated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      }
    };
  }, [fetchItems]);

  return { items, count: items.length, refetch: fetchItems };
}

// Scroll Direction Hook
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  const prevScrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      if (currentScroll > prevScrollRef.current && currentScroll > 100) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      
      prevScrollRef.current = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollDirection;
}

// Google Auth Hook
function useGoogleAuth(onSuccess, onError) {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const initializedRef = useRef(false);

  const initializeGoogle = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !window.google?.accounts?.id ||
      !GOOGLE_CLIENT_ID ||
      initializedRef.current
    ) return;

    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onSuccess?.(response.credential);
        } else {
          onError?.("No credential received from Google");
        }
      },
    });
  }, [onSuccess, onError]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
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

    script.onerror = () => {
      onError?.("Failed to load Google SDK");
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) existingScript.remove();
    };
  }, [initializeGoogle, onError]);

  const triggerGoogleSignIn = useCallback(() => {
    if (typeof window === "undefined" || !window.google?.accounts?.id) {
      onError?.("Google SDK not loaded");
      return;
    }

    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed?.() ||
        notification.isSkippedMoment?.()
      ) {
        const buttonDiv = document.getElementById("navbar-google-btn");
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: "outline",
            size: "large",
          });
          setTimeout(() => {
            const btn = buttonDiv.querySelector("div[role='button']");
            if (btn) btn.click();
          }, 100);
        }
      }
    });
  }, [onError]);

  return { isGoogleLoaded, triggerGoogleSignIn };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const DynamicLogo = memo(function DynamicLogo({ logoUrl, siteName, loading }) {
  const [imageState, setImageState] = useState({ loaded: false, error: false });

  useEffect(() => {
    setImageState({ loaded: false, error: false });
  }, [logoUrl]);

  if (loading) {
    return <div className="w-[120px] h-[32px] bg-gray-200 animate-pulse rounded" />;
  }

  if (imageState.error || !logoUrl) {
    return <span className="text-xl font-bold text-gray-900">{siteName || "Logo"}</span>;
  }

  return (
    <div className="relative w-[120px] h-[32px]">
      {!imageState.loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={logoUrl}
        alt={siteName || "Logo"}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          imageState.loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageState(s => ({ ...s, loaded: true }))}
        onError={() => setImageState(s => ({ ...s, error: true }))}
      />
    </div>
  );
});

const UserAvatar = memo(function UserAvatar({ src, alt, initials, size = "sm" }) {
  const [imageState, setImageState] = useState({ loaded: false, error: false });

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  useEffect(() => {
    if (src) setImageState({ loaded: false, error: false });
  }, [src]);

  if (src && !imageState.error) {
    return (
      <div className="relative">
        {!imageState.loaded && (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse`} />
        )}
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 ${
            imageState.loaded ? "block" : "hidden"
          }`}
          onLoad={() => setImageState(s => ({ ...s, loaded: true }))}
          onError={() => setImageState(s => ({ ...s, error: true }))}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold`}
    >
      {initials}
    </div>
  );
});

const GoogleIcon = memo(function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
  );
});

const NavLink = memo(function NavLink({ href, name, isActive }) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={`px-2 text-sm font-medium transition-colors ${
        isActive ? "text-indigo-700" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {name}
    </Link>
  );
});

const WishlistButton = memo(function WishlistButton({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center rounded-full p-1.5 hover:bg-gray-100 transition-colors"
      aria-label={`Wishlist (${count} items)`}
    >
      <Heart size={22} className="text-gray-700" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow">
          {count}
        </span>
      )}
    </button>
  );
});

const AuthButtons = memo(function AuthButtons({ 
  auth, 
  onNavigate, 
  onGoogleSignIn, 
  isGoogleLoaded,
  onOpenProfile 
}) {
  if (auth.loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-28 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-7 w-14 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (auth.isAuthenticated && auth.user) {
    return (
      <div className="flex items-center gap-3">
        {/* User Info Button - Opens Profile Sidebar */}
        <button
          onClick={onOpenProfile}
          className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 hover:bg-gray-50 transition-colors"
        >
          <UserAvatar
            src={auth.avatarUrl}
            alt={auth.displayName}
            initials={auth.initials}
            size="sm"
          />
          <div className="flex items-center gap-1.5">
            <span className="max-w-[90px] truncate text-xs font-medium text-gray-800">
              {auth.displayName}
            </span>
            {auth.userDetails && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${auth.userDetails.color}`}>
                {auth.userDetails.badge}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {/* Dashboard Button */}
        <Link
          href="/dashboard"
          prefetch={true}
          className="hidden sm:inline-flex items-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Dashboard
        </Link>

        {/* Logout Button */}
        <button
          onClick={auth.logout}
          disabled={auth.logoutLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {auth.logoutLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LogOut size={14} />
          )}
          <span className="hidden sm:inline">
            {auth.logoutLoading ? "..." : "Logout"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onGoogleSignIn}
        disabled={!isGoogleLoaded || auth.googleLoading}
        className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
      >
        {auth.googleLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>Sign in with Google</span>
      </button>

      <Link
        href="/login"
        prefetch={true}
        className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        Login
      </Link>

      <Link
        href="/register"
        prefetch={true}
        className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Sign up
      </Link>
    </div>
  );
});

const TopStrip = memo(function TopStrip({
  auth,
  onGoogleSignIn,
  isGoogleLoaded,
  contactPhone,
  onOpenProfile,
}) {
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="mx-auto flex h-11 max-w-7xl items-center justify-end gap-4 px-6 md:px-14">
        <a
          href={`tel:${contactPhone || "+97141234567"}`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Phone size={14} />
          <span>Call</span>
        </a>

        <span className="h-4 w-px bg-gray-300" />

        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Chat"
        >
          <MessageCircle size={14} />
        </button>

        <AuthButtons
          auth={auth}
          onGoogleSignIn={onGoogleSignIn}
          isGoogleLoaded={isGoogleLoaded}
          onOpenProfile={onOpenProfile}
        />
      </div>
    </div>
  );
});

// Profile Sidebar (Admin Theme Style)
const ProfileSidebar = memo(function ProfileSidebar({
  isOpen,
  onClose,
  auth,
  pathname,
}) {
  const router = useRouter();

  const handleNavigation = useCallback((href) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    onClose();
    router.push("/");
  }, [auth, onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      <aside className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Account</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={auth.avatarUrl}
              alt={auth.displayName}
              initials={auth.initials}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {auth.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">{auth.user?.email}</p>
              {auth.userDetails && (
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${auth.userDetails.color}`}>
                  {auth.userDetails.badge} {auth.userDetails.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {PROFILE_MENU_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <IconComponent className="w-4 h-4 opacity-70" />
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={auth.logoutLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {auth.logoutLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="font-medium">
              {auth.logoutLoading ? "Logging out..." : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
});

// Mobile Menu (Admin Theme Style)
const MobileMenu = memo(function MobileMenu({
  isOpen,
  onClose,
  links,
  pathname,
  wishlistCount,
  auth,
  logoUrl,
  siteName,
}) {
  const router = useRouter();

  const handleNavigation = useCallback((href) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    onClose();
  }, [auth, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-[280px] bg-white shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          {auth.isAuthenticated && auth.user ? (
            <div className="flex items-center gap-3">
              <UserAvatar
                src={auth.avatarUrl}
                alt={auth.displayName}
                initials={auth.initials}
                size="md"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {auth.displayName}
                </p>
                {auth.userDetails && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block mt-1 ${auth.userDetails.color}`}>
                    {auth.userDetails.badge} {auth.userDetails.label}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <DynamicLogo logoUrl={logoUrl} siteName={siteName} loading={false} />
          )}
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-5">
          {links.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              prefetch={true}
              className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                pathname === href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {name}
            </Link>
          ))}

          <button
            onClick={() => handleNavigation("/wishlist")}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Heart size={18} />
              Wishlist
            </span>
            {wishlistCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {auth.isAuthenticated && (
            <button
              onClick={() => handleNavigation("/dashboard")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <User size={18} />
              Dashboard
            </button>
          )}
        </nav>

        {/* Logout Button */}
        {auth.isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-5">
            <button
              onClick={handleLogout}
              disabled={auth.logoutLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {auth.logoutLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
              {auth.logoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN NAVBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const publicSettings = usePublicSettings();
  const auth = useAuth();
  const wishlist = useWishlist(auth.isAuthenticated);

  const { isGoogleLoaded, triggerGoogleSignIn } = useGoogleAuth(
    async (credential) => {
      auth.setGoogleLoading(true);
      await auth.handleGoogleAuth(credential);
    },
    (error) => {
      console.error("Google Auth Error:", error);
      showError(error || "Google sign-in failed");
      auth.setGoogleLoading(false);
    }
  );

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Handle body scroll lock
  useEffect(() => {
    document.body.style.overflow = profileOpen || mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [profileOpen, mobileMenuOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Update document title and favicon
  useEffect(() => {
    if (publicSettings.site_name && typeof document !== "undefined") {
      const currentTitle = document.title;
      if (!currentTitle || currentTitle === "Loading...") {
        document.title = publicSettings.site_name;
      }
    }
  }, [publicSettings.site_name]);

  useEffect(() => {
    if (publicSettings.faviconUrl && typeof document !== "undefined") {
      let favicon = document.querySelector("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = publicSettings.faviconUrl;
    }
  }, [publicSettings.faviconUrl]);

  const handleGoogleSignIn = useCallback(() => {
    if (!isGoogleLoaded) {
      showError("Google SDK is loading. Please try again.");
      return;
    }
    auth.setGoogleLoading(true);
    triggerGoogleSignIn();
  }, [isGoogleLoaded, triggerGoogleSignIn, auth]);

  const handleNavigate = useCallback((path) => {
    router.push(path);
    setMobileMenuOpen(false);
  }, [router]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-transform duration-300 ${
          scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <TopStrip
          auth={auth}
          onGoogleSignIn={handleGoogleSignIn}
          isGoogleLoaded={isGoogleLoaded}
          contactPhone={publicSettings.contact_phone}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center px-6 md:px-14">
            <Link href="/" prefetch={true} className="flex items-center hover:opacity-80">
              <DynamicLogo
                logoUrl={publicSettings.logoUrl}
                siteName={publicSettings.site_name}
                loading={publicSettings.loading}
              />
            </Link>

            <div className="ml-auto flex items-center gap-4">
              <nav className="hidden items-center gap-6 lg:flex">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    isActive={pathname === link.href}
                  />
                ))}
              </nav>

              <WishlistButton
                count={wishlist.count}
                onClick={() => handleNavigate("/wishlist")}
              />

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center rounded-full p-2 text-gray-700 hover:bg-gray-100 lg:hidden transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>

        <div id="navbar-google-btn" className="hidden" />
      </header>

      {/* Profile Sidebar */}
      {auth.isAuthenticated && (
        <ProfileSidebar
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          auth={auth}
          pathname={pathname}
        />
      )}

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={NAV_LINKS}
        pathname={pathname}
        wishlistCount={wishlist.count}
        auth={auth}
        logoUrl={publicSettings.logoUrl}
        siteName={publicSettings.site_name}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}