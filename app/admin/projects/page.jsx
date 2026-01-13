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
  Building2,
  DollarSign,
  BedDouble,
  Star,
  Eye,
  EyeOff,
  ExternalLink,
  ImageIcon,
  FileText,
  Maximize,
  Settings2,
  Calendar,
  Users,
  ArrowUp,
  ArrowDownUp,
  SortDesc,
  SortAsc,
  CheckCircle,
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// ==================== IMAGE URL HELPER ====================
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (!isNaN(imagePath)) {
    return `${API_BASE_URL}/api/v1/media/${imagePath}`;
  }
  
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("data:")) return imagePath;

  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

  if (cleanPath.startsWith("uploads/projects/")) return `${API_BASE_URL}/${cleanPath}`;
  if (cleanPath.startsWith("uploads/")) return `${API_BASE_URL}/uploads/projects/${cleanPath.replace("uploads/", "")}`;
  if (cleanPath.startsWith("projects/")) return `${API_BASE_URL}/uploads/${cleanPath}`;
  return `${API_BASE_URL}/uploads/projects/${cleanPath}`;
};

// ==================== PROJECT IMAGE COMPONENT ====================
const ProjectImage = ({ src, alt, thumbnail }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageSource = useMemo(() => {
    if (src) return getImageUrl(src);
    if (thumbnail) return getImageUrl(thumbnail);
    return null;
  }, [src, thumbnail]);

  if (!imageSource || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Building2 className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      )}
      <img
        src={imageSource}
        alt={alt || "Project"}
        className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: 1, label: "Active", pill: "bg-green-100 text-green-800" },
  { value: 0, label: "Inactive", pill: "bg-red-100 text-red-800" },
];

const LISTING_TYPE_OPTIONS = [
  { value: "sale", label: "Sale", pill: "bg-blue-100 text-blue-800" },
  { value: "rent", label: "Rent", pill: "bg-purple-100 text-purple-800" },
  { value: "Off plan", label: "Off Plan", pill: "bg-amber-100 text-amber-800" },
  { value: "Ready", label: "Ready", pill: "bg-green-100 text-green-800" },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID", key: "id" },
  { id: "picture", label: "Picture", key: "featured_image" },
  { id: "project_name", label: "Project Name", key: "ProjectName" },
  { id: "status", label: "Status", key: "status" },
  { id: "type", label: "Type", key: "listing_type" },
  { id: "price", label: "Price", key: "price" },
  { id: "beds", label: "Beds", key: "bedroom" },
  { id: "location", label: "Location", key: "LocationName" },
  { id: "building", label: "Building", key: "BuildingName" },
  { id: "developer", label: "Developer", key: "DeveloperName" },
  { id: "featured", label: "Featured", key: "featured_project" },
  { id: "verified", label: "Verified", key: "verified" },
  { id: "area", label: "Area", key: "area" },
  { id: "units", label: "Units", key: "total_building" },
  { id: "completion", label: "Completion", key: "completion_date" },
  { id: "views", label: "Views", key: "views" },
  { id: "contacts", label: "Contacts", key: "contacts_count" },
  { id: "created_at", label: "Created", key: "created_at" },
];

// ==================== HELPER FUNCTIONS ====================
const getLocationString = (project) => {
  const parts = [];
  
  if (project.LocationName) parts.push(project.LocationName);
  if (project.BuildingName) parts.push(project.BuildingName);
  if (project.CityName) parts.push(project.CityName);
  else if (project.city_id) parts.push(`City #${project.city_id}`);
  
  if (project.StateName) parts.push(project.StateName);
  
  return parts.join(', ') || 'N/A';
};

