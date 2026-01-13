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
  Users,
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

const ALL_COLUMNS = [
  { id: "name", label: "Name", key: "full_name" },
  { id: "id", label: "ID", key: "id" },
  { id: "initials", label: "Initials", key: "initials" },
  { id: "nationality", label: "Nationality", key: "nationality" },
  { id: "job_title", label: "Job Title", key: "job_title" },
  { id: "phone", label: "Phone", key: "phone" },
  { id: "email", label: "E-mail", key: "email" },
  { id: "status", label: "Status", key: "status" },
];

// Default avatars pool for fallback
const DEFAULT_AVATARS = [
  '/uploads/avatar/user1.jpg',
  '/uploads/avatar/user2.jpg',
  '/uploads/avatar/user3.jpg',
  '/uploads/avatar/user4.jpg',
  '/uploads/avatar/user5.jpg',
];

export default function UsersPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // User State Management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["name", "id", "initials", "nationality", "job_title", "phone", "email", "status"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarCache, setAvatarCache] = useState({});

  // ==================== AUTHENTICATION ====================
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

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

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
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToast = toast.loading("Logging out...");
    
    try {
      const token = getAdminToken();
      
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      
      toast.dismiss(logoutToast);
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      toast.dismiss(logoutToast);
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

  // ==================== AVATAR HELPER ====================
  const getAvatarUrl = (user) => {
    // If user has avatar field
    if (user.avatar) {
      return `${API_BASE_URL}${user.avatar}`;
    }
    
    // Check common avatar field names
    if (user.profile_image) {
      return `${API_BASE_URL}${user.profile_image}`;
    }
    
    if (user.photo) {
      return `${API_BASE_URL}${user.photo}`;
    }
    
    // Construct avatar URL based on user ID
    const possiblePaths = [
      `/uploads/avatar/${user.id}.jpg`,
      `/uploads/avatar/${user.id}.png`,
      `/uploads/avatar/user_${user.id}.jpg`,
      `/uploads/avatar/user_${user.id}.png`,
    ];
    
    // Return the first valid path or a random default
    for (let path of possiblePaths) {
      if (avatarCache[path] !== false) {
        return `${API_BASE_URL}${path}`;
      }
    }
    
    // Return random default avatar
    const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
    return `${API_BASE_URL}${DEFAULT_AVATARS[randomIndex]}`;
  };

  const handleImageError = (e, userId) => {
    const src = e.target.src;
    setAvatarCache(prev => ({ ...prev, [src]: false }));
    
    // Use random default avatar
    const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
    e.target.src = `${API_BASE_URL}${DEFAULT_AVATARS[randomIndex]}`;
  };

  // ==================== FETCH ALL USERS (ADMIN) ====================
  const fetchUsers = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest("/api/v1/users/admin/type/user");

      if (data.success) {
        const usersList = data.users || data.data || [];
        setUsers(usersList);
        setTotal(data.count || data.total || usersList.length);
        
        if (showToast && usersList.length > 0) {
          toast.success(`Loaded ${usersList.length} users`);
        }
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [apiRequest]);

  // ==================== SEARCH USERS ====================
  const searchUsers = useCallback(async () => {
    if (!search.trim()) {
      fetchUsers();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ q: search.trim() });
      const data = await apiRequest(`/api/v1/users/admin/search?${params}`);

      if (data.success) {
        const usersList = data.users || data.data || [];
        setUsers(usersList);
        setTotal(usersList.length);
      }
    } catch (err) {
      console.error("Search error:", err);
      const filtered = users.filter(u => 
        (u.full_name || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || '').includes(search)
      );
      setUsers(filtered);
    } finally {
      setLoading(false);
    }
  }, [search, apiRequest, fetchUsers, users]);

  // ==================== REFRESH HANDLER ====================
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers(true);
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const timer = setTimeout(() => {
      setCurrentPage(1);
      if (search.trim()) {
        searchUsers();
      } else {
        fetchUsers();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search, isAuthenticated, searchUsers, fetchUsers]);

  // ==================== DELETE HANDLER ====================
  const handleDelete = async (id) => {
    const deleteToast = toast.loading("Deleting user...");
    
    try {
      setDeleteLoading(id);
      
      await apiRequest(`/api/v1/users/admin/${id}`, { method: "DELETE" });
      
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((prev) => prev - 1);
      
      toast.dismiss(deleteToast);
      toast.success("User deleted successfully!");
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      toast.error(err.message || "Error deleting user");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  // ==================== BULK DELETE ====================
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    const deleteToast = toast.loading(`Deleting ${selectedUsers.size} users...`);
    
    try {
      const deletePromises = Array.from(selectedUsers).map(id =>
        apiRequest(`/api/v1/users/admin/${id}`, { method: "DELETE" })
      );
      
      await Promise.all(deletePromises);
      
      setUsers((prev) => prev.filter((u) => !selectedUsers.has(u.id)));
      setTotal((prev) => prev - selectedUsers.size);
      
      toast.dismiss(deleteToast);
      toast.success(`${selectedUsers.size} users deleted successfully!`);
      
      setSelectedUsers(new Set());
    } catch (err) {
      console.error("Bulk Delete Error:", err);
      toast.dismiss(deleteToast);
      toast.error("Error deleting some users");
    }
  };

  // ==================== NAVIGATION HANDLERS ====================
  const handleEdit = (id) => {
    router.push(`/admin/users/edit/${id}`);
  };
  
  const handleAdd = () => {
    router.push("/admin/users/add");
  };
  
  const handleView = (id) => {
    router.push(`/admin/users/${id}`);
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // ==================== FILTERED & PAGINATED DATA ====================
  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => u && u.id);
  }, [users]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredUsers.slice(start, start + showCount);
  }, [filteredUsers, currentPage, showCount]);

  const totalPages = Math.ceil(filteredUsers.length / showCount);

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

  // ==================== SELECTION HANDLERS ====================
  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />
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
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
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
                  Delete User
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
                  Are you sure you want to delete this user? This action cannot be undone.
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
                    onClick={() => setShowOverviewDropdown(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Done
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
                  onClick={handleAdd}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New User
                </button>

                {selectedUsers.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedUsers.size})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
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
              <span className="text-gray-500">
                Total: {total} users
              </span>
            </div>
          </div>

          {/* Table */}
          <div
            className="border border-gray-300 border-t-0"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            {loading && users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={() => fetchUsers()}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No users found</p>
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
                            selectedUsers.size === paginatedUsers.length &&
                            paginatedUsers.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                      )}
                      {isVisible("id") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          ID
                        </th>
                      )}
                      {isVisible("initials") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Initials
                        </th>
                      )}
                      {isVisible("nationality") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Nationality
                        </th>
                      )}
                      {isVisible("job_title") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Job Title
                        </th>
                      )}
                      {isVisible("phone") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Phone
                        </th>
                      )}
                      {isVisible("email") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          E-mail
                        </th>
                      )}
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleSelect(user.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        {isVisible("name") && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={getAvatarUrl(user)}
                                alt={user.full_name || user.name || "User"}
                                onError={(e) => handleImageError(e, user.id)}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span className="text-sm text-gray-800 font-medium">
                                {user.full_name || user.name || "-"}
                              </span>
                            </div>
                          </td>
                        )}
                        {isVisible("id") && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleView(user.id)}
                              className="text-blue-600 hover:underline text-sm font-medium"
                            >
                              {user.id}
                            </button>
                          </td>
                        )}
                        {isVisible("initials") && (
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">
                              {getInitials(user.full_name || user.name)}
                            </span>
                          </td>
                        )}
                        {isVisible("nationality") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.nationality || "-"}
                          </td>
                        )}
                        {isVisible("job_title") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.job_title || user.designation || "-"}
                          </td>
                        )}
                        {isVisible("phone") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.phone || user.mobile_phone || "-"}
                          </td>
                        )}
                        {isVisible("email") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.email || "-"}
                          </td>
                        )}
                        {isVisible("status") && (
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 1 || user.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.status === 1 || user.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(user.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({ type: "single", id: user.id });
                                setShowDeleteModal(true);
                              }}
                              disabled={deleteLoading === user.id}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === user.id ? (
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
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredUsers.length)} of{" "}
                {filteredUsers.length} entries
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