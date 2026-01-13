"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router"; // Make sure you have next/router installed
import {
  Loader2,
  Plus,
  Save,
  ArrowLeft,
  Briefcase,
  MapPin,
  Timer,
  Info,
  Link,
  Tag,
  Hash,
  X,
  Trash2,
  CheckCircle,
  Eye,
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
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
];

const TYPE_OPTIONS = [
  { value: "Remote", label: "Remote" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Freelance", label: "Freelance" },
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
export default function AddEditJobPage() {
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
    full_name: "",
    title: "",
    description: "",
    sub_title: "",
    sub_description: "",
    about_team: "",
    about_company: "",
    job_title: "",
    city_name: "",
    responsibilities: "",
    type: "", // Job type
    link: "", // External application link
    facilities: [], // Array of strings (e.g., "Free lunch", "Gym")
    social: [], // Array of objects { name: "LinkedIn", url: "..." }
    seo_title: "",
    seo_description: "",
    seo_keyword: "",
    status: "active",
    slug: "",
  });

  // UI State
  const [loading, setLoading] = useState(isEditMode); // True if editing and fetching data
  const [submitting, setSubmitting] = useState(false); // True when saving/creating
  const [errors, setErrors] = useState({}); // Form validation errors
  const [serverError, setServerError] = useState(null); // API error
  const [cities, setCities] = useState([]); // List of available cities
  const [jobTypes, setJobTypes] = useState([]); // List of available job types
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(true);

  const slugCheckTimeout = useRef(null);

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

        // Try to verify token with API, if fails, fallback to parsing token payload
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
            // If API verification fails but token is still structurally valid
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
          // Fallback if API call or token verification fails
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
            // If token is invalid or unparseable
            logoutAll();
            fastNavigate("/admin/login");
            return;
          }
        }
      } catch (error) {
        // General error during auth check
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
      }).catch(() => {}); // Catch error to prevent crashing, but proceed with logout

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
      // This should ideally not happen if auth is verified, but good fallback
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
      // Session expired or invalid token
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

  // ==================== FETCH CITIES AND JOB TYPES ====================
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDropdownData = async () => {
      try {
        const [citiesData, typesData] = await Promise.all([
          apiRequest("/api/v1/jobs/cities"),
          apiRequest("/api/v1/jobs/types"),
        ]);
        if (citiesData.success) {
          setCities(citiesData.data);
        }
        if (typesData.success) {
          setJobTypes(typesData.data);
        }
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setServerError(err.message);
      }
    };

    fetchDropdownData();
  }, [isAuthenticated, apiRequest]);

  // ==================== FETCH JOB DATA FOR EDIT MODE ====================
  useEffect(() => {
    if (!isAuthenticated || !isEditMode || !id) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        setServerError(null);
        const data = await apiRequest(`/api/v1/jobs/id/${id}`);

        if (data.success && data.data) {
          const job = data.data;
          setFormData({
            full_name: job.full_name || "",
            title: job.title || "",
            description: job.description || "",
            sub_title: job.sub_title || "",
            sub_description: job.sub_description || "",
            about_team: job.about_team || "",
            about_company: job.about_company || "",
            job_title: job.job_title || "",
            city_name: job.city_name || "",
            responsibilities: job.responsibilities || "",
            type: job.type || "",
            link: job.link || "",
            // Parse JSON fields, default to empty array if null or invalid
            facilities: job.facilities ? (typeof job.facilities === 'string' ? JSON.parse(job.facilities) : job.facilities) : [],
            social: job.social ? (typeof job.social === 'string' ? JSON.parse(job.social) : job.social) : [],
            seo_title: job.seo_title || "",
            seo_description: job.seo_description || "",
            seo_keyword: job.seo_keyword || "",
            status: job.status || "active",
            slug: job.slug || "",
          });
          setSlugAvailable(true); // Assume slug is available if it's the current job's slug
        } else {
          showError("Job not found or failed to load.");
          router.push("/admin/jobs"); // Redirect to jobs list
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setServerError(err.message);
        showError("Failed to load job data.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [isAuthenticated, isEditMode, id, apiRequest, router]);

  // ==================== SLUG AVAILABILITY CHECK ====================
  useEffect(() => {
    if (!isAuthenticated || !formData.slug) {
      setSlugAvailable(true); // No slug or not authenticated, assume available
      return;
    }

    if (slugCheckTimeout.current) {
      clearTimeout(slugCheckTimeout.current);
    }

    setSlugChecking(true);
    setSlugAvailable(false); // Assume unavailable until checked

    slugCheckTimeout.current = setTimeout(async () => {
      try {
        const endpoint = `/api/v1/jobs/check-slug/${formData.slug}${isEditMode ? `?exclude_id=${id}` : ''}`;
        const data = await apiRequest(endpoint);
        setSlugAvailable(data.available);
      } catch (err) {
        console.error("Slug check error:", err);
        // On error, better to assume it might be unavailable or just show an alert
        setSlugAvailable(false);
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

  // ==================== DYNAMIC JSON FIELDS HANDLER (FACILITIES/SOCIAL) ====================
  const handleArrayItemChange = (field, index, value) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleAddItem = (field, initialValue = "") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], initialValue],
    }));
  };

  const handleRemoveItem = (field, index) => {
    setFormData((prev) => {
      const newArray = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: newArray };
    });
  };

  const handleSocialItemChange = (index, key, value) => {
    setFormData((prev) => {
      const newSocial = [...prev.social];
      newSocial[index] = { ...newSocial[index], [key]: value };
      return { ...prev, social: newSocial };
    });
  };

  // ==================== FORM VALIDATION ====================
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Job Title is required.";
    if (!formData.job_title.trim()) newErrors.job_title = "Display Job Title is required.";
    if (!formData.city_name.trim()) newErrors.city_name = "City is required.";
    if (!formData.type.trim()) newErrors.type = "Job Type is required.";
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
    const submitToast = showLoading(isEditMode ? "Updating job..." : "Creating job...");

    try {
      const payload = {
        ...formData,
        // Stringify JSON fields before sending to API
        facilities: formData.facilities.length > 0 ? JSON.stringify(formData.facilities) : null,
        social: formData.social.length > 0 ? JSON.stringify(formData.social) : null,
      };

      let result;
      if (isEditMode) {
        result = await apiRequest(`/api/v1/jobs/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiRequest("/api/v1/jobs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      toast.dismiss(submitToast);
      if (result.success) {
        showSuccess(isEditMode ? "Job updated successfully!" : "Job created successfully!");
        router.push("/admin/jobs"); // Redirect to jobs listing page
      } else {
        throw new Error(result.message || "Operation failed.");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setServerError(err.message);
      toast.dismiss(submitToast);
      showError(err.message || (isEditMode ? "Failed to update job." : "Failed to create job."));
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
              {isEditMode ? "Edit Job" : "Add New Job"}
            </h2>
            <button
              onClick={() => router.push("/admin/jobs")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="ml-3 text-lg text-gray-600">Loading job data...</p>
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
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title (Internal)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., Senior Full Stack Engineer"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
                      Display Job Title (Public)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="job_title"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.job_title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., Software Engineer"
                    />
                    {errors.job_title && <p className="text-red-500 text-xs mt-1">{errors.job_title}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Hiring Manager Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Provide a detailed description of the job role..."
                  ></textarea>
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="sub_title" className="block text-sm font-medium text-gray-700 mb-1">
                      Sub Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="sub_title"
                      name="sub_title"
                      value={formData.sub_title}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., Join our innovative team"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    >
                      <option value="">Select a type</option>
                      {jobTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="sub_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Description (Optional)
                  </label>
                  <textarea
                    id="sub_description"
                    name="sub_description"
                    rows="3"
                    value={formData.sub_description}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Short additional description..."
                  ></textarea>
                </div>
              </div>

              {/* Location & Application */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" /> Location & Application
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="city_name" className="block text-sm font-medium text-gray-700 mb-1">
                      City<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="city_name"
                      name="city_name"
                      value={formData.city_name}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border ${errors.city_name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {errors.city_name && <p className="text-red-500 text-xs mt-1">{errors.city_name}</p>}
                  </div>

                  <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                      Application Link (Optional)
                    </label>
                    <input
                      type="url"
                      id="link"
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., https://careers.example.com/job/123"
                    />
                  </div>
                </div>
              </div>

              {/* Team, Company & Responsibilities */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-purple-600" /> Details
                </h3>

                <div className="mb-4">
                  <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-1">
                    Responsibilities (Optional)
                  </label>
                  <textarea
                    id="responsibilities"
                    name="responsibilities"
                    rows="4"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="List key responsibilities..."
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="about_team" className="block text-sm font-medium text-gray-700 mb-1">
                    About the Team (Optional)
                  </label>
                  <textarea
                    id="about_team"
                    name="about_team"
                    rows="3"
                    value={formData.about_team}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Describe the team this role will be part of..."
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="about_company" className="block text-sm font-medium text-gray-700 mb-1">
                    About the Company (Optional)
                  </label>
                  <textarea
                    id="about_company"
                    name="about_company"
                    rows="3"
                    value={formData.about_company}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Provide a brief about the company..."
                  ></textarea>
                </div>
              </div>

              {/* Facilities */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" /> Facilities & Benefits (Optional)
                </h3>
                {formData.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={facility}
                      onChange={(e) => handleArrayItemChange("facilities", index, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                      placeholder={`Facility ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("facilities", index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem("facilities")}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" /> Add Facility
                </button>
              </div>

              {/* Social Links */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Link className="w-5 h-5 text-gray-600" /> Social Links (Optional)
                </h3>
                {formData.social.map((socialItem, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={socialItem.name || ""}
                      onChange={(e) => handleSocialItemChange(index, "name", e.target.value)}
                      className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                      placeholder="e.g., LinkedIn"
                    />
                    <input
                      type="url"
                      value={socialItem.url || ""}
                      onChange={(e) => handleSocialItemChange(index, "url", e.target.value)}
                      className="block w-2/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                      placeholder="e.g., https://linkedin.com/company/..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem("social", index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem("social", { name: "", url: "" })}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" /> Add Social Link
                </button>
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
                      className={`block w-full px-3 py-2 border ${errors.slug || !slugAvailable ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g., senior-full-stack-engineer"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({...prev, slug: generateSlug(prev.title || prev.job_title)}))}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      title="Generate slug from job title"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                  {slugChecking && <p className="text-gray-500 text-xs mt-1 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Checking slug...</p>}
                  {!slugChecking && formData.slug && (isEditMode ? formData.slug !== router.query.id : true) && !slugAvailable && !errors.slug && <p className="text-red-500 text-xs mt-1 flex items-center"><X className="w-3 h-3 mr-1" /> This slug is already taken.</p>}
                  {!slugChecking && formData.slug && slugAvailable && !errors.slug && <p className="text-green-600 text-xs mt-1 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Slug is available.</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Title (Optional)
                  </label>
                  <input
                    type="text"
                    id="seo_title"
                    name="seo_title"
                    value={formData.seo_title}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Meta title for search engines"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Description (Optional)
                  </label>
                  <textarea
                    id="seo_description"
                    name="seo_description"
                    rows="3"
                    value={formData.seo_description}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Meta description for search engines"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="seo_keyword" className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Keywords (Optional, comma-separated)
                  </label>
                  <input
                    type="text"
                    id="seo_keyword"
                    name="seo_keyword"
                    value={formData.seo_keyword}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., react jobs, frontend, software engineer"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="mb-6 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-600" /> Status
                </h3>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Status
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
                  onClick={() => router.push("/admin/jobs")}
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
                  {isEditMode ? "Update Job" : "Create Job"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}