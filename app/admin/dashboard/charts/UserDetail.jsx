"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Eye,
  Trash2,
  BarChart3,
  Calendar,
  User,
  Edit3,
  Loader2,
  Search,
  AlertCircle,
  Send,
  RefreshCw,
  CheckCircle,
  Monitor,
  Globe,
  Smartphone,
  Tablet,
  Chrome,
  TrendingUp,
  MousePointer,
  Clock,
  Filter,
  Download,
  PieChart,
  Activity,
  Users,
  FileText,
  MapPin,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminToken } from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== EVENT TYPE CONFIGURATIONS ====================
const EVENT_TYPE_CONFIG = {
  page_view: { label: "Page View", color: "bg-blue-100 text-blue-700", icon: Eye },
  click: { label: "Click", color: "bg-purple-100 text-purple-700", icon: MousePointer },
  form_submit: { label: "Form Submit", color: "bg-green-100 text-green-700", icon: Send },
  download: { label: "Download", color: "bg-indigo-100 text-indigo-700", icon: Download },
  video_play: { label: "Video Play", color: "bg-pink-100 text-pink-700", icon: Activity },
  signup: { label: "Sign Up", color: "bg-emerald-100 text-emerald-700", icon: Users },
  login: { label: "Login", color: "bg-cyan-100 text-cyan-700", icon: User },
  logout: { label: "Logout", color: "bg-gray-100 text-gray-700", icon: User },
  purchase: { label: "Purchase", color: "bg-yellow-100 text-yellow-700", icon: Zap },
  search: { label: "Search", color: "bg-orange-100 text-orange-700", icon: Search },
  scroll: { label: "Scroll", color: "bg-teal-100 text-teal-700", icon: Activity },
  share: { label: "Share", color: "bg-rose-100 text-rose-700", icon: Zap },
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const VALID_EVENT_TYPES = ['page_view', 'click', 'form_submit', 'download', 'video_play', 'signup', 'login', 'logout', 'purchase', 'search', 'scroll', 'share'];
const VALID_CATEGORIES = ['engagement', 'conversion', 'navigation', 'error', 'performance', 'user_action'];
const VALID_DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];

// ==================== INITIAL FORM STATE ====================
const INITIAL_FORM_STATE = {
  event_type: "page_view",
  event_name: "",
  category: "",
  user_id: "",
  user_name: "",
  session_id: "",
  page_url: "",
  page_title: "",
  referrer: "",
  device_type: "desktop",
  browser: "",
  os: "",
  screen_resolution: "",
  country: "",
  city: "",
  ip_address: "",
  duration: "",
  status: "recorded",
};

