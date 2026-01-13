// utils/auth.js - FIXED (NO "use client")

/**
 * Safe localStorage access (SSR compatible)
 */
const safeStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/**
 * Cookie utilities
 */
export const cookies = {
  set: (name, value, days = 1) => {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  
  get: (name) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },
  
  delete: (name) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },
};

/**
 * Decode JWT payload
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;

  // 30 second buffer for clock skew
  return Date.now() >= (payload.exp * 1000) - 30000;
};

// ============ ADMIN TOKEN FUNCTIONS ============

/**
 * Get admin token
 */
export const getAdminToken = () => {
  return safeStorage.getItem("adminToken") || cookies.get("adminToken");
};

/**
 * Check if admin token is valid
 */
export const isAdminTokenValid = () => {
  const token = getAdminToken();
  return token ? !isTokenExpired(token) : false;
};

/**
 * Set admin token (localStorage + cookie)
 */
export const setAdminToken = (token) => {
  if (!token) return false;

  safeStorage.setItem("adminToken", token);
  cookies.set("adminToken", token, 1); // 1 day

  return true;
};

/**
 * Set admin user data
 */
export const setAdminUser = (user) => {
  if (!user) return;
  safeStorage.setItem("adminUser", JSON.stringify(user));
};

/**
 * Get admin user data
 */
export const getAdminUser = () => {
  const data = safeStorage.getItem("adminUser");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Clear admin tokens
 */
export const clearAdminTokens = () => {
  safeStorage.removeItem("adminToken");
  safeStorage.removeItem("adminUser");
  safeStorage.removeItem("adminEmail");
  cookies.delete("adminToken");
};

/**
 * Get admin data from token
 */
export const getAdminFromToken = () => {
  const token = getAdminToken();
  if (!token || isTokenExpired(token)) return null;

  return decodeToken(token);
};

// ============ USER TOKEN FUNCTIONS ============

/**
 * Get user token
 */
export const getUserToken = () => {
  return safeStorage.getItem("userToken") || safeStorage.getItem("token");
};

/**
 * Check if user token is valid
 */
export const isUserTokenValid = () => {
  const token = getUserToken();
  return token ? !isTokenExpired(token) : false;
};

/**
 * Set user token
 */
export const setUserToken = (token) => {
  if (!token) return false;

  safeStorage.setItem("userToken", token);
  cookies.set("userToken", token, 7); // 7 days

  return true;
};

/**
 * Clear user tokens
 */
export const clearUserTokens = () => {
  safeStorage.removeItem("userToken");
  safeStorage.removeItem("token");
  safeStorage.removeItem("userData");
  cookies.delete("userToken");
  cookies.delete("token");
};

/**
 * Get user from token
 */
export const getUserFromToken = () => {
  const token = getUserToken();
  if (!token || isTokenExpired(token)) return null;

  return decodeToken(token);
};

// ============ SESSION FUNCTIONS ============

/**
 * Get current session type
 */
export const getCurrentSessionType = () => {
  if (isAdminTokenValid()) return "admin";
  if (isUserTokenValid()) return "user";
  return null;
};

/**
 * Check if authenticated
 */
export const isAuthenticated = () => getCurrentSessionType() !== null;
export const isAdmin = () => getCurrentSessionType() === "admin";
export const isUser = () => getCurrentSessionType() === "user";

/**
 * Logout all sessions
 */
export const logoutAll = () => {
  clearAdminTokens();
  clearUserTokens();
};

/**
 * Get comprehensive auth status
 */
export const getAuthStatus = () => {
  const adminToken = getAdminToken();
  const userToken = getUserToken();

  if (adminToken && !isTokenExpired(adminToken)) {
    return {
      isAuthenticated: true,
      type: "admin",
      token: adminToken,
      user: getAdminUser() || getAdminFromToken(),
    };
  }

  if (userToken && !isTokenExpired(userToken)) {
    return {
      isAuthenticated: true,
      type: "user",
      token: userToken,
      user: getUserFromToken(),
    };
  }

  return {
    isAuthenticated: false,
    type: null,
    token: null,
    user: null,
  };
};