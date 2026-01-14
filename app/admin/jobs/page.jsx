// app/admin/jobs/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  Briefcase,
  MapPin,
  Timer,
  Calendar,
  CheckCircle,
  AlertCircle,
  Star,
  StarOff,
  Copy,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminNavbar from "../dashboard/header/DashboardNavbar";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const DEFAULT_COLUMNS = [
  { id: "id", label: "ID", sortable: true, visible: true, width: "80px", align: "center" },
  { id: "title", label: "Job Title", sortable: true, visible: true, width: "250px" },
  { id: "city_name", label: "Location", sortable: true, visible: true, width: "150px" },
  { id: "type", label: "Type", sortable: true, visible: true, width: "120px" },
  { id: "status", label: "Status", sortable: true, visible: true, width: "100px", align: "center" },
  { id: "featured", label: "Featured", sortable: true, visible: true, width: "100px", align: "center" },
  { id: "views", label: "Views", sortable: true, visible: false, width: "80px", align: "center" },
  { id: "created_at", label: "Created", sortable: true, visible: true, width: "120px" },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
  closed: { label: "Closed", color: "bg-red-100 text-red-800" },
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800" },
};

const TYPE_CONFIG = {
  Remote: { color: "bg-purple-100 text-purple-700" },
  "Full-time": { color: "bg-blue-100 text-blue-700" },
  "Part-time": { color: "bg-amber-100 text-amber-700" },
  Contract: { color: "bg-green-100 text-green-700" },
  Freelance: { color: "bg-pink-100 text-pink-700" },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ==================== HOOKS ====================
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => toast.success(message, { duration: 3000 });
const showError = (message) => toast.error(message, { duration: 4000 });
const showLoading = (message) => toast.loading(message);

// ==================== MAIN COMPONENT ====================
export default function JobsListingPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Data State
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterFeatured, setFilterFeatured] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Columns
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Selection
  const [selectedJobs, setSelectedJobs] = useState(new Set());

  // UI State
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewJob, setQuickViewJob] = useState(null);

  // Refs
  const tableRef = useRef(null);

  // ==================== AUTH ====================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getAdminToken();
        if (!token || !isAdminTokenValid() || getCurrentSessionType() !== "admin") {
          logoutAll();
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          }
        } else {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.userType === "admin") {
            setAdmin({ id: payload.id, name: payload.name, email: payload.email });
            setIsAuthenticated(true);
          } else {
            throw new Error("Not admin");
          }
        }
      } catch (error) {
        logoutAll();
        router.replace("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  // ==================== API HELPER ====================
  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = getAdminToken();
      if (!token) throw new Error("No token");

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
        router.replace("/admin/login");
        throw new Error("Session expired");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      return data;
    },
    [router]
  );

  // ==================== FETCH DATA ====================
  const fetchJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterStatus) params.append("status", filterStatus);
      if (filterType) params.append("type", filterType);
      if (filterCity) params.append("city", filterCity);
      if (filterFeatured) params.append("featured", filterFeatured);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const data = await apiRequest(`/api/v1/jobs?${params}`);

      if (data.success) {
        setJobs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError(err.message);
      showError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearch,
    filterStatus,
    filterType,
    filterCity,
    filterFeatured,
    dateFrom,
    dateTo,
    apiRequest,
  ]);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiRequest("/api/v1/jobs/stats");
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }, [isAuthenticated, apiRequest]);

  const fetchFilterOptions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiRequest("/api/v1/jobs/filter-options");
      if (data.success) setFilterOptions(data.data);
    } catch (err) {
      console.error("Filter options fetch error:", err);
    }
  }, [isAuthenticated, apiRequest]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
      fetchStats();
      fetchFilterOptions();
    }
  }, [isAuthenticated]);

  // Fetch on filter/pagination change
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearch,
    filterStatus,
    filterType,
    filterCity,
    filterFeatured,
    dateFrom,
    dateTo,
  ]);

  // ==================== HANDLERS ====================
  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(columnId);
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const handleToggleStatus = async (id) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    const toastId = showLoading("Toggling status...");
    try {
      setActionLoading(id);
      await apiRequest(`/api/v1/jobs/${id}/toggle-status`, { method: "PATCH" });

      const newStatus = job.status === "active" ? "inactive" : "active";
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j)));

      toast.dismiss(toastId);
      showSuccess(`Status changed to ${newStatus}`);
      fetchStats();
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    const toastId = showLoading("Updating...");
    try {
      setActionLoading(id);
      await apiRequest(`/api/v1/jobs/${id}/toggle-featured`, { method: "PATCH" });

      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, featured: !j.featured } : j)));

      toast.dismiss(toastId);
      showSuccess(job.featured ? "Removed from featured" : "Marked as featured");
      fetchStats();
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (id) => {
    const toastId = showLoading("Duplicating job...");
    try {
      setActionLoading(id);
      await apiRequest(`/api/v1/jobs/${id}/duplicate`, { method: "POST" });

      toast.dismiss(toastId);
      showSuccess("Job duplicated successfully");
      fetchJobs();
      fetchStats();
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    const toastId = showLoading("Deleting...");
    try {
      setActionLoading(id);
      await apiRequest(`/api/v1/jobs/${id}`, { method: "DELETE" });

      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((prev) => prev - 1);
      setSelectedJobs((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast.dismiss(toastId);
      showSuccess("Job deleted");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) return;

    const toastId = showLoading(`Deleting ${selectedJobs.size} jobs...`);
    try {
      setActionLoading("bulk");
      const ids = Array.from(selectedJobs);
      await apiRequest("/api/v1/jobs/bulk/delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });

      setJobs((prev) => prev.filter((j) => !selectedJobs.has(j.id)));
      setTotal((prev) => prev - ids.length);
      setSelectedJobs(new Set());

      toast.dismiss(toastId);
      showSuccess(`${ids.length} jobs deleted`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedJobs.size === 0) return;

    const toastId = showLoading(`Updating ${selectedJobs.size} jobs...`);
    try {
      setActionLoading("bulk");
      const ids = Array.from(selectedJobs);
      await apiRequest("/api/v1/jobs/bulk/status", {
        method: "POST",
        body: JSON.stringify({ ids, status }),
      });

      setJobs((prev) => prev.map((j) => (selectedJobs.has(j.id) ? { ...j, status } : j)));
      setSelectedJobs(new Set());

      toast.dismiss(toastId);
      showSuccess(`${ids.length} jobs updated to ${status}`);
      fetchStats();
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    if (jobs.length === 0) {
      showError("No jobs to export");
      return;
    }

    const headers = ["ID", "Title", "Job Title", "City", "Type", "Status", "Featured", "Views", "Created"];
    const csvContent = [
      headers.join(","),
      ...jobs.map((job) =>
        [
          job.id,
          `"${(job.title || "").replace(/"/g, '""')}"`,
          `"${(job.job_title || "").replace(/"/g, '""')}"`,
          `"${(job.city_name || "").replace(/"/g, '""')}"`,
          job.type || "",
          job.status || "",
          job.featured ? "Yes" : "No",
          job.views || 0,
          job.created_at || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jobs-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    showSuccess("Export completed");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setFilterType("");
    setFilterCity("");
    setFilterFeatured("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      }).catch(() => {});
    } finally {
      logoutAll();
      window.location.href = "/admin/login";
    }
  }, []);

  // ==================== SELECTION ====================
  const toggleSelectAll = () => {
    if (selectedJobs.size === jobs.length && jobs.length > 0) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((j) => j.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ==================== COLUMN TOGGLE ====================
  const toggleColumnVisibility = (columnId) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col))
    );
  };

  // ==================== UTILITY ====================
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  const getTypeConfig = (type) => {
    return TYPE_CONFIG[type] || { color: "bg-gray-100 text-gray-700" };
  };

  const activeFiltersCount = [filterStatus, filterType, filterCity, filterFeatured, dateFrom, dateTo].filter(
    Boolean
  ).length;

  const visibleColumns = columns.filter((col) => col.visible);

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  return (
    <>
      <Toaster position="top-right" />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100">
        {/* ==================== DELETE MODAL ==================== */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {deleteTarget.type === "single" ? "Delete Job" : `Delete ${selectedJobs.size} Jobs`}
                  </h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteTarget.type === "single" && deleteTarget.id) {
                      handleDelete(deleteTarget.id);
                    } else {
                      handleBulkDelete();
                    }
                  }}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== QUICK VIEW MODAL ==================== */}
        {showQuickView && quickViewJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuickView(false)} />
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Quick View</h3>
                <button onClick={() => setShowQuickView(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Title</span>
                    <p className="font-medium">{quickViewJob.title || "Untitled"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Job Title</span>
                    <p className="font-medium">{quickViewJob.job_title || "-"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Location</span>
                      <p className="font-medium">{quickViewJob.city_name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Type</span>
                      <p className="font-medium">{quickViewJob.type || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <p
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          getStatusConfig(quickViewJob.status).color
                        }`}
                      >
                        {quickViewJob.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Views</span>
                      <p className="font-medium">{quickViewJob.views || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Featured</span>
                      <p className="font-medium">{quickViewJob.featured ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  {quickViewJob.description && (
                    <div>
                      <span className="text-sm text-gray-500">Description</span>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {quickViewJob.description.substring(0, 500)}
                        {quickViewJob.description.length > 500 && "..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowQuickView(false);
                    router.push(`/admin/jobs/edit/${quickViewJob.id}`);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Job
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== COLUMN SETTINGS MODAL ==================== */}
        {showColumnSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowColumnSettings(false)} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Column Settings</h3>
                <button onClick={() => setShowColumnSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumnVisibility(col.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 max-w-[1600px] mx-auto">
          {/* ==================== HEADER ==================== */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Jobs Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                {total} total jobs • {stats?.active || 0} active
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/jobs/add")}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Job
            </button>
          </div>

          {/* ==================== STATS CARDS ==================== */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: "Total", value: stats.total, color: "bg-gray-500" },
                { label: "Active", value: stats.active, color: "bg-green-500" },
                { label: "Inactive", value: stats.inactive, color: "bg-gray-400" },
                { label: "Featured", value: stats.featured, color: "bg-amber-500" },
                { label: "This Week", value: stats.this_week, color: "bg-blue-500" },
                { label: "Today", value: stats.today, color: "bg-purple-500" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ==================== TOOLBAR ==================== */}
          <div className="bg-white rounded-t-xl border border-b-0 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    fetchJobs();
                    fetchStats();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                <button
                  onClick={handleExport}
                  disabled={jobs.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <button
                  onClick={() => setShowColumnSettings(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
                >
                  <Settings2 className="w-4 h-4" />
                  Columns
                </button>

                {/* Bulk Actions */}
                {selectedJobs.size > 0 && (
                  <>
                    <div className="h-6 w-px bg-gray-300" />
                    <span className="text-sm font-medium text-gray-600">{selectedJobs.size} selected</span>

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkStatusUpdate(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      disabled={actionLoading === "bulk"}
                      className="px-3 py-2 text-sm border rounded-lg bg-white"
                    >
                      <option value="">Set Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="closed">Closed</option>
                    </select>

                    <button
                      onClick={() => {
                        setDeleteTarget({ type: "bulk" });
                        setShowDeleteModal(true);
                      }}
                      disabled={actionLoading === "bulk"}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Right - Search & Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                    showAdvancedFilters || activeFiltersCount > 0
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="">All Status</option>
                      {filterOptions?.statuses?.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label} ({s.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="">All Types</option>
                      {filterOptions?.types?.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label} ({t.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                    <select
                      value={filterCity}
                      onChange={(e) => {
                        setFilterCity(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="">All Cities</option>
                      {filterOptions?.cities?.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label} ({c.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Featured</label>
                    <select
                      value={filterFeatured}
                      onChange={(e) => {
                        setFilterFeatured(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="">All</option>
                      <option value="1">Featured</option>
                      <option value="0">Not Featured</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="mt-4 flex items-center">
                    <button
                      onClick={handleClearFilters}
                      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-4 h-4" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================== TABLE ==================== */}
          <div className="bg-white border border-t-0 overflow-hidden" ref={tableRef}>
            {loading && jobs.length === 0 ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="mt-4 text-gray-600">{error}</p>
                <button
                  onClick={fetchJobs}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="mt-4 text-gray-600">No jobs found</p>
                <button
                  onClick={() => router.push("/admin/jobs/add")}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add New Job
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.size === jobs.length && jobs.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.id}
                          className={`px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider ${
                            col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                          }`}
                          style={{ width: col.width }}
                        >
                          {col.sortable ? (
                            <button
                              onClick={() => handleSort(col.id)}
                              className="inline-flex items-center gap-1 hover:text-gray-900"
                            >
                              {col.label}
                              {sortBy === col.id ? (
                                sortOrder === "ASC" ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40" />
                              )}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((job) => {
                      const statusConfig = getStatusConfig(job.status);
                      const typeConfig = getTypeConfig(job.type);
                      const isSelected = selectedJobs.has(job.id);

                      return (
                        <tr key={job.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(job.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>

                          {visibleColumns.map((col) => (
                            <td
                              key={col.id}
                              className={`px-4 py-3 ${
                                col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""
                              }`}
                            >
                              {col.id === "id" && (
                                <span className="text-sm font-medium text-gray-600">#{job.id}</span>
                              )}

                              {col.id === "title" && (
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                                    <Briefcase className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <button
                                      onClick={() => {
                                        setQuickViewJob(job);
                                        setShowQuickView(true);
                                      }}
                                      className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate block max-w-[200px]"
                                    >
                                      {job.title || "Untitled"}
                                    </button>
                                    {job.job_title && (
                                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{job.job_title}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {col.id === "city_name" && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="truncate max-w-[120px]">{job.city_name || "-"}</span>
                                </div>
                              )}

                              {col.id === "type" && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
                                >
                                  <Timer className="w-3 h-3" />
                                  {job.type || "-"}
                                </span>
                              )}

                              {col.id === "status" && (
                                <button
                                  onClick={() => handleToggleStatus(job.id)}
                                  disabled={actionLoading === job.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} hover:opacity-80 disabled:opacity-50`}
                                >
                                  {actionLoading === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  {job.status}
                                </button>
                              )}

                              {col.id === "featured" && (
                                <button
                                  onClick={() => handleToggleFeatured(job.id)}
                                  disabled={actionLoading === job.id}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    job.featured
                                      ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                                      : "text-gray-400 hover:bg-gray-100"
                                  } disabled:opacity-50`}
                                >
                                  {job.featured ? (
                                    <Star className="w-4 h-4 fill-current" />
                                  ) : (
                                    <StarOff className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {col.id === "views" && <span className="text-sm text-gray-600">{job.views || 0}</span>}

                              {col.id === "created_at" && (
                                <span className="text-sm text-gray-600">{formatDate(job.created_at)}</span>
                              )}
                            </td>
                          ))}

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setQuickViewJob(job);
                                  setShowQuickView(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                                title="Quick View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => router.push(`/admin/jobs/edit/${job.id}`)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDuplicate(job.id)}
                                disabled={actionLoading === job.id}
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 disabled:opacity-50"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: job.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={actionLoading === job.id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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

          {/* ==================== PAGINATION ==================== */}
          {jobs.length > 0 && (
            <div className="bg-white border border-t-0 rounded-b-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border rounded-lg text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 mx-2">
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
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${
                          currentPage === pageNum ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}