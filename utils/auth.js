// utils/auth.js - COMPLETE AUTH MANAGEMENT (FIXED & PRODUCTION READY)

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
 * Cookie utilities with secure options
 */
export const cookies = {
  set: (name, value, days = 1, secure = false) => {
    if (typeof document === "undefined") return;
    
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieString = [
      `${name}=${encodeURIComponent(value)}`,
      `expires=${expiryDate.toUTCString()}`,
      `path=/`,
      `SameSite=${isProduction ? 'Strict' : 'Lax'}`,
      secure || isProduction ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    document.cookie = cookieString;
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

  deleteAll: () => {
    if (typeof document === "undefined") return;
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      cookies.delete(name);
    });
  },
};

/**
 * JWT Decode Helper
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid token format");
      return null;
    }

    const payload = parts[1];
    const decoded = atob(
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=")
    );
    
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Token decode error:", error.message);
    return null;
  }
};

/**
 * Check if token is expired with buffer
 */
export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;

  // 60 second buffer for clock skew and slow networks
  const bufferMs = 60 * 1000;
  return Date.now() >= (payload.exp * 1000) - bufferMs;
};

/**
 * Get token expiry time
 */
export const getTokenExpiry = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

/**
 * Get time remaining on token
 */
export const getTokenTimeRemaining = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  return Math.max(0, expiry.getTime() - Date.now());
};

// ============================================
// ADMIN TOKEN MANAGEMENT
// ============================================

/**
 * Get admin token from storage or cookies
 */
export const getAdminToken = () => {
  const storageToken = safeStorage.getItem("adminToken");
  if (storageToken) return storageToken;
  
  const cookieToken = cookies.get("adminToken");
  return cookieToken || null;
};

/**
 * Check if admin token is valid
 */
