"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image"; // Added for logo/favicon previews
import {
  Save,
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
  Globe,
  Layout,
  CreditCard,
  Share2,
  MessageSquare,
  Info,
  Phone,
  Settings,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  AlertCircle,
  X,
  Upload,
  RotateCcw,
  RefreshCw,
  // Removed Plus as a social icon placeholder, using standard SocialRow structure
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// Correct path to AdminNavbar
const AdminNavbar = dynamic(
  () => import("../dashboard/header/DashboardNavbar"),
  {
    ssr: false,
    loading: () => (
      <div className="h-14 bg-white border-b border-gray-200 animate-pulse" /> // Adjusted height for consistency
    ),
  }
);

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOAST HELPERS (Copied for consistency) ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: '#10B981',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: '#EF4444',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

const showLoadingToast = (message) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

const showWarning = (message) => toast.warning(message, {
  duration: 3000,
  position: "top-right",
  style: {
    background: '#FFC107', // Amber
    color: '#fff',
    fontWeight: '500',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#FFC107',
  },
});

const showInfo = (message) => toast.info(message, {
  duration: 3000,
  position: "top-right",
  style: {
    background: '#17A2B8', // Teal
    color: '#fff',
    fontWeight: '500',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#17A2B8',
  },
});

// ==================== CONSTANTS ====================
const SETTINGS_TABS = [
  { id: "general", label: "General Settings", icon: Globe, category: "general" },
  { id: "footer", label: "Footer", icon: Layout, category: "footer" },
  { id: "layout", label: "Layout", icon: Layout, category: "layout" },
  { id: "payment", label: "Payment Info", icon: CreditCard, category: "payment" },
  { id: "social", label: "Social", icon: Share2, category: "social" },
  { id: "addthis", label: "AddThis & Disqus", icon: MessageSquare, category: "addthis_disqus" },
  { id: "about", label: "About Us", icon: Info, category: "about" },
  { id: "contact", label: "Contact Us", icon: Phone, category: "contact" },
  { id: "other", label: "Other Settings", icon: Settings, category: "other" },
];

// ==================== STYLES (Adjusted for consistency) ====================
const labelCls = "text-sm font-medium text-gray-700";
const fieldCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors";
const selectCls = "px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors";
const textareaCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors";
const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"; // Adjusted from #2771B7
const btnSecondary = "inline-flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 transition-colors";
const btnDanger = "inline-flex items-center gap-2 px-4 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors";

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== API FUNCTIONS ====================

/**
 * Verify admin token
 */
const verifyTokenAPI = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, { // Corrected endpoint for consistency
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Token verification failed");
  }

  return response.json();
};

/**
 * Get all settings
 */
const fetchAllSettingsAPI = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch settings");
  }

  return response.json();
};

/**
 * Get settings by category
 */
const fetchSettingsByCategoryAPI = async (token, category) => { // Currently not used directly, as we fetch all and filter client-side
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/${category}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch ${category} settings`);
  }

  return response.json();
};

/**
 * Update all settings
 */
const updateAllSettingsAPI = async (token, settings) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update settings");
  }

  return response.json();
};

/**
 * Update settings by category (not used if updating all, but kept for potential future use)
 */
const updateCategorySettingsAPI = async (token, category, settings) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/${category}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to update ${category} settings`);
  }

  return response.json();
};

/**
 * Upload logo
 */
const uploadLogoAPI = async (token, file) => {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/upload/logo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload logo");
  }

  return response.json();
};

/**
 * Upload favicon
 */
const uploadFaviconAPI = async (token, file) => {
  const formData = new FormData();
  formData.append("favicon", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/upload/favicon`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload favicon");
  }

  return response.json();
};

/**
 * Upload title background image
 */
const uploadTitleBgAPI = async (token, file) => {
  const formData = new FormData();
  formData.append("title_bg", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/upload/title-bg`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload background image");
  }

  return response.json();
};

/**
 * Reset category settings to defaults
 */
const resetCategorySettingsAPI = async (token, category) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/reset/${category}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to reset ${category} settings`);
  }

  return response.json();
};

/**
 * Reset all settings to defaults
 */
const resetAllSettingsAPI = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/reset-all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to reset all settings");
  }

  return response.json();
};

/**
 * Toggle maintenance mode
 */
const toggleMaintenanceModeAPI = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/toggle-maintenance`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to toggle maintenance mode");
  }

  return response.json();
};

/**
 * Get settings history (not used in this refactor, but kept for context)
 */
const getSettingsHistoryAPI = async (token, limit = 50) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/history?limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch settings history");
  }

  return response.json();
};

