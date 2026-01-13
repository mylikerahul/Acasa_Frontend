"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Eye,
  Trash2,
  Activity,
  Calendar,
  User,
  Edit3,
  Loader2,
  Search,
  AlertCircle,
  Send,
  RefreshCw,
  CheckCircle,
  Clock,
  Monitor,
  Folder,
  Zap,
  Filter,
  TrendingUp,
  BarChart3,
  Trash,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminToken } from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== ACTION CONFIGURATIONS ====================
const ACTION_CONFIG = {
  create: { label: "Create", color: "bg-green-100 text-green-700", icon: Plus },
  read: { label: "Read", color: "bg-blue-100 text-blue-700", icon: Eye },
  update: { label: "Update", color: "bg-yellow-100 text-yellow-700", icon: Edit3 },
  delete: { label: "Delete", color: "bg-red-100 text-red-700", icon: Trash2 },
  login: { label: "Login", color: "bg-purple-100 text-purple-700", icon: User },
  logout: { label: "Logout", color: "bg-gray-100 text-gray-700", icon: User },
  view: { label: "View", color: "bg-cyan-100 text-cyan-700", icon: Eye },
  download: { label: "Download", color: "bg-indigo-100 text-indigo-700", icon: Zap },
  upload: { label: "Upload", color: "bg-pink-100 text-pink-700", icon: Zap },
  export: { label: "Export", color: "bg-orange-100 text-orange-700", icon: Zap },
  import: { label: "Import", color: "bg-teal-100 text-teal-700", icon: Zap },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700" },
};

const VALID_ACTIONS = ['create', 'read', 'update', 'delete', 'login', 'logout', 'view', 'download', 'upload', 'export', 'import'];
const VALID_STATUSES = ['pending', 'completed', 'failed', 'cancelled'];
const VALID_MODULES = ['users', 'blogs', 'notices', 'tasks', 'settings', 'reports', 'orders', 'products', 'categories'];

// ==================== INITIAL FORM STATE ====================
const INITIAL_FORM_STATE = {
  activity_type: "",
  activity_title: "",
  activity_description: "",
  user_name: "",
  user_id: "",
  module: "",
  module_id: "",
  action: "create",
  ip_address: "",
  status: "completed",
};

