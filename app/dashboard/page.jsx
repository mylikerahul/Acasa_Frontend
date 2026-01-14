"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  LogOut,
  Edit3,
  Save,
  X,
  Settings,
  Loader2,
  Building2,
  Calendar,
  Shield,
  Eye,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  ChevronDown,
  Search,
  Plus,
  BarChart3,
  Clock,
  Home,
  Bell,
  HelpCircle,
} from "lucide-react";

import {
  validateUserSession,
  setUserData,
  getUserData,
  clearUserSession,
  updateUserData,
  refreshUserSession,
  getUserToken,
} from "../../utils/auth";

// ==================== Constants ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "profile", label: "My Profile", icon: User },
  { id: "saved", label: "Saved Properties", icon: Heart },
  { id: "settings", label: "Settings", icon: Settings },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ==================== API Instance ====================
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => {
    refreshUserSession();
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearUserSession();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ==================== API Service ====================
const api = {
  getProfile: () => apiClient.get("/api/v1/users/profile"),
  updateProfile: (formData) =>
    apiClient.put("/api/v1/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  removeAvatar: () => apiClient.delete("/api/v1/users/avatar"),
  logout: () => apiClient.post("/api/v1/users/logout"),
  getSavedProperties: () => apiClient.get("/api/v1/users/saved-properties"),
  removeFromSaved: (propertyId) =>
    apiClient.delete(`/api/v1/user/saved-properties/${propertyId}`),
};

// ==================== Utility Functions ====================
const formatDate = (date, options) =>
  new Date(date).toLocaleDateString("en-US", options);

const getAvatarUrl = (user) => user?.avatar?.url || user?.avatarUrl || null;
const getFirstLetter = (name) => name?.[0]?.toUpperCase() || "?";

const validateImage = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Please select a valid image (JPG, PNG, or WebP)" };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image size should be less than 5MB" };
  }
  return { valid: true };
};

const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: '#10B981',
      color: '#fff',
      fontWeight: '500',
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
  });
};

const showLoadingToast = (message) => {
  return toast.loading(message, { position: "top-right" });
};

