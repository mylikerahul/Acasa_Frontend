"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Download,
  RefreshCw,
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

const ALL_COLUMNS = [
  { id: "id", label: "ID", key: "id" },
  { id: "closing_name", label: "Closing Name", key: "closing_name" },
  { id: "status", label: "Status", key: "closing_status" },
  { id: "buyer", label: "Buyer", key: "buyers" },
  { id: "seller", label: "Seller", key: "sellers" },
  { id: "sales_price", label: "Sales Price", key: "sales_price" },
  { id: "commission", label: "Commission", key: "commission" },
  { id: "listing_city", label: "Listing City", key: "listing_city" },
  { id: "developer", label: "Developer", key: "developer" },
  { id: "closing_date", label: "Closing Date", key: "closing_date" },
  { id: "created_at", label: "Created At", key: "created_at" },
];

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending", color: "bg-amber-100 text-amber-800" },
  { value: "In Progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "Closed", label: "Closed", color: "bg-green-100 text-green-800" },
  { value: "Cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

const STATUS_TABS = [
  { key: "all", label: "All Deals" },
  { key: "Pending", label: "Pending" },
  { key: "In Progress", label: "In Progress" },
  { key: "Closed", label: "Closed" },
  { key: "Cancelled", label: "Cancelled" },
];

export default function DealsPage() {
  const router = useRouter();
  const abortControllerRef = useRef(null);

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Deal State Management
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "closing_name", "status", "buyer", "seller", "sales_price", "commission", "listing_city", "closing_date"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedDeals, setSelectedDeals] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);

  // Success Toast Helper
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

  // Error Toast Helper
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

  // Loading Toast Helper
  const showLoading = (message) => {
    return toast.loading(message, {
      position: "top-right",
    });
  };

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

  // API Helper
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

  // ==================== FETCH DEALS ====================
  const fetchDeals = useCallback(async () => {
    if (!isAuthenticated) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      const loadingToast = showLoading("Loading deals...");

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", showCount.toString());
      if (activeTab !== "all") params.append("status", activeTab);
      if (search.trim()) params.append("search", search);

      const data = await apiRequest(`/api/v1/deals?${params}`);

      toast.dismiss(loadingToast);
      
      if (data.success) {
        const dealsList = data.data || data.deals || [];
        setDeals(dealsList);
        setTotal(data.pagination?.total || data.total || dealsList.length);
        setTotalPages(data.pagination?.totalPages || Math.ceil((data.total || dealsList.length) / showCount));
        
        if (dealsList.length === 0) {
          showError("No deals found");
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching deals:", err);
        setError(err.message);
        showError("Failed to load deals");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentPage, showCount, activeTab, search, apiRequest]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest("/api/v1/deals/stats");
      
      if (data.success) {
        setStats(data.stats || data.data || {});
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [apiRequest]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDeals();
      fetchStats();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDeals, fetchStats, isAuthenticated]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      if (isAuthenticated) {
        fetchDeals();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ==================== HANDLERS ====================
  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting deal...");
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/deals/${id}`, { method: "DELETE" });
      setDeals((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => prev - 1);
      
      toast.dismiss(deleteToast);
      showSuccess("Deal deleted successfully!");
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting deal");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const updateToast = showLoading("Updating status...");
    try {
      setStatusUpdateLoading(id);
      await apiRequest(`/api/v1/deals/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, closing_status: newStatus } : d))
      );

      if (selectedDeal && selectedDeal.id === id) {
        setSelectedDeal((prev) => ({ ...prev, closing_status: newStatus }));
      }

      toast.dismiss(updateToast);
      showSuccess(`Status updated to ${newStatus}`);
      fetchStats();
    } catch (err) {
      console.error("Status Update Error:", err);
      toast.dismiss(updateToast);
      showError(err.message || "Error updating status");
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const handleEdit = (id) => {
    window.location.href = `/admin/deals/edit/${id}`;
  };
  
  const handleAdd = () => {
    window.location.href = "/admin/deals/add";
  };
  
  const handleView = (id) => {
    window.location.href = `/admin/deals/${id}`;
  };

  const handleViewDetail = (deal) => {
    setSelectedDeal(deal);
    setShowDetailModal(true);
  };

  const handleExport = async () => {
    const exportToast = showLoading("Exporting deals...");
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/deals/export?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `deals_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.dismiss(exportToast);
      showSuccess("Export completed!");
    } catch (err) {
      toast.dismiss(exportToast);
      showError(err.message || "Export failed");
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const formatCurrency = (value) => {
    if (value == null || value === "") return "-";
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatDate = (dateString) => {
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
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return option ? option.color : "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Closed":
        return <CheckCircle2 className="w-3 h-3" />;
      case "In Progress":
        return <TrendingUp className="w-3 h-3" />;
      case "Pending":
        return <Clock className="w-3 h-3" />;
      case "Cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const safeRender = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "object") return value.label || value.name || value.value || "-";
    return String(value);
  };

  const getTabCount = (tabKey) => {
    if (tabKey === "all") return total;
    return stats[tabKey] || 0;
  };

  // ==================== FILTERED DATA ====================
  const filteredDeals = useMemo(() => {
    return (deals || []).filter((d) => d && d.id);
  }, [deals]);

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

  const toggleSelectAll = () => {
    if (selectedDeals.size === filteredDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(filteredDeals.map((d) => d.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedDeals((prev) => {
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

  return (
    <>
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
              primary: '#10B981',
              secondary: '#fff',
            },
            style: {
              background: '#10B981',
              fontWeight: '500',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
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
                  Delete Deal
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
                  Are you sure you want to delete this deal? This action cannot be undone.
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

        {/* Detail Modal */}
        {showDetailModal && selectedDeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDetailModal(false)}
            />
            <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">
                  Deal #{selectedDeal.id} - {selectedDeal.closing_name || "Untitled"}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Status Badge */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getStatusColor(selectedDeal.closing_status)}`}>
                    {getStatusIcon(selectedDeal.closing_status)}
                    Status: {selectedDeal.closing_status || "N/A"}
                  </span>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Closing ID</div>
                    <div className="font-medium font-mono">{safeRender(selectedDeal.closing_ids)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Closing Name</div>
                    <div className="font-medium">{safeRender(selectedDeal.closing_name)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Buyer
                    </div>
                    <div className="font-medium">{safeRender(selectedDeal.buyers)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Seller
                    </div>
                    <div className="font-medium">{safeRender(selectedDeal.sellers)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Sales Price
                    </div>
                    <div className="font-medium text-green-600">{formatCurrency(selectedDeal.sales_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Commission
                    </div>
                    <div className="font-medium">{formatCurrency(selectedDeal.commission)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Listing City
                    </div>
                    <div className="font-medium">{safeRender(selectedDeal.listing_city)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3" /> Developer
                    </div>
                    <div className="font-medium">{safeRender(selectedDeal.developer)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Closing Date
                    </div>
                    <div className="font-medium">{formatDate(selectedDeal.closing_date)}</div>
                  </div>
                </div>

                {/* Update Status Section */}
                <div className="mt-6 pt-4 border-t">
                  <div className="text-gray-500 mb-2 text-sm">Update Status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusUpdate(selectedDeal.id, s.value)}
                        disabled={statusUpdateLoading === selectedDeal.id}
                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                          selectedDeal.closing_status === s.value
                            ? s.color + " border-current font-semibold"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEdit(selectedDeal.id);
                  }}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-3">
          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden flex-wrap">
              {STATUS_TABS.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    index !== 0 ? "border-l border-gray-300" : ""
                  } ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    activeTab === tab.key
                      ? { backgroundColor: "rgb(39,113,183)" }
                      : {}
                  }
                >
                  {tab.label} ({getTabCount(tab.key)})
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdd}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Deal
                </button>
                <button
                  onClick={handleExport}
                  disabled={deals.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={fetchDeals}
                  disabled={loading}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search deals..."
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
            {loading && deals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading deals...</p>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No deals found</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ backgroundColor: "rgb(236,237,238)" }}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            selectedDeals.size === filteredDeals.length &&
                            filteredDeals.length > 0
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
                      {isVisible("closing_name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Closing Name
                        </th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      {isVisible("buyer") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Buyer
                        </th>
                      )}
                      {isVisible("seller") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Seller
                        </th>
                      )}
                      {isVisible("sales_price") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Sales Price
                        </th>
                      )}
                      {isVisible("commission") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Commission
                        </th>
                      )}
                      {isVisible("listing_city") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          City
                        </th>
                      )}
                      {isVisible("developer") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Developer
                        </th>
                      )}
                      {isVisible("closing_date") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Closing Date
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
                    {filteredDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedDeals.has(deal.id)}
                            onChange={() => toggleSelect(deal.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        {isVisible("id") && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleViewDetail(deal)}
                              className="text-blue-600 hover:underline text-sm font-medium font-mono"
                            >
                              #{deal.id}
                            </button>
                          </td>
                        )}
                        {isVisible("closing_name") && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleEdit(deal.id)}
                              className="text-sm text-gray-800 font-medium hover:text-blue-600 text-left max-w-[180px] truncate block"
                              title={deal.closing_name}
                            >
                              {deal.closing_name || "Untitled Deal"}
                            </button>
                          </td>
                        )}
                        {isVisible("status") && (
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.closing_status)}`}>
                              {getStatusIcon(deal.closing_status)}
                              {deal.closing_status || "N/A"}
                            </span>
                          </td>
                        )}
                        {isVisible("buyer") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {safeRender(deal.buyers)}
                          </td>
                        )}
                        {isVisible("seller") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {safeRender(deal.sellers)}
                          </td>
                        )}
                        {isVisible("sales_price") && (
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {formatCurrency(deal.sales_price)}
                          </td>
                        )}
                        {isVisible("commission") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatCurrency(deal.commission)}
                          </td>
                        )}
                        {isVisible("listing_city") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {safeRender(deal.listing_city)}
                          </td>
                        )}
                        {isVisible("developer") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {safeRender(deal.developer)}
                          </td>
                        )}
                        {isVisible("closing_date") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(deal.closing_date)}
                          </td>
                        )}
                        {isVisible("created_at") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(deal.created_at)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(deal)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(deal.id)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({ type: "single", id: deal.id });
                                setShowDeleteModal(true);
                              }}
                              disabled={deleteLoading === deal.id}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === deal.id ? (
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
          {filteredDeals.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, total)} of{" "}
                {total} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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