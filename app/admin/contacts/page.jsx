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
  Save,
  ArrowUpDown,
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
  { id: "name", label: "Name", key: "name" },
  { id: "id", label: "ID", key: "id" },
  { id: "email", label: "E-mail", key: "email" },
  { id: "phone", label: "Phone", key: "phone" },
  { id: "contact_type", label: "Type", key: "contact_type" },
  { id: "created_at", label: "Created", key: "created_at" },
  { id: "enquiries", label: "Enquiries", key: "enquiries" },
  { id: "status", label: "Status", key: "status" },
];

const CATEGORY_TABS = [
  { key: "all", label: "All Contact" },
  { key: "B2C", label: "B2C" },
  { key: "B2B", label: "B2B" },
  { key: "AGENCY", label: "AGENCY" },
  { key: "DEVELOPER", label: "DEVELOPER" },
  { key: "VENDOR", label: "VENDOR" },
  { key: "INBOUND", label: "INBOUND" },
  { key: "OUTBOUND", label: "OUTBOUND" },
];

export default function ContactsPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Contact State Management
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(["name", "id", "email", "phone", "contact_type", "created_at", "status"])
  );
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Add Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [formData, setFormData] = useState({
    contact_type: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    company_name: "",
    role_title: "",
    country: "United Arab Emirates",
    city: "",
    address_line1: "",
    address_line2: "",
    contact_source: "",
    lead_source: "",
    tags: "",
    notes: "",
  });

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

  // ==================== FETCH CONTACTS ====================
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadingToast = showLoading("Loading contacts...");

      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", showCount.toString());
      if (search.trim()) params.append("search", search);
      if (activeTab !== "all") params.append("contact_type", activeTab);

      const data = await apiRequest(`/api/v1/contact?${params}`);

      toast.dismiss(loadingToast);
      
      if (data.success) {
        const contactsList = data.data || [];
        setContacts(contactsList);
        setTotal(data.pagination?.total || contactsList.length);
        
        if (contactsList.length === 0) {
          showError("No contacts found");
        }
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError(err.message);
      showError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [currentPage, showCount, search, activeTab, apiRequest]);

  // ==================== FETCH STATS ====================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest("/api/v1/contact/stats");
      
      if (data.success) {
        setStats(data.stats || {});
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
      fetchContacts();
      fetchStats();
    }
  }, [fetchContacts, fetchStats, isAuthenticated]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      if (isAuthenticated) {
        fetchContacts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ==================== HANDLERS ====================
  const handleDelete = async (id) => {
    const deleteToast = showLoading("Deleting contact...");
    try {
      setDeleteLoading(id);
      await apiRequest(`/api/v1/contact/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setTotal((prev) => prev - 1);
      
      toast.dismiss(deleteToast);
      showSuccess("Contact deleted successfully!");
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      console.error("Delete Error:", err);
      toast.dismiss(deleteToast);
      showError(err.message || "Error deleting contact");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget.id);
  };

  const handleEdit = (id) => {
    window.location.href = `/admin/contacts/edit/${id}`;
  };
  
  const handleView = (id) => {
    window.location.href = `/admin/contacts/${id}`;
  };

  // ==================== ADD CONTACT FUNCTIONS ====================
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setAddStep(1);
    setFormData({
      contact_type: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      whatsapp: "",
      company_name: "",
      role_title: "",
      country: "United Arab Emirates",
      city: "",
      address_line1: "",
      address_line2: "",
      contact_source: "",
      lead_source: "",
      tags: "",
      notes: "",
    });
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddStep(1);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, contact_type: type }));
    setAddStep(2);
  };

  const handleAddContact = async () => {
    if (!formData.first_name || !formData.phone) {
      showError("Please fill in required fields");
      return;
    }

    const contactData = {
      first_name: formData.first_name,
      last_name: formData.last_name || "",
      email: formData.email || null,
      phone: formData.phone || null,
      contact_type: formData.contact_type,
      contact_source: formData.contact_source || null,
      company_name: formData.company_name || null,
      role_title: formData.role_title || null,
      country: formData.country || null,
      city: formData.city || null,
      address_line1: formData.address_line1 || null,
      address_line2: formData.address_line2 || null,
      lead_source: formData.lead_source || null,
      whatsapp: formData.whatsapp || null,
      tags: formData.tags || null,
      notes: formData.notes || null,
    };

    const loadingToast = showLoading("Creating contact...");
    setAddLoading(true);

    try {
      await apiRequest("/api/v1/contact", {
        method: "POST",
        body: JSON.stringify(contactData),
      });

      toast.dismiss(loadingToast);
      showSuccess("Contact created successfully");
      handleCloseAddModal();
      fetchContacts();
      fetchStats();
    } catch (err) {
      toast.dismiss(loadingToast);
      showError(err.message || "Failed to create contact");
    } finally {
      setAddLoading(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
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

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getTabCount = (tabKey) => {
    if (tabKey === "all") return total;
    return stats[tabKey] || 0;
  };

  // ==================== FILTERED DATA ====================
  const sortedContacts = useMemo(() => {
    let filtered = contacts || [];

    if (!sortConfig.key) return filtered;
    
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [contacts, sortConfig]);

  const filteredContacts = useMemo(() => {
    return sortedContacts.filter((c) => c && (c._id || c.id));
  }, [sortedContacts]);

  const totalPages = Math.ceil(total / showCount);

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
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c._id || c.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedContacts((prev) => {
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
                  Delete Contact
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
                  Are you sure you want to delete this contact? This action cannot be undone.
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

        {/* Add Contact Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">New Contact</h2>
                <button
                  onClick={handleCloseAddModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Step 1: Select Contact Type */}
                {addStep === 1 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Select contact Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleContactTypeSelect("B2C")}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                      >
                        <div className="text-base font-semibold text-gray-900">B2C</div>
                        <div className="text-sm text-gray-500 mt-1">Direct Client</div>
                      </button>
                      <button
                        onClick={() => handleContactTypeSelect("B2B")}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                      >
                        <div className="text-base font-semibold text-gray-900">B2B</div>
                        <div className="text-sm text-gray-500 mt-1">Third party agency</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Form */}
                {addStep === 2 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => handleFormChange("first_name", e.target.value)}
                          required
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => handleFormChange("last_name", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFormChange("email", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => handleFormChange("phone", e.target.value)}
                          required
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => handleFormChange("whatsapp", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter WhatsApp number"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => handleFormChange("company_name", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          value={formData.role_title}
                          onChange={(e) => handleFormChange("role_title", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Manager, CEO"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Country
                        </label>
                        <select
                          value={formData.country}
                          onChange={(e) => handleFormChange("country", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="India">India</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleFormChange("city", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formData.address_line1}
                        onChange={(e) => handleFormChange("address_line1", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter address line 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={formData.address_line2}
                        onChange={(e) => handleFormChange("address_line2", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter address line 2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Contact Source
                        </label>
                        <select
                          value={formData.contact_source}
                          onChange={(e) => handleFormChange("contact_source", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select source</option>
                          <option value="Website">Website</option>
                          <option value="Referral">Referral</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Event">Event</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Lead Source
                        </label>
                        <input
                          type="text"
                          value={formData.lead_source}
                          onChange={(e) => handleFormChange("lead_source", e.target.value)}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter lead source"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleFormChange("tags", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tags separated by commas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleFormChange("notes", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div>
                  {addStep > 1 && (
                    <button
                      onClick={() => setAddStep(1)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseAddModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {addStep === 1 ? (
                    <button
                      onClick={() => formData.contact_type && setAddStep(2)}
                      disabled={!formData.contact_type}
                      style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                      className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={handleAddContact}
                      disabled={addLoading || !formData.first_name || !formData.phone}
                      style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Create Contact
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3">
          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden flex-wrap">
              {CATEGORY_TABS.map((tab, index) => (
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
              <button
                onClick={handleOpenAddModal}
                style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                New Contact
              </button>

              <div className="flex items-center gap-3">
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
            {loading && contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No contacts found</p>
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
                            selectedContacts.size === filteredContacts.length &&
                            filteredContacts.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      {isVisible("name") && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-gray-900"
                          >
                            Name
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                      )}
                      {isVisible("id") && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("id")}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-gray-900"
                          >
                            ID
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                      )}
                      {isVisible("email") && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("email")}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-gray-900"
                          >
                            E-mail
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                      )}
                      {isVisible("phone") && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("phone")}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-gray-900"
                          >
                            Phone
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                      )}
                      {isVisible("contact_type") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Type
                        </th>
                      )}
                      {isVisible("created_at") && (
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleSort("created_at")}
                            className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase hover:text-gray-900"
                          >
                            Created
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                      )}
                      {isVisible("enquiries") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Enquiries
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
                    {filteredContacts.map((contact) => {
                      const id = contact._id || contact.id;
                      return (
                        <tr
                          key={id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedContacts.has(id)}
                              onChange={() => toggleSelect(id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </td>
                          {isVisible("name") && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                                  {getInitials(contact.name || contact.first_name)}
                                </div>
                                <button
                                  onClick={() => handleView(id)}
                                  className="text-sm text-gray-800 font-medium hover:text-blue-600"
                                >
                                  {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "-"}
                                </button>
                              </div>
                            </td>
                          )}
                          {isVisible("id") && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleView(id)}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                {id?.toString().slice(-6) || "-"}
                              </button>
                            </td>
                          )}
                          {isVisible("email") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {contact.email || "-"}
                            </td>
                          )}
                          {isVisible("phone") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {contact.phone || "-"}
                            </td>
                          )}
                          {isVisible("contact_type") && (
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {contact.contact_type || "-"}
                              </span>
                            </td>
                          )}
                          {isVisible("created_at") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(contact.created_at)}
                            </td>
                          )}
                          {isVisible("enquiries") && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {contact.enquiries || 0}
                            </td>
                          )}
                          {isVisible("status") && (
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  contact.status === "Active" || contact.status === 1
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {contact.status || "Active"}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(id)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(id)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({ type: "single", id: id });
                                  setShowDeleteModal(true);
                                }}
                                disabled={deleteLoading === id}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === id ? (
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
          {filteredContacts.length > 0 && (
            <div className="flex items-center justify-between bg-white border border-gray-300 border-t-0 px-4 py-3 rounded-b">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * showCount + 1} to{" "}
                {Math.min(currentPage * showCount, total)} of{" "}
                {total} entries
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
                  disabled={currentPage === totalPages || totalPages === 0}
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