// ==================== MAIN COMPONENT ====================
export default function RecentActivityBoard() {
  // ==================== STATE ====================
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Action Loading States
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
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

  // ==================== FETCH ACTIVITIES ====================
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`/api/v1/recent-activity`);

      if (data.success) {
        setActivities(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/v1/recent-activity/stats`);

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [apiRequest]);

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [fetchActivities, fetchStats]);

  // ==================== FORM VALIDATION ====================
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.activity_title?.trim() && !formData.activity_type?.trim()) {
      errors.activity_title = "Activity title or type is required";
    }

    if (formData.activity_title && formData.activity_title.trim().length > 255) {
      errors.activity_title = "Title must not exceed 255 characters";
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

  const openEditModal = useCallback((activity) => {
    setFormData({
      activity_type: activity.activity_type || "",
      activity_title: activity.activity_title || "",
      activity_description: activity.activity_description || "",
      user_name: activity.user_name || "",
      user_id: activity.user_id?.toString() || "",
      module: activity.module || "",
      module_id: activity.module_id?.toString() || "",
      action: activity.action || "create",
      ip_address: activity.ip_address || "",
      status: activity.status || "completed",
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingId(activity.id);
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

  // ==================== CREATE ACTIVITY ====================
  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        activity_type: formData.activity_type?.trim() || null,
        activity_title: formData.activity_title?.trim() || null,
        activity_description: formData.activity_description?.trim() || null,
        user_name: formData.user_name?.trim() || null,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
        module: formData.module?.trim() || null,
        module_id: formData.module_id ? parseInt(formData.module_id) : null,
        action: formData.action || null,
        ip_address: formData.ip_address?.trim() || null,
        status: formData.status || "completed",
      };

      const data = await apiRequest("/api/v1/recent-activity", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setActivities((prev) => [data.data, ...prev]);
        toast.success("Activity logged successfully! 📋");
        closeModal();
        fetchStats();
      }
    } catch (err) {
      console.error("Create error:", err);
      toast.error(err.message || "Failed to create activity");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, validateForm, apiRequest, closeModal, fetchStats]);

  // ==================== UPDATE ACTIVITY ====================
  const handleUpdate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        activity_type: formData.activity_type?.trim() || null,
        activity_title: formData.activity_title?.trim() || null,
        activity_description: formData.activity_description?.trim() || null,
        user_name: formData.user_name?.trim() || null,
        user_id: formData.user_id ? parseInt(formData.user_id) : null,
        module: formData.module?.trim() || null,
        module_id: formData.module_id ? parseInt(formData.module_id) : null,
        action: formData.action || null,
        ip_address: formData.ip_address?.trim() || null,
        status: formData.status || "completed",
      };

      const data = await apiRequest(`/api/v1/recent-activity/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setActivities((prev) =>
          prev.map((a) => (a.id === editingId ? data.data : a))
        );
        toast.success("Activity updated successfully! ✏️");
        closeModal();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Failed to update activity");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, editingId, validateForm, apiRequest, closeModal]);

  // ==================== DELETE ACTIVITY ====================
  const handleDelete = useCallback(async (id) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    setDeleteLoading(id);
    try {
      const data = await apiRequest(`/api/v1/recent-activity/${id}`, {
        method: "DELETE",
      });

      if (data.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id));
        toast.success("Activity deleted! 🗑️");
        fetchStats();

        if (viewingActivity?.id === id) {
          setViewingActivity(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete activity");
    } finally {
      setDeleteLoading(null);
    }
  }, [apiRequest, fetchStats, viewingActivity]);

  // ==================== CLEANUP OLD ACTIVITIES ====================
  const handleCleanup = useCallback(async (days = 30) => {
    if (!confirm(`Are you sure you want to delete activities older than ${days} days?`)) return;

    setCleanupLoading(true);
    try {
      const data = await apiRequest(`/api/v1/recent-activity/cleanup/old?days=${days}`, {
        method: "DELETE",
      });

      if (data.success) {
        toast.success(data.message);
        fetchActivities();
        fetchStats();
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      toast.error(err.message || "Failed to cleanup activities");
    } finally {
      setCleanupLoading(false);
    }
  }, [apiRequest, fetchActivities, fetchStats]);

  // ==================== VIEW ACTIVITY ====================
  const handleView = useCallback((activity) => {
    setViewingActivity(activity);
  }, []);

  // ==================== REFRESH ====================
  const handleRefresh = useCallback(() => {
    fetchActivities();
    fetchStats();
    toast.success("Refreshed!");
  }, [fetchActivities, fetchStats]);

  // ==================== UTILITY FUNCTIONS ====================
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

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
    return formatDate(dateString);
  }, [formatDate]);

  const getActionConfig = useCallback((action) => {
    return ACTION_CONFIG[action] || { label: action || "Unknown", color: "bg-gray-100 text-gray-700", icon: Activity };
  }, []);

  const getStatusConfig = useCallback((status) => {
    return STATUS_CONFIG[status] || { label: status || "Unknown", color: "bg-gray-100 text-gray-700" };
  }, []);

  // ==================== FILTERED ACTIVITIES ====================
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.activity_title?.toLowerCase().includes(term) ||
          activity.activity_description?.toLowerCase().includes(term) ||
          activity.user_name?.toLowerCase().includes(term) ||
          activity.module?.toLowerCase().includes(term) ||
          activity.action?.toLowerCase().includes(term)
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((activity) => activity.action === actionFilter);
    }

    // Module filter
    if (moduleFilter !== "all") {
      filtered = filtered.filter((activity) => activity.module === moduleFilter);
    }

    return filtered;
  }, [activities, searchTerm, actionFilter, moduleFilter]);

  // ==================== RENDER ====================
  return (
    <>
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
            {stats && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {stats.overview?.total || 0} total
                </span>
                <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                  {stats.overview?.today || 0} today
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
              onClick={() => handleCleanup(30)}
              disabled={cleanupLoading}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 disabled:opacity-50"
              title="Cleanup old activities"
            >
              {cleanupLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Activity
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-gray-600">Last 7 days:</span>
                <span className="font-medium text-gray-800">{stats.overview?.last_week || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-gray-600">Last 30 days:</span>
                <span className="font-medium text-gray-800">{stats.overview?.last_month || 0}</span>
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
                  placeholder="Search activities..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>

              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="all">All Actions</option>
                {VALID_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </select>

              {/* Module Filter */}
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="all">All Modules</option>
                {VALID_MODULES.map((module) => (
                  <option key={module} value={module}>
                    {module.charAt(0).toUpperCase() + module.slice(1)}
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
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No activities found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm || actionFilter !== "all" || moduleFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Activities will appear here"}
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredActivities.map((activity) => {
                const actionConfig = getActionConfig(activity.action);
                const ActionIcon = actionConfig.icon;
                const statusConfig = getStatusConfig(activity.status);

                return (
                  <li
                    key={activity.id}
                    className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg ${actionConfig.color} flex items-center justify-center flex-shrink-0`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {activity.activity_title || activity.activity_type || "Activity"}
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(activity.created_at)}
                            </span>

                            {activity.user_name && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {activity.user_name}
                                </span>
                              </>
                            )}

                            {activity.module && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-purple-600 flex items-center gap-1">
                                  <Folder className="w-3 h-3" />
                                  {activity.module}
                                </span>
                              </>
                            )}

                            {activity.action && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${actionConfig.color}`}>
                                {actionConfig.label}
                              </span>
                            )}

                            {activity.status && activity.status !== 'completed' && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {activity.activity_description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              {activity.activity_description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {/* View */}
                          <button
                            onClick={() => handleView(activity)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(activity)}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(activity.id)}
                            disabled={deleteLoading === activity.id}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleteLoading === activity.id ? (
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
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md">
                  {isEditing ? <Edit3 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {isEditing ? "Edit Activity" : "Log New Activity"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isEditing ? "Update this activity log" : "Record a new activity"}
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
              {/* Row 1: Title & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Activity Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.activity_title}
                    onChange={(e) => handleFormChange("activity_title", e.target.value)}
                    placeholder="e.g., User logged in"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm ${
                      formErrors.activity_title ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {formErrors.activity_title && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.activity_title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Activity Type
                  </label>
                  <input
                    type="text"
                    value={formData.activity_type}
                    onChange={(e) => handleFormChange("activity_type", e.target.value)}
                    placeholder="e.g., authentication, crud"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Action & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Action
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => handleFormChange("action", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  >
                    {VALID_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  >
                    {VALID_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: User Name & User ID */}
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
                      placeholder="e.g., John Doe"
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
                    placeholder="e.g., 123"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 4: Module & Module ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Module
                  </label>
                  <div className="relative">
                    <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.module}
                      onChange={(e) => handleFormChange("module", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm appearance-none"
                    >
                      <option value="">Select Module</option>
                      {VALID_MODULES.map((module) => (
                        <option key={module} value={module}>
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Module ID
                  </label>
                  <input
                    type="number"
                    value={formData.module_id}
                    onChange={(e) => handleFormChange("module_id", e.target.value)}
                    placeholder="e.g., 456"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* IP Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  IP Address
                </label>
                <div className="relative">
                  <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => handleFormChange("ip_address", e.target.value)}
                    placeholder="e.g., 192.168.1.1"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.activity_description}
                  onChange={(e) => handleFormChange("activity_description", e.target.value)}
                  placeholder="Activity details..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm resize-none"
                />
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
                disabled={saveLoading || (!formData.activity_title?.trim() && !formData.activity_type?.trim())}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isEditing ? "Update Activity" : "Log Activity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== VIEW ACTIVITY MODAL =========== */}
      {viewingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingActivity(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActionConfig(viewingActivity.action).color}`}>
                    {(() => {
                      const ActionIcon = getActionConfig(viewingActivity.action).icon;
                      return <ActionIcon className="w-5 h-5" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Activity Details</h3>
                </div>
                <button
                  onClick={() => setViewingActivity(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {viewingActivity.activity_title || viewingActivity.activity_type || "Activity"}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {viewingActivity.action && (
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getActionConfig(viewingActivity.action).color}`}>
                    {getActionConfig(viewingActivity.action).label}
                  </span>
                )}
                {viewingActivity.status && (
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusConfig(viewingActivity.status).color}`}>
                    {getStatusConfig(viewingActivity.status).label}
                  </span>
                )}
                {viewingActivity.module && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                    {viewingActivity.module}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(viewingActivity.created_at)}</span>
                </div>
                {viewingActivity.user_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{viewingActivity.user_name}</span>
                  </div>
                )}
                {viewingActivity.ip_address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Monitor className="w-4 h-4" />
                    <span>{viewingActivity.ip_address}</span>
                  </div>
                )}
                {viewingActivity.module_id && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Folder className="w-4 h-4" />
                    <span>ID: {viewingActivity.module_id}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewingActivity.activity_description && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {viewingActivity.activity_description}
                  </p>
                </div>
              )}

              {/* Activity Type */}
              {viewingActivity.activity_type && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Activity Type</label>
                  <p className="text-sm text-gray-700 mt-1">{viewingActivity.activity_type}</p>
                </div>
              )}

              {/* User Agent */}
              {viewingActivity.user_agent && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">User Agent</label>
                  <p className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-2 rounded-lg break-all">
                    {viewingActivity.user_agent}
                  </p>
                </div>
              )}

              {/* Metadata */}
              {viewingActivity.metadata && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Metadata</label>
                  <pre className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-2 rounded-lg overflow-auto">
                    {typeof viewingActivity.metadata === 'string' 
                      ? viewingActivity.metadata 
                      : JSON.stringify(viewingActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openEditModal(viewingActivity);
                    setViewingActivity(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(viewingActivity.id)}
                  disabled={deleteLoading === viewingActivity.id}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleteLoading === viewingActivity.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
              <button
                onClick={() => setViewingActivity(null)}
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