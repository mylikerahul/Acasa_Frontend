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
  BookOpen,
  ImageIcon,
  Tag,
  User,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast"; // Corrected Toaster import
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth"; // Assuming this path is correct
import AdminNavbar from "../dashboard/header/DashboardNavbar"; // Assuming this path is correct


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION ====================
// This endpoint should be a general user/admin token verification.
// If your user model has a verify-token route, use it. Otherwise,
// ensure this function aligns with how you verify admin tokens.
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Specifically check for 401 if it means token invalid/expired
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};


const STATUS_OPTIONS = [
  { value: "published", label: "Published", bg: "bg-green-100", text: "text-green-700" },
  { value: "draft", label: "Draft", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "pending", label: "Pending", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "archived", label: "Archived", bg: "bg-gray-100", text: "text-gray-700" },
];

const ALL_COLUMNS = [
  { id: "id", label: "ID", key: "id" },
  { id: "image", label: "Image", key: "image" },
  { id: "title", label: "Title", key: "title" },
  { id: "category", label: "Category", key: "category" },
  { id: "author", label: "Author", key: "author" },
  { id: "status", label: "Status", key: "status" },
  { id: "views", label: "Views", key: "views" },
  { id: "published_date", label: "Published Date", key: "published_date" },
];

// Image Component
const BlogImage = ({ src, alt }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("data:")) return src;
    // Ensure consistent path based on backend setup (uploads/blogs/)
    const cleanSrc = src.startsWith("/") ? src.slice(1) : src;
    if (cleanSrc.startsWith("uploads/blogs/")) {
      return `${API_BASE_URL}/${cleanSrc}`;
    } else if (cleanSrc.startsWith("blogs/")) {
      // If src is 'blogs/image.jpg' assume it's under 'uploads/'
      return `${API_BASE_URL}/uploads/${cleanSrc}`;
    } else {
      // Fallback for just a filename
      return `${API_BASE_URL}/uploads/blogs/${cleanSrc}`;
    }
  }, [src, API_BASE_URL]);

  if (!src || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt || "Blog image"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default function BlogsPage() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Blog State Management
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "image", "title", "category", "status", "published_date"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedBlogs, setSelectedBlogs] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState([]); // This state is set but not used in UI

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        if (sessionType === "user") {
          toast.error("Please login as admin to access this dashboard");
        } else {
          toast.error("Please login to access dashboard");
        }
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
        await verifyToken(token); // Verify token with backend
      } catch (verifyError) {
        console.error("Token verification error:", verifyError);
        toast.error("Invalid or expired token. Please login again.");
        handleAuthFailure();
        return;
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
          avatar: null, // Assuming avatar is not in token payload or fetched separately
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
      console.error("Auth check error (outer catch):", error);
      toast.error("Authentication failed. Please login again.");
      handleAuthFailure();
    }
  }, []);

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    // Use Next.js router for navigation if available
    // import { useRouter } from 'next/router';
    // const router = useRouter(); router.push('/admin/login');
    window.location.href = "/admin/login";
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const token = getAdminToken();

      // Assuming your backend has a logout endpoint, if not, this can be removed.
      // For JWT, backend logout might just blacklist the token.
      await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("Backend logout failed:", err)); // Don't block client logout on backend error
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logoutAll(); // Clear client-side tokens
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
      // This case should ideally be caught by checkAuth, but good safeguard.
      window.location.href = "/admin/login";
      throw new Error("Please login to continue");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        // Do not set Content-Type: application/json for FormData uploads
        // Let browser set it for FormData, otherwise specify it.
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // This is crucial for session expiration
      logoutAll();
      window.location.href = "/admin/login";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Network error or malformed response" }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }, []);

  // Get Blog ID
  const getBlogId = useCallback((blog) => {
    return blog.id || blog._id;
  }, []);

  // Fetch Blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search);
      if (activeTab !== "all") params.append("status", activeTab);

      // Corrected endpoint to match your Express routes
      const data = await apiRequest(`/api/v1/blogs/all?${params}`);

      if (data.success) {
        const blogsData = data.data || data.blogs || [];

        const normalizedBlogs = blogsData.map((blog) => ({
          ...blog,
          id: blog.id || blog._id,
          image: blog.image || blog.featuredImage || blog.thumbnail || blog.cover_image,
          title: blog.title || "Untitled",
          // Corrected: Ensure category is always a string
          category: typeof blog.category === 'string'
                      ? blog.category
                      : (Array.isArray(blog.categories) && typeof blog.categories[0] === 'string'
                          ? blog.categories[0]
                          : "Uncategorized"),
          // Corrected: Ensure status is always a string
          status: typeof blog.status === 'string' ? blog.status : "draft",
          author: blog.author || blog.author_name || "Admin",
          views: blog.views || blog.view_count || 0,
          published_date: blog.published_date || blog.publishedAt || blog.created_at || blog.createdAt,
        }));

        setBlogs(normalizedBlogs);
        setTotal(data.total || data.count || normalizedBlogs.length);

        const uniqueCategories = [...new Set(
          normalizedBlogs.map((blog) => blog.category).filter(Boolean)
        )];
        setCategories(uniqueCategories); // Categories state is updated but not used in UI yet
      } else {
         setError(data.message || "Failed to fetch blogs.");
         toast.error(data.message || "Failed to fetch blogs.");
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, apiRequest]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBlogs();
    }
  }, [fetchBlogs, isAuthenticated]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset page on new search
      if (isAuthenticated) { // Only fetch if authenticated
        fetchBlogs();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, isAuthenticated]); // Added isAuthenticated to debounce dependencies

  // Handlers
  const handleDelete = async (id) => {
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/blogs/${id}`, { method: "DELETE" });
      setBlogs((prev) => prev.filter((b) => getBlogId(b) !== id));
      setTotal((prev) => prev - 1);
      toast.success("Blog deleted successfully!");
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err.message || "Error deleting blog");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleEdit = (id) => {
    window.location.href = `/admin/blogs/edit/${id}`;
  };

  const handleAdd = () => {
    window.location.href = "/admin/blogs/add";
  };

  const handleView = (id) => {
    // Note: Your Express routes expose /blogs/slug/:slug publicly, not /blogs/:id
    // You might need to change this to use blog.slug if you want to view the public page,
    // or add a public /blogs/:id route in your backend.
    window.open(`/blogs/${id}`, "_blank");
  };

  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status?.toLowerCase()) || STATUS_OPTIONS[1]; // Default to draft
  };

  // Filtered Data
  const filteredBlogs = useMemo(() => {
    // If search is empty and activeTab is 'all', return original blogs array
    if (!search.trim() && activeTab === "all") return blogs;

    const term = search.toLowerCase();
    return blogs.filter(
      (blog) =>
        (activeTab === "all" || blog.status?.toLowerCase() === activeTab) &&
        (
          getBlogId(blog)?.toString().toLowerCase().includes(term) ||
          blog.title?.toLowerCase().includes(term) ||
          blog.category?.toLowerCase().includes(term) ||
          blog.author?.toLowerCase().includes(term)
        )
    );
  }, [blogs, search, activeTab, getBlogId]); // Added activeTab to dependencies

  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredBlogs.slice(start, start + showCount);
  }, [filteredBlogs, currentPage, showCount]);

  const totalPages = Math.ceil(filteredBlogs.length / showCount);

  // Tab counts
  const getTabCount = (tab) => {
    if (!blogs) return 0;
    switch (tab) {
      case "all":
        return blogs.length;
      case "published":
        return blogs.filter((b) => b.status?.toLowerCase() === "published").length;
      case "draft":
        return blogs.filter((b) => b.status?.toLowerCase() === "draft").length;
      case "pending":
        return blogs.filter((b) => b.status?.toLowerCase() === "pending").length;
      default:
        return 0; // Should not happen with current tabs
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
    if (selectedBlogs.size === paginatedBlogs.length && paginatedBlogs.length > 0) {
      setSelectedBlogs(new Set());
    } else {
      setSelectedBlogs(new Set(paginatedBlogs.map((b) => getBlogId(b))));
    }
  };

  const toggleSelect = (id) => {
    setSelectedBlogs((prev) => {
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
        {/* Toaster for react-hot-toast */}
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    // This state implies redirection has already happened or is about to.
    return null;
  }

  return (
    <>
      {/* Toaster for react-hot-toast */}
      <Toaster position="top-right" />

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
                  Delete Blog
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
                  Are you sure you want to delete this blog? This action cannot
                  be undone.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteLoading === deleteTarget.id} // Disable if this specific blog is loading
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading === deleteTarget.id}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading === deleteTarget.id ? (
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
            {/* Corrected overlay for click-outside */}
            <div
              className="absolute inset-0 bg-black/30"
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
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Blogs</h1>
            <p className="text-gray-600 text-sm">Manage all blog posts in your platform</p>
          </div>

          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden">
              {[
                { key: "all", label: "All Blogs" },
                { key: "published", label: "Published" },
                { key: "draft", label: "Drafts" },
                { key: "pending", label: "Pending" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label} ({getTabCount(tab.key)})
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                New Blog
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, category, or author"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-72"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" /> {/* Corrected icon color */}
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowOverviewDropdown(!showOverviewDropdown)}
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
            {loading && blogs.length === 0 ? ( // Display loading only if no blogs are loaded yet
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading blogs...</p>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No blogs found</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-1">
                    Try a different search term or clear the search.
                  </p>
                )}
                {activeTab !== "all" && (
                  <p className="text-sm text-gray-500 mt-1">
                    No blogs found with status "{activeTab}".
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
                            selectedBlogs.size === paginatedBlogs.length &&
                            paginatedBlogs.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          {/* Removed sorting icons as no sorting logic is present */}
                          ID
                        </th>
                      )}
                      {isVisible("image") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Image
                        </th>
                      )}
                      {isVisible("title") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Title
                        </th>
                      )}
                      {isVisible("category") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Category
                        </th>
                      )}
                      {isVisible("author") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Author
                        </th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      {isVisible("views") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Views
                        </th>
                      )}
                      {isVisible("published_date") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Published
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBlogs.map((blog) => {
                      const blogId = getBlogId(blog);
                      const statusInfo = getStatusInfo(blog.status);

                      return (
                        <tr
                          key={blogId}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedBlogs.has(blogId)}
                              onChange={() => toggleSelect(blogId)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(blogId)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                {String(blogId).slice(-6)}
                              </button>
                            </td>
                          )}
                          {isVisible("image") && (
                            <td className="px-4 py-3">
                              <div className="w-12 h-10 rounded overflow-hidden bg-gray-100 border border-gray-200">
                                <BlogImage src={blog.image} alt={blog.title} />
                              </div>
                            </td>
                          )}
                          {isVisible("title") && (
                            <td className="px-4 py-3">
                              <div className="max-w-[200px]">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {blog.title}
                                </p>
                              </div>
                            </td>
                          )}
                          {isVisible("category") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {blog.category}
                                </span>
                              </div>
                            </td>
                          )}
                          {isVisible("author") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="text-sm text-gray-800">
                                  {blog.author}
                                </span>
                              </div>
                            </td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                          )}
                          {isVisible("views") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 text-purple-500" />
                                <span className="text-sm text-gray-800">
                                  {(blog.views || 0).toLocaleString()}
                                </span>
                              </div>
                            </td>
                          )}
                          {isVisible("published_date") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-800">
                                  {formatDate(blog.published_date)}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(blogId)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(blogId)}
                                className="p-1 rounded hover:bg-gray-200 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: blogId });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === blogId}
                                className="p-1 rounded hover:bg-gray-200 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === blogId ? (
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
          {filteredBlogs.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 p-3">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredBlogs.length)} of{" "}
                {filteredBlogs.length} entries (Total: {total})
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {/* Dynamically adjust visible page numbers for better UX */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 || page === totalPages || // Always show first/last page
                    (page >= currentPage - 2 && page <= currentPage + 2) // Show 2 pages around current
                  )
                  .map((page, index, arr) => (
                    <span key={page}>
                      {index > 0 && page > arr[index - 1] + 1 && (
                        <span className="px-3 py-1.5 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 border rounded text-sm ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
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