// ==================== MAIN COMPONENT ====================
export default function AnalyticsDashboard() {
  // ==================== STATE ====================
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Action Loading States
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // ==================== API HELPER ====================
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }, []);

  // ==================== FETCH ANALYTICS ====================
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`/api/v1/analytics`);

      if (data.success) {
        setAnalytics(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/v1/analytics/stats`);

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [apiRequest]);

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    fetchAnalytics();
    fetchStats();
  }, [fetchAnalytics, fetchStats]);

  // ==================== FORM VALIDATION ====================
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.event_type?.trim()) {
      errors.event_type = "Event type is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ==================== MODAL HANDLERS ====================
  const openCreateModal = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((event) => {
    setFormData({
      event_type: event.event_type || "page_view",
      event_name: event.event_name || "",
      category: event.category || "",
      user_id: event.user_id?.toString() || "",
      user_name: event.user_name || "",
      session_id: event.session_id || "",
      page_url: event.page_url || "",
      page_title: event.page_title || "",
      referrer: event.referrer || "",
      device_type: event.device_type || "desktop",
      browser: event.browser || "",
      os: event.os || "",
      screen_resolution: event.screen_resolution || "",
      country: event.country || "",
      city: event.city || "",
      ip_address: event.ip_address || "",
      duration: event.duration?.toString() || "",
      status: event.status || "recorded",
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingId(event.id);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsEditing(false);
    setEditingId(null);
  }, []);

  // ==================== FORM CHANGE HANDLER ====================
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // ==================== CREATE EVENT ====================
  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        event_type: formData.event_type,
        event_name: formData.event_name?.trim() || null,
        category: formData.category?.trim() || null,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
        user_name: formData.user_name?.trim() || null,
        session_id: formData.session_id?.trim() || null,
        page_url: formData.page_url?.trim() || null,
        page_title: formData.page_title?.trim() || null,
        referrer: formData.referrer?.trim() || null,
        device_type: formData.device_type || null,
        browser: formData.browser?.trim() || null,
        os: formData.os?.trim() || null,
        screen_resolution: formData.screen_resolution?.trim() || null,
        country: formData.country?.trim() || null,
        city: formData.city?.trim() || null,
        ip_address: formData.ip_address?.trim() || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        status: formData.status || "recorded",
      };

      const data = await apiRequest("/api/v1/analytics/track", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setAnalytics((prev) => [data.data, ...prev]);
        toast.success("Analytics event recorded! 📊");
        closeModal();
        fetchStats();
      }
    } catch (err) {
      console.error("Create error:", err);
      toast.error(err.message || "Failed to record event");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, validateForm, apiRequest, closeModal, fetchStats]);

  // ==================== UPDATE EVENT ====================
  const handleUpdate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        event_type: formData.event_type,
        event_name: formData.event_name?.trim() || null,
        category: formData.category?.trim() || null,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
        user_name: formData.user_name?.trim() || null,
        session_id: formData.session_id?.trim() || null,
        page_url: formData.page_url?.trim() || null,
        page_title: formData.page_title?.trim() || null,
        referrer: formData.referrer?.trim() || null,
        device_type: formData.device_type || null,
        browser: formData.browser?.trim() || null,
        os: formData.os?.trim() || null,
        screen_resolution: formData.screen_resolution?.trim() || null,
        country: formData.country?.trim() || null,
        city: formData.city?.trim() || null,
        ip_address: formData.ip_address?.trim() || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        status: formData.status || "recorded",
      };

      const data = await apiRequest(`/api/v1/analytics/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setAnalytics((prev) =>
          prev.map((e) => (e.id === editingId ? data.data : e))
        );
        toast.success("Event updated successfully! ✏️");
        closeModal();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Failed to update event");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, editingId, validateForm, apiRequest, closeModal]);

  // ==================== DELETE EVENT ====================
  const handleDelete = useCallback(async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeleteLoading(id);
    try {
      const data = await apiRequest(`/api/v1/analytics/${id}`, {
        method: "DELETE",
      });

      if (data.success) {
        setAnalytics((prev) => prev.filter((e) => e.id !== id));
        toast.success("Event deleted! 🗑️");
        fetchStats();

        if (viewingEvent?.id === id) {
          setViewingEvent(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete event");
    } finally {
      setDeleteLoading(null);
    }
  }, [apiRequest, fetchStats, viewingEvent]);

  // ==================== CLEANUP OLD ANALYTICS ====================
  const handleCleanup = useCallback(async (days = 90) => {
    if (!confirm(`Are you sure you want to delete analytics older than ${days} days?`)) return;

    setCleanupLoading(true);
    try {
      const data = await apiRequest(`/api/v1/analytics/cleanup/old?days=${days}`, {
        method: "DELETE",
      });

      if (data.success) {
        toast.success(data.message);
        fetchAnalytics();
        fetchStats();
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      toast.error(err.message || "Failed to cleanup analytics");
    } finally {
      setCleanupLoading(false);
    }
  }, [apiRequest, fetchAnalytics, fetchStats]);

  // ==================== VIEW EVENT ====================
  const handleView = useCallback((event) => {
    setViewingEvent(event);
  }, []);

  // ==================== REFRESH ====================
  const handleRefresh = useCallback(() => {
    fetchAnalytics();
    fetchStats();
    toast.success("Refreshed!");
  }, [fetchAnalytics, fetchStats]);

  // ==================== UTILITY FUNCTIONS ====================
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getTimeAgo = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(dateString);
  }, [formatDateTime]);

  const getEventTypeConfig = useCallback((eventType) => {
    return EVENT_TYPE_CONFIG[eventType] || { label: eventType || "Unknown", color: "bg-gray-100 text-gray-700", icon: Activity };
  }, []);

  const formatDuration = useCallback((seconds) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  // ==================== FILTERED ANALYTICS ====================
  const filteredAnalytics = useMemo(() => {
    let filtered = [...analytics];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.event_name?.toLowerCase().includes(term) ||
          event.page_url?.toLowerCase().includes(term) ||
          event.page_title?.toLowerCase().includes(term) ||
          event.user_name?.toLowerCase().includes(term)
      );
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((event) => event.event_type === eventTypeFilter);
    }

    // Device filter
    if (deviceFilter !== "all") {
      filtered = filtered.filter((event) => event.device_type === deviceFilter);
    }

    return filtered;
  }, [analytics, searchTerm, eventTypeFilter, deviceFilter]);

  // ==================== RENDER ====================
  return (
    <>
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Analytics Dashboard</h2>
            {stats && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {stats.overview?.total_events || 0} events
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                  {stats.overview?.unique_users || 0} users
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${showFilters ? 'bg-gray-100' : ''}`}
              title="Filters"
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>

            <button
              onClick={() => handleCleanup(90)}
              disabled={cleanupLoading}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 disabled:opacity-50"
              title="Cleanup old data"
            >
              {cleanupLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Track Event
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Today</p>
                  <p className="text-sm font-semibold text-gray-800">{stats.overview?.today_events || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">This Week</p>
                  <p className="text-sm font-semibold text-gray-800">{stats.overview?.week_events || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sessions</p>
                  <p className="text-sm font-semibold text-gray-800">{stats.overview?.total_sessions || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Duration</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {stats.overview?.avg_duration ? formatDuration(Math.round(stats.overview.avg_duration)) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>

              {/* Event Type Filter */}
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="all">All Events</option>
                {VALID_EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getEventTypeConfig(type).label}
                  </option>
                ))}
              </select>

              {/* Device Filter */}
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="all">All Devices</option>
                {VALID_DEVICE_TYPES.map((device) => (
                  <option key={device} value={device}>
                    {device.charAt(0).toUpperCase() + device.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-4 py-3">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : filteredAnalytics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No analytics data found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm || eventTypeFilter !== "all" || deviceFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start tracking events to see analytics"}
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAnalytics.map((event) => {
                const eventConfig = getEventTypeConfig(event.event_type);
                const EventIcon = eventConfig.icon;
                const DeviceIcon = DEVICE_ICONS[event.device_type] || Monitor;

                return (
                  <li
                    key={event.id}
                    className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg ${eventConfig.color} flex items-center justify-center flex-shrink-0`}>
                      <EventIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {event.event_name || event.page_title || eventConfig.label}
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(event.created_at)}
                            </span>

                            {event.user_name && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {event.user_name}
                                </span>
                              </>
                            )}

                            {event.device_type && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-purple-600 flex items-center gap-1">
                                  <DeviceIcon className="w-3 h-3" />
                                  {event.device_type}
                                </span>
                              </>
                            )}

                            {event.country && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.country}
                                </span>
                              </>
                            )}

                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${eventConfig.color}`}>
                              {eventConfig.label}
                            </span>
                          </div>

                          {/* Page URL */}
                          {event.page_url && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {event.page_url}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {/* View */}
                          <button
                            onClick={() => handleView(event)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deleteLoading === event.id}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleteLoading === event.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* =========== CREATE/EDIT MODAL =========== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md">
                  {isEditing ? <Edit3 className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {isEditing ? "Edit Analytics Event" : "Track New Event"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isEditing ? "Update event details" : "Record a new analytics event"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Row 1: Event Type & Event Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => handleFormChange("event_type", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm ${
                      formErrors.event_type ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    {VALID_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {getEventTypeConfig(type).label}
                      </option>
                    ))}
                  </select>
                  {formErrors.event_type && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.event_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={formData.event_name}
                    onChange={(e) => handleFormChange("event_name", e.target.value)}
                    placeholder="e.g., Button Click - CTA"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Category & Device Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange("category", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  >
                    <option value="">Select Category</option>
                    {VALID_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Device Type
                  </label>
                  <select
                    value={formData.device_type}
                    onChange={(e) => handleFormChange("device_type", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  >
                    {VALID_DEVICE_TYPES.map((device) => (
                      <option key={device} value={device}>
                        {device.charAt(0).toUpperCase() + device.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Page URL & Page Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Page URL
                  </label>
                  <input
                    type="text"
                    value={formData.page_url}
                    onChange={(e) => handleFormChange("page_url", e.target.value)}
                    placeholder="https://example.com/page"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={formData.page_title}
                    onChange={(e) => handleFormChange("page_title", e.target.value)}
                    placeholder="Page title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 4: User Name & User ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    User Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.user_name}
                      onChange={(e) => handleFormChange("user_name", e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    User ID
                  </label>
                  <input
                    type="number"
                    value={formData.user_id}
                    onChange={(e) => handleFormChange("user_id", e.target.value)}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 5: Browser, OS, Screen Resolution */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Browser
                  </label>
                  <input
                    type="text"
                    value={formData.browser}
                    onChange={(e) => handleFormChange("browser", e.target.value)}
                    placeholder="Chrome, Firefox"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    OS
                  </label>
                  <input
                    type="text"
                    value={formData.os}
                    onChange={(e) => handleFormChange("os", e.target.value)}
                    placeholder="Windows, MacOS"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Screen
                  </label>
                  <input
                    type="text"
                    value={formData.screen_resolution}
                    onChange={(e) => handleFormChange("screen_resolution", e.target.value)}
                    placeholder="1920x1080"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 6: Country, City, Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleFormChange("country", e.target.value)}
                      placeholder="USA, India"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFormChange("city", e.target.value)}
                      placeholder="New York"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleFormChange("duration", e.target.value)}
                    placeholder="120"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 7: Session ID, IP Address, Referrer */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Session ID
                  </label>
                  <input
                    type="text"
                    value={formData.session_id}
                    onChange={(e) => handleFormChange("session_id", e.target.value)}
                    placeholder="abc123xyz"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => handleFormChange("ip_address", e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Referrer
                  </label>
                  <input
                    type="text"
                    value={formData.referrer}
                    onChange={(e) => handleFormChange("referrer", e.target.value)}
                    placeholder="google.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
              <button
                onClick={closeModal}
                disabled={saveLoading}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleUpdate : handleCreate}
                disabled={saveLoading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isEditing ? "Update Event" : "Track Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== VIEW EVENT MODAL =========== */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingEvent(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getEventTypeConfig(viewingEvent.event_type).color}`}>
                    {(() => {
                      const EventIcon = getEventTypeConfig(viewingEvent.event_type).icon;
                      return <EventIcon className="w-5 h-5" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Event Details</h3>
                </div>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Event Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Event Type</label>
                  <p className="text-sm text-gray-800 mt-1">{getEventTypeConfig(viewingEvent.event_type).label}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Event Name</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.event_name || "N/A"}</p>
                </div>
              </div>

              {/* Page Info */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Page URL</label>
                <p className="text-sm text-gray-800 mt-1 break-all">{viewingEvent.page_url || "N/A"}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Page Title</label>
                <p className="text-sm text-gray-800 mt-1">{viewingEvent.page_title || "N/A"}</p>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">User</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.user_name || "Anonymous"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Session ID</label>
                  <p className="text-sm text-gray-800 mt-1 font-mono text-xs">{viewingEvent.session_id || "N/A"}</p>
                </div>
              </div>

              {/* Device Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Device</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.device_type || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Browser</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.browser || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">OS</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.os || "N/A"}</p>
                </div>
              </div>

              {/* Location Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Country</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.country || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">City</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.city || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">IP Address</label>
                  <p className="text-sm text-gray-800 mt-1 font-mono text-xs">{viewingEvent.ip_address || "N/A"}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Duration</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.duration ? formatDuration(viewingEvent.duration) : "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Screen</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.screen_resolution || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingEvent.category || "N/A"}</p>
                </div>
              </div>

              {/* Referrer */}
              {viewingEvent.referrer && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Referrer</label>
                  <p className="text-sm text-gray-800 mt-1 break-all">{viewingEvent.referrer}</p>
                </div>
              )}

              {/* Metadata */}
              {viewingEvent.metadata && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Metadata</label>
                  <pre className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-2 rounded-lg overflow-auto max-h-40">
                    {typeof viewingEvent.metadata === 'string' 
                      ? viewingEvent.metadata 
                      : JSON.stringify(viewingEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Timestamp */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Recorded At</label>
                <p className="text-sm text-gray-800 mt-1">{formatDateTime(viewingEvent.created_at)}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openEditModal(viewingEvent);
                    setViewingEvent(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(viewingEvent.id)}
                  disabled={deleteLoading === viewingEvent.id}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleteLoading === viewingEvent.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
              <button
                onClick={() => setViewingEvent(null)}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}