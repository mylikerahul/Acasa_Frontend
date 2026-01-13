"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Edit3,
  RefreshCw,
  Plus,
  X,
  Inbox,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Home,
  Filter,
  Download,
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

// ==================== CONSTANTS ====================

// Status Options (matches controller VALID_STATUSES)
const STATUS_OPTIONS = [
  { value: "New", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "In Progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "Contacted", label: "Contacted", color: "bg-purple-100 text-purple-800" },
  { value: "Qualified", label: "Qualified", color: "bg-indigo-100 text-indigo-800" },
  { value: "Lost", label: "Lost", color: "bg-red-100 text-red-800" },
  { value: "Converted", label: "Converted", color: "bg-green-100 text-green-800" },
];

// Priority Options (matches controller VALID_PRIORITIES)
const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "Medium", label: "Medium", color: "bg-blue-100 text-blue-700" },
  { value: "High", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "Urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

// Quality Options (matches controller VALID_QUALITY)
const QUALITY_OPTIONS = [
  { value: "Hot", label: "Hot", color: "bg-red-100 text-red-700" },
  { value: "Warm", label: "Warm", color: "bg-orange-100 text-orange-700" },
  { value: "Cold", label: "Cold", color: "bg-blue-100 text-blue-700" },
];

// Lead Status Options (matches controller VALID_LEAD_STATUS)
const LEAD_STATUS_OPTIONS = [
  { value: "New", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "Follow Up", label: "Follow Up", color: "bg-yellow-100 text-yellow-800" },
  { value: "Meeting", label: "Meeting", color: "bg-purple-100 text-purple-800" },
  { value: "Negotiation", label: "Negotiation", color: "bg-indigo-100 text-indigo-800" },
  { value: "Closed", label: "Closed", color: "bg-green-100 text-green-800" },
];

// Contact Type Options
const CONTACT_TYPE_OPTIONS = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "investor", label: "Investor" },
];

// Type Options (enquiry type)
const TYPE_OPTIONS = [
  { value: "property", label: "Property" },
  { value: "project", label: "Project" },
  { value: "general", label: "General" },
  { value: "career", label: "Career" },
];

// Source Options
const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "walk_in", label: "Walk In" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "property_finder", label: "Property Finder" },
  { value: "bayut", label: "Bayut" },
  { value: "dubizzle", label: "Dubizzle" },
];

// Listing Type Options
const LISTING_TYPE_OPTIONS = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "both", label: "Both" },
];

// Table Columns (based on model fields)
const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "status", label: "Status" },
  { id: "lead_status", label: "Lead Status" },
  { id: "priority", label: "Priority" },
  { id: "quality", label: "Quality" },
  { id: "type", label: "Type" },
  { id: "source", label: "Source" },
  { id: "contact_type", label: "Contact Type" },
  { id: "listing_type", label: "Listing Type" },
  { id: "country", label: "Country" },
  { id: "state", label: "State" },
  { id: "community", label: "Community" },
  { id: "project", label: "Project" },
  { id: "building", label: "Building" },
  { id: "bedrooms", label: "Bedrooms" },
  { id: "budget", label: "Budget" },
  { id: "agent", label: "Agent" },
  { id: "drip_marketing", label: "Drip Marketing" },
  { id: "contact_date", label: "Contact Date" },
  { id: "message", label: "Message" },
  { id: "created_at", label: "Created At" },
];

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "status",
  "lead_status",
  "priority",
  "quality",
  "type",
  "source",
  "agent",
  "budget",
  "created_at",
];

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== UTILITIES ====================
const safeRender = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") return value.label || value.name || value.value || "N/A";
  return String(value);
};

const formatPrice = (min, max) => {
  const formatter = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) return `From ${formatter.format(min)}`;
  if (max) return `Up to ${formatter.format(max)}`;
  return "N/A";
};

const formatBedrooms = (min, max) => {
  if (min && max) return `${min} - ${max} BR`;
  if (min) return `${min}+ BR`;
  if (max) return `Up to ${max} BR`;
  return "N/A";
};

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

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getOptionLabel = (options, value) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value || "N/A";
};

