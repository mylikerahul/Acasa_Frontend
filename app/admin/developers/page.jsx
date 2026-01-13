"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Loader2,
  Trash2,
  Edit3,
  Plus,
  X,
  Eye,
  Building2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";
import AdminNavbar from "../dashboard/header/DashboardNavbar";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ All possible image extensions
const IMAGE_EXTENSIONS = [".jpg", ".png", ".webp", ".jpeg", ".gif", ".svg"];

const ALL_COLUMNS = [
  { id: "id", label: "ID", key: "id" },
  { id: "picture", label: "Picture", key: "image" },
  { id: "name", label: "Name", key: "name" },
  { id: "email", label: "E-mail", key: "email" },
  { id: "mobile", label: "Mobile", key: "mobile" },
  { id: "website", label: "Website", key: "website" },
  { id: "country", label: "Country", key: "country" },
  { id: "total_project", label: "Projects", key: "total_project" },
  { id: "status", label: "Status", key: "status" },
  { id: "created_at", label: "Created At", key: "created_at" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  // ✅ Get base image path (without extension)
  getBaseImagePath: (imagePath) => {
    if (!imagePath) return null;

    // Already full URL
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // Clean the path
    const cleanPath = imagePath.replace(/^\/+/, "");

    // Remove extension if already present
    const pathWithoutExt = cleanPath.replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "");

    // Return base URL path
    return `${API_BASE_URL}/uploads/developers/${pathWithoutExt}`;
  },

  getInitials: (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  formatDate: (dateString) => {
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
  },

  // ✅ Transform API developer data
  transformDeveloper: (developer) => ({
    id: developer.id,
    name: developer.name?.trim() || "Unknown Developer",
    email: developer.email || "",
    mobile: developer.mobile || "",
    website: developer.website || "",
    country: developer.country || "",
    address: developer.address || "",
    image: developer.image || developer.logo || "",
    total_project: developer.total_project || 0,
    year_established: developer.year_established || "",
    informations: developer.informations || "",
    status: developer.status,
    created_at: developer.created_at,
    updated_at: developer.updated_at,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// SMART IMAGE COMPONENT - Tries multiple extensions
// ═══════════════════════════════════════════════════════════════════════════════

const DeveloperImage = ({ imagePath, name, size = "md" }) => {
  const [currentExtIndex, setCurrentExtIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const basePath = utils.getBaseImagePath(imagePath);

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  // Reset state when basePath changes
  useEffect(() => {
    setCurrentExtIndex(0);
    setLoaded(false);
    setFailed(false);
  }, [basePath]);

  const handleError = () => {
    const nextIndex = currentExtIndex + 1;

    if (nextIndex < IMAGE_EXTENSIONS.length) {
      setCurrentExtIndex(nextIndex);
    } else {
      setFailed(true);
    }
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  // If no base path or all failed, show fallback
  if (!basePath || failed) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold`}
      >
        {utils.getInitials(name)}
      </div>
    );
  }

  const currentUrl = `${basePath}${IMAGE_EXTENSIONS[currentExtIndex]}`;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold`}
    >
      <img
        src={currentUrl}
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
      />
      {!loaded && !failed && (
        <span className="absolute">{utils.getInitials(name)}</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DevelopersPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Developer State Management
  const [developers, setDevelopers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "picture", "name", "email", "mobile", "status"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedDevelopers, setSelectedDevelopers] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        if (sessionType === "user") {
          showError("Please login as admin to access this dashboard");
        } else {
          showError("Please login to access dashboard");
        }
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        showError("Please login to access dashboard");
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        if (verifyError.response?.status === 401) {
          showError("Invalid or expired token. Please login again.");
          handleAuthFailure();
          return;
        }
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.userType !== "admin") {
          showError("Invalid session type. Please login as admin.");
          handleAuthFailure();
          return;
        }

        const adminData = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || "admin",
          userType: payload.userType,
          avatar: null,
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        console.error("Token decode error:", e);
        showError("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      showError("Authentication failed. Please login again.");
      handleAuthFailure();
    }
  }, []);

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

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
      const error = await response
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  // ==================== FETCH DEVELOPERS ====================
  const fetchDevelopers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadingToast = showLoading("Loading developers...");

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search);
      params.append("limit", "100"); // Get more developers

      const data = await apiRequest(`/api/v1/developers?${params}`);

      toast.dismiss(loadingToast);

      // ✅ FIXED: Correct data path - data.data.developers
      if (data.success && data.data && Array.isArray(data.data.developers)) {
        const developersList = data.data.developers.map(utils.transformDeveloper);
        setDevelopers(developersList);
        setTotal(data.data.total || developersList.length);

        if (developersList.length === 0) {
          showError("No developers found");
        }
      } else {
        throw new Error("Invalid API response");
      }
    } catch (err) {
      console.error("Error fetching developers:", err);
      setError(err.message);
      showError("Failed to load developers");
    } finally {
      setLoading(false);
    }
  }, [search, apiRequest]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest("/api/v1/developers?limit=1");

      if (data.success && data.data) {
        const developerStats = {
          total: data.data.total || 0,
          active: data.data.total || 0,
        };
        setStats(developerStats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [apiRequest]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevelopers();
      fetchStats();
    }
  }, [isAuthenticated]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      if (isAuthenticated) {
        fetchDevelopers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ==================== HANDLERS ====================
  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting developer...");
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/developers/${id}`, { method: "DELETE" });
      setDevelopers((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => prev - 1);

      toast.dismiss(deleteToast);
      showSuccess("Developer deleted successfully!");

      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting developer");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleEdit = (id) => {
    router.push(`/admin/developers/edit/${id}`);
  };

  const handleAdd = () => {
    router.push("/admin/developers/add");
  };

  const handleView = (id) => {
    router.push(`/admin/developers/${id}`);
  };

  // ==================== FILTERED DATA ====================
  const filteredDevelopers = useMemo(() => {
    let filtered = developers || [];

    // Client-side search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name?.toLowerCase().includes(searchLower) ||
          d.email?.toLowerCase().includes(searchLower) ||
          d.mobile?.toLowerCase().includes(searchLower)
      );
    }

    return filtered.filter((d) => d && d.id);
  }, [developers, search]);

  const paginatedDevelopers = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredDevelopers.slice(start, start + showCount);
  }, [filteredDevelopers, currentPage, showCount]);

  const totalPages = Math.ceil(filteredDevelopers.length / showCount);

  // ==================== COLUMN VISIBILITY ====================
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

  // ==================== SELECTION ====================
  const toggleSelectAll = () => {
    if (selectedDevelopers.size === paginatedDevelopers.length) {
      setSelectedDevelopers(new Set());
    } else {
      setSelectedDevelopers(new Set(paginatedDevelopers.map((d) => d.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedDevelopers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

  // ==================== RENDER ====================
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
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
            style: {
              background: "#10B981",
              fontWeight: "500",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
            style: {
              background: "#EF4444",
              fontWeight: "500",
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: "#3B82F6",
              color: "#fff",
              fontWeight: "500",
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

      <div className="min-h-screen bg-gray-100 pt-4">
        {/* Delete Modal */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete Developer
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this developer? This action
                  cannot be undone.
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

        {/* Overview Dropdown Modal */}
        {showOverviewDropdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0"
              onClick={() => setShowOverviewDropdown(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-300">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-800">
                  Show / Hide Column in Listing
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Developers</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Developers</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.active}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Showing</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {filteredDevelopers.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleAdd}
                style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                New Developer
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or mobile"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="relative">
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
            </div>
          </div>

          {/* Table */}
          <div
            className="border border-gray-300 border-t-0"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            {loading && developers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading developers...</p>
              </div>
            ) : filteredDevelopers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No developers found</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-1">
                    Try a different search term
                  </p>
                )}
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
                            selectedDevelopers.size ===
                              paginatedDevelopers.length &&
                            paginatedDevelopers.length > 0
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
                      {isVisible("picture") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Picture
                        </th>
                      )}
                      {isVisible("name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                      )}
                      {isVisible("email") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          E-mail
                        </th>
                      )}
                      {isVisible("mobile") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Mobile
                        </th>
                      )}
                      {isVisible("website") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Website
                        </th>
                      )}
                      {isVisible("country") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Country
                        </th>
                      )}
                      {isVisible("total_project") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Projects
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
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDevelopers.map((developer) => (
                      <tr
                        key={developer.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDevelopers.has(developer.id)}
                            onChange={() => toggleSelect(developer.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        {isVisible("id") && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleEdit(developer.id)}
                              className="text-blue-600 hover:underline text-sm font-medium"
                            >
                              {developer.id}
                            </button>
                          </td>
                        )}
                        {isVisible("picture") && (
                          <td className="px-4 py-3">
                            <DeveloperImage
                              imagePath={developer.image}
                              name={developer.name}
                              size="md"
                            />
                          </td>
                        )}
                        {isVisible("name") && (
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {developer.name || "-"}
                          </td>
                        )}
                        {isVisible("email") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {developer.email || "-"}
                          </td>
                        )}
                        {isVisible("mobile") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {developer.mobile || "-"}
                          </td>
                        )}
                        {isVisible("website") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {developer.website ? (
                              <a
                                href={developer.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {developer.website}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        )}
                        {isVisible("country") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {developer.country || "-"}
                          </td>
                        )}
                        {isVisible("total_project") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {developer.total_project || 0}
                          </td>
                        )}
                        {isVisible("status") && (
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                developer.status === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {developer.status === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        {isVisible("created_at") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {utils.formatDate(developer.created_at)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(developer.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(developer.id)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: "single",
                                  id: developer.id,
                                });
                                setShowDeleteModal(true);
                              }}
                              disabled={deleteLoading === developer.id}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === developer.id ? (
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
            )}
          </div>

          {/* Pagination */}
          {filteredDevelopers.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredDevelopers.length)}{" "}
                of {filteredDevelopers.length} entries
              </div>
              <div className="flex items-center gap-1">
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
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