const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Ensure we don't double-slash if API_BASE_URL already ends with /
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const assetPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${assetPath}`;
};


// ==================== MAIN COMPONENT ====================
export default function SettingsPage() { // Changed to export default function
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Settings State - Organized by category
  const [settings, setSettings] = useState({
    general: {},
    footer: {},
    layout: {},
    payment: {},
    social: {},
    addthis_disqus: {},
    about: {},
    contact: {},
    other: {},
  });
  const [originalSettings, setOriginalSettings] = useState({});

  // File States - holds File objects for new uploads
  const [files, setFiles] = useState({
    logo: null,
    favicon: null,
    titleBgImage: null,
  });

  // File Previews - holds URLs (blob: for new, original URL for existing)
  const [previews, setPreviews] = useState({
    logo: null,
    favicon: null,
    titleBg: null,
  });

  // ==================== AUTH VERIFICATION ====================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getAdminToken();
        const sessionType = getCurrentSessionType();

        if (!token || !isAdminTokenValid()) {
          showError("Session expired. Please login again.");
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        if (sessionType !== "admin") {
          showError("Please login as admin.");
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        try {
          const data = await verifyTokenAPI(token);

          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          } else {
            throw new Error("Invalid token response");
          }
        } catch (verifyError) {
          console.error("Token verification error:", verifyError);
          showError("Session expired. Please login again.");
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        logoutAll();
        fastNavigate("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // ==================== FETCH ALL SETTINGS ====================
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) {
      showError("Session expired. Please login again.");
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const loadToast = showLoadingToast("Loading settings...");

      const response = await fetchAllSettingsAPI(token);

      toast.dismiss(loadToast);

      if (response.success && response.settings) {
        setSettings(response.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(response.settings)));

        // Set image previews from existing settings
        const newPreviews = { logo: null, favicon: null, titleBg: null };
        if (response.settings.general?.logo) {
          newPreviews.logo = getAssetUrl(response.settings.general.logo);
        }
        if (response.settings.general?.favicon) {
          newPreviews.favicon = getAssetUrl(response.settings.general.favicon);
        }
        if (response.settings.layout?.title_bg_image) {
          newPreviews.titleBg = getAssetUrl(response.settings.layout.title_bg_image);
        }
        setPreviews(newPreviews);

        showSuccess("Settings loaded successfully");
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  // ==================== CHECK IF DIRTY ====================
  useEffect(() => {
    const currentSettingsStr = JSON.stringify(settings);
    const originalSettingsStr = JSON.stringify(originalSettings);
    const hasFileChanges = Object.values(files).some((f) => f !== null);

    setIsDirty(currentSettingsStr !== originalSettingsStr || hasFileChanges);
  }, [settings, originalSettings, files]);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();
      if (token) {
        // Assuming your /api/v1/users/logout endpoint correctly invalidates the token server-side
        await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }
    } catch (err) {
      console.error("Logout API call failed:", err);
      // Even if API call fails, proceed with local logout as the token might be expired/invalid
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll(); // Clear local storage
      showSuccess("Logged out successfully");
      fastNavigate("/admin/login");
      setLogoutLoading(false);
    }
  }, []);

  // ==================== SETTING CHANGE HANDLER ====================
  const handleSettingChange = useCallback((category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setSaved(false); // Reset saved status on any change
  }, []);

  // ==================== FILE CHANGE HANDLER ====================
  const handleFileChange = useCallback((field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      // If file input is cleared or no file selected
      setFiles((prev) => ({ ...prev, [field]: null }));
      const previewKey = field === "titleBgImage" ? "titleBg" : field;
      setPreviews((prev) => ({ ...prev, [previewKey]: null })); // Clear preview
      showInfo(`File cleared for ${field}.`);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("File size must be less than 5MB");
      e.target.value = ''; // Clear file input value
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Only image files are allowed");
      e.target.value = ''; // Clear file input value
      return;
    }

    setFiles((prev) => ({ ...prev, [field]: file }));

    // Create preview
    const previewKey = field === "titleBgImage" ? "titleBg" : field;
    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev) => {
      // Revoke previous blob URL if it exists to prevent memory leaks
      if (prev[previewKey] && prev[previewKey].startsWith("blob:")) {
        URL.revokeObjectURL(prev[previewKey]);
      }
      return { ...prev, [previewKey]: previewUrl };
    });

    showInfo(`File selected for ${field}. Remember to save changes.`);
  }, []);

  // ==================== SAVE SETTINGS ====================
  const handleSave = useCallback(async () => {
    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) {
      showError("Session expired. Please login again.");
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    setSaving(true);
    const saveToastId = showLoadingToast("Saving settings...");
    setError(null);
    let updatedSettings = { ...settings }; // Use a mutable copy for updates during file upload success

    try {
      // 1. Upload files first if any
      const uploadPromises = [];

      if (files.logo) {
        uploadPromises.push(
          uploadLogoAPI(token, files.logo)
            .then(logoResult => {
              if (logoResult.success) {
                updatedSettings = {
                  ...updatedSettings,
                  general: { ...updatedSettings.general, logo: logoResult.path },
                };
                showSuccess("Logo uploaded successfully");
              } else {
                showError(`Logo upload failed: ${logoResult.message}`);
                throw new Error("Logo upload failed"); // Propagate error to stop full save
              }
            })
            .catch(err => {
              showError(`Logo upload failed: ${err.message}`);
              throw err;
            })
        );
      }

      if (files.favicon) {
        uploadPromises.push(
          uploadFaviconAPI(token, files.favicon)
            .then(faviconResult => {
              if (faviconResult.success) {
                updatedSettings = {
                  ...updatedSettings,
                  general: { ...updatedSettings.general, favicon: faviconResult.path },
                };
                showSuccess("Favicon uploaded successfully");
              } else {
                showError(`Favicon upload failed: ${faviconResult.message}`);
                throw new Error("Favicon upload failed");
              }
            })
            .catch(err => {
              showError(`Favicon upload failed: ${err.message}`);
              throw err;
            })
        );
      }

      if (files.titleBgImage) {
        uploadPromises.push(
          uploadTitleBgAPI(token, files.titleBgImage)
            .then(bgResult => {
              if (bgResult.success) {
                updatedSettings = {
                  ...updatedSettings,
                  layout: { ...updatedSettings.layout, title_bg_image: bgResult.path },
                };
                showSuccess("Background image uploaded successfully");
              } else {
                showError(`Background image upload failed: ${bgResult.message}`);
                throw new Error("Background image upload failed");
              }
            })
            .catch(err => {
              showError(`Background image upload failed: ${err.message}`);
              throw err;
            })
        );
      }

      await Promise.all(uploadPromises); // Wait for all file uploads to complete

      // 2. Update all settings (including paths from successful uploads)
      const response = await updateAllSettingsAPI(token, updatedSettings);

      toast.dismiss(saveToastId);

      if (response.success) {
        setSaved(true);
        setIsDirty(false);
        // Update both settings and originalSettings with the *newly saved* settings (including new image paths)
        setSettings(updatedSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(updatedSettings)));

        // Clear file objects after successful upload and save
        setFiles({ logo: null, favicon: null, titleBgImage: null });
        showSuccess("All settings saved successfully!");
        setTimeout(() => setSaved(false), 3000); // Clear saved status after 3 seconds
      } else {
        throw new Error(response.message || "Failed to save settings");
      }
    } catch (err) {
      toast.dismiss(saveToastId);
      setError(err.message);
      showError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings, files]);

  // ==================== RESET HANDLERS ====================
  const handleResetCategory = useCallback(async (category) => {
    if (!window.confirm(`Are you sure you want to reset ${category} settings to defaults? This action cannot be undone for this section.`)) {
      return;
    }

    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) {
      showError("Session expired. Please login again.");
      return;
    }

    setResetting(true);
    const resetToastId = showLoadingToast(`Resetting ${category} settings...`);

    try {
      const response = await resetCategorySettingsAPI(token, category);

      toast.dismiss(resetToastId);
      if (response.success) {
        await fetchSettings(); // Re-fetch all settings to update UI (including image previews)
        showSuccess(`${category} settings reset to defaults`);
      } else {
        throw new Error(response.message || `Failed to reset ${category} settings`);
      }
    } catch (err) {
      toast.dismiss(resetToastId);
      showError(err.message);
    } finally {
      setResetting(false);
    }
  }, [fetchSettings]);

  const handleResetAll = useCallback(async () => {
    if (!window.confirm("Are you sure you want to reset ALL settings to defaults? This cannot be undone.")) {
      return;
    }

    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) {
      showError("Session expired. Please login again.");
      return;
    }

    setResetting(true);
    const resetToastId = showLoadingToast("Resetting all settings...");

    try {
      const response = await resetAllSettingsAPI(token);

      toast.dismiss(resetToastId);
      if (response.success) {
        await fetchSettings(); // Re-fetch all settings to update UI (including image previews)
        showSuccess("All settings reset to defaults");
      } else {
        throw new Error(response.message || "Failed to reset all settings");
      }
    } catch (err) {
      toast.dismiss(resetToastId);
      showError(err.message);
    } finally {
      setResetting(false);
    }
  }, [fetchSettings]);

  // ==================== DISCARD CHANGES ====================
  const handleDiscardChanges = useCallback(() => {
    if (!isDirty) return;

    if (!window.confirm("Are you sure you want to discard all unsaved changes?")) return;

    // Revert settings to original state
    setSettings(JSON.parse(JSON.stringify(originalSettings)));

    // Clear any pending file uploads
    setFiles({ logo: null, favicon: null, titleBgImage: null });

    // Revert previews to original images or null
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      // Revoke any blob URLs from discarded new files
      Object.values(prev).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });

      // Set previews back to original image URLs from originalSettings
      newPreviews.logo = originalSettings.general?.logo ? getAssetUrl(originalSettings.general.logo) : null;
      newPreviews.favicon = originalSettings.general?.favicon ? getAssetUrl(originalSettings.general.favicon) : null;
      newPreviews.titleBg = originalSettings.layout?.title_bg_image ? getAssetUrl(originalSettings.layout.title_bg_image) : null;
      return newPreviews;
    });

    setIsDirty(false);
    setSaved(false);
    showInfo("Changes discarded");
  }, [isDirty, originalSettings]);

  // ==================== TOGGLE MAINTENANCE MODE ====================
  const handleToggleMaintenance = useCallback(async () => {
    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) {
      showError("Session expired. Please login again.");
      return;
    }

    const toggleToastId = showLoadingToast("Toggling maintenance mode...");

    try {
      const response = await toggleMaintenanceModeAPI(token);

      toast.dismiss(toggleToastId);
      if (response.success) {
        setSettings((prev) => ({
          ...prev,
          other: {
            ...prev.other,
            maintenance_mode: response.maintenanceMode,
          },
        }));
        showSuccess(`Maintenance mode ${response.maintenanceMode ? "enabled" : "disabled"}`);
        // Update originalSettings as well since this change is immediate
        setOriginalSettings(prev => ({
          ...prev,
          other: { ...prev.other, maintenance_mode: response.maintenanceMode }
        }));
        setIsDirty(false); // Maintenance mode toggle is an instant save
      } else {
        throw new Error(response.message || "Failed to toggle maintenance mode");
      }
    } catch (err) {
      toast.dismiss(toggleToastId);
      showError(err.message);
    }
  }, []);

  // ==================== CLEANUP ====================
  useEffect(() => {
    // Clean up blob URLs when component unmounts or previews change
    return () => {
      Object.values(previews).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]); // Re-run cleanup if previews object changes

  // ==================== GET CURRENT CATEGORY ====================
  const getCurrentCategory = useCallback(() => {
    const tab = SETTINGS_TABS.find((t) => t.id === activeTab);
    return tab?.category || "general";
  }, [activeTab]);

  // ==================== RENDER TAB CONTENT ====================
  const renderTabContent = useCallback(() => {
    const category = getCurrentCategory();
    const categorySettings = settings[category] || {};

    const commonProps = {
      settings: categorySettings,
      onChange: (key, value) => handleSettingChange(category, key, value),
      onFileChange: handleFileChange,
      previews,
      onToggleMaintenance: handleToggleMaintenance, // Pass to OtherSettings
    };

    switch (activeTab) {
      case "general":
        return <GeneralSettings {...commonProps} />;
      case "footer":
        return <FooterSettings {...commonProps} />;
      case "layout":
        return <LayoutSettings {...commonProps} />;
      case "payment":
        return <PaymentSettings {...commonProps} />;
      case "social":
        return <SocialSettings {...commonProps} />;
      case "addthis":
        return <AddThisSettings {...commonProps} />;
      case "about":
        return <AboutSettings {...commonProps} />;
      case "contact":
        return <ContactSettings {...commonProps} />;
      case "other":
        return <OtherSettings {...commonProps} />;
      default:
        return null;
    }
  }, [activeTab, settings, handleSettingChange, handleFileChange, previews, getCurrentCategory, handleToggleMaintenance]);

  // ==================== LOADING SCREEN ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null; // Should redirect via fastNavigate already

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
            style: {
              background: '#10B981',
              fontWeight: '500',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
            style: {
              background: '#EF4444',
              fontWeight: '500',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: '#3B82F6',
              color: '#fff',
              fontWeight: '500',
            },
          },
        }}
      />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      {/* Main Content Area */}
      <div className="max-w-[1250px] mx-auto px-3 py-4"> {/* Adjusted padding */}
        <div className="bg-white border border-gray-300 rounded-t p-3">
          {/* Header and Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

              {/* Back/Forward Nav Buttons */}
              <button
                onClick={() => window.history.back()}
                className="w-9 h-9 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => window.history.forward()}
                className="w-9 h-9 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                title="Forward"
              >
                <ArrowRight className="w-4 h-4 text-gray-700" />
              </button>

              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1 rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-200"
              >
                Dashboard
              </Link>

              {isDirty && (
                <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {saved && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-1 rounded">
                  <Check className="h-4 w-4" />
                  Saved!
                </div>
              )}

              <button
                onClick={fetchSettings}
                disabled={loading}
                className={btnSecondary}
                title="Refresh settings"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <nav className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-1">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border rounded flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 border-t-0 px-4 py-3 flex items-start gap-2 rounded-b md:rounded-none">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <div className="flex-1 text-sm text-red-800">{error}</div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Main Settings Content Area */}
        <div className="bg-white border border-gray-300 border-t-0 rounded-b">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
            </div>
          ) : (
            <>
              <div className="p-6">
                {renderTabContent()}
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center gap-3 rounded-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {isDirty ? "You have unsaved changes." : "All changes saved."}
                  </span>
                  <button
                    onClick={() => handleResetCategory(getCurrentCategory())}
                    disabled={resetting}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset this tab
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={resetting || saving}
                    className={`${btnDanger} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Reset All
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    disabled={!isDirty || saving || resetting}
                    className={`${btnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <X className="h-4 w-4" />
                    Discard
                  </button>

                  <button
                    type="button" // Changed to type="button" to prevent implicit form submission
                    onClick={handleSave}
                    disabled={saving || !isDirty || resetting}
                    className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

const GeneralSettings = ({ settings, onChange, onFileChange, previews }) => (
  <div className="space-y-6">
    <SectionHeader title="General Information" />

    <FormRow label="Site Logo">
      <FileUpload
        preview={previews.logo}
        onFileChange={onFileChange("logo")}
        placeholder="Logo Preview"
        size="200x75px"
        previewSize="h-16 w-40"
      />
    </FormRow>

    <FormRow label="Favicon">
      <FileUpload
        preview={previews.favicon}
        onFileChange={onFileChange("favicon")}
        placeholder="F"
        size="16x16px"
        previewSize="h-10 w-10" // Adjusted for better visibility
      />
    </FormRow>

    <FormRow label="Site Name">
      <input
        type="text"
        value={settings.site_name || ""}
        onChange={(e) => onChange("site_name", e.target.value)}
        className={fieldCls}
        placeholder="Your website name"
      />
    </FormRow>

    <FormRow label="Site Email">
      <input
        type="email"
        value={settings.site_email || ""}
        onChange={(e) => onChange("site_email", e.target.value)}
        className={fieldCls}
        placeholder="contact@example.com"
      />
    </FormRow>

    <FormRow label="Currency Sign">
      <input
        type="text"
        value={settings.currency_sign || "AED"}
        onChange={(e) => onChange("currency_sign", e.target.value)}
        className={`w-32 ${fieldCls}`} // Fixed syntax
        placeholder="AED"
      />
    </FormRow>

    <FormRow label="Google Map Key">
      <input
        type="text"
        value={settings.google_map_key || ""}
        onChange={(e) => onChange("google_map_key", e.target.value)}
        className={fieldCls}
        placeholder="AIzaSy..."
      />
    </FormRow>

    <FormRow label="reCaptcha Site Key">
      <input
        type="text"
        value={settings.recaptcha_key || ""}
        onChange={(e) => onChange("recaptcha_key", e.target.value)}
        className={fieldCls}
        placeholder="6Le..."
      />
    </FormRow>

    <FormRow label="Site Description (Meta)">
      <textarea
        value={settings.site_description || ""}
        onChange={(e) => onChange("site_description", e.target.value)}
        rows={3}
        className={textareaCls}
        placeholder="Brief description of your website for SEO..."
      />
    </FormRow>

    <FormRow label="Site Keywords (Meta)">
      <input
        type="text"
        value={settings.site_keywords || ""}
        onChange={(e) => onChange("site_keywords", e.target.value)}
        className={fieldCls}
        placeholder="keyword1, keyword2, keyword3"
      />
    </FormRow>
  </div>
);

const FooterSettings = ({ settings, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="Footer Management" />

    <ToggleRow
      label="Sign Up Newsletter"
      enabled={settings.newsletter_enable ?? true}
      onToggle={(v) => onChange("newsletter_enable", v)}
    />

    <ToggleRow
      label="Address Section"
      enabled={settings.address_enable ?? true}
      onToggle={(v) => onChange("address_enable", v)}
    />

    <FormRow label="Address Text (HTML allowed)">
      <textarea
        value={settings.address_text || ""}
        onChange={(e) => onChange("address_text", e.target.value)}
        rows={2}
        className={`${textareaCls} font-mono`}
        placeholder="Your business address (e.g., &lt;p&gt;123 Main St&lt;/p&gt;)"
      />
    </FormRow>

    <ToggleRow
      label="Telephone Section"
      enabled={settings.telephone_enable ?? true}
      onToggle={(v) => onChange("telephone_enable", v)}
    />

    <FormRow label="Telephone Number">
      <input
        type="text"
        value={settings.telephone_text || ""}
        onChange={(e) => onChange("telephone_text", e.target.value)}
        className={fieldCls}
        placeholder="+971 50 123 4567"
      />
    </FormRow>

    <FormRow label="Footer Text (HTML allowed)">
      <textarea
        value={settings.footer_text || ""}
        onChange={(e) => onChange("footer_text", e.target.value)}
        rows={4}
        className={`${textareaCls} font-mono`}
        placeholder="Custom footer content (HTML allowed)..."
      />
    </FormRow>

    <FormRow label="Copyright Text">
      <input
        type="text"
        value={settings.copyright_text || ""}
        onChange={(e) => onChange("copyright_text", e.target.value)}
        className={fieldCls}
        placeholder="© 2024 Company Name. All rights reserved."
      />
    </FormRow>

    <SectionHeader title="Footer Widgets" className="mt-6" />

    {/* Widget Col 1 */}
    <div className="border border-gray-200 p-4 rounded space-y-3 bg-gray-50">
      <ToggleRow
        label="Enable Widget Col 1"
        enabled={settings.widget_col1_enable ?? true}
        onToggle={(v) => onChange("widget_col1_enable", v)}
      />
      {settings.widget_col1_enable !== false && (
        <>
          <FormRow label="Widget 1 Heading">
            <input
              type="text"
              value={settings.widget_col1_heading || ""}
              onChange={(e) => onChange("widget_col1_heading", e.target.value)}
              className={fieldCls}
              placeholder="Widget 1 Heading"
            />
          </FormRow>
          <FormRow label="Widget 1 Content (HTML)">
            <textarea
              value={settings.widget_col1_content || ""}
              onChange={(e) => onChange("widget_col1_content", e.target.value)}
              rows={3}
              className={`${textareaCls} font-mono`}
              placeholder="HTML content for widget 1 (e.g., &lt;ul&gt;...&lt;/ul&gt;)"
            />
          </FormRow>
        </>
      )}
    </div>

    {/* Widget Col 2 */}
    <div className="border border-gray-200 p-4 rounded space-y-3 bg-gray-50">
      <ToggleRow
        label="Enable Widget Col 2"
        enabled={settings.widget_col2_enable ?? true}
        onToggle={(v) => onChange("widget_col2_enable", v)}
      />
      {settings.widget_col2_enable !== false && (
        <>
          <FormRow label="Widget 2 Heading">
            <input
              type="text"
              value={settings.widget_col2_heading || ""}
              onChange={(e) => onChange("widget_col2_heading", e.target.value)}
              className={fieldCls}
              placeholder="Widget 2 Heading"
            />
          </FormRow>
          <FormRow label="Widget 2 Content (HTML)">
            <textarea
              value={settings.widget_col2_content || ""}
              onChange={(e) => onChange("widget_col2_content", e.target.value)}
              rows={3}
              className={`${textareaCls} font-mono`}
              placeholder="HTML content for widget 2"
            />
          </FormRow>
        </>
      )}
    </div>

    {/* Widget Col 3 */}
    <div className="border border-gray-200 p-4 rounded space-y-3 bg-gray-50">
      <ToggleRow
        label="Enable Widget Col 3"
        enabled={settings.widget_col3_enable ?? true}
        onToggle={(v) => onChange("widget_col3_enable", v)}
      />
      {settings.widget_col3_enable !== false && (
        <>
          <FormRow label="Widget 3 Heading">
            <input
              type="text"
              value={settings.widget_col3_heading || ""}
              onChange={(e) => onChange("widget_col3_heading", e.target.value)}
              className={fieldCls}
              placeholder="Widget 3 Heading"
            />
          </FormRow>
          <FormRow label="Widget 3 Content (HTML)">
            <textarea
              value={settings.widget_col3_content || ""}
              onChange={(e) => onChange("widget_col3_content", e.target.value)}
              rows={3}
              className={`${textareaCls} font-mono`}
              placeholder="HTML content for widget 3"
            />
          </FormRow>
        </>
      )}
    </div>

    {/* Widget Col 4 (Footer Bottom Links) */}
    <div className="border border-gray-200 p-4 rounded space-y-3 bg-gray-50">
      <ToggleRow
        label="Enable Widget Col 4"
        enabled={settings.widget_col4_enable ?? true}
        onToggle={(v) => onChange("widget_col4_enable", v)}
      />
      {settings.widget_col4_enable !== false && (
        <>
          <FormRow label="Widget 4 Heading">
            <input
              type="text"
              value={settings.widget_col4_heading || "Footer Bottom Links"}
              onChange={(e) => onChange("widget_col4_heading", e.target.value)}
              className={fieldCls}
              placeholder="Widget 4 Heading"
            />
          </FormRow>
          <FormRow label="Widget 4 Content (HTML)">
            <textarea
              value={settings.widget_col4_content || ""}
              onChange={(e) => onChange("widget_col4_content", e.target.value)}
              rows={3}
              className={`${textareaCls} font-mono`}
              placeholder="HTML content for widget 4"
            />
          </FormRow>
        </>
      )}
    </div>
  </div>
);

const LayoutSettings = ({ settings, onChange, onFileChange, previews }) => (
  <div className="space-y-6">
    <SectionHeader title="Website Layout & Defaults" />

    <FormRow label="Title Background Image">
      <FileUpload
        preview={previews.titleBg}
        onFileChange={onFileChange("titleBgImage")}
        placeholder="BG Image"
        size="1920x400px recommended"
        previewSize="h-24 w-40" // Adjusted size
      />
    </FormRow>

    <FormRow label="Default Map Latitude">
      <input
        type="text"
        value={settings.default_map_latitude || "25.2048"}
        onChange={(e) => onChange("default_map_latitude", e.target.value)}
        className={`w-48 ${fieldCls}`} // Fixed syntax
        placeholder="25.2048"
      />
    </FormRow>

    <FormRow label="Default Map Longitude">
      <input
        type="text"
        value={settings.default_map_longitude || "55.2708"}
        onChange={(e) => onChange("default_map_longitude", e.target.value)}
        className={`w-48 ${fieldCls}`} // Fixed syntax
        placeholder="55.2708"
      />
    </FormRow>

    <FormRow label="Home Page Style">
      <select
        value={settings.home_page || "default"}
        onChange={(e) => onChange("home_page", e.target.value)}
        className={`w-full ${selectCls}`}
      >
        <option value="default">Default Home</option>
        <option value="custom">Custom Page</option>
        {/* Add more options as per your system's custom pages */}
      </select>
    </FormRow>

    <FormRow label="Properties Page Style">
      <select
        value={settings.properties_page || "default"}
        onChange={(e) => onChange("properties_page", e.target.value)}
        className={`w-full ${selectCls}`}
      >
        <option value="default">Default Properties Listing</option>
        <option value="custom">Custom Properties Page</option>
      </select>
    </FormRow>

    <FormRow label="Featured Properties Page Style">
      <select
        value={settings.featured_properties_page || "default"}
        onChange={(e) => onChange("featured_properties_page", e.target.value)}
        className={`w-full ${selectCls}`}
      >
        <option value="default">Default Featured Listing</option>
        <option value="custom">Custom Featured Page</option>
      </select>
    </FormRow>

    <FormRow label="Sale Properties Page Style">
      <select
        value={settings.sale_properties_page || "default"}
        onChange={(e) => onChange("sale_properties_page", e.target.value)}
        className={`w-full ${selectCls}`}
      >
        <option value="default">Default Sale Listing</option>
        <option value="custom">Custom Sale Page</option>
      </select>
    </FormRow>

    <FormRow label="Rent Properties Page Style">
      <select
        value={settings.rent_properties_page || "default"}
        onChange={(e) => onChange("rent_properties_page", e.target.value)}
        className={`w-full ${selectCls}`}
      >
        <option value="default">Default Rent Listing</option>
        <option value="custom">Custom Rent Page</option>
      </select>
    </FormRow>

    <FormRow label="Pagination Limit (per page)">
      <input
        type="number"
        value={settings.pagination_limit || 10}
        onChange={(e) => onChange("pagination_limit", parseInt(e.target.value) || 10)}
        min="5"
        max="100"
        className={`w-32 ${fieldCls}`} // Fixed syntax
      />
      <p className="text-xs text-gray-500 mt-1">Number of items to display per page (min 5, max 100)</p>
    </FormRow>
  </div>
);

const PaymentSettings = ({ settings, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="Payment Information" />

    <FormRow label="Featured Property Price">
      <div className="flex items-center gap-2">
        <input
          type="number" // Changed to number type for price
          value={settings.featured_property_price || "0"}
          onChange={(e) => onChange("featured_property_price", e.target.value)}
          className={`w-32 ${fieldCls}`} // Fixed syntax
          placeholder="0"
        />
        <span className="text-sm text-gray-500">AED</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Price for making a property featured</p>
    </FormRow>

    <FormRow label="Stripe Currency">
      <select
        value={settings.stripe_currency || "AED"}
        onChange={(e) => onChange("stripe_currency", e.target.value)}
        className={`w-32 ${selectCls}`} // Fixed syntax
      >
        <option value="AED">AED - UAE Dirham</option>
        <option value="USD">USD - US Dollar</option>
        <option value="EUR">EUR - Euro</option>
        <option value="GBP">GBP - British Pound</option>
        <option value="INR">INR - Indian Rupee</option>
        {/* Add more currencies as needed */}
      </select>
      <p className="text-xs text-gray-500 mt-1">Currency used for Stripe payments</p>
    </FormRow>

    <FormRow label="Stripe Publishable Key">
      <input
        type="text"
        value={settings.stripe_key || ""}
        onChange={(e) => onChange("stripe_key", e.target.value)}
        className={fieldCls}
        placeholder="pk_live_..."
      />
      <p className="text-xs text-gray-500 mt-1">Your Stripe publishable key</p>
    </FormRow>

    <FormRow label="Stripe Secret Key">
      <input
        type="password" // Use password type for secret key
        value={settings.stripe_secret || ""}
        onChange={(e) => onChange("stripe_secret", e.target.value)}
        className={fieldCls}
        placeholder="sk_live_..."
      />
      <p className="text-xs text-gray-500 mt-1 text-red-600">
        Warning: This is a sensitive key. Updates usually require server-side configuration.
      </p>
    </FormRow>

    <FormRow label="PayPal Business Email">
      <input
        type="email"
        value={settings.paypal_email || ""}
        onChange={(e) => onChange("paypal_email", e.target.value)}
        className={fieldCls}
        placeholder="paypal@example.com"
      />
      <p className="text-xs text-gray-500 mt-1">Your PayPal business account email</p>
    </FormRow>

    <FormRow label="Bank Payment Details">
      <textarea
        value={settings.bank_payment_details || ""}
        onChange={(e) => onChange("bank_payment_details", e.target.value)}
        rows={4}
        className={`${textareaCls} font-mono`}
        placeholder="Provide bank account details for manual transfers (e.g., Bank Name, Account No., IBAN)..."
      />
      <p className="text-xs text-gray-500 mt-1">Details displayed to users for bank transfers</p>
    </FormRow>
  </div>
);

const SocialSettings = ({ settings, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="Social Media Links" />

    <SocialRow
      icon={Facebook}
      color="text-blue-600"
      label="Facebook Profile URL"
      value={settings.facebook_url || ""}
      onChange={(v) => onChange("facebook_url", v)}
      placeholder="https://facebook.com/yourpage"
    />
    <SocialRow
      icon={Twitter}
      color="text-blue-400"
      label="Twitter Profile URL"
      value={settings.twitter_url || ""}
      onChange={(v) => onChange("twitter_url", v)}
      placeholder="https://twitter.com/yourhandle"
    />
    <SocialRow
      icon={Linkedin}
      color="text-blue-700"
      label="LinkedIn Profile URL"
      value={settings.linkedin_url || ""}
      onChange={(v) => onChange("linkedin_url", v)}
      placeholder="https://linkedin.com/in/yourprofile"
    />
    <SocialRow
      icon={Instagram}
      color="text-pink-600"
      label="Instagram Profile URL"
      value={settings.instagram_url || ""}
      onChange={(v) => onChange("instagram_url", v)}
      placeholder="https://instagram.com/yourprofile"
    />
    <SocialRow
      icon={Youtube}
      color="text-red-600"
      label="YouTube Channel URL"
      value={settings.youtube_url || ""}
      onChange={(v) => onChange("youtube_url", v)}
      placeholder="https://youtube.com/yourchannel"
    />
    {/* GPlus is deprecated, but keeping the field if your backend still expects it */}
    <SocialRow
      icon={Globe} // Using Globe as a generic icon for deprecated/less common platforms
      color="text-gray-500"
      label="Google+ / Other URL"
      value={settings.gplus_url || ""}
      onChange={(v) => onChange("gplus_url", v)}
      placeholder="https://plus.google.com/..."
    />
  </div>
);

const AddThisSettings = ({ settings, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="AddThis & Disqus Integration" />

    <FormRow label="AddThis Share Buttons Code">
      <textarea
        value={settings.addthis_code || ""}
        onChange={(e) => onChange("addthis_code", e.target.value)}
        rows={6}
        className={`${textareaCls} font-mono`}
        placeholder="Paste AddThis HTML/JS code here for social sharing buttons..."
      />
      <p className="text-xs text-gray-500 mt-1">
        Get the embed code for social sharing buttons from{" "}
        <a href="https://www.addthis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          AddThis.com
        </a>.
      </p>
    </FormRow>

    <FormRow label="Disqus Comments Code">
      <textarea
        value={settings.disqus_code || ""}
        onChange={(e) => onChange("disqus_code", e.target.value)}
        rows={6}
        className={`${textareaCls} font-mono`}
        placeholder="Paste Disqus universal embed code here for comments..."
      />
      <p className="text-xs text-gray-500 mt-1">
        Integrate a comment section by getting the embed code from{" "}
        <a href="https://disqus.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          Disqus.com
        </a>.
      </p>
    </FormRow>
  </div>
);

const AboutSettings = ({ settings, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="About Us Page Content" />

    <FormRow label="About Page Title">
      <input
        type="text"
        value={settings.about_title || "About Us"}
        onChange={(e) => onChange("about_title", e.target.value)}
        className={fieldCls}
        placeholder="Title for your About Us page"
      />
    </FormRow>

    <FormRow label="About Us Description (HTML allowed)">
      <textarea
        value={settings.about_description || ""}
        onChange={(e) => onChange("about_description", e.target.value)}
        rows={12}
        className={`${textareaCls} font-mono`}
        placeholder="Full content for your About Us page. HTML formatting is supported."
      />
    </FormRow>
  </div>
);

const ContactSettings = ({ settings, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="Contact Us Page Details" />

    <FormRow label="Contact Page Title">
      <input
        type="text"
        value={settings.contact_title || "Contact Us"}
        onChange={(e) => onChange("contact_title", e.target.value)}
        className={fieldCls}
        placeholder="Title for your Contact Us page"
      />
    </FormRow>

    <FormRow label="Map Latitude">
      <input
        type="text"
        value={settings.contact_map_latitude || ""}
        onChange={(e) => onChange("contact_map_latitude", e.target.value)}
        className={`w-48 ${fieldCls}`} // Fixed syntax
        placeholder="25.2048"
      />
      <p className="text-xs text-gray-500 mt-1">Latitude for the map displayed on contact page</p>
    </FormRow>

    <FormRow label="Map Longitude">
      <input
        type="text"
        value={settings.contact_map_longitude || ""}
        onChange={(e) => onChange("contact_map_longitude", e.target.value)}
        className={`w-48 ${fieldCls}`} // Fixed syntax
        placeholder="55.2708"
      />
      <p className="text-xs text-gray-500 mt-1">Longitude for the map displayed on contact page</p>
    </FormRow>

    <FormRow label="Contact Email Address">
      <input
        type="email"
        value={settings.contact_email || ""}
        onChange={(e) => onChange("contact_email", e.target.value)}
        className={fieldCls}
        placeholder="contact@example.com"
      />
      <p className="text-xs text-gray-500 mt-1">Main email address for inquiries</p>
    </FormRow>

    <FormRow label="Contact Phone Number">
      <input
        type="text"
        value={settings.contact_phone || ""}
        onChange={(e) => onChange("contact_phone", e.target.value)}
        className={fieldCls}
        placeholder="+971 50 123 4567"
      />
      <p className="text-xs text-gray-500 mt-1">Main phone number for contact</p>
    </FormRow>

    <FormRow label="Contact Address (HTML allowed)">
      <textarea
        value={settings.contact_address || ""}
        onChange={(e) => onChange("contact_address", e.target.value)}
        rows={3}
        className={`${textareaCls} font-mono`}
        placeholder="Your physical address (e.g., &lt;p&gt;Office 1, Building A&lt;/p&gt;)"
      />
      <p className="text-xs text-gray-500 mt-1">Physical address displayed on the contact page</p>
    </FormRow>
  </div>
);

const OtherSettings = ({ settings, onChange, onToggleMaintenance }) => (
  <div className="space-y-6">
    <SectionHeader title="Miscellaneous System Settings" />

    <FormRow label="Maintenance Mode">
      <div className="flex items-center gap-4">
        <ToggleSwitch
          enabled={settings.maintenance_mode ?? false}
          onToggle={onToggleMaintenance} // This directly triggers the API call
        />
        <span className={`text-sm font-medium ${settings.maintenance_mode ? "text-red-600" : "text-gray-500"}`}>
          {settings.maintenance_mode ? "Site is currently offline" : "Site is live and accessible"}
        </span>
      </div>
      <p className="col-span-3 col-start-2 text-xs text-gray-500 mt-1">
        Toggling this will immediately make your website inaccessible to the public.
      </p>
    </FormRow>

    <ToggleRow
      label="User Registration"
      enabled={settings.user_registration ?? true}
      onToggle={(v) => onChange("user_registration", v)}
    />
    <p className="col-span-3 col-start-2 text-xs text-gray-500 mt-1">
        Allow new users to register an account on your website.
    </p>

    <ToggleRow
      label="Email Verification"
      enabled={settings.email_verification ?? true}
      onToggle={(v) => onChange("email_verification", v)}
    />
    <p className="col-span-3 col-start-2 text-xs text-gray-500 mt-1">
        Require users to verify their email address after registration.
    </p>

    <FormRow label="Custom Header Code">
      <textarea
        value={settings.header_code || ""}
        onChange={(e) => onChange("header_code", e.target.value)}
        rows={5}
        className={`${textareaCls} font-mono`}
        placeholder="Paste custom HTML/JS code for <head> section (e.g., analytics, meta tags)..."
      />
      <p className="text-xs text-gray-500 mt-1">
        This code will be injected directly into the `&lt;head&gt;` section of every page.
      </p>
    </FormRow>

    <FormRow label="Custom Footer Code">
      <textarea
        value={settings.footer_code || ""}
        onChange={(e) => onChange("footer_code", e.target.value)}
        rows={5}
        className={`${textareaCls} font-mono`}
        placeholder="Paste custom HTML/JS code before closing &lt;/body&gt; tag (e.g., analytics, scripts)..."
      />
      <p className="text-xs text-gray-500 mt-1">
        This code will be injected directly before the `&lt;/body&gt;` closing tag on every page.
      </p>
    </FormRow>

    <FormRow label="Default Items Per Page">
      <input
        type="number"
        value={settings.items_per_page || 10}
        onChange={(e) => onChange("items_per_page", parseInt(e.target.value) || 10)}
        min="5"
        max="100"
        className={`w-32 ${fieldCls}`} // Fixed syntax
      />
      <p className="text-xs text-gray-500 mt-1">Default number of items shown on listings/tables.</p>
    </FormRow>
  </div>
);

// ==================== HELPER COMPONENTS ====================

const SectionHeader = ({ title, className = "" }) => (
  <h2 className={`text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4 ${className}`}>
    {title}
  </h2>
);

const FormRow = ({ label, children }) => (
  <div className="grid grid-cols-4 gap-4 items-start">
    <label className={`${labelCls} pt-2`}>{label}</label>
    <div className="col-span-3">{children}</div>
  </div>
);

// Adjusted ToggleRow to use radio buttons for clear enable/disable semantics
const ToggleRow = ({ label, enabled, onToggle }) => (
  <div className="grid grid-cols-4 gap-4 items-center">
    <label className={labelCls}>{label}</label>
    <div className="col-span-3 flex items-center gap-4">
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="radio"
          checked={enabled}
          onChange={() => onToggle(true)}
          className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <span className="ml-2 text-sm text-gray-700">Enable</span>
      </label>
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="radio"
          checked={!enabled}
          onChange={() => onToggle(false)}
          className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <span className="ml-2 text-sm text-gray-700">Disable</span>
      </label>
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      enabled ? "bg-red-600" : "bg-gray-200"
    }`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);


