// components/admin/Lifestyle/LifestyleListingPage.js

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
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
  Briefcase, // Re-purposing Briefcase for general entries
  MapPin, // Re-purposing MapPin for Country/Developer
  BarChart3,
  Calendar,
  CheckCircle,
  Globe, // Re-purposing Globe for status or country
  AlertCircle,
  Users, // Icon for developer
  Building2, // Icon for country
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth"; // Adjust path as needed
import AdminNavbar from "../dashboard/header/DashboardNavbar"; // Adjust path as needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  { value: "archived", label: "Archived", color: "bg-red-100 text-red-800" },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "name", label: "Internal Name" },
  { id: "title", label: "Public Title" },
  { id: "country_id", label: "Country" },
  { id: "developer_id", label: "Developer" },
  { id: "status", label: "Status" },
  { id: "created_at", label: "Created" },
  // 'subtitle', 'description', 'image', 'seo_title', 'seo_description', 'seo_focus_keyword' are usually not in listing tables
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
export default function LifestyleListingPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Data State
  const [lifestyles, setLifestyles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "name", "title", "country_id", "developer_id", "status", "created_at"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [selectedLifestyles, setSelectedLifestyles] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dropdown data (e.g., for filtering by Country or Developer)
  const [countries, setCountries] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState("");

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

  // ==================== FETCH LIFESTYLE ENTRIES ====================
  const fetchLifestyles = useCallback(async () => {
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
      if (filterStatus) {
        params.append("status", filterStatus);
      }
      if (filterCountry) {
        params.append("country_id", filterCountry);
      }
      if (filterDeveloper) {
        params.append("developer_id", filterDeveloper);
      }

      const data = await apiRequest(`/api/v1/lifestyle/paginate?${params}`);

      if (data.success) {
        setLifestyles(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching lifestyles:", err);
      setError(err.message);
      showError("Failed to load lifestyles");
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    currentPage,
    showCount,
    searchQuery,
    filterStatus,
    filterCountry,
    filterDeveloper,
    apiRequest,
  ]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await apiRequest("/api/v1/lifestyle/stats");
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [isAuthenticated, apiRequest]);

  // ==================== FETCH DROPDOWN DATA (Countries, Developers) ====================
  const fetchDropdownData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [countriesData, developersData] = await Promise.all([
        apiRequest("/api/v1/lifestyle/countries"),
        apiRequest("/api/v1/lifestyle/developers"),
      ]);
      if (countriesData.success) {
        setCountries(countriesData.data);
      }
      if (developersData.success) {
        setDevelopers(developersData.data);
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  }, [isAuthenticated, apiRequest]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchLifestyles();
      fetchStats();
      fetchDropdownData();
    }
  }, [isAuthenticated, currentPage, showCount, filterStatus, filterCountry, filterDeveloper]);

  // Search with debounce
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLifestyles();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ==================== STATUS UPDATE ====================
  const handleStatusUpdate = async (id, newStatusValue) => {
    const updateToast = showLoading("Updating status...");

    try {
      setStatusLoading(id);

      await apiRequest(`/api/v1/lifestyle/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatusValue }),
      });

      // Update local state
      setLifestyles((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatusValue } : item
        )
      );

      toast.dismiss(updateToast);
      showSuccess(`Lifestyle status updated to ${newStatusValue}`);

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
    const item = lifestyles.find((l) => l.id === id);
    if (!item) return;

    const updateToast = showLoading("Toggling status...");

    try {
      setStatusLoading(id);

      await apiRequest(`/api/v1/lifestyle/${id}/toggle-status`, {
        method: "PATCH",
      });

      const newStatusValue = item.status === "active" ? "inactive" : "active";

      // Update local state
      setLifestyles((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, status: newStatusValue } : l
        )
      );

      toast.dismiss(updateToast);
      showSuccess(`Lifestyle status changed to ${newStatusValue}`);
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
    if (selectedLifestyles.size === 0) {
      showError("Please select lifestyle entries to update");
      return;
    }

    const updateToast = showLoading("Updating lifestyles...");

    try {
      setStatusLoading("bulk");
      const ids = Array.from(selectedLifestyles);

      await apiRequest("/api/v1/lifestyle/bulk-update-status", {
        method: "POST",
        body: JSON.stringify({ ids, status: statusValue }),
      });

      // Update local state
      setLifestyles((prev) =>
        prev.map((item) =>
          selectedLifestyles.has(item.id) ? { ...item, status: statusValue } : item
        )
      );

      setSelectedLifestyles(new Set());
      toast.dismiss(updateToast);
      showSuccess(`${ids.length} lifestyle entries updated to ${statusValue}`);
      fetchStats();
    } catch (err) {
      toast.dismiss(updateToast);
      showError(err.message || "Error updating lifestyle entries");
    } finally {
      setStatusLoading(null);
    }
  };

  // ==================== DELETE LIFESTYLE ====================
  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting lifestyle entry...");

    try {
      setDeleteLoading(id);

      await apiRequest(`/api/v1/lifestyle/${id}`, {
        method: "DELETE",
      });

      setLifestyles((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => prev - 1);

      toast.dismiss(deleteToast);
      showSuccess("Lifestyle entry deleted successfully!");

      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting lifestyle entry");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ==================== BULK DELETE ====================
  const handleBulkDelete = async () => {
    if (selectedLifestyles.size === 0) {
      showError("Please select lifestyle entries to delete");
      return;
    }

    const deleteToast = showLoading("Deleting lifestyle entries...");

    try {
      setDeleteLoading("bulk");
      const ids = Array.from(selectedLifestyles);

      await apiRequest("/api/v1/lifestyle/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });

      setLifestyles((prev) => prev.filter((item) => !selectedLifestyles.has(item.id)));
      setTotal((prev) => prev - ids.length);
      setSelectedLifestyles(new Set());

      toast.dismiss(deleteToast);
      showSuccess(`${ids.length} lifestyle entries deleted successfully!`);

      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting lifestyle entries");
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
    if (lifestyles.length === 0) {
      showError("No lifestyle entries to export");
      return;
    }

    const exportToast = showLoading("Exporting lifestyle entries...");

    try {
      const headers = [
        "ID",
        "Name",
        "Title",
        "Slug",
        "Country ID",
        "Developer ID",
        "Status",
        "Created At",
      ];

      const csvContent = [
        headers.join(","),
        ...lifestyles.map((item) =>
          [
            item.id,
            `"${(item.name || "").replace(/"/g, '""')}"`,
            `"${(item.title || "").replace(/"/g, '""')}"`,
            item.slug || "",
            item.country_id || "",
            item.developer_id || "",
            item.status || "",
            item.created_at || "",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lifestyle-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(exportToast);
      showSuccess("Lifestyle entries exported successfully!");
    } catch (err) {
      toast.dismiss(exportToast);
      showError("Export failed");
    }
  };

  // ==================== NAVIGATION HANDLERS ====================
  const handleEdit = (id) => router.push(`/admin/lifestyle/edit/${id}`);
  const handleView = (slug) => router.push(`/admin/lifestyle/${slug}`); // Assuming public view by slug
  const handleAdd = () => router.push("/admin/lifestyle/add");

  // ==================== CLEAR FILTERS ====================
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setFilterCountry("");
    setFilterDeveloper("");
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

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : "-";
  };

  const getDeveloperName = (developerId) => {
    const developer = developers.find(d => d.id === developerId);
    return developer ? developer.name : "-";
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
    if (selectedLifestyles.size === lifestyles.length && lifestyles.length > 0) {
      setSelectedLifestyles(new Set());
    } else {
      setSelectedLifestyles(new Set(lifestyles.map((item) => item.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedLifestyles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== STATS DATA ====================
  const totalCount = stats?.total || total;
  const activeCount = stats?.active || lifestyles.filter((l) => l.status === "active").length;
  const inactiveCount = stats?.inactive || lifestyles.filter((l) => l.status === "inactive").length;
  const lastWeekCount = stats?.last_week || 0;

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
                  {deleteTarget.type === "single" ? "Delete Lifestyle Entry" : "Delete Lifestyle Entries"}
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
                        ? "This lifestyle entry will be permanently deleted."
                        : `${selectedLifestyles.size} lifestyle entries will be permanently deleted.`}
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
                  Update Lifestyle Status
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
                    Entry: <span className="font-medium">{statusTarget.name}</span>
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
              { label: "Total Entries", value: totalCount, icon: Briefcase, color: "bg-gray-500" },
              { label: "Active", value: activeCount, icon: CheckCircle, color: "bg-green-500" },
              { label: "Inactive", value: inactiveCount, icon: EyeOff, color: "bg-amber-500" },
              { label: "Added Last Week", value: lastWeekCount, icon: Calendar, color: "bg-blue-500" },
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
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAdd}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Entry
                </button>

                <button
                  onClick={() => {
                    fetchLifestyles();
                    fetchStats();
                    fetchDropdownData();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                <button
                  onClick={handleExport}
                  disabled={lifestyles.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                {/* Bulk Actions */}
                {selectedLifestyles.size > 0 && (
                  <>
                    <div className="h-6 w-px bg-gray-300 mx-1" />

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkStatusUpdate(e.target.value);
                          e.target.value = ""; // Reset select after action
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
                        setDeleteTarget({ type: "bulk", ids: Array.from(selectedLifestyles) });
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
                      Delete ({selectedLifestyles.size})
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search entries..."
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

              <select
                value={filterCountry}
                onChange={(e) => {
                  setFilterCountry(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterDeveloper}
                onChange={(e) => {
                  setFilterDeveloper(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Developers</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {(searchQuery || filterStatus || filterCountry || filterDeveloper) && (
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
                Total: {total} entries | Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 border-t-0 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <div className="flex-1 text-sm text-red-800">{error}</div>
              <button
                onClick={fetchLifestyles}
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
            {loading && lifestyles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading lifestyle entries...</p>
              </div>
            ) : lifestyles.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No lifestyle entries found</p>
                <button
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add New Entry
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
                            selectedLifestyles.size === lifestyles.length && lifestyles.length > 0
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
                      {isVisible("name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                      )}
                      {isVisible("title") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Title
                        </th>
                      )}
                      {isVisible("country_id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Country
                        </th>
                      )}
                      {isVisible("developer_id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Developer
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
                    {lifestyles.map((item) => {
                      const statusInfo = getStatusInfo(item.status);

                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 ${
                            selectedLifestyles.has(item.id) ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLifestyles.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>

                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(item.id)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                #{item.id}
                              </button>
                            </td>
                          )}

                          {isVisible("name") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                                  <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    onClick={() => handleView(item.slug || item.id)}
                                    className="text-sm font-medium text-gray-800 hover:text-blue-600 hover:underline truncate block max-w-[200px]"
                                    title={item.name}
                                  >
                                    {item.name || "Untitled"}
                                  </button>
                                  {item.subtitle && (
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {isVisible("title") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <p className="line-clamp-2 max-w-[200px]">
                                {item.title || "-"}
                              </p>
                            </td>
                          )}

                          {isVisible("country_id") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {getCountryName(item.country_id) || "-"}
                                </span>
                              </div>
                            </td>
                          )}

                          {isVisible("developer_id") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {getDeveloperName(item.developer_id) || "-"}
                                </span>
                              </div>
                            </td>
                          )}

                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setStatusTarget(item);
                                  setNewStatus("");
                                  setShowStatusModal(true);
                                }}
                                disabled={statusLoading === item.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} hover:opacity-80 transition-opacity disabled:opacity-50`}
                              >
                                {statusLoading === item.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : null}
                                {item.status || "active"}
                              </button>
                            </td>
                          )}

                          {isVisible("created_at") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatDate(item.created_at)}
                              </div>
                            </td>
                          )}

                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleView(item.slug)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View Public Page"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(item.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit Entry"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(item.id)}
                                disabled={statusLoading === item.id}
                                className="p-1.5 rounded hover:bg-amber-50 text-amber-600 disabled:opacity-50"
                                title="Toggle Status"
                              >
                                {statusLoading === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : item.status === "active" ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: item.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === item.id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete Entry"
                              >
                                {deleteLoading === item.id ? (
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
          {lifestyles.length > 0 && (
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