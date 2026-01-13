"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Camera,
  Save,
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Edit3,
  MapPin,
  Building,
  Globe,
  Clock,
  Activity,
  Key,
  Upload,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast"; // Import Toaster
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== DYNAMIC IMPORT ====================
const AdminNavbar = dynamic(
  () => import("../dashboard/header/DashboardNavbar"),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />
    ),
  }
);

// ==================== CONSTANTS ====================
const TABS = [
  { id: "profile", label: "Profile Information", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "activity", label: "Activity Log", icon: Activity },
];

const INITIAL_PROFILE_STATE = {
  full_name: "",
  name: "",
  email: "",
  phone: "",
  mobile_phone: "",
  image_icon: null,
  usertype: "",
  salutation: "",
  nationality: "",
  country: "",
  city: "",
  about: "",
  created_at: "",
  last_login: "",
  status: 1,
};

const INITIAL_PASSWORD_STATE = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// ==================== STYLES (Adjusted for consistency) ====================
const labelCls = "text-sm font-medium text-gray-700";
const fieldCls = "w-full h-9 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed";
const textareaCls = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none";
const btnPrimary = "h-9 px-4 rounded bg-[#2771B7] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-colors";
const btnSecondary = "h-9 px-4 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors";
const btnDanger = "h-9 px-4 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors";

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== API HELPER ====================
const createApiRequest = () => async (endpoint, options = {}) => {
  const token = getAdminToken();

  if (!token || !isAdminTokenValid()) {
    logoutAll();
    fastNavigate("/admin/login");
    throw new Error("Session expired. Please login again.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      logoutAll();
      fastNavigate("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }
    throw error;
  }
};

// ==================== UTILITY FUNCTIONS ====================
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getInitials = (name) => {
  if (!name) return "A";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ==================== TOAST HELPER FUNCTIONS ====================
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

// ==================== MAIN COMPONENT ====================
export default function AdminProfilePage() {
  const apiRequest = useMemo(() => createApiRequest(), []);
  const fileInputRef = useRef(null);

  // ==================== AUTH STATE ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==================== UI STATE ====================
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ==================== PROFILE STATE ====================
  const [profile, setProfile] = useState(INITIAL_PROFILE_STATE);
  const [originalProfile, setOriginalProfile] = useState(INITIAL_PROFILE_STATE);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // ==================== PASSWORD STATE ====================
  const [passwords, setPasswords] = useState(INITIAL_PASSWORD_STATE);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // ==================== ACTIVITY STATE ====================
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // ==================== AUTH VERIFICATION ====================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getAdminToken();
        const sessionType = getCurrentSessionType();

        if (!token || !isAdminTokenValid()) {
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        if (sessionType !== "admin") {
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Token verification failed");
          }

          const data = await response.json();

          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          } else {
            throw new Error("Invalid token response");
          }
        } catch (verifyError) {
          console.error("Token verification error:", verifyError);
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

  // ==================== FETCH PROFILE ====================
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest("/api/v1/users/profile");

      if (response.success && response.user) {
        const profileData = response.user;
        setProfile(profileData);
        setOriginalProfile(profileData);

        if (profileData.image_icon) {
          const imageUrl = profileData.image_icon.startsWith('http')
            ? profileData.image_icon
            : `${API_BASE_URL}/${profileData.image_icon}`;
          setAvatarPreview(imageUrl);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err.message);
      showError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, apiRequest]);

  // ==================== FETCH ACTIVITIES ====================
  const fetchActivities = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setActivitiesLoading(true);
      // Replace with actual API call when available
      const mockActivities = [
        {
          id: 1,
          type: "login",
          description: "Logged in from new device",
          created_at: new Date().toISOString(),
          ip_address: "192.168.1.1"
        },
        {
          id: 2,
          type: "update",
          description: "Updated profile information",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          ip_address: "192.168.1.1"
        },
        {
          id: 3,
          type: "delete",
          description: "Deleted agent account John Doe",
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          ip_address: "192.168.1.2"
        },
      ];
      setActivities(mockActivities);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      showError("Failed to load activities");
    } finally {
      setActivitiesLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "activity") {
      fetchActivities();
    }
  }, [isAuthenticated, activeTab, fetchActivities]);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();
      if (token) {
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
      showError("Logout failed. Please try again.");
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll();
      showSuccess("Logged out successfully");
      fastNavigate("/admin/login");
      setLogoutLoading(false);
    }
  }, []);

  // ==================== PROFILE HANDLERS ====================
  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAvatarClick = useCallback(() => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  }, [isEditing]);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("Only image files are allowed");
      return;
    }

    setAvatarFile(file);

    const previewUrl = URL.createObjectURL(file);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(previewUrl);
  }, [avatarPreview]);

  const handleRemoveAvatar = useCallback(() => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setProfile((prev) => ({ ...prev, image_icon: null }));
  }, [avatarPreview]);

  const handleSaveProfile = useCallback(async () => {
    if (!isAdminTokenValid()) {
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    setSaving(true);
    const saveToastId = showLoadingToast("Saving profile...");
    try {
      setError(null);

      const fd = new FormData();

      const allowedFields = [
        'full_name', 'name', 'phone', 'mobile_phone',
        'salutation', 'nationality', 'country', 'city', 'about'
      ];

      allowedFields.forEach(key => {
        if (profile[key] !== null && profile[key] !== undefined) {
          fd.append(key, profile[key].toString());
        }
      });

      if (avatarFile) {
        fd.append("image", avatarFile);
      } else if (profile.image_icon === null && originalProfile.image_icon !== null) {
        // If image was removed
        fd.append("image_icon_removed", "true");
      }

      const response = await apiRequest("/api/v1/users/profile", {
        method: "PUT",
        body: fd,
      });

      toast.dismiss(saveToastId);

      if (response.success) {
        setSaved(true);
        setIsEditing(false);
        
        const updatedProfile = response.user;
        setProfile(updatedProfile);
        setOriginalProfile(updatedProfile);
        setAvatarFile(null);

        if (updatedProfile.image_icon) {
          const imageUrl = updatedProfile.image_icon.startsWith('http')
            ? updatedProfile.image_icon
            : `${API_BASE_URL}/${updatedProfile.image_icon}`;
          setAvatarPreview(imageUrl);
        } else {
          setAvatarPreview(null);
        }

        showSuccess("Profile updated successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message);
      showError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [profile, originalProfile, avatarFile, apiRequest, avatarPreview]);

  const handleCancelEdit = useCallback(() => {
    setProfile({ ...originalProfile });
    setIsEditing(false);

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    
    if (originalProfile.image_icon) {
      const imageUrl = originalProfile.image_icon.startsWith('http')
        ? originalProfile.image_icon
        : `${API_BASE_URL}/${originalProfile.image_icon}`;
      setAvatarPreview(imageUrl);
    } else {
      setAvatarPreview(null);
    }
    
    setAvatarFile(null);
  }, [originalProfile, avatarPreview]);

  // ==================== PASSWORD HANDLERS ====================
  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));

    if (passwordErrors[name]) {
      setPasswordErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [passwordErrors]);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const validatePasswords = useCallback(() => {
    const errors = {};

    if (!passwords.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwords.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwords.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwords.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }, [passwords]);

  const handleChangePassword = useCallback(async () => {
    if (!validatePasswords()) return;

    if (!isAdminTokenValid()) {
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    setPasswordLoading(true);
    const passwordToastId = showLoadingToast("Updating password...");

    try {
      const response = await apiRequest("/api/v1/users/update-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      toast.dismiss(passwordToastId);

      if (response.success) {
        setPasswords(INITIAL_PASSWORD_STATE);
        showSuccess("Password changed successfully!");
      } else {
        throw new Error(response.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      toast.dismiss(passwordToastId);
      if (err.message.toLowerCase().includes("current password")) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
      } else {
        showError(err.message || "Failed to change password");
      }
    } finally {
      setPasswordLoading(false);
    }
  }, [passwords, validatePasswords, apiRequest]);

  // ==================== CLEANUP ====================
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // ==================== COMPUTED VALUES ====================
  const hasProfileChanges = useMemo(() => {
    return (
      JSON.stringify(profile) !== JSON.stringify(originalProfile) ||
      avatarFile !== null
    );
  }, [profile, originalProfile, avatarFile]);

  // ==================== LOADING SCREEN ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster /> {/* Ensure Toaster is rendered for initial loading */}
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

  if (!isAuthenticated || !admin) return null;

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-100"> {/* Consistent background */}
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

      <div className="max-w-[1280px] mx-auto px-4 pt-4 pb-10"> {/* Adjusted top padding */}
        {/* Success Message */}
        {saved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1> {/* Larger header */}

            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleCancelEdit} className={btnSecondary} disabled={saving}>
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !hasProfileChanges}
                    className={btnPrimary}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className={btnPrimary}>
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-1 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border rounded flex items-center gap-2 transition-colors ${ // Adjusted for AgentsPage tab style
                activeTab === tab.id
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SIDEBAR - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {/* Avatar */}
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  <div
                    onClick={handleAvatarClick}
                    className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-2xl font-semibold text-white overflow-hidden ${
                      isEditing ? "cursor-pointer hover:opacity-80" : ""
                    }`}
                    style={{ backgroundColor: "rgb(39,113,183)" }} // Blue color from AgentsPage
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(profile.full_name || profile.name || admin?.full_name || admin?.name)
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
                    >
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {isEditing && avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    Remove Photo
                  </button>
                )}

                <h3 className="mt-3 text-lg font-semibold text-gray-800">
                  {profile.full_name || profile.name || admin?.full_name || admin?.name || "Admin"}
                </h3>
                <p className="text-sm text-gray-500">
                  {profile.usertype || admin?.usertype || "Administrator"}
                </p>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">
                    {profile.email || admin?.email || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    {profile.phone || profile.mobile_phone || "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    {profile.city && profile.country
                      ? `${profile.city}, ${profile.country}`
                      : "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">
                    Joined {formatDate(profile.created_at)?.split(",")[0] || "N/A"}
                  </span>
                </div>
              </div>

              {/* Last Login */}
              {profile.last_login && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last login: {formatDate(profile.last_login)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Loading profile...</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* PROFILE TAB */}
                  {activeTab === "profile" && (
                    <ProfileTab
                      profile={profile}
                      isEditing={isEditing}
                      onChange={handleProfileChange}
                    />
                  )}

                  {/* SECURITY TAB */}
                  {activeTab === "security" && (
                    <SecurityTab
                      passwords={passwords}
                      showPasswords={showPasswords}
                      passwordErrors={passwordErrors}
                      passwordLoading={passwordLoading}
                      profile={profile}
                      onChange={handlePasswordChange}
                      onToggleVisibility={togglePasswordVisibility}
                      onChangePassword={handleChangePassword}
                    />
                  )}

                  {/* ACTIVITY TAB */}
                  {activeTab === "activity" && (
                    <ActivityTab
                      activities={activities}
                      loading={activitiesLoading}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

const ProfileTab = ({ profile, isEditing, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="Personal Information" />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormRow label="Full Name">
        <input
          type="text"
          name="full_name"
          value={profile.full_name || profile.name || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
          placeholder="Enter your full name"
        />
      </FormRow>

      <FormRow label="Email Address">
        <input
          type="email"
          name="email"
          value={profile.email || ""}
          onChange={onChange}
          disabled={true} // Email should generally not be editable via profile settings
          className={fieldCls}
          placeholder="Email address"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </FormRow>

      <FormRow label="Phone Number">
        <input
          type="tel"
          name="phone"
          value={profile.phone || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
          placeholder="+971 50 123 4567"
        />
      </FormRow>

      <FormRow label="Mobile Phone">
        <input
          type="tel"
          name="mobile_phone"
          value={profile.mobile_phone || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
          placeholder="+971 50 987 6543"
        />
      </FormRow>

      <FormRow label="Salutation">
        <select
          name="salutation"
          value={profile.salutation || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
        >
          <option value="">Select</option>
          <option value="Mr">Mr</option>
          <option value="Mrs">Mrs</option>
          <option value="Ms">Ms</option>
          <option value="Dr">Dr</option>
        </select>
      </FormRow>

      <FormRow label="Nationality">
        <input
          type="text"
          name="nationality"
          value={profile.nationality || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
          placeholder="e.g., Indian, American"
        />
      </FormRow>
    </div>

    <SectionHeader title="Location" className="mt-8" />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormRow label="City">
        <input
          type="text"
          name="city"
          value={profile.city || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
          placeholder="Dubai"
        />
      </FormRow>

      <FormRow label="Country">
        <input
          type="text"
          name="country"
          value={profile.country || ""}
          onChange={onChange}
          disabled={!isEditing}
          className={fieldCls}
          placeholder="United Arab Emirates"
        />
      </FormRow>
    </div>

    <SectionHeader title="About" className="mt-8" />

    <FormRow label="Bio" fullWidth>
      <textarea
        name="about"
        value={profile.about || ""}
        onChange={onChange}
        disabled={!isEditing}
        rows={4}
        className={textareaCls}
        placeholder="Write a short bio about yourself..."
      />
    </FormRow>
  </div>
);

const SecurityTab = ({
  passwords,
  showPasswords,
  passwordErrors,
  passwordLoading,
  profile,
  onChange,
  onToggleVisibility,
  onChangePassword,
}) => (
  <div className="space-y-6">
    <SectionHeader title="Change Password" />

    <div className="max-w-md space-y-4">
      <FormRow label="Current Password" fullWidth>
        <div className="relative">
          <input
            type={showPasswords.current ? "text" : "password"}
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={onChange}
            className={`${fieldCls} pr-10 ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => onToggleVisibility("current")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordErrors.currentPassword && (
          <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
        )}
      </FormRow>

      <FormRow label="New Password" fullWidth>
        <div className="relative">
          <input
            type={showPasswords.new ? "text" : "password"}
            name="newPassword"
            value={passwords.newPassword}
            onChange={onChange}
            className={`${fieldCls} pr-10 ${passwordErrors.newPassword ? "border-red-500" : ""}`}
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => onToggleVisibility("new")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordErrors.newPassword && (
          <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Min 6 characters
        </p>
      </FormRow>

      <FormRow label="Confirm Password" fullWidth>
        <div className="relative">
          <input
            type={showPasswords.confirm ? "text" : "password"}
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={onChange}
            className={`${fieldCls} pr-10 ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => onToggleVisibility("confirm")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordErrors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
        )}
      </FormRow>

      <button
        onClick={onChangePassword}
        disabled={passwordLoading}
        className={`${btnPrimary} mt-4`}
      >
        {passwordLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Update Password
          </>
        )}
      </button>
    </div>

    <SectionHeader title="Account Security" className="mt-10" />

    <div className="space-y-3">
      <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              Account Status
            </p>
            <p className="text-xs text-gray-500">
              Your account is {profile.status === 1 ? "active" : "inactive"}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full ${ // Consistent pill styling
          profile.status === 1
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          {profile.status === 1 ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  </div>
);

const ActivityTab = ({ activities, loading }) => (
  <div className="space-y-6">
    <SectionHeader title="Recent Activity" />

    {loading ? (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-2">Loading activities...</p>
      </div>
    ) : activities.length === 0 ? (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 mx-auto text-gray-300" />
        <p className="text-sm text-gray-500 mt-2">No recent activity</p>
      </div>
    ) : (
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id || index}
            className="p-4 border border-gray-200 rounded-lg flex items-start gap-3"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                activity.type === "login"
                  ? "bg-green-100"
                  : activity.type === "update"
                  ? "bg-blue-100"
                  : activity.type === "delete"
                  ? "bg-red-100"
                  : "bg-gray-100"
              }`}
            >
              {activity.type === "login" ? (
                <User className="w-4 h-4 text-green-600" />
              ) : activity.type === "update" ? (
                <Edit3 className="w-4 h-4 text-blue-600" />
              ) : activity.type === "delete" ? (
                <Trash2 className="w-4 h-4 text-red-600" />
              ) : (
                <Activity className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatDate(activity.created_at)}
                </span>
                {activity.ip_address && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {activity.ip_address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ==================== HELPER COMPONENTS ====================

const SectionHeader = ({ title, className = "" }) => (
  <h2 className={`text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4 ${className}`}> {/* Adjusted heading size and border */}
    {title}
  </h2>
);

const FormRow = ({ label, children, fullWidth = false }) => (
  <div className={fullWidth ? "" : ""}>
    <label className={`${labelCls} block mb-1.5`}>{label}</label>
    {children}
  </div>
);