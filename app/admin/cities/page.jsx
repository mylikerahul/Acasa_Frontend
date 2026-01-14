"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  X,
  Loader2,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  MapPin,
  AlertCircle,
  Image as ImageIcon,
  Globe,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { Country, City } from "country-state-city";
import AdminNavbar from "../dashboard/header/DashboardNavbar";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const COUNTRIES = [
  { id: 1, name: "United Arab Emirates", code: "AE" },
  { id: 2, name: "Saudi Arabia", code: "SA" },
  { id: 3, name: "Qatar", code: "QA" },
  { id: 4, name: "Bahrain", code: "BH" },
  { id: 5, name: "Kuwait", code: "KW" },
  { id: 6, name: "Oman", code: "OM" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-red-100 text-red-800" },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "image", label: "Image" },
  { id: "name", label: "City Name" },
  { id: "country", label: "Country" },
  { id: "coordinates", label: "Coordinates" },
  { id: "slug", label: "Slug" },
  { id: "status", label: "Status" },
];

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: { background: '#10B981', color: '#fff', fontWeight: '500' },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: { background: '#EF4444', color: '#fff', fontWeight: '500' },
  });
};

const showLoading = (message) => {
  return toast.loading(message, { position: "top-right" });
};

// ==================== UTILITY FUNCTIONS ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

const normalizeStatus = (status) => {
  if (status === 1 || status === "1" || status === "active" || status === true) {
    return "active";
  }
  return "inactive";
};

const isStatusActive = (status) => {
  return status === 1 || status === "1" || status === "active" || status === true;
};

const createAuthHeaders = (includeJson = false) => {
  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}` };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

const getCountryName = (countryId) => {
  const country = COUNTRIES.find((c) => c.id === parseInt(countryId));
  return country ? country.name : "Unknown";
};

// ==================== CUSTOM HOOKS ====================
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ==================== API HOOK ====================
const useCityApi = () => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const abortControllerRef = useRef(null);

  const fetchCities = useCallback(async (page = 1, limit = 10, filters = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/v1/cities?page=${page}&limit=${limit}`;

      if (filters.status) url += `&status=${filters.status}`;
      if (filters.country_id) url += `&country_id=${filters.country_id}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: createAuthHeaders(),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (data.success) {
        setCities(data.data || []);
        setPagination({
          currentPage: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.total || 0,
          limit: data.pagination?.limit || 10,
        });
        return { success: true };
      } else {
        showError(data.message || "Failed to fetch cities");
        return { success: false };
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fetch error:", error);
        showError("Failed to fetch cities");
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCityById = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        showError(data.message || "Failed to load city");
        return { success: false };
      }
    } catch (error) {
      console.error("Fetch by ID error:", error);
      showError("Failed to load city");
      return { success: false };
    }
  }, []);

  const createCity = useCallback(async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cities`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("City created successfully!");
        return { success: true, data: data.data };
      } else {
        showError(data.message || "Failed to create city");
        return { success: false };
      }
    } catch (error) {
      console.error("Create error:", error);
      showError("Failed to create city");
      return { success: false };
    }
  }, []);

  const updateCity = useCallback(async (id, formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("City updated successfully!");
        return { success: true, data: data.data };
      } else {
        showError(data.message || "Failed to update city");
        return { success: false };
      }
    } catch (error) {
      console.error("Update error:", error);
      showError("Failed to update city");
      return { success: false };
    }
  }, []);

  const deleteCity = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("City deleted successfully!");
        return { success: true };
      } else {
        showError(data.message || "Failed to delete city");
        return { success: false };
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Failed to delete city");
      return { success: false };
    }
  }, []);

  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}/status`, {
        method: "PATCH",
        headers: createAuthHeaders(true),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        showSuccess(`Status updated to ${newStatus}`);
        return { success: true };
      } else {
        showError(data.message || "Failed to update status");
        return { success: false };
      }
    } catch (error) {
      console.error("Status update error:", error);
      showError("Failed to update status");
      return { success: false };
    }
  }, []);

  const bulkDelete = useCallback(async (ids) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cities/bulk/delete`, {
        method: "POST",
        headers: createAuthHeaders(true),
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();

      if (data.success) {
        showSuccess(`${ids.length} cities deleted successfully!`);
        return { success: true };
      } else {
        showError(data.message || "Failed to delete cities");
        return { success: false };
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      showError("Failed to delete cities");
      return { success: false };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    cities,
    pagination,
    fetchCities,
    fetchCityById,
    createCity,
    updateCity,
    deleteCity,
    updateStatus,
    bulkDelete,
  };
};