export const isAdminTokenValid = () => {
  const token = getAdminToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * Set admin token in storage and cookies
 */
export const setAdminToken = (token, rememberMe = false) => {
  if (!token) return false;

  // Always store in localStorage
  safeStorage.setItem("adminToken", token);
  
  // Store in cookie (1 day for normal, 7 days for remember me)
  const days = rememberMe ? 7 : 1;
  cookies.set("adminToken", token, days, true);

  return true;
};

/**
 * Set admin user data
 */
export const setAdminUser = (user) => {
  if (!user || !user.id) return false;

  const userData = {
    id: user.id,
    name: user.full_name || user.name,
    email: user.email,
    usertype: user.usertype,
    image_icon: user.image_icon,
    created_at: user.created_at,
  };

  safeStorage.setItem("adminUser", JSON.stringify(userData));
  return true;
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
 * Clear all admin tokens and data
 */
export const clearAdminTokens = () => {
  const keysToRemove = [
    "adminToken",
    "adminUser",
    "admin_remembered_email",
    "adminAuthTimestamp",
  ];

  keysToRemove.forEach((key) => {
    safeStorage.removeItem(key);
    cookies.delete(key);
  });

  // Clear all auth cookies as backup
  cookies.delete("adminToken");
  cookies.delete("userToken");
};

/**
 * Get admin data from token
 */
export const getAdminFromToken = () => {
  const token = getAdminToken();
  if (!token || isTokenExpired(token)) return null;

  return decodeToken(token);
};

/**
 * Validate admin token and get payload
 */
export const validateAdminToken = () => {
  const token = getAdminToken();
  
  if (!token) {
    return {
      valid: false,
      reason: "NO_TOKEN",
      message: "No token found",
    };
  }

  if (isTokenExpired(token)) {
    clearAdminTokens();
    return {
      valid: false,
      reason: "TOKEN_EXPIRED",
      message: "Token has expired",
    };
  }

  const payload = decodeToken(token);
  
  if (!payload?.id || !payload?.email) {
    clearAdminTokens();
    return {
      valid: false,
      reason: "INVALID_PAYLOAD",
      message: "Invalid token payload",
    };
  }

  if (payload.usertype?.toLowerCase() !== "admin") {
    return {
      valid: false,
      reason: "NOT_ADMIN",
      message: "User is not an admin",
    };
  }

  return {
    valid: true,
    payload,
    expiresAt: getTokenExpiry(token),
    timeRemaining: getTokenTimeRemaining(token),
  };
};

// ============================================
// USER TOKEN MANAGEMENT
// ============================================

/**
 * Get user token from storage or cookies
 */
export const getUserToken = () => {
  const storageToken = safeStorage.getItem("userToken");
  if (storageToken) return storageToken;
  
  const cookieToken = cookies.get("userToken");
  return cookieToken || null;
};

/**
 * Check if user token is valid
 */
export const isUserTokenValid = () => {
  const token = getUserToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * Set user token in storage and cookies
 */
export const setUserToken = (token, rememberMe = false) => {
  if (!token) return false;

  // Always store in localStorage
  safeStorage.setItem("userToken", token);
  
  // Store in cookie (1 day for normal, 7 days for remember me)
  const days = rememberMe ? 7 : 1;
  cookies.set("userToken", token, days, true);

  return true;
};

/**
 * Clear user tokens
 */
export const clearUserTokens = () => {
  const keysToRemove = [
    "userToken",
    "userData",
    "user_remembered_email",
    "userAuthTimestamp",
    "userSessionLastActive",
  ];

  keysToRemove.forEach((key) => {
    safeStorage.removeItem(key);
    cookies.delete(key);
  });

  cookies.delete("userToken");
};

/**
 * Store full user data in localStorage
 */
export const setUserData = (userData) => {
  if (!userData) return false;
  
  try {
    const cleanData = {
      id: userData.id || userData._id,
      name: userData.name || userData.full_name,
      email: userData.email,
      phone: userData.phone || null,
      location: userData.location || null,
      avatar: userData.avatar || null,
      avatarUrl: userData.avatarUrl || userData.avatar?.url || null,
      role: userData.role || userData.usertype || "user",
      createdAt: userData.createdAt || userData.created_at,
      updatedAt: userData.updatedAt || userData.updated_at,
    };

    safeStorage.setItem("userData", JSON.stringify(cleanData));
    return true;
  } catch (error) {
    console.error("Error setting user data:", error);
    return false;
  }
};

/**
 * Get stored user data
 */
export const getUserData = () => {
  const data = safeStorage.getItem("userData");
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Update partial or full user data
 */
export const updateUserData = (updates) => {
  const current = getUserData() || {};
  const updated = { ...current, ...updates };
  return setUserData(updated);
};

/**
 * Clear entire user session (token + data)
 */
export const clearUserSession = () => {
  clearUserTokens();
  safeStorage.removeItem("userData");
};

/**
 * Validate user session (client-side check)
 */
export const validateUserSession = () => {
  const token = getUserToken();
  const userData = getUserData();

  if (!token || !userData) {
    return {
      valid: false,
      reason: "NO_SESSION",
      message: "No active session",
      requiresApiCheck: true,
    };
  }

  if (isTokenExpired(token)) {
    clearUserSession();
    return {
      valid: false,
      reason: "TOKEN_EXPIRED",
      message: "Session expired",
      requiresApiCheck: false,
    };
  }

  const payload = decodeToken(token);
  
  if (!payload?.id && !payload?.userId) {
    clearUserSession();
    return {
      valid: false,
      reason: "INVALID_PAYLOAD",
      message: "Invalid token payload",
      requiresApiCheck: false,
    };
  }

  return {
    valid: true,
    payload,
    user: userData,
    requiresApiCheck: false,
    expiresAt: getTokenExpiry(token),
    timeRemaining: getTokenTimeRemaining(token),
  };
};

/**
 * Refresh session - called after every successful API call
 * Extends token life if backend supports it (optional)
 */
export const refreshUserSession = () => {
  // Update last active timestamp
  safeStorage.setItem("userSessionLastActive", Date.now().toString());
  
  // Optional: Implement silent token refresh here if your backend supports it
  // Example:
  // if (getTokenTimeRemaining(getUserToken()) < 5 * 60 * 1000) { // Less than 5 mins
  //   apiClient.post("/api/v1/users/refresh-token").then(({ data }) => {
  //     if (data.token) setUserToken(data.token);
  //   }).catch(() => {});
  // }
};

/**
 * Get user from token payload
 */
export const getUserFromToken = () => {
  const token = getUserToken();
  if (!token || isTokenExpired(token)) return null;
  return decodeToken(token);
};

/**
 * Validate user token and get payload
 */
export const validateUserToken = () => {
  const token = getUserToken();
  
  if (!token) {
    return {
      valid: false,
      reason: "NO_TOKEN",
      message: "No token found",
    };
  }

  if (isTokenExpired(token)) {
    clearUserSession();
    return {
      valid: false,
      reason: "TOKEN_EXPIRED",
      message: "Token has expired",
    };
  }

  const payload = decodeToken(token);
  
  if (!payload?.id && !payload?.userId) {
    clearUserSession();
    return {
      valid: false,
      reason: "INVALID_PAYLOAD",
      message: "Invalid token payload",
    };
  }

  return {
    valid: true,
    payload,
    expiresAt: getTokenExpiry(token),
    timeRemaining: getTokenTimeRemaining(token),
  };
};

// ============================================
// SESSION MANAGEMENT (COMMON)
// ============================================

/**
 * Get current session type (admin or user)
 */
export const getCurrentSessionType = () => {
  if (isAdminTokenValid()) return "admin";
  if (isUserTokenValid()) return "user";
  return null;
};

/**
 * Check if any session is active
 */
export const isAuthenticated = () => getCurrentSessionType() !== null;

/**
 * Check if current session is admin
 */
export const isAdmin = () => getCurrentSessionType() === "admin";

/**
 * Check if current session is user
 */
export const isUser = () => getCurrentSessionType() === "user";

/**
 * Logout all sessions (admin + user)
 */
export const logoutAll = () => {
  clearAdminTokens();
  clearUserSession();
  cookies.deleteAll();
};

/**
 * Get comprehensive auth status
 */
export const getAuthStatus = () => {
  const adminToken = getAdminToken();
  const userToken = getUserToken();

  // Check admin session first
  if (adminToken && !isTokenExpired(adminToken)) {
    return {
      isAuthenticated: true,
      type: "admin",
      token: adminToken,
      user: getAdminUser(),
      expiresAt: getTokenExpiry(adminToken),
      timeRemaining: getTokenTimeRemaining(adminToken),
    };
  }

  // Check user session
  if (userToken && !isTokenExpired(userToken)) {
    return {
      isAuthenticated: true,
      type: "user",
      token: userToken,
      user: getUserData(),
      expiresAt: getTokenExpiry(userToken),
      timeRemaining: getTokenTimeRemaining(userToken),
    };
  }

  return {
    isAuthenticated: false,
    type: null,
    token: null,
    user: null,
    expiresAt: null,
    timeRemaining: 0,
  };
};

/**
 * Store auth timestamp for security
 */
export const setAuthTimestamp = (type = "user") => {
  const key = type === "admin" ? "adminAuthTimestamp" : "userAuthTimestamp";
  safeStorage.setItem(key, Date.now().toString());
};

/**
 * Get auth timestamp
 */
export const getAuthTimestamp = (type = "user") => {
  const key = type === "admin" ? "adminAuthTimestamp" : "userAuthTimestamp";
  const timestamp = safeStorage.getItem(key);
  return timestamp ? parseInt(timestamp) : null;
};

/**
 * Check if session is too old (optional security measure)
 * Default: 24 hours
 */
export const isSessionTooOld = (type = "user", maxAgeMs = 24 * 60 * 60 * 1000) => {
  const timestamp = getAuthTimestamp(type);
  if (!timestamp) return true;
  return Date.now() - timestamp > maxAgeMs;
};

/**
 * Get last active time for user session
 */
export const getLastActiveTime = () => {
  const timestamp = safeStorage.getItem("userSessionLastActive");
  return timestamp ? parseInt(timestamp) : null;
};

/**
 * Check if user session is idle for too long
 * Default: 30 minutes
 */
export const isSessionIdle = (maxIdleMs = 30 * 60 * 1000) => {
  const lastActive = getLastActiveTime();
  if (!lastActive) return false;
  return Date.now() - lastActive > maxIdleMs;
};

// ============================================
// UTILITY EXPORTS
// ============================================

export default {
  // Token utilities
  decodeToken,
  isTokenExpired,
  getTokenExpiry,
  getTokenTimeRemaining,
  
  // Admin functions
  getAdminToken,
  setAdminToken,
  isAdminTokenValid,
  setAdminUser,
  getAdminUser,
  clearAdminTokens,
  validateAdminToken,
  getAdminFromToken,
  
  // User functions
  getUserToken,
  setUserToken,
  isUserTokenValid,
  setUserData,
  getUserData,
  updateUserData,
  clearUserSession,
  validateUserSession,
  refreshUserSession,
  getUserFromToken,
  validateUserToken,
  clearUserTokens,
  
  // Session management
  getCurrentSessionType,
  isAuthenticated,
  isAdmin,
  isUser,
  logoutAll,
  getAuthStatus,
  setAuthTimestamp,
  getAuthTimestamp,
  isSessionTooOld,
  getLastActiveTime,
  isSessionIdle,
  
  // Cookie utilities
  cookies,
};