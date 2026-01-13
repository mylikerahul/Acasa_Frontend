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
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth"; // Assuming this path is correct
import AdminNavbar from "../dashboard/header/DashboardNavbar"; // Assuming this path is correct

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; // Ensure a fallback for development

// IMPORTANT: Update this to match your actual agent model's image field name
// If your agent model has a field like 'avatar' or 'profile_picture', use that.
// For now, assuming a field named 'avatar' in the backend agent model.
const AGENT_IMAGE_FIELD = "avatar"; // Example: 'avatar', 'image_url', 'profile_pic'

// Helper function to get the full name of an agent
const getAgentFullName = (agent) => {
  if (agent.name) return agent.name;
  if (agent.first_name && agent.last_name) return `${agent.first_name} ${agent.last_name}`;
  if (agent.first_name) return agent.first_name;
  if (agent.last_name) return agent.last_name;
  return "-";
};

// All columns that can be displayed/toggled
const ALL_COLUMNS = [
  { id: "id", label: "ID", key: "id" },
  { id: "picture", label: "Picture", key: AGENT_IMAGE_FIELD }, // Using the defined image field
  { id: "full_name", label: "Full Name", key: "name" }, // Maps to 'name' or derived from 'first_name', 'last_name'
  { id: "email", label: "E-mail", key: "email" },
  { id: "mobile", label: "Mobile", key: "mobile" }, // Using 'mobile' from backend model
  { id: "designation", label: "Designation", key: "designation" }, // New field from agent model
  { id: "company", label: "Company", key: "company" }, // New field from agent model
  { id: "nationality", label: "Nationality", key: "nationality" }, // New field from agent model
  { id: "orn_number", label: "ORN", key: "orn_number" }, // New field from agent model
  { id: "status", label: "Status", key: "status" },
  { id: "created_at", label: "Created At", key: "created_at" },
];