const getOptionColor = (options, value) => {
  const option = options.find((o) => o.value === value);
  return option ? option.color : "bg-gray-100 text-gray-700";
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

// ==================== API HELPER ====================
const createApiRequest = () => async (endpoint, options = {}) => {
  const token = getAdminToken();

  if (!token || !isAdminTokenValid()) {
    logoutAll();
    fastNavigate("/admin/login");
    throw new Error("Session expired. Please login again.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const isFormData = options.body instanceof FormData;
    
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      logoutAll();
      fastNavigate("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      showError("Request timeout. Please try again.");
      throw new Error("Request timeout. Please try again.");
    }
    throw error;
  }
};

// ==================== MAIN COMPONENT ====================
export default function EnquiriesPage() {
  const apiRequest = useMemo(() => createApiRequest(), []);
  const abortControllerRef = useRef(null);

  // ==================== AUTH STATE ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==================== DATA STATE ====================
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  // ==================== STATS STATE ====================
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byPriority: {},
    byQuality: {},
    bySource: {},
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
  });

  // ==================== RELATED DATA STATE ====================
  const [agents, setAgents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [projects, setProjects] = useState([]);

  // ==================== FILTER STATE ====================
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ==================== PAGINATION STATE ====================
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ==================== UI STATE ====================
  const [visibleColumns, setVisibleColumns] = useState(new Set(DEFAULT_VISIBLE_COLUMNS));
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [selectedEnquiries, setSelectedEnquiries] = useState(new Set());
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [assignAgentModalOpen, setAssignAgentModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ==================== LOADING STATES ====================
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

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
            throw new Error("Invalid token response");
          }
        } catch (verifyError) {
          logoutAll();
          fastNavigate("/admin/login");
          return;
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

  // ==================== DEBOUNCED SEARCH ====================
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ==================== FETCH RELATED DATA ====================
  const fetchRelatedData = useCallback(async () => {
    try {
      const agentsRes = await apiRequest("/api/v1/users?role=agent").catch(() => ({ data: [] }));
      setAgents(agentsRes.data || agentsRes.users || []);

      const countriesRes = await apiRequest("/api/v1/countries").catch(() => ({ data: [] }));
      setCountries(countriesRes.data || []);

      const projectsRes = await apiRequest("/api/v1/projects").catch(() => ({ data: [] }));
      setProjects(projectsRes.data || []);
    } catch (err) {
      console.warn("Error fetching related data:", err);
    }
  }, [apiRequest]);

  // ==================== FETCH ENQUIRIES ====================
  const fetchEnquiries = useCallback(async () => {
    if (!isAuthenticated) return;

    if (!isAdminTokenValid()) {
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      const loadingToast = showLoading("Loading enquiries...");

      const params = new URLSearchParams();

      params.append("page", currentPage.toString());
      params.append("limit", showCount.toString());

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (qualityFilter !== "all") params.append("quality", qualityFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      if (agentFilter !== "all") params.append("agent_id", agentFilter);
      if (leadStatusFilter !== "all") params.append("lead_status", leadStatusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateFrom) params.append("from_date", dateFrom);
      if (dateTo) params.append("to_date", dateTo);

      const tabFilters = {
        new: { status: "New" },
        inProgress: { status: "In Progress" },
        contacted: { status: "Contacted" },
        qualified: { status: "Qualified" },
        converted: { status: "Converted" },
        lost: { status: "Lost" },
        hot: { quality: "Hot" },
        urgent: { priority: "Urgent" },
        today: { today: "true" },
      };

      if (tabFilters[activeTab]) {
        Object.entries(tabFilters[activeTab]).forEach(([key, value]) => {
          params.set(key, value);
        });
      }

      const queryString = params.toString();
      const endpoint = `/api/v1/enquiries/list${queryString ? `?${queryString}` : ""}`;

      const data = await apiRequest(endpoint);

      toast.dismiss(loadingToast);

      if (data.success) {
        setEnquiries(data.data || []);
        setTotal(data.total || data.count || 0);
        setTotalPages(data.totalPages || 1);
        
        if ((data.data || []).length === 0) {
          showError("No enquiries found");
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
        showError(err.message || "Error fetching enquiries");
      }
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    currentPage,
    showCount,
    activeTab,
    statusFilter,
    priorityFilter,
    qualityFilter,
    typeFilter,
    sourceFilter,
    agentFilter,
    leadStatusFilter,
    debouncedSearch,
    dateFrom,
    dateTo,
    apiRequest,
  ]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await apiRequest("/api/v1/enquiries/stats");
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn("Error fetching stats:", err);
    }
  }, [isAuthenticated, apiRequest]);

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    if (isAuthenticated) {
      fetchEnquiries();
      fetchStats();
      fetchRelatedData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAuthenticated, fetchEnquiries, fetchStats, fetchRelatedData]);

  // ==================== LOCAL FILTERING ====================
  const filteredEnquiries = useMemo(() => {
    return (enquiries || []).filter((e) => e && e.id);
  }, [enquiries]);

  const paginatedEnquiries = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredEnquiries.slice(start, start + showCount);
  }, [filteredEnquiries, currentPage, showCount]);

  const calculatedTotalPages = Math.ceil(filteredEnquiries.length / showCount);

  // ==================== ACTION HANDLERS ====================
  const handleAddEnquiry = useCallback(() => {
    fastNavigate("/admin/enquiries/add");
  }, []);

  const handleEdit = useCallback((id) => {
    fastNavigate(`/admin/enquiries/edit/${id}`);
  }, []);

  const handleView = useCallback((id) => {
    fastNavigate(`/admin/enquiries/view/${id}`);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      const deleteToast = showLoading("Deleting enquiry...");
      try {
        setDeleteLoading(id);
        const result = await apiRequest(`/api/v1/enquiries/delete/${id}`, {
          method: "DELETE",
        });

        toast.dismiss(deleteToast);

        if (result.success) {
          setEnquiries((prev) => prev.filter((e) => e.id !== id));
          setSelectedEnquiries((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setTotal((prev) => prev - 1);
          showSuccess("Enquiry deleted successfully!");
          setShowDeleteModal(false);
          setDeleteTarget(null);
          fetchStats();
        } else {
          showError(result.message || "Failed to delete enquiry");
        }
      } catch (err) {
        toast.dismiss(deleteToast);
        showError(err.message || "Error deleting enquiry");
      } finally {
        setDeleteLoading(null);
      }
    },
    [apiRequest, fetchStats]
  );

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleStatusUpdate = useCallback(
    async (id, newStatus, leadStatus = null, lostStatus = null) => {
      const updateToast = showLoading("Updating status...");
      try {
        setStatusUpdateLoading(id);

        const body = { status: newStatus };
        if (leadStatus) body.lead_status = leadStatus;
        if (lostStatus) body.lost_status = lostStatus;

        const result = await apiRequest(`/api/v1/enquiries/status/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        toast.dismiss(updateToast);

        if (result.success) {
          setEnquiries((prev) =>
            prev.map((e) =>
              e.id === id
                ? {
                    ...e,
                    status: newStatus,
                    lead_status: leadStatus || e.lead_status,
                    lost_status: lostStatus || e.lost_status,
                  }
                : e
            )
          );
          showSuccess(`Status updated to ${newStatus}`);
          fetchStats();
        } else {
          showError(result.message || "Error updating status");
        }
      } catch (err) {
        toast.dismiss(updateToast);
        showError(err.message || "Error updating status");
      } finally {
        setStatusUpdateLoading(null);
      }
    },
    [apiRequest, fetchStats]
  );

  const handleAssignAgent = useCallback(
    async (enquiryId, agentId) => {
      const assignToast = showLoading("Assigning agent...");
      try {
        setAssignLoading(true);

        const result = await apiRequest(`/api/v1/enquiries/assign-agent/${enquiryId}`, {
          method: "PATCH",
          body: JSON.stringify({ agent_id: parseInt(agentId) }),
        });

        toast.dismiss(assignToast);

        if (result.success) {
          setEnquiries((prev) =>
            prev.map((e) =>
              e.id === enquiryId ? { ...e, agent_id: parseInt(agentId) } : e
            )
          );
          showSuccess("Agent assigned successfully!");
          setAssignAgentModalOpen(false);
          setSelectedAgentId("");
        } else {
          showError(result.message || "Error assigning agent");
        }
      } catch (err) {
        toast.dismiss(assignToast);
        showError(err.message || "Error assigning agent");
      } finally {
        setAssignLoading(false);
      }
    },
    [apiRequest]
  );

  const handleViewDetail = useCallback(async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setDetailModalOpen(true);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedEnquiries.size === 0) return;

    const deleteToast = showLoading("Deleting enquiries...");
    try {
      setBulkActionLoading(true);
      const ids = Array.from(selectedEnquiries);

      const result = await apiRequest("/api/v1/enquiries/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });

      toast.dismiss(deleteToast);

      if (result.success) {
        setEnquiries((prev) => prev.filter((e) => !selectedEnquiries.has(e.id)));
        setSelectedEnquiries(new Set());
        setTotal((prev) => prev - ids.length);
        showSuccess(`${ids.length} enquiries deleted`);
        fetchStats();
      } else {
        showError(result.message || "Error deleting enquiries");
      }
    } catch (err) {
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting enquiries");
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedEnquiries, apiRequest, fetchStats]);

  // ==================== SELECTION HANDLERS ====================
  const toggleSelectAll = useCallback(() => {
    setSelectedEnquiries((prev) => {
      if (prev.size === paginatedEnquiries.length) {
        return new Set();
      }
      return new Set(paginatedEnquiries.map((e) => e.id));
    });
  }, [paginatedEnquiries]);

  const toggleSelect = useCallback((id) => {
    setSelectedEnquiries((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ==================== COLUMN HANDLERS ====================
  const toggleColumn = useCallback((columnId) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  const isVisible = (columnId) => visibleColumns.has(columnId);

  // ==================== RESET FILTERS ====================
  const resetFilters = useCallback(() => {
    setActiveTab("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setQualityFilter("all");
    setTypeFilter("all");
    setSourceFilter("all");
    setAgentFilter("all");
    setLeadStatusFilter("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }, []);

  // ==================== TAB COUNTS ====================
  const getTabCount = useCallback(
    (tab) => {
      const counts = {
        all: stats.total || total,
        new: stats.byStatus?.New || 0,
        inProgress: stats.byStatus?.["In Progress"] || 0,
        contacted: stats.byStatus?.Contacted || 0,
        qualified: stats.byStatus?.Qualified || 0,
        converted: stats.byStatus?.Converted || 0,
        lost: stats.byStatus?.Lost || 0,
        hot: stats.byQuality?.Hot || 0,
        urgent: stats.byPriority?.Urgent || 0,
        today: stats.today || 0,
      };
      return counts[tab] ?? 0;
    },
    [stats, total]
  );

  // ==================== GET AGENT NAME ====================
  const getAgentName = useCallback(
    (agentId) => {
      if (!agentId) return "Unassigned";
      const agent = agents.find((a) => a.id === agentId);
      return agent ? agent.name || agent.username : `Agent #${agentId}`;
    },
    [agents]
  );

  // ==================== LOADING SCREEN ====================
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

  // ==================== NOT AUTHENTICATED ====================
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
                  Delete Enquiry
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
                  Are you sure you want to delete this enquiry? This action cannot be undone.
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            {[
              { label: "Total", value: stats.total, color: "bg-gray-500" },
              { label: "Today", value: stats.today, color: "bg-blue-500" },
              { label: "This Week", value: stats.thisWeek, color: "bg-indigo-500" },
              { label: "This Month", value: stats.thisMonth, color: "bg-purple-500" },
              { label: "New", value: stats.byStatus?.New || 0, color: "bg-blue-400" },
              { label: "Hot Leads", value: stats.byQuality?.Hot || 0, color: "bg-red-500" },
              { label: "Urgent", value: stats.byPriority?.Urgent || 0, color: "bg-orange-500" },
              { label: "Converted", value: stats.byStatus?.Converted || 0, color: "bg-green-500" },
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

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddEnquiry}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Enquiry
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {showFilters && <X className="w-3 h-3 ml-1" />}
                </button>

                <button
                  onClick={() => {
                    fetchEnquiries();
                    fetchStats();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                {selectedEnquiries.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-300 text-red-700 rounded bg-white hover:bg-red-50 disabled:opacity-50"
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete ({selectedEnquiries.size})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search enquiries..."
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

            {/* Filters Panel */}
            {showFilters && (
              <div className="border border-gray-200 rounded p-4 mb-3 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Priority</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => {
                        setPriorityFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Priority</option>
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quality</label>
                    <select
                      value={qualityFilter}
                      onChange={(e) => {
                        setQualityFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Quality</option>
                      {QUALITY_OPTIONS.map((q) => (
                        <option key={q.value} value={q.value}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Source</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => {
                        setSourceFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Sources</option>
                      {SOURCE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Agent</label>
                    <select
                      value={agentFilter}
                      onChange={(e) => {
                        setAgentFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Agents</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || a.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {[
                { key: "all", label: "All" },
                { key: "today", label: "Today" },
                { key: "new", label: "New" },
                { key: "inProgress", label: "In Progress" },
                { key: "contacted", label: "Contacted" },
                { key: "qualified", label: "Qualified" },
                { key: "converted", label: "Converted" },
                { key: "lost", label: "Lost" },
                { key: "hot", label: "🔥 Hot" },
                { key: "urgent", label: "⚡ Urgent" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    activeTab === t.key
                      ? "bg-gray-800 border-gray-800 text-white font-medium"
                      : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-white"
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                      activeTab === t.key ? "bg-white/20" : "bg-gray-200"
                    }`}
                  >
                    {getTabCount(t.key)}
                  </span>
                </button>
              ))}
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
              <span className="ml-4 text-gray-500">Total: {total} enquiries</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 border-t-0 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <div className="flex-1 text-sm text-red-800">{error}</div>
              <button onClick={fetchEnquiries} className="text-sm underline text-red-700">
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div
            className="border border-gray-300 border-t-0"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            {loading && enquiries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading enquiries...</p>
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No enquiries found</p>
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
                            selectedEnquiries.size === paginatedEnquiries.length &&
                            paginatedEnquiries.length > 0
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
                      {isVisible("status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Status
                        </th>
                      )}
                      {isVisible("lead_status") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Lead Status
                        </th>
                      )}
                      {isVisible("priority") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Priority
                        </th>
                      )}
                      {isVisible("quality") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Quality
                        </th>
                      )}
                      {isVisible("type") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Type
                        </th>
                      )}
                      {isVisible("source") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Source
                        </th>
                      )}
                      {isVisible("contact_type") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Contact Type
                        </th>
                      )}
                      {isVisible("listing_type") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Listing Type
                        </th>
                      )}
                      {isVisible("country") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Country
                        </th>
                      )}
                      {isVisible("state") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          State
                        </th>
                      )}
                      {isVisible("community") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Community
                        </th>
                      )}
                      {isVisible("project") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Project
                        </th>
                      )}
                      {isVisible("building") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Building
                        </th>
                      )}
                      {isVisible("bedrooms") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Bedrooms
                        </th>
                      )}
                      {isVisible("budget") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Budget
                        </th>
                      )}
                      {isVisible("agent") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Agent
                        </th>
                      )}
                      {isVisible("drip_marketing") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Drip Marketing
                        </th>
                      )}
                      {isVisible("contact_date") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Contact Date
                        </th>
                      )}
                      {isVisible("message") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Message
                        </th>
                      )}
                      {isVisible("created_at") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Created At
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEnquiries.map((enq) => {
                      const statusColor = getOptionColor(STATUS_OPTIONS, enq.status);
                      const priorityColor = getOptionColor(PRIORITY_OPTIONS, enq.priority);
                      const qualityColor = getOptionColor(QUALITY_OPTIONS, enq.quality);
                      const leadStatusColor = getOptionColor(LEAD_STATUS_OPTIONS, enq.lead_status);

                      return (
                        <tr
                          key={enq.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEnquiries.has(enq.id)}
                              onChange={() => toggleSelect(enq.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewDetail(enq)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                #{enq.id}
                              </button>
                            </td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                {enq.status || "New"}
                              </span>
                            </td>
                          )}
                          {isVisible("lead_status") && (
                            <td className="px-4 py-3">
                              {enq.lead_status ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leadStatusColor}`}>
                                  {enq.lead_status}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("priority") && (
                            <td className="px-4 py-3">
                              {enq.priority ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                                  {enq.priority}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("quality") && (
                            <td className="px-4 py-3">
                              {enq.quality ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${qualityColor}`}>
                                  {enq.quality}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          {isVisible("type") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {getOptionLabel(TYPE_OPTIONS, enq.type)}
                            </td>
                          )}
                          {isVisible("source") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {getOptionLabel(SOURCE_OPTIONS, enq.source)}
                            </td>
                          )}
                          {isVisible("contact_type") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {getOptionLabel(CONTACT_TYPE_OPTIONS, enq.contact_type)}
                            </td>
                          )}
                          {isVisible("listing_type") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {getOptionLabel(LISTING_TYPE_OPTIONS, enq.listing_type)}
                            </td>
                          )}
                          {isVisible("country") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {safeRender(enq.country_name || enq.country)}
                            </td>
                          )}
                          {isVisible("state") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {safeRender(enq.state_name || enq.state_id)}
                            </td>
                          )}
                          {isVisible("community") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {safeRender(enq.community_name || enq.community_id)}
                            </td>
                          )}
                          {isVisible("project") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {safeRender(enq.project_name || enq.project_id)}
                            </td>
                          )}
                          {isVisible("building") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {safeRender(enq.building)}
                            </td>
                          )}
                          {isVisible("bedrooms") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatBedrooms(enq.bedroom_min, enq.bedroom_max)}
                            </td>
                          )}
                          {isVisible("budget") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatPrice(enq.price_min, enq.price_max)}
                            </td>
                          )}
                          {isVisible("agent") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <span>{getAgentName(enq.agent_id)}</span>
                                <button
                                  onClick={() => {
                                    setSelectedEnquiry(enq);
                                    setSelectedAgentId(enq.agent_id || "");
                                    setAssignAgentModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Assign Agent"
                                >
                                  <UserPlus className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            </td>
                          )}
                          {isVisible("drip_marketing") && (
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  enq.drip_marketing
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {enq.drip_marketing ? "Enabled" : "Disabled"}
                              </span>
                            </td>
                          )}
                          {isVisible("contact_date") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(enq.contact_date)}
                            </td>
                          )}
                          {isVisible("message") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span
                                className="max-w-[150px] truncate block"
                                title={enq.message}
                              >
                                {safeRender(enq.message)}
                              </span>
                            </td>
                          )}
                          {isVisible("created_at") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDateTime(enq.created_at)}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetail(enq)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(enq.id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: enq.id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === enq.id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === enq.id ? (
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
          {filteredEnquiries.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, filteredEnquiries.length)} of{" "}
                {filteredEnquiries.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(calculatedTotalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (calculatedTotalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= calculatedTotalPages - 2) {
                    pageNum = calculatedTotalPages - 4 + i;
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
                    setCurrentPage((p) => Math.min(p + 1, calculatedTotalPages))
                  }
                  disabled={currentPage === calculatedTotalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {detailModalOpen && selectedEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDetailModalOpen(false)}
            />
            <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">
                  Enquiry #{selectedEnquiry.id}
                </h3>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${getOptionColor(
                      STATUS_OPTIONS,
                      selectedEnquiry.status
                    )}`}
                  >
                    Status: {selectedEnquiry.status || "New"}
                  </span>
                  {selectedEnquiry.priority && (
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getOptionColor(
                        PRIORITY_OPTIONS,
                        selectedEnquiry.priority
                      )}`}
                    >
                      Priority: {selectedEnquiry.priority}
                    </span>
                  )}
                  {selectedEnquiry.quality && (
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getOptionColor(
                        QUALITY_OPTIONS,
                        selectedEnquiry.quality
                      )}`}
                    >
                      Quality: {selectedEnquiry.quality}
                    </span>
                  )}
                  {selectedEnquiry.lead_status && (
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getOptionColor(
                        LEAD_STATUS_OPTIONS,
                        selectedEnquiry.lead_status
                      )}`}
                    >
                      Lead: {selectedEnquiry.lead_status}
                    </span>
                  )}
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Home className="w-3 h-3" /> Type
                    </div>
                    <div className="font-medium">
                      {getOptionLabel(TYPE_OPTIONS, selectedEnquiry.type)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Source</div>
                    <div className="font-medium">
                      {getOptionLabel(SOURCE_OPTIONS, selectedEnquiry.source)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Contact Type</div>
                    <div className="font-medium">
                      {getOptionLabel(CONTACT_TYPE_OPTIONS, selectedEnquiry.contact_type)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Listing Type</div>
                    <div className="font-medium">
                      {getOptionLabel(LISTING_TYPE_OPTIONS, selectedEnquiry.listing_type)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </div>
                    <div className="font-medium">
                      {[
                        selectedEnquiry.community_name,
                        selectedEnquiry.state_name,
                        selectedEnquiry.country_name,
                      ]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3" /> Building
                    </div>
                    <div className="font-medium">{safeRender(selectedEnquiry.building)}</div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Budget
                    </div>
                    <div className="font-medium">
                      {formatPrice(selectedEnquiry.price_min, selectedEnquiry.price_max)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Bedrooms</div>
                    <div className="font-medium">
                      {formatBedrooms(selectedEnquiry.bedroom_min, selectedEnquiry.bedroom_max)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Assigned Agent</div>
                    <div className="font-medium">{getAgentName(selectedEnquiry.agent_id)}</div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Contact Date
                    </div>
                    <div className="font-medium">{formatDate(selectedEnquiry.contact_date)}</div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Drip Marketing</div>
                    <div className="font-medium">
                      {selectedEnquiry.drip_marketing ? "Enabled" : "Disabled"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Created At</div>
                    <div className="font-medium">{formatDateTime(selectedEnquiry.created_at)}</div>
                  </div>
                </div>

                {/* Message */}
                {selectedEnquiry.message && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-gray-500 mb-2 text-sm">Message</div>
                    <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {selectedEnquiry.message}
                    </div>
                  </div>
                )}

                {/* Update Status Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-gray-500 mb-2 text-sm">Update Status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => {
                          handleStatusUpdate(selectedEnquiry.id, s.value);
                          setSelectedEnquiry((prev) => ({ ...prev, status: s.value }));
                        }}
                        disabled={statusUpdateLoading === selectedEnquiry.id}
                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                          selectedEnquiry.status === s.value
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

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleEdit(selectedEnquiry.id);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Agent Modal */}
        {assignAgentModalOpen && selectedEnquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setAssignAgentModalOpen(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Assign Agent to Enquiry #{selectedEnquiry.id}
                </h3>
                <button
                  onClick={() => setAssignAgentModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <label className="block text-sm text-gray-600 mb-2">Select Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name || agent.username} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setAssignAgentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignAgent(selectedEnquiry.id, selectedAgentId)}
                  disabled={!selectedAgentId || assignLoading}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90 disabled:opacity-50"
                >
                  {assignLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Assign Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}