// ==================== MAIN COMPONENT ====================
export default function ProjectsPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Page state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  // Pagination
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "picture", "project_name", "status", "type", "price", "location"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      const error = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  // ==================== FETCH PROJECTS ====================
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadingToast = showLoading("Loading projects...");

      const params = new URLSearchParams();

      if (statusFilter === "active") params.append("status", "1");
      else if (statusFilter === "inactive") params.append("status", "0");

      if (activeTab === "sale") params.append("listing_type", "sale");
      else if (activeTab === "rent") params.append("listing_type", "rent");
      else if (activeTab === "featured") params.append("featured_only", "true");
      else if (activeTab === "verified") params.append("verified_only", "true");
      else if (activeTab === "my" && admin) params.append("user_id", admin.id);

      if (listingTypeFilter !== "all") params.append("listing_type", listingTypeFilter);

      if (search.trim()) params.append("search", search.trim());

      params.append("sort_by", sortBy);
      params.append("sort_order", sortOrder);
      params.append("limit", "1000"); // Load enough for client pagination if needed, or implement server pagination properly

      const token = getAdminToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/projects?${params.toString()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        withCredentials: true,
      });

      toast.dismiss(loadingToast);

      if (response.data.success) {
        // *** KEY FIX: Check multiple possible keys for the data array ***
        let projectsData = 
          response.data.projects || 
          response.data.listings || 
          response.data.data || 
          [];
        
        // Sorting fallback
        projectsData = projectsData.sort((a, b) => {
           // Basic sort by ID descending if no specific sort logic provided by API
           return sortOrder === "desc" ? b.id - a.id : a.id - b.id;
        });
        
        setProjects(projectsData);
        setTotal(response.data.pagination?.total || response.data.total || projectsData.length);
        
        if (projectsData.length === 0) {
          // Only show error if we expected results but got none, 
          // but for an empty state, we usually handle it in UI
          console.log("No projects found in response");
        }
      } else {
        setProjects([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
      if (err.response?.status === 401) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
      } else {
        const errorMsg = err.response?.data?.message || "Failed to load projects";
        setError(errorMsg);
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, listingTypeFilter, search, admin, handleAuthFailure, sortBy, sortOrder]);

  // ==================== DELETE HANDLERS ====================
  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting project...");
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
      
      toast.dismiss(deleteToast);
      showSuccess("Project deleted successfully!");
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting project");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const bulkDeleteProjects = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProjects.size} projects?`)) return;

    const deleteToast = showLoading("Deleting projects...");
    try {
      setLoading(true);
      const token = getAdminToken();

      const response = await axios.delete(`${API_BASE_URL}/api/v1/projects/bulk`, {
        data: { project_ids: Array.from(selectedProjects) },
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        withCredentials: true,
      });

      toast.dismiss(deleteToast);

      if (response.data.success) {
        setProjects((prev) => prev.filter((p) => !selectedProjects.has(p.id)));
        setTotal((prev) => Math.max(0, prev - selectedProjects.size));
        setSelectedProjects(new Set());
        showSuccess(`${selectedProjects.size} projects deleted successfully!`);
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.dismiss(deleteToast);
      showError("Error deleting some projects");
    } finally {
      setLoading(false);
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [fetchProjects, isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      if (isAuthenticated) {
        fetchProjects();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ==================== HANDLERS ====================
  const handleEdit = (id) => {
    // Check if router is available, otherwise fallback to window.location
    if (typeof window !== 'undefined') {
       window.location.href = `/admin/projects/edit/${id}`;
    }
  };
  
  const handleView = (id) => {
    if (typeof window !== 'undefined') {
      window.open(`/projects/${id}`, "_blank");
    }
  };
  
  const handleAddProject = () => {
    if (typeof window !== 'undefined') {
      window.location.href = "/admin/projects/add";
    }
  };

  const handleRefresh = () => {
    fetchProjects();
  };

  const handleExport = () => {
    const headers = ["ID", "Project Name", "Price", "Bedrooms", "Location", "Status", "Type", "Developer", "Views", "Created At"];
    const csvData = projects.map((p) => [
      p.id,
      `"${(p.ProjectName || "").replace(/"/g, '""')}"`,
      p.price || "",
      p.bedroom || "",
      `"${getLocationString(p).replace(/"/g, '""')}"`,
      p.status === 1 ? "Active" : "Inactive",
      p.listing_type || "",
      p.DeveloperName || "",
      p.views || 0,
      p.created_at || "",
    ]);

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `projects_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("Export completed!");
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return "Price on request";
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
    if (selectedProjects.size === paginatedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(paginatedProjects.map((p) => p.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== FILTERED & PAGINATED DATA ====================
  // Ensure we have an array
  const filteredProjects = useMemo(() => {
    return Array.isArray(projects) ? projects.filter((p) => p && p.id) : [];
  }, [projects]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredProjects.slice(start, start + showCount);
  }, [filteredProjects, currentPage, showCount]);

  const totalPages = Math.ceil(filteredProjects.length / showCount);

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
          style: { background: '#363636', color: '#fff' },
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
                  Delete Project
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
                  Are you sure you want to delete this project? This action cannot be undone.
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
          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddProject}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                <button
                  onClick={handleExport}
                  disabled={projects.length === 0}
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
                    placeholder="Search by name, location..."
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

            {/* Tabs & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {[
                  { key: "all", label: "All Projects" },
                  { key: "sale", label: "Sale" },
                  { key: "rent", label: "Rent" },
                  { key: "featured", label: "Featured" },
                  { key: "verified", label: "Verified" },
                  { key: "my", label: "My Projects" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
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
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={listingTypeFilter}
                  onChange={(e) => setListingTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                  <option value="Off plan">Off Plan</option>
                  <option value="Ready">Ready</option>
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
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="ml-2">entries</span>
              <span className="ml-4 text-gray-500">Total: {total} projects</span>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProjects.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 border-t-0 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-blue-900">
                <strong>{selectedProjects.size}</strong> projects selected
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedProjects(new Set())} 
                  className="text-sm underline text-blue-700"
                >
                  Clear Selection
                </button>
                <button
                  onClick={bulkDeleteProjects}
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
          <div
            className="border border-gray-300 border-t-0"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            {loading && projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No projects found</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-1">
                    Try a different search term
                  </p>
                )}
                <button
                  onClick={handleAddProject}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add New Project
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
                          checked={
                            selectedProjects.size === paginatedProjects.length &&
                            paginatedProjects.length > 0
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
                      {isVisible("project_name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Project Name
                        </th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      {isVisible("type") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Type
                        </th>
                      )}
                      {isVisible("price") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Price
                        </th>
                      )}
                      {isVisible("beds") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Beds
                        </th>
                      )}
                      {isVisible("location") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Location
                        </th>
                      )}
                      {isVisible("building") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Building
                        </th>
                      )}
                      {isVisible("developer") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Developer
                        </th>
                      )}
                      {isVisible("featured") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Featured
                        </th>
                      )}
                      {isVisible("verified") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Verified
                        </th>
                      )}
                      {isVisible("area") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Area
                        </th>
                      )}
                      {isVisible("units") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Units
                        </th>
                      )}
                      {isVisible("completion") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Completion
                        </th>
                      )}
                      {isVisible("views") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Views
                        </th>
                      )}
                      {isVisible("contacts") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Contacts
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
                    {paginatedProjects.map((project) => {
                      const statusInfo = project.status === 1 ? STATUS_OPTIONS[0] : STATUS_OPTIONS[1];
                      const listingInfo =
                        LISTING_TYPE_OPTIONS.find((l) => l.value.toLowerCase() === project.listing_type?.toLowerCase()) || 
                        { value: project.listing_type, label: project.listing_type || 'N/A', pill: 'bg-gray-100 text-gray-800' };

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProjects.has(project.id)}
                              onChange={() => toggleSelect(project.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(project.id)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                #{project.id}
                              </button>
                            </td>
                          )}
                          {isVisible("picture") && (
                            <td className="px-4 py-3">
                              <div className="w-12 h-10 rounded overflow-hidden border border-gray-200 bg-gray-100">
                                <ProjectImage 
                                  src={project.featured_image} 
                                  thumbnail={project.thumbnail}
                                  alt={project.ProjectName} 
                                />
                              </div>
                            </td>
                          )}
                          {isVisible("project_name") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(project.id)}
                                className="text-left font-medium text-gray-800 hover:text-blue-600 hover:underline block max-w-[200px] truncate"
                                title={project.ProjectName || "Untitled"}
                              >
                                {project.ProjectName || "Untitled Project"}
                              </button>
                              <div className="text-xs text-gray-500 max-w-[200px] truncate">
                                {project.project_slug || project.ProjectNumber || "no-slug"}
                              </div>
                            </td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.pill}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                          )}
                          {isVisible("type") && (
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listingInfo.pill}`}>
                                {listingInfo.label}
                              </span>
                            </td>
                          )}
                          {isVisible("price") && (
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                              {formatPrice(project.price)}
                            </td>
                          )}
                          {isVisible("beds") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <BedDouble className="w-4 h-4 text-gray-400" />
                                {project.bedroom || "-"}
                              </span>
                            </td>
                          )}
                          {isVisible("location") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1 max-w-[150px]">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate" title={getLocationString(project)}>
                                  {getLocationString(project)}
                                </span>
                              </span>
                            </td>
                          )}
                          {isVisible("building") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {project.BuildingName || "-"}
                            </td>
                          )}
                          {isVisible("developer") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {project.DeveloperName || (project.developer_id ? `#${project.developer_id}` : "-")}
                            </td>
                          )}
                          {isVisible("featured") && (
                            <td className="px-4 py-3">
                              {project.featured_project === "1" || project.featured_project === 1 ? (
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("verified") && (
                            <td className="px-4 py-3">
                              {project.verified === 1 ? (
                                <CheckCircle className="w-4 h-4 fill-green-500 text-green-500" />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("area") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {project.area ? `${project.area} sqft` : "-"}
                            </td>
                          )}
                          {isVisible("units") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {project.total_building || project.rooms || "-"}
                            </td>
                          )}
                          {isVisible("completion") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(project.completion_date)}
                            </td>
                          )}
                          {isVisible("views") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <Eye className="w-4 h-4 text-gray-400" />
                                {project.views || 0}
                              </span>
                            </td>
                          )}
                          {isVisible("contacts") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-4 h-4 text-gray-400" />
                                {project.contacts_count || 0}
                              </span>
                            </td>
                          )}
                          {isVisible("created_at") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(project.created_at)}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(project.id)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(project.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: project.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === project.id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === project.id ? (
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
          {filteredProjects.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredProjects.length)} of{" "}
                {filteredProjects.length} entries
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