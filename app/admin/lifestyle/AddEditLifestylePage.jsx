// components/admin/Lifestyle/AddEditLifestylePage.js

"use client"; // This directive is crucial for client-side functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router"; // For Next.js 12 pages router or App Router client component
import {
  Loader2,
  Plus,
  Save,
  ArrowLeft,
  Briefcase,
  Info,
  Link as LinkIcon,
  Tag,
  Hash,
  X,
  ImageIcon,
  Users,
  Building2,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth"; // Adjust path as needed
import AdminNavbar from "../dashboard/header/DashboardNavbar"; // Adjust path as needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#10B981",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10B981",
    },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: "#EF4444",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#EF4444",
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

// ==================== SLUG GENERATOR ====================
const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

// ==================== MAIN COMPONENT ====================
export default function AddEditLifestylePage() {
  const router = useRouter();
  const { id } = router.query; // Get ID from URL for edit mode
  const isEditMode = !!id;

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    title: "",
    country_id: "",
    developer_id: "",
    subtitle: "",
    description: "",
    image: "",
    seo_title: "",
    seo_description: "",
    seo_focus_keyword: "",
    status: "active",
  });

  // UI State
  const [loading, setLoading] = useState(isEditMode); // True if editing and fetching data
  const [submitting, setSubmitting] = useState(false); // True when saving/creating
  const [errors, setErrors] = useState({}); // Form validation errors
  const [serverError, setServerError] = useState(null); // API error

  const [countries, setCountries] = useState([]); // List of available countries
  const [developers, setDevelopers] = useState([]); // List of available developers

  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(true);
  const slugCheckTimeout = useRef(null);
  const initialSlugRef = useRef(null); // To store the slug when data is first fetched

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
          const response = await fetch(
            `${API_BASE_URL}/api/v1/users/admin/verify-token`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (!response.ok) throw new Error("Token verification failed");

          const data = await response.json();

          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          } else {
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

  // ==================== API HELPER ====================
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      fastNavigate("/admin/login");
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
      fastNavigate("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  // ==================== FETCH DROPDOWN DATA (Countries, Developers) ====================
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDropdownData = async () => {
      try {
        const [countriesData, developersData] = await Promise.all([
          apiRequest("/api/v1/lifestyle/countries"),
          apiRequest("/api/v1/lifestyle/developers"),
        ]);
        if (countriesData.success) {
          setCountries(countriesData.data);
        }
        if (developersData.success) {
          setDevelopers(developersData.data);
        }
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setServerError(err.message);
      }
    };

    fetchDropdownData();
  }, [isAuthenticated, apiRequest]);

  // ==================== FETCH LIFESTYLE DATA FOR EDIT MODE ====================
  useEffect(() => {
    if (!isAuthenticated || !isEditMode || !id) return;

    const fetchLifestyle = async () => {
      try {
        setLoading(true);
        setServerError(null);
        const data = await apiRequest(`/api/v1/lifestyle/id/${id}`);

        if (data.success && data.data) {
          const lifestyle = data.data;
          setFormData({
            slug: lifestyle.slug || "",
            name: lifestyle.name || "",
            title: lifestyle.title || "",
            country_id: lifestyle.country_id?.toString() || "", // Convert to string for select value
            developer_id: lifestyle.developer_id?.toString() || "", // Convert to string for select value
            subtitle: lifestyle.subtitle || "",
            description: lifestyle.description || "",
            image: lifestyle.image || "",
            seo_title: lifestyle.seo_title || "",
            seo_description: lifestyle.seo_description || "",
            seo_focus_keyword: lifestyle.seo_focus_keyword || "",
            status: lifestyle.status || "active",
          });
          initialSlugRef.current = lifestyle.slug; // Store original slug
          setSlugAvailable(true); // Assume initial slug is available
        } else {
          showError("Lifestyle entry not found or failed to load.");
          router.push("/admin/lifestyle"); // Redirect to lifestyle list
        }
      } catch (err) {
        console.error("Error fetching lifestyle:", err);
        setServerError(err.message);
        showError("Failed to load lifestyle data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLifestyle();
  }, [isAuthenticated, isEditMode, id, apiRequest, router]);

  // ==================== SLUG AVAILABILITY CHECK ====================
  useEffect(() => {
    if (!isAuthenticated || !formData.slug) {
      setSlugAvailable(true); // No slug or not authenticated, assume available
      return;
    }

    // In edit mode, if the slug hasn't changed from the original, it's considered available.
    if (isEditMode && formData.slug === initialSlugRef.current) {
      setSlugAvailable(true);
      setSlugChecking(false);
      return;
    }

    if (slugCheckTimeout.current) {
      clearTimeout(slugCheckTimeout.current);
    }

    setSlugChecking(true);
    setSlugAvailable(false); // Assume unavailable until checked

    slugCheckTimeout.current = setTimeout(async () => {
      try {
        const endpoint = `/api/v1/lifestyle/check-slug/${formData.slug}${isEditMode ? `?exclude_id=${id}` : ''}`;
        const data = await apiRequest(endpoint);
        setSlugAvailable(data.available);
      } catch (err) {
        console.error("Slug check error:", err);
        setSlugAvailable(false); // On error, assume unavailable to be safe
        showError("Error checking slug availability. Please try again.");
      } finally {
        setSlugChecking(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(slugCheckTimeout.current);
  }, [formData.slug, isAuthenticated, isEditMode, id, apiRequest]);


  // ==================== FORM FIELD CHANGE HANDLER ====================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  };

  const handleSlugChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    setErrors((prev) => ({ ...prev, slug: "" }));
  };

  // ==================== FORM VALIDATION ====================
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Internal Name is required.";
    if (!formData.title.trim()) newErrors.title = "Public Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required.";
    else if (!slugAvailable || slugChecking) newErrors.slug = "Slug is not valid or being checked.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      showError("Please fill in all required fields and correct errors.");
      return;
    }

    setSubmitting(true);
    const submitToast = showLoading(isEditMode ? "Updating lifestyle..." : "Creating lifestyle...");

    try {
      const payload = {
        ...formData,
        // Convert country_id/developer_id to number or null if empty
        country_id: formData.country_id ? parseInt(formData.country_id) : null,
        developer_id: formData.developer_id ? parseInt(formData.developer_id) : null,
      };

      let result;
      if (isEditMode) {
        result = await apiRequest(`/api/v1/lifestyle/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiRequest("/api/v1/lifestyle", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      toast.dismiss(submitToast);
      if (result.success) {
        showSuccess(isEditMode ? "Lifestyle entry updated successfully!" : "Lifestyle entry created successfully!");
        router.push("/admin/lifestyle"); // Redirect to lifestyle listing page
      } else {
        throw new Error(result.message || "Operation failed.");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setServerError(err.message);
      toast.dismiss(submitToast);
      showError(err.message || (isEditMode ? "Failed to update lifestyle." : "Failed to create lifestyle."));
    } finally {
      setSubmitting(false);
    }
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
      <Toaster />
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 p-3">
        <div className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditMode ? "Edit Lifestyle Entry" : "Add New Lifestyle Entry"}
            </h2>
            <button
              onClick={() => router.push("/admin/lifestyle")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lifestyle List
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="ml-3 text-lg text-gray-600">Loading lifestyle data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <span className="block sm:inline">{serverError}</span>
                </div>
              )}

              {/* General Information */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" /> General Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Internal Name (Unique)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., Luxury Homes"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Public Title<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., Luxury Living in Downtown"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Experience the best of modern life"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Provide a detailed description of this lifestyle offering..."
                  ></textarea>
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Relationships & Media */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> Relationships & Media
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="country_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Country (Optional)
                    </label>
                    <select
                      id="country_id"
                      name="country_id"
                      value={formData.country_id}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="developer_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Developer (Optional)
                    </label>
                    <select
                      id="developer_id"
                      name="developer_id"
                      value={formData.developer_id}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select Developer</option>
                      {developers.map((developer) => (
                        <option key={developer.id} value={developer.id}>
                          {developer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      id="image"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., https://example.com/lifestyle-hero.jpg"
                    />
                    {formData.image && (
                      <a href={formData.image} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View Image">
                        <ImageIcon className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO Information */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-teal-600" /> SEO Information
                </h3>

                <div className="mb-4">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL Identifier)<span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className={`block w-full px-3 py-2 border ${errors.slug || (!slugAvailable && formData.slug) ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., luxury-homes-downtown"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, slug: generateSlug(prev.title || prev.name)}))}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      title="Generate slug from title/name"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                  {slugChecking && <p className="text-gray-500 text-xs mt-1 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Checking slug...</p>}
                  {!slugChecking && formData.slug && !slugAvailable && !errors.slug && <p className="text-red-500 text-xs mt-1 flex items-center"><X className="w-3 h-3 mr-1" /> This slug is already taken.</p>}
                  {!slugChecking && formData.slug && slugAvailable && !errors.slug && <p className="text-green-600 text-xs mt-1 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Slug is available.</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Title (Optional, max 60 chars)
                  </label>
                  <input
                    type="text"
                    id="seo_title"
                    name="seo_title"
                    value={formData.seo_title}
                    onChange={handleChange}
                    maxLength={60}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Meta title for search engines"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seo_title.length}/60 characters</p>
                </div>

                <div className="mb-4">
                  <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Description (Optional, max 160 chars)
                  </label>
                  <textarea
                    id="seo_description"
                    name="seo_description"
                    rows="3"
                    value={formData.seo_description}
                    onChange={handleChange}
                    maxLength={160}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Meta description for search engines"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">{formData.seo_description.length}/160 characters</p>
                </div>

                <div className="mb-4">
                  <label htmlFor="seo_focus_keyword" className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Focus Keyword (Optional, max 100 chars)
                  </label>
                  <input
                    type="text"
                    id="seo_focus_keyword"
                    name="seo_focus_keyword"
                    value={formData.seo_focus_keyword}
                    onChange={handleChange}
                    maxLength={100}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., luxury real estate"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.seo_focus_keyword.length}/100 characters</p>
                </div>
              </div>

              {/* Status */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-600" /> Status
                </h3>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Lifestyle Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/admin/lifestyle")}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || slugChecking || !slugAvailable}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isEditMode ? "Update Lifestyle" : "Create Lifestyle"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}