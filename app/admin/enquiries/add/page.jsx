"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Search,
  ChevronDown,
  MapPin,
  User,
  Loader2,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  Plus,
  X,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Building2,
  DollarSign,
  Star,
  Eye,
  ExternalLink,
  Filter,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  MoreVertical,
  UserPlus,
  Tag,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== AUTH HELPERS ====================
const getCurrentSessionType = () => {
  if (typeof window === "undefined") return null;
  const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  const userToken = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (adminToken) return "admin";
  if (userToken) return "user";
  return null;
};

const logoutAll = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("userToken");
  localStorage.removeItem("token");
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("userToken");
  sessionStorage.removeItem("token");
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: "New", label: "New", color: "bg-blue-100 text-blue-800", icon: Star },
  { value: "In Progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "Contacted", label: "Contacted", color: "bg-purple-100 text-purple-800", icon: Phone },
  { value: "Qualified", label: "Qualified", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "Lost", label: "Lost", color: "bg-red-100 text-red-800", icon: XCircle },
  { value: "Converted", label: "Converted", color: "bg-emerald-100 text-emerald-800", icon: ArrowUpRight },
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "Medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "High", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "Urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

const QUALITY_OPTIONS = [
  { value: "Hot", label: "Hot", color: "bg-red-100 text-red-800", icon: Flame },
  { value: "Warm", label: "Warm", color: "bg-orange-100 text-orange-800", icon: Thermometer },
  { value: "Cold", label: "Cold", color: "bg-blue-100 text-blue-800", icon: Snowflake },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID", key: "id" },
  { id: "contact", label: "Contact", key: "contact_id" },
  { id: "type", label: "Type", key: "type" },
  { id: "source", label: "Source", key: "source" },
  { id: "status", label: "Status", key: "status" },
  { id: "priority", label: "Priority", key: "priority" },
  { id: "quality", label: "Quality", key: "quality" },
  { id: "agent", label: "Agent", key: "agent_id" },
  { id: "property", label: "Property", key: "property_id" },
  { id: "project", label: "Project", key: "project_id" },
  { id: "message", label: "Message", key: "message" },
  { id: "price_range", label: "Price Range", key: "price_min" },
  { id: "bedrooms", label: "Bedrooms", key: "bedroom_min" },
  { id: "lead_status", label: "Lead Status", key: "lead_status" },
  { id: "contact_date", label: "Contact Date", key: "contact_date" },
  { id: "created_at", label: "Created", key: "created_at" },
];

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: { background: "#10B981", color: "#fff", fontWeight: "500" },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: { background: "#EF4444", color: "#fff", fontWeight: "500" },
  });
};

