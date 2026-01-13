"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
  TrendingUp,
  Eye,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  Clock,
  BarChart3,
  Activity,
  Bookmark,
} from "lucide-react";

// ==================== Constants ====================
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "profile", label: "My Profile", icon: User },
  { id: "saved", label: "Saved Properties", icon: Heart },
  { id: "settings", label: "Settings", icon: Settings },
];

const QUICK_ACTIONS = [
  { label: "Browse Properties", icon: Building2, path: "/properties", color: "from-blue-500 to-cyan-600" },
  { label: "View Saved", icon: Bookmark, tab: "saved", color: "from-rose-500 to-pink-600" },
  { label: "Edit Profile", icon: Edit3, tab: "profile", editMode: true, color: "from-violet-500 to-purple-600" },
  { label: "Contact Support", icon: Mail, path: "/contact", color: "from-amber-500 to-orange-600" },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ==================== API Client ====================
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ==================== Utility Functions ====================
const formatDate = (date, options) => new Date(date).toLocaleDateString("en-US", options);
const formatTime = (date, options) => new Date(date).toLocaleTimeString("en-US", options);
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

// ==================== Sub Components ====================
const DashboardSection = ({ title, description, icon: Icon, children, headerRight, compact }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
    <div className={`px-6 ${compact ? "py-4" : "py-5"} border-b border-gray-100`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
              <Icon className="w-5 h-5 text-amber-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {headerRight}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const PropertyCard = ({ property, onRemove, isRemoving }) => (
  <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="relative h-40 overflow-hidden">
      <img
        src={property.image || property.images?.[0]?.url || "https://via.placeholder.com/400x300"}
        alt={property.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
      <button
        onClick={() => onRemove(property._id || property.id)}
        disabled={isRemoving}
        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 disabled:opacity-50"
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        )}
      </button>
      <div className="absolute bottom-3 left-3 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
        {property.beds || property.bedrooms || "N/A"} Beds
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-semibold text-gray-800 truncate group-hover:text-amber-600 transition-colors">
        {property.title}
      </h4>
      <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{property.location || property.address || "N/A"}</span>
      </p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-lg font-bold text-gray-800">
          AED <span className="text-amber-600">{property.price?.toLocaleString() || "N/A"}</span>
        </span>
        <button className="p-2 bg-gray-100 rounded-lg hover:bg-amber-100 transition-colors">
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  </div>
);

const StatsCard = ({ stat }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {stat.trend}
        </p>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
        <stat.icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
        <User className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
    {action}
  </div>
);

// ==================== Main Dashboard Component ====================
export default function UserDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const authChecked = useRef(false);

  // State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [removeCurrentAvatar, setRemoveCurrentAvatar] = useState(false);
  const [savedProperties, setSavedProperties] = useState([]);

  const [loading, setLoading] = useState({
    profile: false,
    update: false,
    logout: false,
    properties: false,
    removeProperty: null,
  });

  // Memoized values
  const currentAvatarUrl = useMemo(() => getAvatarUrl(user), [user]);
  const firstLetter = useMemo(() => getFirstLetter(user?.name), [user?.name]);

  const stats = useMemo(() => [
    { label: "Saved Properties", value: savedProperties.length, icon: Heart, color: "from-rose-500 to-pink-600", trend: "+2 this week" },
    { label: "Profile Views", value: "128", icon: Eye, color: "from-blue-500 to-cyan-600", trend: "+12% this month" },
    { label: "Inquiries Sent", value: "24", icon: Mail, color: "from-violet-500 to-purple-600", trend: "5 pending" },
    { label: "Member Since", value: user?.created_at ? formatDate(user.created_at, { month: "short", year: "numeric" }) : "—", icon: Calendar, color: "from-amber-500 to-orange-600", trend: "Active member" },
  ], [savedProperties.length, user?.created_at]);

  // ==================== Auth Check ====================
  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    const checkAuth = async () => {
      try {
        const { data } = await api.get("/api/v1/users/me");
        const userData = data?.user || data?.data || data;

        if (!userData?.id) {
          throw new Error("Invalid user data");
        }

        // Check if admin (redirect if yes)
        if (userData.usertype === "admin" || userData.role === "admin") {
          toast.error("Please use admin dashboard");
          router.replace("/admin/dashboard");
          return;
        }

        setUser(userData);
        setForm({
          name: userData.name || "",
          phone: userData.phone || "",
          location: userData.location || "",
        });
        setImagePreview(getAvatarUrl(userData));

        // Load saved properties
        loadSavedProperties();

      } catch (error) {
        console.error("Auth error:", error);
        toast.error("Please login to access dashboard");
        router.replace("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // ==================== Load Saved Properties ====================
  const loadSavedProperties = useCallback(async () => {
    setLoading(prev => ({ ...prev, properties: true }));
    try {
      const { data } = await api.get("/api/v1/users/saved-properties");
      setSavedProperties(data?.properties || data?.data || []);
    } catch (error) {
      console.error("Failed to load saved properties:", error);
      // Sample fallback data
      setSavedProperties([
        { id: 1, title: "Luxury Villa in Palm Jumeirah", location: "Palm Jumeirah, Dubai", price: 2500000, beds: 4, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400" },
        { id: 2, title: "Modern Apartment Downtown", location: "Downtown Dubai", price: 1200000, beds: 2, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400" },
        { id: 3, title: "Beachfront Studio", location: "JBR, Dubai", price: 850000, beds: 1, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400" },
      ]);
    } finally {
      setLoading(prev => ({ ...prev, properties: false }));
    }
  }, []);

  // ==================== Refresh Dashboard ====================
  const refreshDashboard = useCallback(async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const { data } = await api.get("/api/v1/users/me");
      const userData = data?.user || data?.data || data;
      
      setUser(userData);
      setForm({
        name: userData.name || "",
        phone: userData.phone || "",
        location: userData.location || "",
      });
      setImagePreview(getAvatarUrl(userData));
      
      await loadSavedProperties();
      toast.success("Dashboard refreshed");
    } catch (error) {
      console.error("Refresh failed:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired");
        router.replace("/login");
      } else {
        toast.error("Failed to refresh");
      }
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }, [loadSavedProperties, router]);

  // ==================== Logout ====================
  const handleLogout = useCallback(async () => {
    setLoading(prev => ({ ...prev, logout: true }));
    try {
      await api.post("/api/v1/users/logout");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.replace("/login");
      setLoading(prev => ({ ...prev, logout: false }));
    }
  }, [router]);

  // ==================== Image Handlers ====================
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
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

  // ==================== Update Profile ====================
  const handleUpdateProfile = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(prev => ({ ...prev, update: true }));
    try {
      // Remove avatar if requested
      if (removeCurrentAvatar && !imageFile) {
        await api.delete("/api/v1/users/avatar");
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("name", form.name.trim());
      if (form.phone?.trim()) formData.append("phone", form.phone.trim());
      if (form.location?.trim()) formData.append("location", form.location.trim());
      if (imageFile) formData.append("avatar", imageFile);

      await api.put("/api/v1/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Profile updated successfully");
      setEditMode(false);
      setImageFile(null);
      setRemoveCurrentAvatar(false);
      await refreshDashboard();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  }, [form, imageFile, removeCurrentAvatar, refreshDashboard]);

  // ==================== Cancel Edit ====================
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [user, currentAvatarUrl]);

  // ==================== Remove Property ====================
  const handleRemoveProperty = useCallback(async (propertyId) => {
    setLoading(prev => ({ ...prev, removeProperty: propertyId }));
    try {
      await api.delete(`/api/v1/users/saved-properties/${propertyId}`);
      setSavedProperties(prev => prev.filter(p => (p._id || p.id) !== propertyId));
      toast.success("Property removed from favourites");
    } catch (error) {
      console.error("Remove property failed:", error);
      toast.error("Failed to remove property");
    } finally {
      setLoading(prev => ({ ...prev, removeProperty: null }));
    }
  }, []);

  // ==================== Quick Action Handler ====================
  const handleQuickAction = useCallback((action) => {
    if (action.path) {
      router.push(action.path);
    } else if (action.tab) {
      setActiveTab(action.tab);
      if (action.editMode) setEditMode(true);
    }
  }, [router]);

  // ==================== Render ====================
  if (authLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-gray-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-14 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800" style={{ fontFamily: '"Playfair Display", serif' }}>
                  My <span className="italic text-amber-600">Dashboard</span>
                </h1>
                {loading.profile && (
                  <span className="px-3 py-1 text-xs bg-amber-100 text-amber-800 rounded-full flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold text-gray-900">{user.name}</span>! 👋
              </p>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {user.status || "Active"}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  {user.usertype || "User"}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-sm text-gray-500 mr-2">
                <div className="flex items-center gap-2 font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  {formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatTime(new Date(), { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <button
                onClick={refreshDashboard}
                disabled={loading.profile}
                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading.profile ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleLogout}
                disabled={loading.logout}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
              >
                {loading.logout ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-white rounded-2xl shadow-md border border-gray-100 mb-8 p-1.5 inline-flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id ? "bg-gray-800 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, idx) => <StatsCard key={idx} stat={stat} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Overview */}
                <DashboardSection
                  title="Profile Overview"
                  description="Your account information at a glance"
                  icon={User}
                  headerRight={
                    <button onClick={() => setActiveTab("profile")} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                      Edit Profile →
                    </button>
                  }
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
                        {currentAvatarUrl ? (
                          <img src={currentAvatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          firstLetter
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800 truncate">{user.name}</h3>
                      <p className="text-gray-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {user.phone && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {user.phone}
                          </span>
                        )}
                        {user.location && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {user.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </DashboardSection>

                {/* Saved Properties */}
                <DashboardSection
                  title="Recently Saved"
                  description="Properties you've saved recently"
                  icon={Heart}
                  headerRight={
                    savedProperties.length > 0 && (
                      <button onClick={() => setActiveTab("saved")} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                        View All →
                      </button>
                    )
                  }
                >
                  {savedProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No saved properties yet</p>
                      <button
                        onClick={() => router.push("/properties")}
                        className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        Browse Properties
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedProperties.slice(0, 2).map((property) => (
                        <PropertyCard
                          key={property._id || property.id}
                          property={property}
                          onRemove={handleRemoveProperty}
                          isRemoving={loading.removeProperty === (property._id || property.id)}
                        />
                      ))}
                    </div>
                  )}
                </DashboardSection>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <DashboardSection title="Quick Actions" description="Common actions" icon={Activity}>
                  <div className="space-y-3">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </DashboardSection>

                {/* Account Status */}
                <DashboardSection title="Account Status" description="Your account details" icon={Shield}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-sm font-medium text-green-700">Account Status</span>
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold capitalize">
                        {user.status || "Active"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-600">Account Type</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold capitalize">
                        {user.usertype || "User"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-600">Login Count</span>
                      <span className="text-sm text-gray-500">{user.login_count || 1}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-600">Last Login</span>
                      <span className="text-sm text-gray-500">
                        {user.last_login_at ? formatDate(user.last_login_at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Today"}
                      </span>
                    </div>
                  </div>
                </DashboardSection>
              </div>
            </div>
          </>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <DashboardSection
            title="Profile Information"
            description="Manage your personal information"
            icon={User}
            headerRight={
              !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )
            }
          >
            {/* Image Upload - Edit Mode */}
            {editMode && (
              <div className="mb-8 pb-6 border-b border-gray-100">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
                  <Camera className="w-4 h-4" />
                  Profile Photo
                </label>

                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg">
                      {imagePreview && !removeCurrentAvatar ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        firstLetter
                      )}
                    </div>

                    {(imageFile || (imagePreview && !removeCurrentAvatar)) && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={loading.update}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading.update}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {imagePreview ? "Change Photo" : "Upload Photo"}
                      </button>

                      {currentAvatarUrl && !removeCurrentAvatar && !imageFile && (
                        <button
                          onClick={handleRemoveImage}
                          disabled={loading.update}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-400">JPG, PNG or WebP. Max size 5MB.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {editMode ? (
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    disabled={loading.update}
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-900 font-medium">{user.email}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+971 XX XXX XXXX"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    disabled={loading.update}
                  />
                ) : (
                  <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">{user.phone || "Not provided"}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                {editMode ? (
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Dubai, UAE"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    disabled={loading.update}
                  />
                ) : (
                  <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">{user.location || "Not provided"}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {editMode && (
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading.update}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-md disabled:opacity-50"
                >
                  {loading.update ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading.update ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={loading.update}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </DashboardSection>
        )}

        {/* Saved Properties Tab */}
        {activeTab === "saved" && (
          <DashboardSection
            title="Saved Properties"
            description={`${savedProperties.length} properties saved`}
            icon={Heart}
            headerRight={
              <button
                onClick={() => router.push("/properties")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Browse More
              </button>
            }
          >
            {savedProperties.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved properties yet"
                description="Start exploring and save properties you love"
                action={
                  <button
                    onClick={() => router.push("/properties")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-md"
                  >
                    <Building2 className="w-5 h-5" />
                    Explore Properties
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((property) => (
                  <PropertyCard
                    key={property._id || property.id}
                    property={property}
                    onRemove={handleRemoveProperty}
                    isRemoving={loading.removeProperty === (property._id || property.id)}
                  />
                ))}
              </div>
            )}
          </DashboardSection>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <DashboardSection title="Settings" description="Manage your account preferences" icon={Settings}>
            <EmptyState
              icon={Settings}
              title="Coming Soon"
              description="We're working on bringing you more settings and customization options"
            />
          </DashboardSection>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-8 flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          User Dashboard - Manage your properties efficiently
        </footer>
      </div>
    </div>
  );
}
// "use client";

// import { useEffect, useState, useRef, useCallback, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import toast from "react-hot-toast";
// import axios from "axios";
// import {
//   User,
//   Mail,
//   Phone,
//   MapPin,
//   Heart,
//   LogOut,
//   Edit3,
//   Save,
//   X,
//   Settings,
//   Loader2,
//   Building2,
//   Calendar,
//   Shield,
//   TrendingUp,
//   Eye,
//   Camera,
//   Upload,
//   Trash2,
//   RefreshCw,
//   Clock,
//   BarChart3,
//   Activity,
//   Bookmark,
// } from "lucide-react";

// // ==================== Constants ====================
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// const TABS = [
//   { id: "overview", label: "Overview", icon: BarChart3 },
//   { id: "profile", label: "My Profile", icon: User },
//   { id: "saved", label: "Saved Properties", icon: Heart },
//   { id: "settings", label: "Settings", icon: Settings },
// ];

// const QUICK_ACTIONS = [
//   {
//     label: "Browse Properties",
//     icon: Building2,
//     path: "/properties",
//     color: "from-blue-500 to-cyan-600",
//   },
//   {
//     label: "View Saved",
//     icon: Bookmark,
//     tab: "saved",
//     color: "from-rose-500 to-pink-600",
//   },
//   {
//     label: "Edit Profile",
//     icon: Edit3,
//     tab: "profile",
//     editMode: true,
//     color: "from-violet-500 to-purple-600",
//   },
//   {
//     label: "Contact Support",
//     icon: Mail,
//     path: "/contact",
//     color: "from-amber-500 to-orange-600",
//   },
// ];

// const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
// const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// // ==================== API Instance with Cookies ====================
// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true, // Important: This sends cookies automatically
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // ==================== API Service ====================
// const api = {
//   // This will check auth via cookie automatically
//   getProfile: () => apiClient.get("/api/v1/user/profile"),
  
//   updateProfile: (formData) =>
//     apiClient.put("/api/v1/user/profile", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   removeAvatar: () => apiClient.delete("/api/v1/user/avatar"),

//   logout: () => apiClient.post("/api/v1/user/logout"),

//   getSavedProperties: () => apiClient.get("/api/v1/user/saved-properties"),

//   removeFromSaved: (propertyId) =>
//     apiClient.delete(`/api/v1/user/saved-properties/${propertyId}`),
    
//   // Auth check endpoint
//   checkAuth: () => apiClient.get("/api/v1/user/me"),
// };

// // ==================== Utility Functions ====================
// const formatDate = (date, options) =>
//   new Date(date).toLocaleDateString("en-US", options);

// const formatTime = (date, options) =>
//   new Date(date).toLocaleTimeString("en-US", options);

// const getAvatarUrl = (user) => user?.avatar?.url || user?.avatarUrl || null;
// const getFirstLetter = (name) => name?.[0]?.toUpperCase() || "?";

// const validateImage = (file) => {
//   if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
//     return { valid: false, error: "Please select a valid image (JPG, PNG, or WebP)" };
//   }
//   if (file.size > MAX_IMAGE_SIZE) {
//     return { valid: false, error: "Image size should be less than 5MB" };
//   }
//   return { valid: true };
// };

// // ==================== Sub Components ====================

// const DashboardSection = ({ title, description, icon: Icon, children, headerRight, compact }) => (
//   <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
//     <div className={`px-6 ${compact ? "py-4" : "py-5"} border-b border-gray-100`}>
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           {Icon && (
//             <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
//               <Icon className="w-5 h-5 text-amber-600" />
//             </div>
//           )}
//           <div>
//             <h3 className="font-semibold text-gray-800">{title}</h3>
//             {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
//           </div>
//         </div>
//         {headerRight}
//       </div>
//     </div>
//     <div className="p-6">{children}</div>
//   </div>
// );

// const PropertyCard = ({ property, onRemove, isRemoving }) => (
//   <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
//     <div className="relative h-40 overflow-hidden">
//       <img
//         src={property.image || property.images?.[0]?.url}
//         alt={property.title}
//         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
//         loading="lazy"
//       />
//       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//       <button
//         onClick={() => onRemove(property._id || property.id)}
//         disabled={isRemoving}
//         className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 disabled:opacity-50"
//       >
//         {isRemoving ? (
//           <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
//         ) : (
//           <Heart className="w-4 h-4 text-red-500 fill-red-500" />
//         )}
//       </button>
//       <div className="absolute bottom-3 left-3 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
//         {property.beds || property.bedrooms} {property.beds ? "" : "Beds"}
//       </div>
//     </div>
//     <div className="p-4">
//       <h4 className="font-semibold text-gray-800 truncate group-hover:text-amber-600 transition-colors">
//         {property.title}
//       </h4>
//       <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
//         <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
//         <span className="truncate">{property.location || property.address}</span>
//       </p>
//       <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
//         <span className="text-lg font-bold text-gray-800">
//           AED <span className="text-amber-600">{property.price?.toLocaleString()}</span>
//         </span>
//         <button className="p-2 bg-gray-100 rounded-lg hover:bg-amber-100 transition-colors">
//           <Eye className="w-4 h-4 text-gray-600" />
//         </button>
//       </div>
//     </div>
//   </div>
// );

// const StatsCard = ({ stat }) => (
//   <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
//     <div className="flex items-start justify-between">
//       <div>
//         <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
//         <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
//         <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
//           <TrendingUp className="w-3 h-3" />
//           {stat.trend}
//         </p>
//       </div>
//       <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
//         <stat.icon className="w-6 h-6 text-white" />
//       </div>
//     </div>
//   </div>
// );

// const LoadingScreen = () => (
//   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//     <div className="text-center">
//       <div className="relative">
//         <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
//         <User className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
//       </div>
//       <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
//     </div>
//   </div>
// );

// const EmptyState = ({ icon: Icon, title, description, action }) => (
//   <div className="text-center py-16">
//     <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//       <Icon className="w-10 h-10 text-gray-400" />
//     </div>
//     <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
//     <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
//     {action}
//   </div>
// );

// // ==================== Main Dashboard Component ====================
// export default function UserDashboard() {
//   const router = useRouter();
//   const fileInputRef = useRef(null);
//   const authChecked = useRef(false); // Prevent multiple auth checks

//   // Auth State
//   const [user, setUser] = useState(null);
//   const [authLoading, setAuthLoading] = useState(true);

//   // UI State
//   const [activeTab, setActiveTab] = useState("overview");
//   const [editMode, setEditMode] = useState(false);

//   // Form State
//   const [form, setForm] = useState({ name: "", phone: "", location: "" });
//   const [imagePreview, setImagePreview] = useState(null);
//   const [imageFile, setImageFile] = useState(null);
//   const [removeCurrentAvatar, setRemoveCurrentAvatar] = useState(false);

//   // Loading States
//   const [loadingStates, setLoadingStates] = useState({
//     profile: false,
//     update: false,
//     logout: false,
//     properties: false,
//     removeProperty: null,
//   });

//   // Data State
//   const [savedProperties, setSavedProperties] = useState([]);

//   // ==================== Memoized Values ====================
//   const currentAvatarUrl = useMemo(() => getAvatarUrl(user), [user]);
//   const firstLetter = useMemo(() => getFirstLetter(user?.name), [user?.name]);

//   const stats = useMemo(
//     () => [
//       {
//         label: "Saved Properties",
//         value: savedProperties.length,
//         icon: Heart,
//         color: "from-rose-500 to-pink-600",
//         trend: "+2 this week",
//       },
//       {
//         label: "Profile Views",
//         value: "128",
//         icon: Eye,
//         color: "from-blue-500 to-cyan-600",
//         trend: "+12% this month",
//       },
//       {
//         label: "Inquiries Sent",
//         value: "24",
//         icon: Mail,
//         color: "from-violet-500 to-purple-600",
//         trend: "5 pending",
//       },
//       {
//         label: "Member Since",
//         value: user?.createdAt
//           ? formatDate(user.createdAt, { month: "short", year: "numeric" })
//           : "—",
//         icon: Calendar,
//         color: "from-amber-500 to-orange-600",
//         trend: "Active member",
//       },
//     ],
//     [savedProperties.length, user?.createdAt]
//   );

//   // ==================== Loading State Helper ====================
//   const setLoading = useCallback((key, value) => {
//     setLoadingStates((prev) => ({ ...prev, [key]: value }));
//   }, []);

//   const isLoading = loadingStates.profile;
//   const isUpdating = loadingStates.update;
//   const isLoggingOut = loadingStates.logout;

//   // ==================== Auth Check - API Based ====================
//   useEffect(() => {
//     // Prevent multiple calls
//     if (authChecked.current) return;
//     authChecked.current = true;

//     const checkAuth = async () => {
//       try {
//         // Call API - cookies will be sent automatically
//         const { data } = await api.getProfile();
        
//         const userData = data?.user || data?.data || data;
        
//         if (!userData || !userData.id) {
//           throw new Error("Invalid user data");
//         }

//         // Check if user role (not admin)
//         if (userData.role === 'admin' || userData.userType === 'admin') {
//           toast.error("Please use admin dashboard");
//           router.replace("/admin/dashboard");
//           return;
//         }

//         setUser(userData);
//         setForm({
//           name: userData?.name || "",
//           phone: userData?.phone || "",
//           location: userData?.location || "",
//         });
//         setImagePreview(getAvatarUrl(userData));

//         // Load saved properties
//         loadSavedProperties();

//       } catch (error) {
//         console.error("Auth check failed:", error);
        
//         // 401 = Not authenticated
//         if (error.response?.status === 401) {
//           toast.error("Please login to access dashboard");
//         } else {
//           toast.error("Session expired. Please login again.");
//         }
        
//         router.replace("/login");
//       } finally {
//         setAuthLoading(false);
//       }
//     };

//     checkAuth();
//   }, []); // Empty dependency - runs once

//   // ==================== Load Saved Properties ====================
//   const loadSavedProperties = useCallback(async () => {
//     setLoading("properties", true);
//     try {
//       const { data } = await api.getSavedProperties();
//       setSavedProperties(data?.properties || data?.data || []);
//     } catch (error) {
//       console.error("Failed to load saved properties:", error);
//       // Use sample data as fallback
//       setSavedProperties([
//         {
//           id: 1,
//           title: "Luxury Villa in Palm Jumeirah",
//           location: "Palm Jumeirah, Dubai",
//           price: 2500000,
//           beds: "4 Beds",
//           image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400",
//         },
//         {
//           id: 2,
//           title: "Modern Apartment Downtown",
//           location: "Downtown Dubai",
//           price: 1200000,
//           beds: "2 Beds",
//           image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
//         },
//         {
//           id: 3,
//           title: "Beachfront Studio",
//           location: "JBR, Dubai",
//           price: 850000,
//           beds: "Studio",
//           image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
//         },
//       ]);
//     } finally {
//       setLoading("properties", false);
//     }
//   }, [setLoading]);

//   // ==================== Refresh Dashboard ====================
//   const refreshDashboard = useCallback(async () => {
//     setLoading("profile", true);
//     try {
//       const { data } = await api.getProfile();
//       const userData = data?.user || data?.data || data;
      
//       setUser(userData);
//       setForm({
//         name: userData?.name || "",
//         phone: userData?.phone || "",
//         location: userData?.location || "",
//       });
//       setImagePreview(getAvatarUrl(userData));
      
//       await loadSavedProperties();
//       toast.success("Dashboard refreshed");
//     } catch (error) {
//       console.error("Refresh failed:", error);
//       if (error.response?.status === 401) {
//         toast.error("Session expired");
//         router.replace("/login");
//       } else {
//         toast.error("Failed to refresh");
//       }
//     } finally {
//       setLoading("profile", false);
//     }
//   }, [loadSavedProperties, router, setLoading]);

//   // ==================== Handle Logout ====================
//   const handleLogout = useCallback(async () => {
//     setLoading("logout", true);
//     try {
//       await api.logout();
//       toast.success("Logged out successfully");
//     } catch (error) {
//       console.error("Logout error:", error);
//       // Even if API fails, clear local state
//     } finally {
//       setUser(null);
//       router.replace("/");
//       setLoading("logout", false);
//     }
//   }, [router, setLoading]);

//   // ==================== Image Handlers ====================
//   const handleImageSelect = useCallback((e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const validation = validateImage(file);
//     if (!validation.valid) {
//       toast.error(validation.error);
//       return;
//     }

//     setImageFile(file);
//     setRemoveCurrentAvatar(false);

//     const reader = new FileReader();
//     reader.onloadend = () => setImagePreview(reader.result);
//     reader.readAsDataURL(file);
//   }, []);

//   const handleRemoveImage = useCallback(() => {
//     setImageFile(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";

//     if (currentAvatarUrl) {
//       setRemoveCurrentAvatar(true);
//       setImagePreview(null);
//     } else {
//       setImagePreview(null);
//     }
//   }, [currentAvatarUrl]);

//   // ==================== Handle Profile Update ====================
//   const handleUpdateProfile = useCallback(async () => {
//     if (!form.name.trim()) {
//       toast.error("Name is required");
//       return;
//     }

//     setLoading("update", true);
//     try {
//       if (removeCurrentAvatar && !imageFile) {
//         await api.removeAvatar();
//       }

//       const formData = new FormData();
//       formData.append("name", form.name.trim());
//       if (form.phone?.trim()) formData.append("phone", form.phone.trim());
//       if (form.location?.trim()) formData.append("location", form.location.trim());
//       if (imageFile) formData.append("avatar", imageFile);

//       await api.updateProfile(formData);

//       toast.success("Profile updated successfully");
//       resetEditState();
//       await refreshDashboard();
//     } catch (error) {
//       console.error("Update failed:", error);
//       toast.error(error.response?.data?.message || "Failed to update profile");
//     } finally {
//       setLoading("update", false);
//     }
//   }, [form, imageFile, removeCurrentAvatar, refreshDashboard, setLoading]);

//   // ==================== Reset Edit State ====================
//   const resetEditState = useCallback(() => {
//     setEditMode(false);
//     setImageFile(null);
//     setRemoveCurrentAvatar(false);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   }, []);

//   // ==================== Cancel Edit ====================
//   const handleCancelEdit = useCallback(() => {
//     setForm({
//       name: user?.name || "",
//       phone: user?.phone || "",
//       location: user?.location || "",
//     });
//     setImagePreview(currentAvatarUrl);
//     resetEditState();
//   }, [user, currentAvatarUrl, resetEditState]);

//   // ==================== Remove Property ====================
//   const handleRemoveProperty = useCallback(async (propertyId) => {
//     setLoading("removeProperty", propertyId);
//     try {
//       await api.removeFromSaved(propertyId);
//       setSavedProperties((prev) => prev.filter((p) => (p._id || p.id) !== propertyId));
//       toast.success("Property removed from favourites");
//     } catch (error) {
//       console.error("Remove property failed:", error);
//       toast.error("Failed to remove property");
//     } finally {
//       setLoading("removeProperty", null);
//     }
//   }, [setLoading]);

//   // ==================== Quick Action Handler ====================
//   const handleQuickAction = useCallback((action) => {
//     if (action.path) {
//       router.push(action.path);
//     } else if (action.tab) {
//       setActiveTab(action.tab);
//       if (action.editMode) setEditMode(true);
//     }
//   }, [router]);

//   // ==================== Form Change Handler ====================
//   const handleFormChange = useCallback((field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   }, []);

//   // ==================== Render ====================
//   if (authLoading) return <LoadingScreen />;
//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-gray-50 relative overflow-hidden">
//       {/* Background Elements */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-3xl" />
//         <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-gray-200/30 rounded-full blur-3xl" />
//         <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-3xl" />
//         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
//       </div>

//       <div className="relative max-w-7xl mx-auto px-6 md:px-14 py-8">
//         {/* ==================== Header ==================== */}
//         <header className="mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <div className="flex items-center gap-3">
//                 <h1
//                   className="text-3xl lg:text-4xl font-bold text-gray-800"
//                   style={{ fontFamily: '"Playfair Display", serif' }}
//                 >
//                   My <span className="italic text-amber-600">Dashboard</span>
//                 </h1>
//                 {isLoading && (
//                   <span className="px-3 py-1 text-xs bg-amber-100 text-amber-800 rounded-full flex items-center gap-1.5">
//                     <Loader2 className="w-3 h-3 animate-spin" />
//                     Updating...
//                   </span>
//                 )}
//               </div>
//               <p className="text-gray-600 mt-2">
//                 Welcome back, <span className="font-semibold text-gray-900">{user.name}</span>! 👋
//               </p>
//               <div className="mt-3 flex items-center gap-3 flex-wrap">
//                 <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
//                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//                   Active
//                 </span>
//                 <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
//                   <Shield className="w-3 h-3" />
//                   Verified Account
//                 </span>
//                 <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                   {user.email}
//                 </span>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="hidden md:flex flex-col items-end text-sm text-gray-500 mr-2">
//                 <div className="flex items-center gap-2 font-medium text-gray-700">
//                   <Calendar className="w-4 h-4" />
//                   {formatDate(new Date(), { weekday: "long", month: "long", day: "numeric" })}
//                 </div>
//                 <div className="flex items-center gap-2 text-xs">
//                   <Clock className="w-3 h-3" />
//                   {formatTime(new Date(), { hour: "2-digit", minute: "2-digit" })}
//                 </div>
//               </div>

//               <button
//                 onClick={refreshDashboard}
//                 disabled={isLoading}
//                 className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50"
//               >
//                 <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`} />
//               </button>

//               <button
//                 onClick={handleLogout}
//                 disabled={isLoggingOut}
//                 className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
//               >
//                 {isLoggingOut ? (
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                 ) : (
//                   <LogOut className="w-5 h-5" />
//                 )}
//                 <span className="text-sm font-medium hidden sm:inline">Logout</span>
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* ==================== Tab Navigation ==================== */}
//         <nav className="bg-white rounded-2xl shadow-md border border-gray-100 mb-8 p-1.5 inline-flex gap-1 flex-wrap">
//           {TABS.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
//                 activeTab === tab.id
//                   ? "bg-gray-800 text-white shadow-md"
//                   : "text-gray-600 hover:bg-gray-100"
//               }`}
//             >
//               <tab.icon className="w-4 h-4" />
//               {tab.label}
//             </button>
//           ))}
//         </nav>

//         {/* ==================== OVERVIEW TAB ==================== */}
//         {activeTab === "overview" && (
//           <>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//               {stats.map((stat, idx) => (
//                 <StatsCard key={idx} stat={stat} />
//               ))}
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               <div className="lg:col-span-2 space-y-6">
//                 <DashboardSection
//                   title="Profile Overview"
//                   description="Your account information at a glance"
//                   icon={User}
//                   headerRight={
//                     <button
//                       onClick={() => setActiveTab("profile")}
//                       className="text-sm text-amber-600 hover:text-amber-700 font-medium"
//                     >
//                       Edit Profile →
//                     </button>
//                   }
//                 >
//                   <div className="flex items-center gap-6">
//                     <div className="relative">
//                       <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg">
//                         {currentAvatarUrl ? (
//                           <img src={currentAvatarUrl} alt={user.name} className="w-full h-full object-cover" />
//                         ) : (
//                           firstLetter
//                         )}
//                       </div>
//                       <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-xl font-bold text-gray-800 truncate">{user.name}</h3>
//                       <p className="text-gray-500 truncate">{user.email}</p>
//                       <div className="flex items-center gap-4 mt-3 flex-wrap">
//                         {user.phone && (
//                           <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
//                             <Phone className="w-4 h-4" />
//                             {user.phone}
//                           </span>
//                         )}
//                         {user.location && (
//                           <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
//                             <MapPin className="w-4 h-4" />
//                             {user.location}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </DashboardSection>

//                 <DashboardSection
//                   title="Recently Saved"
//                   description="Properties you've saved recently"
//                   icon={Heart}
//                   headerRight={
//                     savedProperties.length > 0 && (
//                       <button
//                         onClick={() => setActiveTab("saved")}
//                         className="text-sm text-amber-600 hover:text-amber-700 font-medium"
//                       >
//                         View All →
//                       </button>
//                     )
//                   }
//                 >
//                   {savedProperties.length === 0 ? (
//                     <div className="text-center py-8">
//                       <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
//                       <p className="text-gray-500">No saved properties yet</p>
//                       <button
//                         onClick={() => router.push("/properties")}
//                         className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
//                       >
//                         Browse Properties
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       {savedProperties.slice(0, 2).map((property) => (
//                         <PropertyCard
//                           key={property._id || property.id}
//                           property={property}
//                           onRemove={handleRemoveProperty}
//                           isRemoving={loadingStates.removeProperty === (property._id || property.id)}
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </DashboardSection>
//               </div>

//               <div className="space-y-6">
//                 <DashboardSection title="Quick Actions" description="Common actions" icon={Activity}>
//                   <div className="space-y-3">
//                     {QUICK_ACTIONS.map((action, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => handleQuickAction(action)}
//                         className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
//                       >
//                         <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
//                           <action.icon className="w-5 h-5 text-white" />
//                         </div>
//                         <span className="font-medium text-gray-700">{action.label}</span>
//                       </button>
//                     ))}
//                   </div>
//                 </DashboardSection>

//                 <DashboardSection title="Account Status" description="Your account details" icon={Shield}>
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
//                       <span className="text-sm font-medium text-green-700">Email Verified</span>
//                       <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
//                         <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                         </svg>
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
//                       <span className="text-sm font-medium text-gray-600">Account Type</span>
//                       <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
//                         {user.role || "User"}
//                       </span>
//                     </div>
//                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
//                       <span className="text-sm font-medium text-gray-600">Last Login</span>
//                       <span className="text-sm text-gray-500">Today</span>
//                     </div>
//                   </div>
//                 </DashboardSection>
//               </div>
//             </div>
//           </>
//         )}

//         {/* ==================== PROFILE TAB ==================== */}
//         {activeTab === "profile" && (
//           <DashboardSection
//             title="Profile Information"
//             description="Manage your personal information"
//             icon={User}
//             headerRight={
//               !editMode && (
//                 <button
//                   onClick={() => setEditMode(true)}
//                   className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
//                 >
//                   <Edit3 className="w-4 h-4" />
//                   Edit Profile
//                 </button>
//               )
//             }
//           >
//             {editMode && (
//               <div className="mb-8 pb-6 border-b border-gray-100">
//                 <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-4">
//                   <Camera className="w-4 h-4" />
//                   Profile Photo
//                 </label>

//                 <div className="flex items-center gap-6">
//                   <div className="relative">
//                     <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg">
//                       {imagePreview && !removeCurrentAvatar ? (
//                         <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
//                       ) : (
//                         firstLetter
//                       )}
//                     </div>

//                     {(imageFile || (imagePreview && !removeCurrentAvatar)) && (
//                       <button
//                         onClick={handleRemoveImage}
//                         disabled={isUpdating}
//                         className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>

//                   <div className="flex-1">
//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       accept={ALLOWED_IMAGE_TYPES.join(",")}
//                       onChange={handleImageSelect}
//                       className="hidden"
//                     />

//                     <div className="flex flex-wrap gap-3">
//                       <button
//                         onClick={() => fileInputRef.current?.click()}
//                         disabled={isUpdating}
//                         className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
//                       >
//                         <Upload className="w-4 h-4" />
//                         {imagePreview ? "Change Photo" : "Upload Photo"}
//                       </button>

//                       {currentAvatarUrl && !removeCurrentAvatar && !imageFile && (
//                         <button
//                           onClick={handleRemoveImage}
//                           disabled={isUpdating}
//                           className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           Remove
//                         </button>
//                       )}
//                     </div>

//                     <p className="mt-2 text-xs text-gray-400">JPG, PNG or WebP. Max size 5MB.</p>

//                     {imageFile && (
//                       <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
//                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
//                         New image selected: {imageFile.name}
//                       </p>
//                     )}

//                     {removeCurrentAvatar && !imageFile && (
//                       <p className="mt-1 text-xs text-orange-600 flex items-center gap-1">
//                         <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
//                         Current avatar will be removed
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
//                   <User className="w-4 h-4" />
//                   Full Name
//                 </label>
//                 {editMode ? (
//                   <input
//                     value={form.name}
//                     onChange={(e) => handleFormChange("name", e.target.value)}
//                     className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
//                     disabled={isUpdating}
//                     placeholder="Enter your name"
//                   />
//                 ) : (
//                   <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">{user.name}</p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
//                   <Mail className="w-4 h-4" />
//                   Email Address
//                 </label>
//                 <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 rounded-xl">
//                   <p className="text-gray-900 font-medium">{user.email}</p>
//                   <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
//                     <Shield className="w-3 h-3" />
//                     Verified
//                   </span>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
//                   <Phone className="w-4 h-4" />
//                   Phone Number
//                 </label>
//                 {editMode ? (
//                   <input
//                     value={form.phone}
//                     onChange={(e) => handleFormChange("phone", e.target.value)}
//                     placeholder="+971 XX XXX XXXX"
//                     className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
//                     disabled={isUpdating}
//                   />
//                 ) : (
//                   <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">
//                     {user.phone || "Not provided"}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
//                   <MapPin className="w-4 h-4" />
//                   Location
//                 </label>
//                 {editMode ? (
//                   <input
//                     value={form.location}
//                     onChange={(e) => handleFormChange("location", e.target.value)}
//                     placeholder="Dubai, UAE"
//                     className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
//                     disabled={isUpdating}
//                   />
//                 ) : (
//                   <p className="text-gray-900 font-medium py-3 px-4 bg-gray-50 rounded-xl">
//                     {user.location || "Not provided"}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {editMode && (
//               <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
//                 <button
//                   onClick={handleUpdateProfile}
//                   disabled={isUpdating}
//                   className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//                   {isUpdating ? "Saving..." : "Save Changes"}
//                 </button>
//                 <button
//                   onClick={handleCancelEdit}
//                   disabled={isUpdating}
//                   className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
//                 >
//                   <X className="w-4 h-4" />
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </DashboardSection>
//         )}

//         {/* ==================== SAVED PROPERTIES TAB ==================== */}
//         {activeTab === "saved" && (
//           <DashboardSection
//             title="Saved Properties"
//             description={`${savedProperties.length} properties saved`}
//             icon={Heart}
//             headerRight={
//               <button
//                 onClick={() => router.push("/properties")}
//                 className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
//               >
//                 <Building2 className="w-4 h-4" />
//                 Browse More
//               </button>
//             }
//           >
//             {savedProperties.length === 0 ? (
//               <EmptyState
//                 icon={Heart}
//                 title="No saved properties yet"
//                 description="Start exploring and save properties you love to see them here"
//                 action={
//                   <button
//                     onClick={() => router.push("/properties")}
//                     className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-md"
//                   >
//                     <Building2 className="w-5 h-5" />
//                     Explore Properties
//                   </button>
//                 }
//               />
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {savedProperties.map((property) => (
//                   <PropertyCard
//                     key={property._id || property.id}
//                     property={property}
//                     onRemove={handleRemoveProperty}
//                     isRemoving={loadingStates.removeProperty === (property._id || property.id)}
//                   />
//                 ))}
//               </div>
//             )}
//           </DashboardSection>
//         )}

//         {/* ==================== SETTINGS TAB ==================== */}
//         {activeTab === "settings" && (
//           <DashboardSection title="Settings" description="Manage your account preferences" icon={Settings}>
//             <EmptyState
//               icon={Settings}
//               title="Coming Soon"
//               description="We're working on bringing you more settings and customization options"
//             />
//           </DashboardSection>
//         )}

//         {/* ==================== Footer ==================== */}
//         <footer className="text-center text-sm text-gray-500 mt-8 flex items-center justify-center gap-2">
//           <TrendingUp className="w-4 h-4 text-amber-500" />
//           User Dashboard - Manage your properties efficiently
//         </footer>
//       </div>
//     </div>
//   );
// }