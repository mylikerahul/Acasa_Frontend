"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Loader2,
  Trash2,
  Edit3,
  Plus,
  X,
  Eye,
  MapPin,
  Globe,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Country, City } from "country-state-city";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";
import AdminNavbar from "../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "image", label: "Image" },
  { id: "cities", label: "City Name" },
  { id: "country", label: "Country" },
  { id: "code", label: "Code" },
  { id: "slug", label: "Slug" },
  { id: "status", label: "Status" },
  { id: "created_at", label: "Created" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", bg: "bg-green-100", text: "text-green-700" },
  { value: "inactive", label: "Inactive", bg: "bg-red-100", text: "text-red-700" },
];

// ==================== IMAGE URL HELPER ====================
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("/")) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/uploads/cities/${imagePath}`;
};

// City Image Component
const CityImage = ({ src, alt }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const imageUrl = useMemo(() => getImageUrl(src), [src]);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <MapPin className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}
      <img
        src={imageUrl}
        alt={alt || "City"}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

export default function CitiesPage() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // City State
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "image", "cities", "country", "code", "status"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Quick Add Modal State
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddData, setQuickAddData] = useState({ country: "", cities: "" });
  const [countriesList, setCountriesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // View Modal State
  const [viewCity, setViewCity] = useState(null);

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        toast.error(
          sessionType === "user"
            ? "Please login as admin to access this dashboard"
            : "Please login to access dashboard"
        );
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        toast.error("Please login to access dashboard");
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        toast.error("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        if (verifyError.response?.status === 401) {
          toast.error("Invalid or expired token. Please login again.");
          handleAuthFailure();
          return;
        }
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.userType !== "admin") {
          toast.error("Invalid session type. Please login as admin.");
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
        toast.error("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      toast.error("Authentication failed. Please login again.");
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
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
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
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }, []);

  // Fetch Cities
  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", showCount);
      if (search.trim()) params.append("search", search);

      const data = await apiRequest(`/api/v1/cities?${params}`);

      if (data.success) {
        setCities(data.data || []);
        setTotal(data.pagination?.total_items || data.data?.length || 0);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, showCount, apiRequest]);

  // Initialize countries list
  useEffect(() => {
    setCountriesList(Country.getAllCountries());
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCities();
    }
  }, [fetchCities, isAuthenticated]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      if (isAuthenticated) {
        fetchCities();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Get cities by country
  const getCitiesByCountry = useCallback((countryCode) => {
    if (!countryCode) {
      setCitiesList([]);
      return;
    }
    const cities = City.getCitiesOfCountry(countryCode);
    setCitiesList(cities || []);
  }, []);

  // Generate slug
  const generateSlug = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handlers
  const handleDelete = async (id) => {
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/cities/${id}`, { method: "DELETE" });
      setCities((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
      toast.success("City deleted successfully!");
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err.message || "Error deleting city");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleStatusToggle = async (city) => {
    const newStatus = city.status === "active" ? "inactive" : "active";
    try {
      await apiRequest(`/api/v1/cities/${city.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setCities((prev) =>
        prev.map((c) => (c.id === city.id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (id) => {
    window.location.href = `/admin/cities/edit/${id}`;
  };

  const handleAdd = () => {
    window.location.href = "/admin/cities/add";
  };

  // Quick Add Handlers
  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();

    if (!quickAddData.country) {
      toast.error("Please select a country");
      return;
    }

    if (!quickAddData.cities) {
      toast.error("Please select a city");
      return;
    }

    setQuickAddLoading(true);

    try {
      const country = countriesList.find(
        (c) => c.isoCode === quickAddData.country
      );
      const countryName = country?.name || quickAddData.country;

      const formData = new FormData();
      formData.append("slug", generateSlug(quickAddData.cities));
      formData.append("country", countryName);
      formData.append("cities", quickAddData.cities);
      formData.append("code", quickAddData.country);
      formData.append("status", "active");

      const token = getAdminToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/cities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("City created successfully!");
        setShowQuickAddModal(false);
        setQuickAddData({ country: "", cities: "" });
        setCitiesList([]);
        fetchCities();
      } else {
        throw new Error(data.message || "Failed to create city");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create city");
    } finally {
      setQuickAddLoading(false);
    }
  };

  // Utility Functions
  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[1];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filtered Data
  const filteredCities = useMemo(() => {
    if (!search.trim()) return cities || [];
    const term = search.toLowerCase();
    return cities.filter(
      (c) =>
        c.id?.toString().includes(term) ||
        c.cities?.toLowerCase().includes(term) ||
        c.country?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term)
    );
  }, [cities, search]);

  const paginatedCities = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredCities.slice(start, start + showCount);
  }, [filteredCities, currentPage, showCount]);

  const totalPages = Math.ceil(filteredCities.length / showCount);

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
    if (selectedCities.size === paginatedCities.length) {
      setSelectedCities(new Set());
    } else {
      setSelectedCities(new Set(paginatedCities.map((c) => c.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Admin Navbar */}
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
                  Delete City
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
                  Are you sure you want to delete this city? This action cannot
                  be undone.
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

        {/* Quick Add Modal */}
        {showQuickAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowQuickAddModal(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Quick Add City
                </h3>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickAddData.country}
                    onChange={(e) => {
                      setQuickAddData((prev) => ({
                        ...prev,
                        country: e.target.value,
                        cities: "",
                      }));
                      getCitiesByCountry(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    {countriesList.map((country) => (
                      <option key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickAddData.cities}
                    onChange={(e) =>
                      setQuickAddData((prev) => ({
                        ...prev,
                        cities: e.target.value,
                      }))
                    }
                    disabled={!quickAddData.country}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Select City</option>
                    {citiesList.map((city, index) => (
                      <option key={`${city.name}-${index}`} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {!quickAddData.country && (
                    <p className="text-xs text-gray-500 mt-1">
                      Please select a country first
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickAddLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {quickAddLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Create City
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewCity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setViewCity(null)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  City Details
                </h3>
                <button
                  onClick={() => setViewCity(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-20 rounded border border-gray-300 overflow-hidden bg-gray-100 flex-shrink-0">
                    {viewCity.image ? (
                      <img
                        src={getImageUrl(viewCity.image)}
                        alt={viewCity.cities}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium text-gray-600">ID:</span>{" "}
                      {viewCity.id}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">City:</span>{" "}
                      {viewCity.cities}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Country:</span>{" "}
                      {viewCity.country}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Code:</span>{" "}
                      {viewCity.code || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Slug:</span>{" "}
                      {viewCity.slug || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Status:</span>{" "}
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          getStatusInfo(viewCity.status).bg
                        } ${getStatusInfo(viewCity.status).text}`}
                      >
                        {getStatusInfo(viewCity.status).label}
                      </span>
                    </p>
                  </div>
                </div>

                {(viewCity.seo_title || viewCity.seo_description) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">
                      SEO Information
                    </h4>
                    {viewCity.seo_title && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Title:</span>{" "}
                        {viewCity.seo_title}
                      </p>
                    )}
                    {viewCity.seo_description && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span>{" "}
                        {viewCity.seo_description}
                      </p>
                    )}
                  </div>
                )}
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
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                    onClick={() => setShowOverviewDropdown(false)}
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
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Cities</h1>
            <p className="text-gray-600 text-sm">
              Manage all cities in your platform
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => (window.location.href = "/admin/communities")}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Communities
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white">
                Cities
              </button>
              <button
                onClick={() =>
                  (window.location.href = "/admin/sub-communities")
                }
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Sub Communities
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  New City
                </button>
                <button
                  onClick={() => setShowQuickAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Quick Add
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchCities}
                  disabled={loading}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-600 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                </button>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by city or country"
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
                    onClick={() =>
                      setShowOverviewDropdown(!showOverviewDropdown)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
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
          <div className="bg-white border border-gray-300 border-t-0">
            {loading && cities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading cities...</p>
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No cities found</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            selectedCities.size === paginatedCities.length &&
                            paginatedCities.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          <div className="flex items-center gap-1">
                            ID
                            <div className="flex flex-col">
                              <ChevronDown className="w-3 h-3 text-gray-400 -mb-1" />
                              <ChevronDown className="w-3 h-3 text-gray-400 rotate-180" />
                            </div>
                          </div>
                        </th>
                      )}
                      {isVisible("image") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Image
                        </th>
                      )}
                      {isVisible("cities") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          City Name
                        </th>
                      )}
                      {isVisible("country") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Country
                        </th>
                      )}
                      {isVisible("code") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Code
                        </th>
                      )}
                      {isVisible("slug") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Slug
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
                    {paginatedCities.map((city) => {
                      const statusInfo = getStatusInfo(city.status);

                      return (
                        <tr
                          key={city.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedCities.has(city.id)}
                              onChange={() => toggleSelect(city.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(city.id)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                {city.id}
                              </button>
                            </td>
                          )}
                          {isVisible("image") && (
                            <td className="px-4 py-3">
                              <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 border border-gray-200">
                                <CityImage src={city.image} alt={city.cities} />
                              </div>
                            </td>
                          )}
                          {isVisible("cities") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-800">
                                  {city.cities}
                                </span>
                              </div>
                            </td>
                          )}
                          {isVisible("country") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-800">
                                  {city.country}
                                </span>
                              </div>
                            </td>
                          )}
                          {isVisible("code") && (
                            <td className="px-4 py-3">
                              <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {city.code || "-"}
                              </code>
                            </td>
                          )}
                          {isVisible("slug") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {city.slug || "-"}
                            </td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleStatusToggle(city)}
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text} hover:opacity-80`}
                              >
                                {statusInfo.label}
                              </button>
                            </td>
                          )}
                          {isVisible("created_at") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-800">
                                  {formatDate(city.created_at)}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewCity(city)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(city.id)}
                                className="p-1 rounded hover:bg-gray-200 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "single",
                                    id: city.id,
                                  });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === city.id}
                                className="p-1 rounded hover:bg-gray-200 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === city.id ? (
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
          {filteredCities.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 p-3">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredCities.length)} of{" "}
                {filteredCities.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 border rounded text-sm ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
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