export default function AgentsPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Agent State Management
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null); // Adjusted to match agent stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10); // Corresponds to 'limit'
  const [currentPage, setCurrentPage] = useState(1); // Corresponds to 'page'
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["id", "picture", "full_name", "email", "mobile", "status"]) // Default visible columns
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState(new Set());
  const [totalAgentsCount, setTotalAgentsCount] = useState(0); // Total count from backend
  const [totalPages, setTotalPages] = useState(0); // Total pages from backend
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id: number, type: 'single' | 'bulk' }

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

  const showLoadingToast = (message) => {
    return toast.loading(message, {
      position: "top-right",
    });
  };

  // ==================== AUTHENTICATION ====================
  const verifyToken = async (token) => {
    // This endpoint should be a general user/admin token verification.
    // If your user model has a verify-token route, use it. Otherwise,
    // ensure this function aligns with how you verify admin tokens.
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

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        showError(sessionType === "user" ? "Please login as admin to access this dashboard" : "Please login to access dashboard");
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
        await verifyToken(token); // Verify token with backend
      } catch (verifyError) {
        if (verifyError.message === "Unauthorized") {
          showError("Invalid or expired token. Please login again.");
        } else {
          showError("Token verification failed. Please login again.");
        }
        handleAuthFailure();
        return;
      }

      // Decode token for client-side user info
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
          avatar: null, // Assuming avatar might come from a user profile endpoint if needed
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Token decode error:", e);
        showError("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      showError("Authentication failed. Please login again.");
      handleAuthFailure();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    router.push("/admin/login"); // Use router.push for Next.js navigation
  }, [router]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");
    
    try {
      const token = getAdminToken();
      // Assuming a general logout endpoint for users/admins
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // Catch to prevent errors from non-existent logout endpoint
      
      toast.dismiss(logoutToastId);
      showSuccess("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      toast.dismiss(logoutToastId);
      showError("Logout failed. Please try again.");
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      router.push("/admin/login");
      setLogoutLoading(false);
    }
  }, [router]);

  // API Helper
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
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
      router.push("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Network error or malformed response" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [router]);

  // ==================== FETCH AGENTS ====================
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadingToastId = showLoadingToast("Loading agents...");

      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      params.append("page", currentPage.toString());
      params.append("limit", showCount.toString());
      params.append("orderBy", "created_at"); // Default for admin view
      params.append("order", "DESC"); // Default for admin view
      // If you want to filter by status for admin, you can add a `status` state here:
      // if (statusFilter !== undefined) params.append("status", statusFilter.toString());

      // Corrected endpoint
      const response = await apiRequest(`/api/v1/agents?${params.toString()}`);

      toast.dismiss(loadingToastId);
      
      if (response.success) {
        const { agents: fetchedAgents, total, page, limit, totalPages: backendTotalPages } = response.data;
        setAgents(fetchedAgents);
        setTotalAgentsCount(total);
        setCurrentPage(page);
        setShowCount(limit);
        setTotalPages(backendTotalPages);
        
        if (fetchedAgents.length === 0 && search.trim() === "") {
          showError("No agents found in the system.");
        } else if (fetchedAgents.length === 0 && search.trim() !== "") {
          showError("No agents found matching your search criteria.");
        }
      } else {
        throw new Error(response.message || "Failed to fetch agents.");
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError(err.message);
      showError("Failed to load agents: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, showCount, apiRequest]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      // Corrected endpoint
      const response = await apiRequest("/api/agents/admin/stats");
      
      if (response.success && response.data) {
        const { total_agents, active_agents, inactive_agents, total_companies, total_nationalities } = response.data;
        setStats({
          total: total_agents,
          active: active_agents,
          inactive: inactive_agents,
          companies: total_companies,
          nationalities: total_nationalities,
        });
      }
    } catch (err) {
      console.error("Error fetching agent stats:", err);
    }
  }, [apiRequest]);

  // ==================== LIFECYCLE HOOKS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAgents();
      fetchStats();
    }
  }, [isAuthenticated, fetchAgents, fetchStats]); // Include fetchAgents/Stats in dependency array

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) { // Only fetch if authenticated
        setCurrentPage(1); // Reset to first page on new search
        fetchAgents();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, isAuthenticated, fetchAgents]);

  // Handle page/limit changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchAgents();
    }
  }, [currentPage, showCount, isAuthenticated, fetchAgents]);


  // ==================== HANDLERS ====================
  const handleDelete = async (id) => {
    const deleteToastId = showLoadingToast("Deleting agent...");
    try {
      setDeleteLoading(id);
      // Corrected endpoint to use soft delete
      await apiRequest(`/api/agents/admin/${id}`, { method: "DELETE" });
      
      toast.dismiss(deleteToastId);
      showSuccess("Agent deleted successfully (status set to inactive)!");
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      // Re-fetch agents and stats after successful deletion
      fetchAgents();
      fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToastId);
      showError(err.message || "Error deleting agent");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget?.type === "single" && deleteTarget.id) {
      handleDelete(deleteTarget.id);
    }
    // Implement bulk delete if you have a bulk delete API endpoint
    // else if (deleteTarget?.type === "bulk") {
    //   handleBulkDelete(Array.from(selectedAgents));
    // }
  };

  const handleEdit = (id) => {
    router.push(`/admin/agents/edit/${id}`);
  };
  
  const handleAdd = () => {
    router.push("/admin/agents/add");
  };
  
  const handleView = (id) => {
    router.push(`/admin/agents/${id}`); // Assuming you have a view page for agents
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    // Assuming images are stored under /uploads/agents
    return `${API_BASE_URL}/uploads/agents/${image}`;
  };

  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
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

  // ==================== COLUMN MANAGEMENT ====================
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

  // ==================== ROW SELECTION ====================
  const toggleSelectAll = () => {
    if (selectedAgents.size === agents.length) { // Using 'agents' directly here, as pagination is server-side
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(agents.map((a) => a.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ==================== LOADING STATE & AUTH PROTECTION ====================
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
    // This state should ideally not be reached if handleAuthFailure redirects
    return null;
  }

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete Agent
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
                  Are you sure you want to delete this agent? This action will set the agent's status to inactive.
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
                    disabled={deleteLoading === deleteTarget.id} // Disable if this specific agent is loading
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
              <button
                onClick={handleAdd}
                style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                New Agent
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, mobile, ORN"
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
                  setCurrentPage(1); // Reset page when limit changes
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
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading agents...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No agents found</p>
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
                            selectedAgents.size === agents.length &&
                            agents.length > 0
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
                      {isVisible("full_name") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Full Name
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
                      {isVisible("designation") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Designation
                        </th>
                      )}
                      {isVisible("company") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Company
                        </th>
                      )}
                       {isVisible("nationality") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Nationality
                        </th>
                      )}
                      {isVisible("orn_number") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          ORN
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
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedAgents.has(agent.id)}
                            onChange={() => toggleSelect(agent.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        {isVisible("id") && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleEdit(agent.id)}
                              className="text-blue-600 hover:underline text-sm font-medium"
                            >
                              {agent.id}
                            </button>
                          </td>
                        )}
                        {isVisible("picture") && (
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {agent[AGENT_IMAGE_FIELD] ? ( // Use the configured image field
                                <img
                                  src={getImageUrl(agent[AGENT_IMAGE_FIELD])}
                                  alt={getAgentFullName(agent)}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML = getInitials(getAgentFullName(agent));
                                  }}
                                />
                              ) : (
                                <span className="text-sm">
                                  {getInitials(getAgentFullName(agent))}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {isVisible("full_name") && (
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {getAgentFullName(agent)}
                          </td>
                        )}
                        {isVisible("email") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agent.email || "-"}
                          </td>
                        )}
                        {isVisible("mobile") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agent.mobile || "-"}
                          </td>
                        )}
                         {isVisible("designation") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agent.designation || "-"}
                          </td>
                        )}
                        {isVisible("company") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agent.company || "-"}
                          </td>
                        )}
                        {isVisible("nationality") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agent.nationality || "-"}
                          </td>
                        )}
                        {isVisible("orn_number") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agent.orn_number || "-"}
                          </td>
                        )}
                        {isVisible("status") && (
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                agent.status === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {agent.status === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        {isVisible("created_at") && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(agent.created_at)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(agent.id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(agent.id)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({ type: "single", id: agent.id });
                                setShowDeleteModal(true);
                              }}
                              disabled={deleteLoading === agent.id}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === agent.id ? (
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
          {totalAgentsCount > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, totalAgentsCount)} of{" "}
                {totalAgentsCount} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Only show a few page numbers around the current page
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
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
                  } else if (
                    pageNum === currentPage - 3 ||
                    pageNum === currentPage + 3
                  ) {
                    return (
                      <span key={pageNum} className="px-3 py-1.5 text-sm text-gray-600">
                        ...
                      </span>
                    );
                  }
                  return null;
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