// ==================== SUB COMPONENTS ====================
const CityImage = React.memo(({ src, alt, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!src || imageError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={getImageUrl(src)}
        alt={alt || "City"}
        className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
});

CityImage.displayName = "CityImage";

// Delete Modal
const DeleteModal = React.memo(({ isOpen, onClose, onConfirm, loading, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DeleteModal.displayName = "DeleteModal";

// View Modal
const ViewModal = React.memo(({ city, onClose }) => {
  if (!city) return null;

  const statusInfo = isStatusActive(city.status) ? STATUS_OPTIONS[0] : STATUS_OPTIONS[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{city?.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <div className="w-full h-32 rounded border border-gray-200 overflow-hidden bg-gray-100">
                <CityImage src={city?.img} alt={city?.name} />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2 text-sm">
              <p><span className="font-medium text-gray-600">ID:</span> {city?.id}</p>
              <p><span className="font-medium text-gray-600">Name:</span> {city?.name}</p>
              <p><span className="font-medium text-gray-600">Country:</span> {getCountryName(city?.country_id)}</p>
              <p><span className="font-medium text-gray-600">Slug:</span> {city?.slug}</p>
              {city?.latitude && city?.longitude && (
                <p>
                  <span className="font-medium text-gray-600">Coordinates:</span>{" "}
                  {city.latitude}, {city.longitude}
                </p>
              )}
              <p>
                <span className="font-medium text-gray-600">Status:</span>{" "}
                <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </p>
            </div>
          </div>

          {city?.description && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Description</h4>
              <div
                className="text-sm text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: city.description }}
              />
            </div>
          )}

          {(city?.seo_title || city?.seo_description || city?.seo_keyword) && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-2">SEO Information</h4>
              <div className="space-y-2 text-sm">
                {city?.seo_title && (
                  <p><span className="font-medium text-gray-600">Title:</span> {city.seo_title}</p>
                )}
                {city?.seo_description && (
                  <p><span className="font-medium text-gray-600">Description:</span> {city.seo_description}</p>
                )}
                {city?.seo_keyword && (
                  <p><span className="font-medium text-gray-600">Keywords:</span> {city.seo_keyword}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ViewModal.displayName = "ViewModal";

// Quick Add Modal
const QuickAddModal = React.memo(({ isOpen, onClose, onSubmit, loading }) => {
  const [countriesList, setCountriesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [modalData, setModalData] = useState({ country: "", city: "" });

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountriesList(allCountries);
  }, []);

  const handleCountryChange = (countryCode) => {
    setModalData({ country: countryCode, city: "" });
    if (countryCode) {
      const cities = City.getCitiesOfCountry(countryCode);
      setCitiesList(cities || []);
    } else {
      setCitiesList([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!modalData.country) {
      showError("Please select a country");
      return;
    }
    if (!modalData.city) {
      showError("Please select a city");
      return;
    }

    const country = countriesList.find((c) => c.isoCode === modalData.country);

    const formData = new FormData();
    formData.append("name", modalData.city);
    formData.append("country_id", "1"); // Default to UAE
    formData.append("status", "active");

    const success = await onSubmit(formData);
    if (success) {
      setModalData({ country: "", city: "" });
      setCitiesList([]);
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setModalData({ country: "", city: "" });
      setCitiesList([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Quick Add City</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Country <span className="text-red-500">*</span>
            </label>
            <select
              value={modalData.country}
              onChange={(e) => handleCountryChange(e.target.value)}
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
              Select City <span className="text-red-500">*</span>
            </label>
            <select
              value={modalData.city}
              onChange={(e) => setModalData((prev) => ({ ...prev, city: e.target.value }))}
              disabled={!modalData.country}
              className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">Select City</option>
              {citiesList.map((city, index) => (
                <option key={`${city.name}-${index}`} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            {!modalData.country && (
              <p className="text-xs text-gray-500 mt-1">Please select a country first</p>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

QuickAddModal.displayName = "QuickAddModal";

// Column Selector Modal
const ColumnSelectorModal = React.memo(({ isOpen, onClose, visibleColumns, onToggle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Show / Hide Column in Listing</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
                  onChange={() => onToggle(col.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                onClose();
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
  );
});

ColumnSelectorModal.displayName = "ColumnSelectorModal";

// ==================== MAIN COMPONENT ====================
export default function CitiesScreen() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // City State
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [viewCity, setViewCity] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "image", "name", "country", "slug", "status"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterCountryId, setFilterCountryId] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    loading,
    cities,
    pagination,
    fetchCities,
    fetchCityById,
    createCity,
    updateCity,
    deleteCity,
    updateStatus,
    bulkDelete,
  } = useCityApi();

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
          const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

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

  // ==================== HANDLERS ====================
  const handleQuickAdd = useCallback(
    async (formData) => {
      setSubmitLoading(true);
      const saveToast = showLoading("Creating city...");

      try {
        const result = await createCity(formData);
        toast.dismiss(saveToast);

        if (result.success) {
          fetchCities(1, showCount);
          return true;
        }
        return false;
      } catch (error) {
        toast.dismiss(saveToast);
        console.error("Quick add error:", error);
        showError(error.message || "Failed to create city");
        return false;
      } finally {
        setSubmitLoading(false);
      }
    },
    [createCity, fetchCities, showCount]
  );

  const handleEdit = (id) => {
    fastNavigate(`/admin/cities/edit/${id}`);
  };

  const handleAdd = () => {
    fastNavigate("/admin/cities/add");
  };

  const handleDeleteClick = useCallback((city) => {
    setDeleteTarget(city);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    const deleteToast = showLoading("Deleting city...");

    try {
      const result = await deleteCity(deleteTarget.id);
      toast.dismiss(deleteToast);

      if (result.success) {
        fetchCities(currentPage, showCount, { search: searchTerm, country_id: filterCountryId });
        setShowDeleteModal(false);
        setDeleteTarget(null);
      }
    } catch (error) {
      toast.dismiss(deleteToast);
      console.error("Delete error:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, deleteCity, fetchCities, currentPage, showCount, searchTerm, filterCountryId]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) {
      showError("Please select cities to delete");
      return;
    }

    setDeleteLoading(true);
    const deleteToast = showLoading(`Deleting ${selectedIds.size} cities...`);

    try {
      const result = await bulkDelete(Array.from(selectedIds));
      toast.dismiss(deleteToast);

      if (result.success) {
        setSelectedIds(new Set());
        fetchCities(1, showCount);
        setShowDeleteModal(false);
      }
    } catch (error) {
      toast.dismiss(deleteToast);
      console.error("Bulk delete error:", error);
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedIds, bulkDelete, fetchCities, showCount]);

  const handleStatusUpdate = useCallback(
    async (id, newStatus) => {
      const updateToast = showLoading("Updating status...");
      const result = await updateStatus(id, newStatus);
      toast.dismiss(updateToast);

      if (result.success) {
        fetchCities(currentPage, showCount, { search: searchTerm, country_id: filterCountryId });
      }
    },
    [updateStatus, fetchCities, currentPage, showCount, searchTerm, filterCountryId]
  );

  const handleRefresh = useCallback(() => {
    setSearchTerm("");
    setFilterCountryId("");
    setSelectedIds(new Set());
    setCurrentPage(1);
    fetchCities(1, showCount);
  }, [fetchCities, showCount]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (isAuthenticated) {
      fetchCities(1, showCount);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1);
      fetchCities(1, showCount, { search: debouncedSearchTerm, country_id: filterCountryId });
    }
  }, [debouncedSearchTerm, filterCountryId, isAuthenticated, showCount]);

  useEffect(() => {
    if (isAuthenticated && currentPage > 1) {
      fetchCities(currentPage, showCount, { search: searchTerm, country_id: filterCountryId });
    }
  }, [currentPage]);

  // ==================== UTILITY FUNCTIONS ====================
  const getStatusInfo = (status) => {
    const isActive = isStatusActive(status);
    return isActive ? STATUS_OPTIONS[0] : STATUS_OPTIONS[1];
  };

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
    if (selectedIds.size === cities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cities.map((c) => c.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = pagination.totalPages || 1;

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} gutter={8} />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        {/* Delete Modal */}
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={deleteTarget ? handleDeleteConfirm : handleBulkDelete}
          loading={deleteLoading}
          title={deleteTarget ? "Delete City" : `Delete ${selectedIds.size} Cities`}
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
              : `Are you sure you want to delete ${selectedIds.size} cities? This action cannot be undone.`
          }
        />

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={showQuickAddModal}
          onClose={() => setShowQuickAddModal(false)}
          onSubmit={handleQuickAdd}
          loading={submitLoading}
        />

        {/* View Modal */}
        <ViewModal city={viewCity} onClose={() => setViewCity(null)} />

        {/* Column Selector Modal */}
        <ColumnSelectorModal
          isOpen={showOverviewDropdown}
          onClose={() => setShowOverviewDropdown(false)}
          visibleColumns={visibleColumns}
          onToggle={toggleColumn}
        />

        <div className="p-3">
          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => fastNavigate("/admin/communities")}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Communities
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-gray-800 text-white">
                Cities
              </button>
              <button
                onClick={() => fastNavigate("/admin/sub-communities")}
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
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
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

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                {selectedIds.size > 0 && (
                  <button
                    onClick={() => {
                      setDeleteTarget(null);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedIds.size})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Country Filter */}
                <select
                  value={filterCountryId}
                  onChange={(e) => setFilterCountryId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>

                <button
                  onClick={() => setShowOverviewDropdown(true)}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded hover:opacity-90"
                >
                  Overview
                  <ChevronDown className="w-4 h-4" />
                </button>
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
              <span className="ml-4 text-gray-500">Total: {pagination.totalItems} cities</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 border-t-0 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <div className="flex-1 text-sm text-red-800">{error}</div>
              <button onClick={handleRefresh} className="text-sm underline text-red-700">
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            {loading && cities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading cities...</p>
              </div>
            ) : cities.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No cities found</p>
                {(searchTerm || filterCountryId) && (
                  <p className="text-sm text-gray-500 mt-1">Try a different search term or filter</p>
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
                          checked={selectedIds.size === cities.length && cities.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                      )}
                      {isVisible("image") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Image</th>
                      )}
                      {isVisible("name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">City Name</th>
                      )}
                      {isVisible("country") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Country</th>
                      )}
                      {isVisible("coordinates") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Coordinates</th>
                      )}
                      {isVisible("slug") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Slug</th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map((city) => {
                      const statusInfo = getStatusInfo(city.status);
                      const isActive = isStatusActive(city.status);

                      return (
                        <tr key={city.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(city.id)}
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
                                #{city.id}
                              </button>
                            </td>
                          )}
                          {isVisible("image") && (
                            <td className="px-4 py-3">
                              <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 border border-gray-200">
                                <CityImage src={city.img} alt={city.name} />
                              </div>
                            </td>
                          )}
                          {isVisible("name") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-800">{city.name}</span>
                              </div>
                            </td>
                          )}
                          {isVisible("country") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600">{getCountryName(city.country_id)}</span>
                              </div>
                            </td>
                          )}
                          {isVisible("coordinates") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {city.latitude && city.longitude ? (
                                <span>{city.latitude}, {city.longitude}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("slug") && (
                            <td className="px-4 py-3 text-sm text-gray-600">{city.slug || "-"}</td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleStatusUpdate(city.id, isActive ? "inactive" : "active")}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} hover:opacity-80 transition-opacity`}
                              >
                                {statusInfo.label}
                              </button>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewCity(city)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(city.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(city)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
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

          {/* Pagination */}
          {cities.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{" "}
                {pagination.totalItems} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(pageNum)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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