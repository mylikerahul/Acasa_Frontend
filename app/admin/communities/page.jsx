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
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import TextEditor from "../../components/common/SimpleTextEditor";
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
  { id: 1, name: "United Arab Emirates" },
  { id: 2, name: "Saudi Arabia" },
  { id: 3, name: "Qatar" },
  { id: 4, name: "Bahrain" },
  { id: 5, name: "Kuwait" },
  { id: 6, name: "Oman" },
];

const UAE_CITIES = [
  { id: 1, name: "Dubai" },
  { id: 2, name: "Abu Dhabi" },
  { id: 3, name: "Sharjah" },
  { id: 4, name: "Ajman" },
  { id: 5, name: "Ras Al Khaimah" },
  { id: 6, name: "Fujairah" },
  { id: 7, name: "Umm Al Quwain" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-red-100 text-red-800" },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "image", label: "Image" },
  { id: "name", label: "Name" },
  { id: "city", label: "City" },
  { id: "country", label: "Country" },
  { id: "description", label: "Description" },
  { id: "status", label: "Status" },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const INITIAL_FORM_STATE = {
  country_id: 1,
  city_id: 1,
  name: "",
  longitude: "",
  latitude: "",
  seo_title: "",
  seo_description: "",
  seo_keyword: "",
  description: "",
  status: "active",
  featured: false,
  top_community: false,
};

const INITIAL_MODAL_STATE = {
  city_id: "",
  name: "",
};

// ==================== TOAST HELPERS ====================
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

// ==================== UTILITY FUNCTIONS ====================
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
};

const truncateText = (str, maxLength = 120) => {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
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

const validateFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const extensions = ALLOWED_IMAGE_TYPES.map((t) => t.split("/")[1]).join(", ");
    return { valid: false, error: `Invalid image type. Allowed: ${extensions}` };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return { valid: false, error: `Image size must be less than ${sizeMB}MB` };
  }
  return { valid: true, error: null };
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

const getCityName = (cityId) => {
  const city = UAE_CITIES.find((c) => c.id === parseInt(cityId));
  return city ? city.name : "Unknown";
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

const useFileUpload = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const clearImage = useCallback(() => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  const resetFiles = useCallback(() => {
    clearImage();
  }, [clearImage]);

  const setPreviewsFromCommunity = useCallback((community) => {
    setImagePreview(community?.img ? getImageUrl(community.img) : null);
    setImageFile(null);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  return {
    imageFile,
    imagePreview,
    handleImageChange,
    clearImage,
    resetFiles,
    setPreviewsFromCommunity,
  };
};

const useCommunityApi = () => {
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const abortControllerRef = useRef(null);

  const fetchCommunities = useCallback(async (page = 1, limit = 10, filters = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/v1/communities?page=${page}&limit=${limit}`;

      if (filters.status) url += `&status=${filters.status}`;
      if (filters.city_id) url += `&city_id=${filters.city_id}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: createAuthHeaders(),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (data.success) {
        setCommunities(data.data || []);
        setPagination({
          currentPage: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.total || 0,
          limit: data.pagination?.limit || 10,
        });
        return { success: true };
      } else {
        showError(data.message || "Failed to fetch communities");
        return { success: false };
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fetch error:", error);
        showError("Failed to fetch communities");
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommunityById = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/communities/${id}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        showError(data.message || "Failed to load community");
        return { success: false };
      }
    } catch (error) {
      console.error("Fetch by ID error:", error);
      showError("Failed to load community");
      return { success: false };
    }
  }, []);

  const createCommunity = useCallback(async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/communities`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Community created successfully!");
        return { success: true, data: data.data };
      } else {
        showError(data.message || "Failed to create community");
        return { success: false };
      }
    } catch (error) {
      console.error("Create error:", error);
      showError("Failed to create community");
      return { success: false };
    }
  }, []);

  const updateCommunity = useCallback(async (id, formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/communities/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Community updated successfully!");
        return { success: true, data: data.data };
      } else {
        showError(data.message || "Failed to update community");
        return { success: false };
      }
    } catch (error) {
      console.error("Update error:", error);
      showError("Failed to update community");
      return { success: false };
    }
  }, []);

  const deleteCommunity = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/communities/${id}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Community deleted successfully!");
        return { success: true };
      } else {
        showError(data.message || "Failed to delete community");
        return { success: false };
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Failed to delete community");
      return { success: false };
    }
  }, []);

  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/communities/${id}/status`, {
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    communities,
    pagination,
    fetchCommunities,
    fetchCommunityById,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    updateStatus,
  };
};

// ==================== SUB COMPONENTS ====================
const CommunityImage = React.memo(({ src, alt }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <MapPin className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(src)}
      alt={alt || "Community"}
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  );
});

CommunityImage.displayName = "CommunityImage";

// ==================== MAIN COMPONENT ====================
export default function CommunitiesScreen() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Community State
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [viewCommunity, setViewCommunity] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalData, setModalData] = useState(INITIAL_MODAL_STATE);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "image", "name", "city", "country", "status"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    loading,
    communities,
    pagination,
    fetchCommunities,
    fetchCommunityById,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    updateStatus,
  } = useCommunityApi();

  const fileUpload = useFileUpload();

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

  // ==================== FORM HANDLERS ====================
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleModalChange = useCallback((field, value) => {
    setModalData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    fileUpload.resetFiles();
    setEditMode(false);
    setEditId(null);
  }, [fileUpload]);

  // ==================== VALIDATION ====================
  const validateMainForm = useCallback(() => {
    if (!formData.name.trim()) {
      showError("Community name is required");
      return false;
    }
    if (!formData.country_id) {
      showError("Country is required");
      return false;
    }
    if (!formData.city_id) {
      showError("City is required");
      return false;
    }
    return true;
  }, [formData]);

  const validateModalForm = useCallback(() => {
    if (!modalData.city_id) {
      showError("Please select a city");
      return false;
    }
    if (!modalData.name.trim()) {
      showError("Community name is required");
      return false;
    }
    return true;
  }, [modalData]);

  // ==================== SUBMIT HANDLERS ====================
  const handleMainSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateMainForm()) return;

      if (!isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        logoutAll();
        fastNavigate("/admin/login");
        return;
      }

      setSubmitLoading(true);
      const saveToast = showLoading(editMode ? "Updating community..." : "Creating community...");

      try {
        const formDataToSend = new FormData();

        formDataToSend.append("name", formData.name.trim());
        formDataToSend.append("country_id", formData.country_id);
        formDataToSend.append("city_id", formData.city_id);
        formDataToSend.append("status", formData.status);

        if (formData.latitude) formDataToSend.append("latitude", formData.latitude);
        if (formData.longitude) formDataToSend.append("longitude", formData.longitude);
        if (formData.description) formDataToSend.append("description", formData.description);
        if (formData.seo_title) formDataToSend.append("seo_title", formData.seo_title);
        if (formData.seo_description) formDataToSend.append("seo_description", formData.seo_description);
        if (formData.seo_keyword) formDataToSend.append("seo_keywork", formData.seo_keyword);

        formDataToSend.append("featured", formData.featured ? 1 : 0);
        formDataToSend.append("top_community", formData.top_community ? 1 : 0);

        if (fileUpload.imageFile) {
          formDataToSend.append("img", fileUpload.imageFile);
        }

        const result = editMode
          ? await updateCommunity(editId, formDataToSend)
          : await createCommunity(formDataToSend);

        toast.dismiss(saveToast);

        if (result.success) {
          resetForm();
          fetchCommunities(pagination.currentPage);
        }
      } finally {
        setSubmitLoading(false);
      }
    },
    [formData, fileUpload.imageFile, editMode, editId, validateMainForm, createCommunity, updateCommunity, resetForm, fetchCommunities, pagination.currentPage]
  );

  const handleModalSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateModalForm()) return;

      if (!isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        logoutAll();
        fastNavigate("/admin/login");
        return;
      }

      setSubmitLoading(true);
      const saveToast = showLoading("Creating community...");

      try {
        const formDataToSend = new FormData();
        formDataToSend.append("country_id", 1);
        formDataToSend.append("city_id", modalData.city_id);
        formDataToSend.append("name", modalData.name.trim());
        formDataToSend.append("status", "active");

        const result = await createCommunity(formDataToSend);

        toast.dismiss(saveToast);

        if (result.success) {
          setShowQuickAddModal(false);
          setModalData(INITIAL_MODAL_STATE);
          fetchCommunities(1);
        }
      } finally {
        setSubmitLoading(false);
      }
    },
    [modalData, validateModalForm, createCommunity, fetchCommunities]
  );

  // ==================== CRUD HANDLERS ====================
  const handleEdit = useCallback(
    async (id) => {
      const result = await fetchCommunityById(id);

      if (result.success) {
        const community = result.data;
        setFormData({
          country_id: community.country_id || 1,
          city_id: community.city_id || 1,
          name: community.name || "",
          longitude: community.longitude || "",
          latitude: community.latitude || "",
          seo_title: community.seo_title || "",
          seo_description: community.seo_description || "",
          seo_keyword: community.seo_keyword || community.seo_keywork || "",
          description: community.description || "",
          status: normalizeStatus(community.status),
          featured: community.featured === 1 || community.featured === true,
          top_community: community.top_community === 1 || community.top_community === true,
        });
        fileUpload.setPreviewsFromCommunity(community);
        setEditMode(true);
        setEditId(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        showSuccess("Community loaded for editing");
      }
    },
    [fetchCommunityById, fileUpload]
  );

  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting community...");
    try {
      setDeleteLoading(id);
      const result = await deleteCommunity(id);

      toast.dismiss(deleteToast);

      if (result.success) {
        fetchCommunities(pagination.currentPage);
        setShowDeleteModal(false);
        setDeleteTarget(null);
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleStatusUpdate = useCallback(
    async (id, newStatus) => {
      const updateToast = showLoading("Updating status...");
      const result = await updateStatus(id, newStatus);
      toast.dismiss(updateToast);
      if (result.success) {
        fetchCommunities(pagination.currentPage);
      }
    },
    [updateStatus, fetchCommunities, pagination.currentPage]
  );

  const handleRefresh = useCallback(() => {
    setSearchTerm("");
    setSelectedIds(new Set());
    fetchCommunities(1);
  }, [fetchCommunities]);

  // Search effect
  useEffect(() => {
    if (isAuthenticated && debouncedSearchTerm !== undefined) {
      fetchCommunities(1, showCount, { search: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm, isAuthenticated, showCount]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchCommunities(1);
    }
  }, [isAuthenticated]);

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
    if (selectedIds.size === communities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(communities.map((c) => c.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== FILTERED DATA ====================
  const filteredCommunities = useMemo(() => {
    return (communities || []).filter((c) => c && c.id);
  }, [communities]);

  const paginatedCommunities = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredCommunities.slice(start, start + showCount);
  }, [filteredCommunities, currentPage, showCount]);

  const totalPages = Math.ceil(filteredCommunities.length / showCount);

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
                  Delete Community
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
                  Are you sure you want to delete this community? This action cannot be undone.
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
                  Quick Add Community
                </h3>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleModalSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalData.city_id}
                    onChange={(e) => handleModalChange("city_id", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select City</option>
                    {UAE_CITIES.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Community Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalData.name}
                    onChange={(e) => handleModalChange("name", e.target.value)}
                    placeholder="Enter community name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
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
                    disabled={submitLoading}
                    style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90 disabled:opacity-50"
                  >
                    {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewCommunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setViewCommunity(null)}
            />
            <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  {viewCommunity?.name}
                </h3>
                <button
                  onClick={() => setViewCommunity(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-1">
                    <div className="w-full h-32 rounded border border-gray-200 overflow-hidden bg-gray-100">
                      <CommunityImage src={viewCommunity?.img} alt={viewCommunity?.name} />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2 text-sm">
                    <p><span className="font-medium text-gray-600">ID:</span> {viewCommunity?.id}</p>
                    <p><span className="font-medium text-gray-600">Name:</span> {viewCommunity?.name}</p>
                    <p><span className="font-medium text-gray-600">City:</span> {getCityName(viewCommunity?.city_id)}</p>
                    <p><span className="font-medium text-gray-600">Country:</span> {getCountryName(viewCommunity?.country_id)}</p>
                    <p>
                      <span className="font-medium text-gray-600">Status:</span>{" "}
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusInfo(viewCommunity?.status).color}`}>
                        {getStatusInfo(viewCommunity?.status).label}
                      </span>
                    </p>
                  </div>
                </div>

                {viewCommunity?.description && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                    <div
                      className="text-sm text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewCommunity.description }}
                    />
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
          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden">
              <button className="px-4 py-2 text-sm font-medium bg-gray-800 text-white">
                Communities
              </button>
              <button
                onClick={() => fastNavigate("/admin/cities")}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
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

          {/* Add/Edit Form Card */}
          <div className="bg-white border border-gray-300 rounded-lg mb-4">
            <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 className="text-sm font-semibold text-gray-800">
                {editMode ? "Edit Community" : "Add New Community"}
              </h2>
            </div>

            <form onSubmit={handleMainSave} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country_id}
                    onChange={(e) => handleFormChange("country_id", parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => handleFormChange("city_id", parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {UAE_CITIES.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Community Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Enter community name"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => handleFormChange("latitude", e.target.value)}
                    placeholder="e.g., 25.2048"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => handleFormChange("longitude", e.target.value)}
                    placeholder="e.g., 55.2708"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Community Image
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={fileUpload.handleImageChange}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="flex items-end">
                  {fileUpload.imagePreview && (
                    <div className="relative group">
                      <img
                        src={fileUpload.imagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={fileUpload.clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleFormChange("featured", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.top_community}
                    onChange={(e) => handleFormChange("top_community", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Top Community</span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleFormChange("seo_title", e.target.value)}
                      maxLength={60}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.seo_title.length}/60</p>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      SEO Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.seo_description}
                      onChange={(e) => handleFormChange("seo_description", e.target.value)}
                      maxLength={160}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.seo_description.length}/160</p>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.seo_keyword}
                      onChange={(e) => handleFormChange("seo_keyword", e.target.value)}
                      placeholder="keyword1, keyword2"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Description
                  </label>
                  <TextEditor
                    value={formData.description}
                    onChange={(value) => handleFormChange("description", value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90 disabled:opacity-50"
                >
                  {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editMode ? "Update Community" : "Save Community"}
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQuickAddModal(true)}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
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
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search communities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
              <span className="ml-4 text-gray-500">Total: {pagination.totalItems} communities</span>
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
          <div
            className="border border-gray-300 border-t-0"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            {loading && communities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading communities...</p>
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No communities found</p>
                {searchTerm && (
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
                            selectedIds.size === paginatedCommunities.length &&
                            paginatedCommunities.length > 0
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
                      {isVisible("image") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Image
                        </th>
                      )}
                      {isVisible("name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                      )}
                      {isVisible("city") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          City
                        </th>
                      )}
                      {isVisible("country") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Country
                        </th>
                      )}
                      {isVisible("description") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Description
                        </th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCommunities.map((community) => {
                      const statusInfo = getStatusInfo(community.status);
                      const isActive = isStatusActive(community.status);

                      return (
                        <tr
                          key={community.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(community.id)}
                              onChange={() => toggleSelect(community.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(community.id)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                #{community.id}
                              </button>
                            </td>
                          )}
                          {isVisible("image") && (
                            <td className="px-4 py-3">
                              <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 border border-gray-200">
                                <CommunityImage src={community.img} alt={community.name} />
                              </div>
                            </td>
                          )}
                          {isVisible("name") && (
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              {community.name}
                            </td>
                          )}
                          {isVisible("city") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {getCityName(community.city_id)}
                            </td>
                          )}
                          {isVisible("country") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {getCountryName(community.country_id)}
                            </td>
                          )}
                          {isVisible("description") && (
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                              <p className="truncate">
                                {truncateText(stripHtml(community.description || ""), 80)}
                              </p>
                            </td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() =>
                                  handleStatusUpdate(community.id, isActive ? "inactive" : "active")
                                }
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} hover:opacity-80`}
                              >
                                {statusInfo.label}
                              </button>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewCommunity(community)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(community.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: community.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === community.id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === community.id ? (
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
          {filteredCommunities.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredCommunities.length)} of{" "}
                {filteredCommunities.length} entries
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
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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