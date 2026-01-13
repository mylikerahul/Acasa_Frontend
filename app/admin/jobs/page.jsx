"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ChevronDown,
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
  DollarSign,
  Timer,
  BarChart3,
  Calendar,
  CheckCircle,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";
import AdminNavbar from "../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-800" },
];

const TYPE_OPTIONS = [
  { value: "Remote", label: "Remote", color: "bg-purple-100 text-purple-700" },
  { value: "Full-time", label: "Full-time", color: "bg-blue-100 text-blue-700" },
  { value: "Part-time", label: "Part-time", color: "bg-amber-100 text-amber-700" },
  { value: "Contract", label: "Contract", color: "bg-green-100 text-green-700" },
  { value: "Freelance", label: "Freelance", color: "bg-pink-100 text-pink-700" },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "job_title", label: "Job Title" },
  { id: "description", label: "Description" },
  { id: "location", label: "Location" },
  { id: "type", label: "Type" },
  { id: "salary", label: "Salary" },
  { id: "views", label: "Views" },
  { id: "status", label: "Status" },
  { id: "created_at", label: "Created" },
];

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#10B981",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10B981",
    },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: "#EF4444",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#EF4444",
    },
  });
};

const showLoading = (message) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== MAIN COMPONENT ====================
export default function JobsListingPage() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Data State
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "job_title", "location", "type", "status", "created_at"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");

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
          const response = await fetch(
            `${API_BASE_URL}/api/v1/users/admin/verify-token`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (!response.ok) throw new Error("Token verification failed");

          const data = await response.json();

          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          } else {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setAdmin({
              id: payload.id,
              name: payload.name,
              email: payload.email,
              role: payload.role || "admin",
              userType: payload.userType,
            });
            setIsAuthenticated(true);
          }
        } catch (verifyError) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.userType === "admin") {
              setAdmin({
                id: payload.id,
                name: payload.name,
                email: payload.email,
                role: payload.role || "admin",
                userType: payload.userType,
              });
              setIsAuthenticated(true);
            } else {
              logoutAll();
              fastNavigate("/admin/login");
              return;
            }
          } catch {
            logoutAll();
            fastNavigate("/admin/login");
            return;
          }
        }
      } catch (error) {
        logoutAll();
        fastNavigate("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToast = showLoading("Logging out...");

    try {
      const token = getAdminToken();

      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      toast.dismiss(logoutToast);
      showSuccess("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
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

  // ==================== API HELPER ====================
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      fastNavigate("/admin/login");
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
      fastNavigate("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  // ==================== FETCH JOBS ====================
  const fetchJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", showCount.toString());

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (filterType) {
        params.append("type", filterType);
      }
      if (filterStatus) {
        params.append("status", filterStatus);
      }

      // Use paginate endpoint for server-side pagination
      const data = await apiRequest(`/api/v1/jobs/paginate?${params}`);

      if (data.success) {
        setJobs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message);
      showError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    currentPage,
    showCount,
    searchQuery,
    filterType,
    filterStatus,
    apiRequest,
  ]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await apiRequest("/api/v1/jobs/stats");
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [isAuthenticated, apiRequest]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
      fetchStats();
    }
  }, [isAuthenticated, currentPage, showCount, filterType, filterStatus]);

  // Search with debounce
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchJobs();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ==================== STATUS UPDATE ====================
  const handleStatusUpdate = async (id, newStatusValue) => {
    const updateToast = showLoading("Updating status...");

    try {
      setStatusLoading(id);

      await apiRequest(`/api/v1/jobs/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatusValue }),
      });

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id ? { ...job, status: newStatusValue } : job
        )
      );

      toast.dismiss(updateToast);
      showSuccess(`Job status updated to ${newStatusValue}`);

      // Close modal and refresh stats
      setShowStatusModal(false);
      setStatusTarget(null);
      setNewStatus("");
      fetchStats();
    } catch (err) {
      console.error("Status Update Error:", err);
      toast.dismiss(updateToast);
      showError(err.message || "Error updating status");
    } finally {
      setStatusLoading(null);
    }
  };

  // ==================== TOGGLE STATUS ====================
  const handleToggleStatus = async (id) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    const updateToast = showLoading("Toggling status...");

    try {
      setStatusLoading(id);

      await apiRequest(`/api/v1/jobs/${id}/toggle-status`, {
        method: "PATCH",
      });

      const newStatusValue = job.status === "active" ? "inactive" : "active";

      // Update local state
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, status: newStatusValue } : j
        )
      );

      toast.dismiss(updateToast);
      showSuccess(`Job status changed to ${newStatusValue}`);
      fetchStats();
    } catch (err) {
      console.error("Toggle Status Error:", err);
      toast.dismiss(updateToast);
      showError(err.message || "Error toggling status");
    } finally {
      setStatusLoading(null);
    }
  };

  // ==================== BULK STATUS UPDATE ====================
  const handleBulkStatusUpdate = async (statusValue) => {
    if (selectedJobs.size === 0) {
      showError("Please select jobs to update");
      return;
    }

    const updateToast = showLoading("Updating jobs...");

    try {
      setStatusLoading("bulk");
      const ids = Array.from(selectedJobs);

      await apiRequest("/api/v1/jobs/bulk-update-status", {
        method: "POST",
        body: JSON.stringify({ ids, status: statusValue }),
      });

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          selectedJobs.has(job.id) ? { ...job, status: statusValue } : job
        )
      );

      setSelectedJobs(new Set());
      toast.dismiss(updateToast);
      showSuccess(`${ids.length} jobs updated to ${statusValue}`);
      fetchStats();
    } catch (err) {
      toast.dismiss(updateToast);
      showError(err.message || "Error updating jobs");
    } finally {
      setStatusLoading(null);
    }
  };

  // ==================== DELETE JOB ====================
  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting job...");

    try {
      setDeleteLoading(id);

      await apiRequest(`/api/v1/jobs/${id}`, {
        method: "DELETE",
      });

      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((prev) => prev - 1);

      toast.dismiss(deleteToast);
      showSuccess("Job deleted successfully!");

      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting job");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ==================== BULK DELETE ====================
  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) {
      showError("Please select jobs to delete");
      return;
    }

    const deleteToast = showLoading("Deleting jobs...");

    try {
      setDeleteLoading("bulk");
      const ids = Array.from(selectedJobs);

      await apiRequest("/api/v1/jobs/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });

      setJobs((prev) => prev.filter((j) => !selectedJobs.has(j.id)));
      setTotal((prev) => prev - ids.length);
      setSelectedJobs(new Set());

      toast.dismiss(deleteToast);
      showSuccess(`${ids.length} jobs deleted successfully!`);

      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting jobs");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ==================== DELETE CONFIRM ====================
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "single") {
      handleDelete(deleteTarget.id);
    } else {
      handleBulkDelete();
    }
  };

  // ==================== STATUS CONFIRM ====================
  const handleStatusConfirm = () => {
    if (!statusTarget || !newStatus) return;
    handleStatusUpdate(statusTarget.id, newStatus);
  };

  // ==================== EXPORT ====================
  const handleExport = async () => {
    if (jobs.length === 0) {
      showError("No jobs to export");
      return;
    }

    const exportToast = showLoading("Exporting jobs...");

    try {
      const headers = [
        "ID",
        "Title",
        "Job Title",
        "City",
        "Type",
        "Status",
        "Created At",
      ];

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
            job.created_at || "",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jobs-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(exportToast);
      showSuccess("Jobs exported successfully!");
    } catch (err) {
      toast.dismiss(exportToast);
      showError("Export failed");
    }
  };

  // ==================== NAVIGATION HANDLERS ====================
  const handleEdit = (id) => fastNavigate(`/admin/jobs/edit/${id}`);
  const handleView = (slugOrId) => fastNavigate(`/admin/jobs/${slugOrId}`);
  const handleAdd = () => fastNavigate("/admin/jobs/add");

  // ==================== CLEAR FILTERS ====================
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  // ==================== UTILITY FUNCTIONS ====================
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

  const getStatusInfo = (status) => {
    return (
      STATUS_OPTIONS.find((s) => s.value === status) || {
        value: status,
        label: status,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getTypeInfo = (type) => {
    return (
      TYPE_OPTIONS.find((t) => t.value === type) || {
        value: type,
        label: type,
        color: "bg-gray-100 text-gray-700",
      }
    );
  };

  // ==================== COLUMN TOGGLE ====================
  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const isVisible = (columnId) => visibleColumns.has(columnId);

  // ==================== SELECT HANDLERS ====================
  const toggleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((j) => j.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== STATS DATA ====================
  const totalCount = stats?.total || total;
  const activeCount = stats?.active || jobs.filter((j) => j.status === "active").length;
  const inactiveCount = stats?.inactive || jobs.filter((j) => j.status === "inactive").length;
  const todayCount = stats?.today || 0;

  // ==================== LOADING STATE ====================
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

  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        {/* ==================== DELETE MODAL ==================== */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  {deleteTarget.type === "single" ? "Delete Job" : "Delete Jobs"}
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Are you sure?</p>
                    <p className="text-sm text-gray-500">
                      {deleteTarget.type === "single"
                        ? "This job will be permanently deleted."
                        : `${selectedJobs.size} jobs will be permanently deleted.`}
                    </p>
                  </div>
                </div>
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
                    {deleteLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STATUS UPDATE MODAL ==================== */}
        {showStatusModal && statusTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowStatusModal(false);
                setStatusTarget(null);
                setNewStatus("");
              }}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Update Job Status
                </h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusTarget(null);
                    setNewStatus("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Job: <span className="font-medium">{statusTarget.title}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Current Status:{" "}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        getStatusInfo(statusTarget.status).color
                      }`}
                    >
                      {statusTarget.status}
                    </span>
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNewStatus(option.value)}
                        disabled={option.value === statusTarget.status}
                        className={`px-3 py-2 text-sm font-medium rounded border-2 transition-all ${
                          newStatus === option.value
                            ? "border-blue-500 bg-blue-50"
                            : option.value === statusTarget.status
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className={`${option.color} px-2 py-0.5 rounded text-xs`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setStatusTarget(null);
                      setNewStatus("");
                    }}
                    disabled={statusLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusConfirm}
                    disabled={!newStatus || statusLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {statusLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== COLUMN VISIBILITY MODAL ==================== */}
        {showOverviewDropdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0"
              onClick={() => setShowOverviewDropdown(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-300">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-800">
                  Show / Hide Columns
                </h3>
                <button
                  onClick={() => setShowOverviewDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                    >
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
                      showSuccess("Columns updated");
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
          {/* ==================== STATS CARDS ==================== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Jobs", value: totalCount, icon: Briefcase, color: "bg-gray-500" },
              { label: "Active", value: activeCount, icon: CheckCircle, color: "bg-green-500" },
              { label: "Inactive", value: inactiveCount, icon: EyeOff, color: "bg-amber-500" },
              { label: "Added Today", value: todayCount, icon: Calendar, color: "bg-blue-500" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-300 rounded-lg p-3 text-center"
              >
                <div className={`w-2 h-2 ${stat.color} rounded-full mx-auto mb-2`} />
                <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ==================== CONTROLS ==================== */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAdd}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Job
                </button>

                <button
                  onClick={() => {
                    fetchJobs();
                    fetchStats();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                <button
                  onClick={handleExport}
                  disabled={jobs.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                {/* Bulk Actions */}
                {selectedJobs.size > 0 && (
                  <>
                    <div className="h-6 w-px bg-gray-300 mx-1" />

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkStatusUpdate(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      disabled={statusLoading === "bulk"}
                      className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Bulk Status Update</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          Set {s.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setDeleteTarget({ type: "bulk", ids: Array.from(selectedJobs) });
                        setShowDeleteModal(true);
                      }}
                      disabled={deleteLoading === "bulk"}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-300 text-red-700 rounded bg-white hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteLoading === "bulk" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete ({selectedJobs.size})
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>

                <button
                  onClick={() => setShowOverviewDropdown(!showOverviewDropdown)}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  Overview
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {(searchQuery || filterType || filterStatus) && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
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
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="ml-2">entries</span>
              <span className="ml-4 text-gray-500">
                Total: {total} jobs | Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 border-t-0 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <div className="flex-1 text-sm text-red-800">{error}</div>
              <button
                onClick={fetchJobs}
                className="text-sm underline text-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* ==================== TABLE ==================== */}
          <div
            className="border border-gray-300 border-t-0"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            {loading && jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No jobs found</p>
                <button
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add New Job
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{ backgroundColor: "rgb(236,237,238)" }}
                >
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            selectedJobs.size === jobs.length && jobs.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          ID
                        </th>
                      )}
                      {isVisible("job_title") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Job Title
                        </th>
                      )}
                      {isVisible("description") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Description
                        </th>
                      )}
                      {isVisible("location") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Location
                        </th>
                      )}
                      {isVisible("type") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Type
                        </th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      {isVisible("created_at") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Created
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => {
                      const statusInfo = getStatusInfo(job.status);
                      const typeInfo = getTypeInfo(job.type);

                      return (
                        <tr
                          key={job.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            selectedJobs.has(job.id) ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedJobs.has(job.id)}
                              onChange={() => toggleSelect(job.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>

                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(job.id)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                #{job.id}
                              </button>
                            </td>
                          )}

                          {isVisible("job_title") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                                  <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    onClick={() => handleView(job.slug || job.id)}
                                    className="text-sm font-medium text-gray-800 hover:text-blue-600 hover:underline truncate block max-w-[200px]"
                                    title={job.title}
                                  >
                                    {job.title || "Untitled Job"}
                                  </button>
                                  {job.job_title && (
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {job.job_title}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {isVisible("description") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <p className="line-clamp-2 max-w-[200px]">
                                {job.description || "No description"}
                              </p>
                            </td>
                          )}

                          {isVisible("location") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {job.city_name || "-"}
                                </span>
                              </div>
                            </td>
                          )}

                          {isVisible("type") && (
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}
                              >
                                <Timer className="w-3 h-3" />
                                {job.type || "-"}
                              </span>
                            </td>
                          )}

                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setStatusTarget(job);
                                  setNewStatus("");
                                  setShowStatusModal(true);
                                }}
                                disabled={statusLoading === job.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} hover:opacity-80 transition-opacity disabled:opacity-50`}
                              >
                                {statusLoading === job.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : null}
                                {job.status || "active"}
                              </button>
                            </td>
                          )}

                          {isVisible("created_at") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatDate(job.created_at)}
                              </div>
                            </td>
                          )}

                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleView(job.slug || job.id)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(job.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(job.id)}
                                disabled={statusLoading === job.id}
                                className="p-1.5 rounded hover:bg-amber-50 text-amber-600 disabled:opacity-50"
                                title="Toggle Status"
                              >
                                {statusLoading === job.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : job.status === "active" ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: job.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === job.id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === job.id ? (
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

          {/* ==================== PAGINATION ==================== */}
          {jobs.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, total)} of {total} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
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
                      className={`px-3 py-1.5 border rounded text-sm ${
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
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}