// ==================== User Navbar Component ====================
const UserNavbar = ({ user, onLogout, logoutLoading }) => {
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-xl font-bold text-gray-800"
            >
              <Home className="w-6 h-6" style={{ color: "rgb(39,113,183)" }} />
              <span>PropertyHub</span>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/properties")}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Browse Properties
            </button>

            <button className="p-2 hover:bg-gray-100 rounded relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {getAvatarUrl(user) ? (
                    <img src={getAvatarUrl(user)} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    getFirstLetter(user?.name)
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-300 rounded shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push("/dashboard");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4" />
                        My Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          router.push("/contact");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </button>
                    </div>
                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        disabled={logoutLoading}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {logoutLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ==================== Main Dashboard Component ====================
export default function UserDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const authChecked = useRef(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeCurrentAvatar, setRemoveCurrentAvatar] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    update: false,
    logout: false,
    properties: false,
    removeProperty: null,
  });
  const [savedProperties, setSavedProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentAvatarUrl = useMemo(() => getAvatarUrl(user), [user]);
  const firstLetter = useMemo(() => getFirstLetter(user?.name), [user?.name]);

  const setLoading = useCallback((key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return savedProperties;
    const query = searchQuery.toLowerCase();
    return savedProperties.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
    );
  }, [savedProperties, searchQuery]);

  // Paginated properties
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredProperties.slice(start, start + showCount);
  }, [filteredProperties, currentPage, showCount]);

  const totalPages = Math.ceil(filteredProperties.length / showCount);

  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    const checkAuth = async () => {
      try {
        const sessionCheck = validateUserSession();
        
        if (!sessionCheck.valid && !sessionCheck.requiresApiCheck) {
          throw new Error(sessionCheck.message);
        }

        const { data } = await api.getProfile();
        const userData = data?.user || data?.data || data;

        if (!userData || !userData.id) {
          throw new Error("Invalid user data received");
        }

        if (userData.role === "admin" || userData.userType === "admin") {
          showError("Please use admin dashboard");
          router.replace("/admin/dashboard");
          return;
        }

        setUserData(userData);
        setUser(userData);
        setForm({
          name: userData.name || "",
          phone: userData.phone || "",
          location: userData.location || "",
        });
        setImagePreview(getAvatarUrl(userData));

        await loadSavedProperties();
      } catch (error) {
        clearUserSession();
        showError("Please login to access dashboard");
        router.replace("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadSavedProperties = useCallback(async () => {
    setLoading("properties", true);
    try {
      const { data } = await api.getSavedProperties();
      setSavedProperties(data?.properties || data?.data || []);
    } catch (error) {
      // Demo data
      setSavedProperties([
        {
          id: 1,
          title: "Luxury Villa in Palm Jumeirah",
          location: "Palm Jumeirah, Dubai",
          price: 2500000,
          bedrooms: 4,
          bathrooms: 5,
          area: 4500,
          type: "Villa",
          status: "active",
          image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400",
          savedAt: "2024-01-15",
        },
        {
          id: 2,
          title: "Modern Apartment Downtown",
          location: "Downtown Dubai",
          price: 1200000,
          bedrooms: 2,
          bathrooms: 2,
          area: 1200,
          type: "Apartment",
          status: "active",
          image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
          savedAt: "2024-01-10",
        },
        {
          id: 3,
          title: "Penthouse with Marina View",
          location: "Dubai Marina",
          price: 3500000,
          bedrooms: 3,
          bathrooms: 4,
          area: 3200,
          type: "Penthouse",
          status: "active",
          image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
          savedAt: "2024-01-08",
        },
      ]);
    } finally {
      setLoading("properties", false);
    }
  }, [setLoading]);

  const refreshDashboard = useCallback(async () => {
    const loadingToast = showLoadingToast("Refreshing...");
    setLoading("profile", true);
    try {
      const { data } = await api.getProfile();
      const userData = data?.user || data?.data || data;

      setUserData(userData);
      setUser(userData);
      setForm({
        name: userData.name || "",
        phone: userData.phone || "",
        location: userData.location || "",
      });
      setImagePreview(getAvatarUrl(userData));

      await loadSavedProperties();
      toast.dismiss(loadingToast);
      showSuccess("Dashboard refreshed");
    } catch (error) {
      toast.dismiss(loadingToast);
      if (error.response?.status === 401) {
        clearUserSession();
        showError("Session expired");
        router.replace("/login");
      } else {
        showError("Failed to refresh");
      }
    } finally {
      setLoading("profile", false);
    }
  }, [loadSavedProperties, router, setLoading]);

  const handleLogout = useCallback(async () => {
    setLoading("logout", true);
    const logoutToast = showLoadingToast("Logging out...");
    try {
      await api.logout();
      clearUserSession();
      toast.dismiss(logoutToast);
      showSuccess("Logged out successfully");
      router.replace("/");
    } catch (error) {
      toast.dismiss(logoutToast);
      clearUserSession();
      router.replace("/");
    } finally {
      setLoading("logout", false);
    }
  }, [router, setLoading]);

  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    setImageFile(file);
    setRemoveCurrentAvatar(false);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (currentAvatarUrl) {
      setRemoveCurrentAvatar(true);
      setImagePreview(null);
    } else {
      setImagePreview(null);
    }
  }, [currentAvatarUrl]);

  const handleUpdateProfile = useCallback(async () => {
    if (!form.name.trim()) {
      showError("Name is required");
      return;
    }

    setLoading("update", true);
    const updateToast = showLoadingToast("Updating profile...");
    try {
      if (removeCurrentAvatar && !imageFile) {
        await api.removeAvatar();
      }

      const formData = new FormData();
      formData.append("name", form.name.trim());
      if (form.phone?.trim()) formData.append("phone", form.phone.trim());
      if (form.location?.trim()) formData.append("location", form.location.trim());
      if (imageFile) formData.append("avatar", imageFile);

      const { data } = await api.updateProfile(formData);
      const updatedUser = data?.user || data?.data || data;

      updateUserData(updatedUser);
      setUser(updatedUser);
      setImagePreview(getAvatarUrl(updatedUser));

      toast.dismiss(updateToast);
      showSuccess("Profile updated successfully");
      setEditMode(false);
      setImageFile(null);
      setRemoveCurrentAvatar(false);
    } catch (error) {
      toast.dismiss(updateToast);
      showError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading("update", false);
    }
  }, [form, imageFile, removeCurrentAvatar, setLoading]);

  const handleCancelEdit = useCallback(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      location: user?.location || "",
    });
    setImagePreview(currentAvatarUrl);
    setEditMode(false);
    setImageFile(null);
    setRemoveCurrentAvatar(false);
  }, [user, currentAvatarUrl]);

  const handleRemoveProperty = useCallback(async (propertyId) => {
    const deleteToast = showLoadingToast("Removing property...");
    setLoading("removeProperty", propertyId);
    try {
      await api.removeFromSaved(propertyId);
      setSavedProperties((prev) => prev.filter((p) => (p._id || p.id) !== propertyId));
      toast.dismiss(deleteToast);
      showSuccess("Property removed from saved");
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      toast.dismiss(deleteToast);
      showError("Failed to remove property");
    } finally {
      setLoading("removeProperty", null);
    }
  }, [setLoading]);

  const handleDeleteConfirm = () => {
    if (deleteTarget?.id) {
      handleRemoveProperty(deleteTarget.id);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />

      <UserNavbar
        user={user}
        onLogout={handleLogout}
        logoutLoading={loadingStates.logout}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Remove Property</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this property from your saved list?
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loadingStates.removeProperty}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loadingStates.removeProperty === deleteTarget.id}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingStates.removeProperty === deleteTarget.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-3">
          {/* Dashboard Header */}
          <div className="bg-white border border-gray-300 rounded-t p-4 mb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, <span className="font-medium">{user.name}</span>!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </span>
                <button
                  onClick={refreshDashboard}
                  disabled={loadingStates.profile}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${loadingStates.profile ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={activeTab === tab.id ? { backgroundColor: "rgb(39,113,183)" } : {}}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-gray-300 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Saved Properties</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{savedProperties.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: "rgb(39,113,183)" }}>
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Profile Views</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">128</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500 rounded flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Inquiries Sent</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">24</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {user?.createdAt
                            ? formatDate(user.createdAt, { month: "short", year: "numeric" })
                            : "2024"}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-amber-500 rounded flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Profile Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Profile Summary */}
                  <div className="lg:col-span-2 bg-white border border-gray-300 rounded">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Profile Summary</h3>
                      <button
                        onClick={() => { setActiveTab("profile"); setEditMode(true); }}
                        className="text-sm font-medium hover:underline"
                        style={{ color: "rgb(39,113,183)" }}
                      >
                        Edit Profile
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                          {currentAvatarUrl ? (
                            <img src={currentAvatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            firstLetter
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-800">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {user.phone && (
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5" />
                                {user.phone}
                              </span>
                            )}
                            {user.location && (
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-3.5 h-3.5" />
                                {user.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white border border-gray-300 rounded">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      <button
                        onClick={() => router.push("/properties")}
                        className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: "rgb(39,113,183)" }}>
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Browse Properties</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("saved")}
                        className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-rose-500 rounded flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">View Saved</span>
                      </button>
                      <button
                        onClick={() => router.push("/contact")}
                        className="w-full flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-amber-500 rounded flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Contact Support</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Saved Properties */}
                {savedProperties.length > 0 && (
                  <div className="bg-white border border-gray-300 rounded mt-4">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Recently Saved Properties</h3>
                      <button
                        onClick={() => setActiveTab("saved")}
                        className="text-sm font-medium hover:underline"
                        style={{ color: "rgb(39,113,183)" }}
                      >
                        View All ({savedProperties.length})
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedProperties.slice(0, 3).map((property) => (
                          <div key={property.id} className="border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative h-32">
                              <img
                                src={property.image}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                                {property.type}
                              </span>
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-gray-800 text-sm truncate">{property.title}</h4>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.location}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-gray-800">
                                  AED {property.price?.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {property.bedrooms} Beds
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="p-4">
                <div className="bg-white border border-gray-300 rounded">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Profile Information</h3>
                    {!editMode && (
                      <button
                        onClick={() => setEditMode(true)}
                        style={{ backgroundColor: "rgb(39,113,183)" }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded hover:opacity-90"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    {/* Avatar Section (Edit Mode) */}
                    {editMode && (
                      <div className="mb-8 pb-6 border-b border-gray-200">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-4">
                          <Camera className="w-4 h-4" />
                          Profile Photo
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-2 border-gray-200">
                              {imagePreview && !removeCurrentAvatar ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                firstLetter
                              )}
                            </div>
                            {(imageFile || (imagePreview && !removeCurrentAvatar)) && (
                              <button
                                onClick={handleRemoveImage}
                                disabled={loadingStates.update}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept={ALLOWED_IMAGE_TYPES.join(",")}
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loadingStates.update}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-50"
                              >
                                <Upload className="w-4 h-4" />
                                {imagePreview ? "Change" : "Upload"}
                              </button>
                              {currentAvatarUrl && !removeCurrentAvatar && !imageFile && (
                                <button
                                  onClick={handleRemoveImage}
                                  disabled={loadingStates.update}
                                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-gray-400">JPG, PNG or WebP. Max 5MB.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                          <User className="w-4 h-4" />
                          Full Name
                        </label>
                        {editMode ? (
                          <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={loadingStates.update}
                            placeholder="Enter your name"
                          />
                        ) : (
                          <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-gray-800 font-medium">{user.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-gray-800 font-medium">{user.email}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </label>
                        {editMode ? (
                          <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+971 XX XXX XXXX"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={loadingStates.update}
                          />
                        ) : (
                          <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-gray-800 font-medium">
                            {user.phone || "Not provided"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        {editMode ? (
                          <input
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="Dubai, UAE"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={loadingStates.update}
                          />
                        ) : (
                          <p className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-gray-800 font-medium">
                            {user.location || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Edit Mode Buttons */}
                    {editMode && (
                      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={handleUpdateProfile}
                          disabled={loadingStates.update}
                          style={{ backgroundColor: "rgb(39,113,183)" }}
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-50"
                        >
                          {loadingStates.update ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {loadingStates.update ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loadingStates.update}
                          className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Saved Properties Tab */}
            {activeTab === "saved" && (
              <div className="p-4">
                {/* Search & Controls */}
                <div className="bg-white border border-gray-300 rounded p-3 mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <button
                      onClick={() => router.push("/properties")}
                      style={{ backgroundColor: "rgb(39,113,183)" }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" />
                      Browse Properties
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search saved properties..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                          <Search className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mt-3">
                    <span className="mr-2">Show</span>
                    <select
                      value={showCount}
                      onChange={(e) => {
                        setShowCount(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {[5, 10, 25, 50].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="ml-2">entries</span>
                  </div>
                </div>

                {/* Properties Table */}
                {loadingStates.properties ? (
                  <div className="bg-white border border-gray-300 rounded p-12 text-center">
                    <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="bg-white border border-gray-300 rounded p-12 text-center">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved properties</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? "Try a different search term" : "Start exploring and save properties you like"}
                    </p>
                    <button
                      onClick={() => router.push("/properties")}
                      style={{ backgroundColor: "rgb(39,113,183)" }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded hover:opacity-90"
                    >
                      <Building2 className="w-4 h-4" />
                      Browse Properties
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-300 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-300">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Property</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Location</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Details</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Saved On</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedProperties.map((property) => (
                            <tr key={property.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                                    <img
                                      src={property.image}
                                      alt={property.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="font-medium text-gray-800 text-sm max-w-[200px] truncate">
                                    {property.title}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  {property.location}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {property.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                                AED {property.price?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {property.bedrooms} Beds • {property.bathrooms} Baths • {property.area} sqft
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDate(property.savedAt, { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => router.push(`/properties/${property.id}`)}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteTarget({ id: property.id, title: property.title });
                                      setShowDeleteModal(true);
                                    }}
                                    disabled={loadingStates.removeProperty === property.id}
                                    className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                    title="Remove"
                                  >
                                    {loadingStates.removeProperty === property.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {filteredProperties.length > showCount && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Showing {(currentPage - 1) * showCount + 1} to{" "}
                          {Math.min(currentPage * showCount, filteredProperties.length)} of{" "}
                          {filteredProperties.length} entries
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 border rounded text-sm ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="p-4">
                <div className="bg-white border border-gray-300 rounded">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Account Settings</h3>
                  </div>
                  <div className="p-12 text-center">
                    <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h3>
                    <p className="text-gray-500">More settings and preferences will be available soon.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
            <p className="text-sm text-gray-500 text-center">
              User Dashboard • Last login: Today at {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}