// ==================== STATS CARD COMPONENT ====================
function StatsCard({ title, value, icon: Icon, color, subValue }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function EnquiriesPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Page state
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "contact", "type", "source", "status", "priority", "quality", "message", "created_at"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [selectedEnquiries, setSelectedEnquiries] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const isFirstLoad = useRef(true);
  const loadingToastRef = useRef(null);

  // ==================== AUTHENTICATION ====================
  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();
      if (sessionType !== "admin") {
        showError("Please login as admin to access this page");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        console.error("Token verification error:", verifyError);
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.userType !== "admin") {
          showError("Invalid session type. Please login as admin.");
          handleAuthFailure();
          return;
        }

        setAdmin({
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || "admin",
          userType: payload.userType,
        });
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        console.error("Token decode error:", e);
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToast = toast.loading("Logging out...", { position: "top-right" });

    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      toast.dismiss(logoutToast);
      showSuccess("Logged out successfully");
    } catch (err) {
      toast.dismiss(logoutToast);
      showError("Logout failed. Please try again.");
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // ==================== API HELPERS ====================
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();
    if (!token) {
      window.location.href = "/admin/login";
      throw new Error("Please login to continue");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logoutAll();
      window.location.href = "/admin/login";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  // ==================== FETCH ENQUIRIES ====================
  const fetchEnquiries = useCallback(async (options = {}) => {
    const { isRefresh = false, showToast = true } = options;

    try {
      setError(null);

      if (isFirstLoad.current) {
        setInitialLoading(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (showToast && !isFirstLoad.current) {
        loadingToastRef.current = toast.loading(
          isRefresh ? "Refreshing enquiries..." : "Loading enquiries...",
          { position: "top-right" }
        );
      }

      const params = new URLSearchParams();

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (qualityFilter !== "all") params.append("quality", qualityFilter);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      if (activeTab === "my" && admin) params.append("agent_id", admin.id);
      if (activeTab === "new") params.append("status", "New");
      if (activeTab === "hot") params.append("quality", "Hot");
      if (activeTab === "converted") params.append("status", "Converted");

      params.append("page", currentPage.toString());
      params.append("limit", showCount.toString());

      const token = getAdminToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/enquiries/list?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
      }

      if (response.data.success) {
        const enquiriesData = response.data.data || [];
        setEnquiries(enquiriesData);
        setTotal(response.data.total || enquiriesData.length);

        if (isRefresh && showToast) {
          showSuccess(`${enquiriesData.length} enquiries loaded`);
        }
      } else {
        setEnquiries([]);
        setTotal(0);
      }

      isFirstLoad.current = false;
    } catch (err) {
      console.error("Fetch enquiries error:", err);

      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
      }

      if (err.response?.status === 401) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
      } else {
        const errorMsg = err.response?.data?.message || "Failed to load enquiries";
        setError(errorMsg);
        showError(errorMsg);
      }
    } finally {
      setInitialLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, statusFilter, priorityFilter, qualityFilter, debouncedSearch, currentPage, showCount, admin, handleAuthFailure]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      const token = getAdminToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/enquiries/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  // ==================== DELETE HANDLERS ====================
  const handleDelete = useCallback(async (id) => {
    const deleteToast = toast.loading("Deleting enquiry...", { position: "top-right" });
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/enquiries/delete/${id}`, { method: "DELETE" });
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);

      toast.dismiss(deleteToast);
      showSuccess("Enquiry deleted successfully!");

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting enquiry");
    } finally {
      setDeleteLoading(null);
    }
  }, [apiRequest]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  }, [deleteTarget, handleDelete]);

  const bulkDeleteEnquiries = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete ${selectedEnquiries.size} enquiries?`)) return;

    const deleteToast = toast.loading("Deleting enquiries...", { position: "top-right" });
    try {
      setLoading(true);
      await apiRequest("/api/v1/enquiries/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedEnquiries) }),
      });

      toast.dismiss(deleteToast);
      setEnquiries((prev) => prev.filter((e) => !selectedEnquiries.has(e.id)));
      setTotal((prev) => Math.max(0, prev - selectedEnquiries.size));
      const deletedCount = selectedEnquiries.size;
      setSelectedEnquiries(new Set());
      showSuccess(`${deletedCount} enquiries deleted successfully!`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.dismiss(deleteToast);
      showError("Error deleting some enquiries");
    } finally {
      setLoading(false);
    }
  }, [selectedEnquiries, apiRequest]);

  // ==================== STATUS UPDATE ====================
  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      await apiRequest(`/api/v1/enquiries/status/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      showSuccess("Status updated successfully");
    } catch (err) {
      console.error("Update status error:", err);
      showError("Failed to update status");
    }
  }, [apiRequest]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEnquiries({ showToast: false });
      fetchStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isFirstLoad.current) {
      setCurrentPage(1);
      fetchEnquiries({ showToast: true });
    }
  }, [activeTab, statusFilter, priorityFilter, qualityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (isAuthenticated && !isFirstLoad.current) {
      setCurrentPage(1);
      fetchEnquiries({ showToast: true });
    }
  }, [debouncedSearch]);

  // ==================== HANDLERS ====================
  const handleEdit = useCallback((id) => {
    window.location.href = `/admin/enquiries/edit/${id}`;
  }, []);

  const handleView = useCallback((id) => {
    window.location.href = `/admin/enquiries/view/${id}`;
  }, []);

  const handleAddEnquiry = useCallback(() => {
    window.location.href = "/admin/enquiries/add";
  }, []);

  const handleRefresh = useCallback(() => {
    fetchEnquiries({ isRefresh: true, showToast: true });
    fetchStats();
  }, [fetchEnquiries, fetchStats]);

  const handleExport = useCallback(() => {
    const headers = ["ID", "Type", "Source", "Status", "Priority", "Quality", "Message", "Created At"];
    const csvData = enquiries.map((e) => [
      e.id,
      e.type || "",
      e.source || "",
      e.status || "",
      e.priority || "",
      e.quality || "",
      `"${(e.message || "").replace(/"/g, '""')}"`,
      e.created_at || "",
    ]);

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `enquiries_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("Export completed!");
  }, [enquiries]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatPrice = useCallback((min, max) => {
    if (!min && !max) return "-";
    const format = (val) =>
      new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        minimumFractionDigits: 0,
      }).format(val);

    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
    return "-";
  }, []);

  const toggleColumn = useCallback((columnId) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  const isVisible = useCallback((columnId) => visibleColumns.has(columnId), [visibleColumns]);

  const toggleSelectAll = useCallback(() => {
    if (selectedEnquiries.size === paginatedEnquiries.length) {
      setSelectedEnquiries(new Set());
    } else {
      setSelectedEnquiries(new Set(paginatedEnquiries.map((e) => e.id)));
    }
  }, [selectedEnquiries.size]);

  const toggleSelect = useCallback((id) => {
    setSelectedEnquiries((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ==================== COMPUTED VALUES ====================
  const filteredEnquiries = useMemo(() => {
    return Array.isArray(enquiries) ? enquiries.filter((e) => e && e.id) : [];
  }, [enquiries]);

  const paginatedEnquiries = useMemo(() => {
    return filteredEnquiries;
  }, [filteredEnquiries]);

  const totalPages = Math.ceil(total / showCount);

  // ==================== LOADING STATES ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (initialLoading) {
    return (
      <>
        <Toaster position="top-right" />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="p-3">
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-4 text-gray-600 font-medium">Loading enquiries...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} gutter={8} />

      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-gray-100 pt-4">
        {/* Delete Modal */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Delete Enquiry</h3>
                <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this enquiry? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Dropdown Modal */}
        {showOverviewDropdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0" onClick={() => setShowOverviewDropdown(false)} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-300">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-800">Show / Hide Columns</h3>
                <button onClick={() => setShowOverviewDropdown(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ALL_COLUMNS.map((col) => (
                    <label key={col.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.id)}
                        onChange={() => toggleColumn(col.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowOverviewDropdown(false);
                      showSuccess("Columns updated successfully");
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
              <StatsCard
                title="Total Enquiries"
                value={stats.total || 0}
                icon={MessageSquare}
                color="bg-blue-100 text-blue-600"
              />
              <StatsCard
                title="Today"
                value={stats.today || 0}
                icon={Calendar}
                color="bg-green-100 text-green-600"
              />
              <StatsCard
                title="This Week"
                value={stats.thisWeek || 0}
                icon={TrendingUp}
                color="bg-purple-100 text-purple-600"
              />
              <StatsCard
                title="This Month"
                value={stats.thisMonth || 0}
                icon={Clock}
                color="bg-orange-100 text-orange-600"
              />
              <StatsCard
                title="Hot Leads"
                value={stats.byQuality?.Hot || 0}
                icon={Flame}
                color="bg-red-100 text-red-600"
              />
              <StatsCard
                title="Converted"
                value={stats.byStatus?.Converted || 0}
                icon={CheckCircle}
                color="bg-emerald-100 text-emerald-600"
              />
            </div>
          )}

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddEnquiry}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Enquiry
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  onClick={handleExport}
                  disabled={enquiries.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search enquiries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>

                <button
                  onClick={() => setShowOverviewDropdown(!showOverviewDropdown)}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded hover:opacity-90"
                >
                  Overview
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {[
                  { key: "all", label: "All Enquiries" },
                  { key: "new", label: "New" },
                  { key: "hot", label: "Hot Leads" },
                  { key: "converted", label: "Converted" },
                  { key: "my", label: "My Enquiries" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    disabled={loading}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-50 ${
                      activeTab === t.key
                        ? "bg-gray-800 border-gray-800 text-white font-medium"
                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="all">All Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="all">All Priority</option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>

                <select
                  value={qualityFilter}
                  onChange={(e) => setQualityFilter(e.target.value)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="all">All Quality</option>
                  {QUALITY_OPTIONS.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">Show</span>
              <select
                value={showCount}
                onChange={(e) => {
                  setShowCount(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="ml-2">entries</span>
              <span className="ml-4 text-gray-500">
                Total: {total} enquiries
                {loading && !refreshing && (
                  <span className="ml-2 inline-flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedEnquiries.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 border-t-0 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-blue-900">
                <strong>{selectedEnquiries.size}</strong> enquiries selected
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedEnquiries(new Set())} className="text-sm underline text-blue-700">
                  Clear Selection
                </button>
                <button
                  onClick={bulkDeleteEnquiries}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-gray-300 border-t-0 relative" style={{ backgroundColor: "rgb(236,237,238)" }}>
            {(loading || refreshing) && filteredEnquiries.length > 0 && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-gray-700 font-medium">{refreshing ? "Refreshing..." : "Loading..."}</span>
                </div>
              </div>
            )}

            {filteredEnquiries.length === 0 && !loading ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No enquiries found</p>
                {debouncedSearch && <p className="text-sm text-gray-500 mt-1">Try a different search term</p>}
                <button
                  onClick={handleAddEnquiry}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add New Enquiry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ backgroundColor: "rgb(236,237,238)" }}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.size === paginatedEnquiries.length && paginatedEnquiries.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("id") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>}
                      {isVisible("contact") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Contact</th>}
                      {isVisible("type") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>}
                      {isVisible("source") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Source</th>}
                      {isVisible("status") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>}
                      {isVisible("priority") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Priority</th>}
                      {isVisible("quality") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Quality</th>}
                      {isVisible("agent") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Agent</th>}
                      {isVisible("message") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Message</th>}
                      {isVisible("price_range") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price Range</th>}
                      {isVisible("bedrooms") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Bedrooms</th>}
                      {isVisible("created_at") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEnquiries.map((enquiry) => {
                      const statusInfo = STATUS_OPTIONS.find((s) => s.value === enquiry.status) || STATUS_OPTIONS[0];
                      const priorityInfo = PRIORITY_OPTIONS.find((p) => p.value === enquiry.priority);
                      const qualityInfo = QUALITY_OPTIONS.find((q) => q.value === enquiry.quality);

                      return (
                        <tr key={enquiry.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEnquiries.has(enquiry.id)}
                              onChange={() => toggleSelect(enquiry.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button onClick={() => handleEdit(enquiry.id)} className="text-blue-600 hover:underline text-sm font-medium">
                                #{enquiry.id}
                              </button>
                            </td>
                          )}
                          {isVisible("contact") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {enquiry.contact_id ? `#${enquiry.contact_id}` : "-"}
                            </td>
                          )}
                          {isVisible("type") && (
                            <td className="px-4 py-3 text-sm text-gray-600">{enquiry.type || "-"}</td>
                          )}
                          {isVisible("source") && (
                            <td className="px-4 py-3 text-sm text-gray-600">{enquiry.source || "-"}</td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <select
                                value={enquiry.status || "New"}
                                onChange={(e) => updateStatus(enquiry.id, e.target.value)}
                                className={`text-xs font-medium px-2 py-1 rounded ${statusInfo.color} border-0 cursor-pointer`}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                          )}
                          {isVisible("priority") && (
                            <td className="px-4 py-3">
                              {priorityInfo ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                                  {priorityInfo.label}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("quality") && (
                            <td className="px-4 py-3">
                              {qualityInfo ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${qualityInfo.color}`}>
                                  {qualityInfo.icon && <qualityInfo.icon className="w-3 h-3" />}
                                  {qualityInfo.label}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("agent") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {enquiry.agent_id ? (
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  #{enquiry.agent_id}
                                </span>
                              ) : (
                                <span className="text-gray-400">Unassigned</span>
                              )}
                            </td>
                          )}
                          {isVisible("message") && (
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                              <span className="truncate block" title={enquiry.message}>
                                {enquiry.message?.substring(0, 50) || "-"}
                                {enquiry.message?.length > 50 ? "..." : ""}
                              </span>
                            </td>
                          )}
                          {isVisible("price_range") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatPrice(enquiry.price_min, enquiry.price_max)}
                            </td>
                          )}
                          {isVisible("bedrooms") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {enquiry.bedroom_min || enquiry.bedroom_max
                                ? `${enquiry.bedroom_min || "?"} - ${enquiry.bedroom_max || "?"}`
                                : "-"}
                            </td>
                          )}
                          {isVisible("created_at") && (
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(enquiry.created_at)}</td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(enquiry.id)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(enquiry.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ id: enquiry.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === enquiry.id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === enquiry.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredEnquiries.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to {Math.min(currentPage * showCount, total)} of {total} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1.5 border rounded text-sm disabled:opacity-50 ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