const FileUpload = ({ preview, onFileChange, placeholder, size, previewSize }) => (
  <div className="flex items-center gap-4">
    <div className={`${previewSize} relative border border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0`}>
      {preview ? (
        <Image src={preview} alt="Preview" fill className="object-contain" sizes="100px" />
      ) : (
        <span className="text-gray-400 text-sm">{placeholder}</span>
      )}
    </div>
    <div className="flex-grow">
      <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 cursor-pointer">
        <Upload className="w-4 h-4" />
        Choose File
        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </label>
      <p className="text-xs text-gray-500 mt-1">Recommended size: {size}</p>
    </div>
  </div>
);

const SocialRow = ({ icon: Icon, color, label, value, onChange, placeholder }) => (
  <FormRow label={label}>
    <div className="flex items-center gap-2">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${color} bg-gray-100 flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldCls} flex-grow`}
        placeholder={placeholder}
      />
    </div>
  </FormRow>
);


const WidgetRow = ({ label, enabled, heading, content, onToggle, onHeadingChange, onContentChange }) => (
  <div className="border border-gray-200 p-4 rounded space-y-3 bg-gray-50">
    <ToggleRow
      label={`Enable ${label}`}
      enabled={enabled}
      onToggle={onToggle}
    />
    {enabled !== false && ( // Only show heading/content fields if widget is enabled
      <>
        <FormRow label={`${label} Heading`}>
          <input
            type="text"
            value={heading}
            onChange={(e) => onHeadingChange(e.target.value)}
            className={fieldCls}
            placeholder={`${label} Heading`}
          />
        </FormRow>
        <FormRow label={`${label} Content (HTML)`}>
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={3}
            className={`${textareaCls} font-mono`}
            placeholder={`HTML content for ${label}`}
          />
        </FormRow>
      </>
    )}
  </div>
);