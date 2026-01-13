"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Upload,
  X,
  Globe,
  Hash,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active", bg: "bg-green-100", text: "text-green-700" },
  { value: "inactive", label: "Inactive", bg: "bg-red-100", text: "text-red-700" },
];

// ==================== IMAGE URL HELPER ====================
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  if (imagePath.startsWith("/")) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/uploads/cities/${imagePath}`;
};

// City Image Component (using regular img tag)
const CityImagePreview = ({ src, alt, onRemove }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return null;
  }

  return (
    <div className="relative w-full h-48 rounded border border-gray-300 overflow-hidden bg-gray-100">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt || "City"}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default function EditCityPage() {
  const params = useParams();
  const cityId = params?.id;

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    cities: "",
    country: "",
    code: "",
    slug: "",
    status: "active",
    description: "",
    seo_title: "",
    seo_description: "",
    seo_focus_keyword: "",
  });
  const [originalData, setOriginalData] = useState(null);

  // Image State
  const [currentImage, setCurrentImage] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        toast.error(
          sessionType === "user"
            ? "Please login as admin to access this dashboard"
            : "Please login to access dashboard"
        );
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

        setAdmin({
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || "admin",
          userType: payload.userType,
          avatar: null,
        });
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
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logoutAll();
      toast.success("Logged out successfully");
      window.location.href = "/admin/login";
    }
  }, []);

  // API Helper
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      window.location.href = "/admin/login";
      throw new Error("Please login to continue");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
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
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }, []);

  // Fetch City Data
  const fetchCity = useCallback(async () => {
    if (!cityId) {
      toast.error("City ID is missing");
      window.location.href = "/admin/cities";
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest(`/api/v1/cities/${cityId}`);

      if (data.success && data.data) {
        const city = data.data;

        const cityData = {
          cities: city.cities || "",
          country: city.country || "",
          code: city.code || "",
          slug: city.slug || "",
          status: city.status || "active",
          description: city.description || "",
          seo_title: city.seo_title || "",
          seo_description: city.seo_description || "",
          seo_focus_keyword: city.seo_focus_keyword || "",
        };

        setFormData(cityData);
        setOriginalData(cityData);
        setCurrentImage(city.image);
      } else {
        throw new Error("City not found");
      }
    } catch (err) {
      console.error("Error fetching city:", err);
      toast.error("Failed to load city data");
      window.location.href = "/admin/cities";
    } finally {
      setLoading(false);
    }
  }, [cityId, apiRequest]);

  // Effects
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && cityId) {
      fetchCity();
    }
  }, [isAuthenticated, cityId, fetchCity]);

  // Generate slug from city name
  const generateSlug = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle Input Change
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-generate slug from city name
      if (field === "cities") {
        newData.slug = generateSlug(value);
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle Image Change
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setNewImage(file);
    setRemoveImage(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    toast.success("Image selected");
  };

  // Remove Image
  const handleRemoveImage = () => {
    setNewImage(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  // Cancel Image Change
  const handleCancelImageChange = () => {
    setNewImage(null);
    setImagePreview(null);
    setRemoveImage(false);
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.cities.trim()) {
      newErrors.cities = "City name is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalData) return false;
    const formChanged =
      formData.cities !== originalData.cities ||
      formData.country !== originalData.country ||
      formData.code !== originalData.code ||
      formData.slug !== originalData.slug ||
      formData.status !== originalData.status ||
      formData.description !== originalData.description ||
      formData.seo_title !== originalData.seo_title ||
      formData.seo_description !== originalData.seo_description ||
      formData.seo_focus_keyword !== originalData.seo_focus_keyword;

    return formChanged || newImage !== null || removeImage;
  };

  // Reset form
  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      setNewImage(null);
      setImagePreview(null);
      setRemoveImage(false);
      setErrors({});
      toast.success("Form reset to original values");
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSaving(true);

    try {
      // Use FormData for file upload
      const submitData = new FormData();
      submitData.append("cities", formData.cities);
      submitData.append("country", formData.country);
      submitData.append("code", formData.code);
      submitData.append("slug", formData.slug);
      submitData.append("status", formData.status);
      submitData.append("description", formData.description);
      submitData.append("seo_title", formData.seo_title);
      submitData.append("seo_description", formData.seo_description);
      submitData.append("seo_focus_keyword", formData.seo_focus_keyword);

      if (newImage) {
        submitData.append("image", newImage);
      } else if (removeImage) {
        submitData.append("remove_image", "true");
      }

      await apiRequest(`/api/v1/cities/${cityId}`, {
        method: "PUT",
        body: submitData,
      });

      toast.success("City updated successfully!");

      setTimeout(() => {
        window.location.href = "/admin/cities";
      }, 1000);
    } catch (err) {
      console.error("Error updating city:", err);
      toast.error(err.message || "Failed to update city");
    } finally {
      setSaving(false);
    }
  };

  // Navigate back
  const handleBack = () => {
    window.location.href = "/admin/cities";
  };

  // Get current display image
  const displayImage =
    imagePreview || (removeImage ? null : getImageUrl(currentImage));

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (loading) {
    return (
      <>
        <AdminNavbar
          admin={admin}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />
        <div className="min-h-screen bg-gray-100 pt-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading city...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Admin Navbar */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-3">
          {/* Header */}
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cities
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  Edit City
                </h1>
                <p className="text-gray-600 text-sm">
                  Update city details • ID: #{cityId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges() && (
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={saving || !hasChanges()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-4">
                {/* Basic Information Card */}
                <div className="bg-white border border-gray-300 rounded">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      <h2 className="text-sm font-semibold text-gray-800">
                        Basic Information
                      </h2>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* City Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        City Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.cities}
                        onChange={(e) => handleChange("cities", e.target.value)}
                        placeholder="Enter city name"
                        className={`w-full px-4 py-2.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors.cities
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.cities && (
                        <div className="flex items-center gap-1 mt-1.5 text-red-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-xs">{errors.cities}</span>
                        </div>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) =>
                            handleChange("country", e.target.value)
                          }
                          placeholder="Enter country name"
                          className={`w-full pl-10 pr-4 py-2.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            errors.country
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.country && (
                        <div className="flex items-center gap-1 mt-1.5 text-red-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-xs">{errors.country}</span>
                        </div>
                      )}
                    </div>

                    {/* Code and Slug Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          City Code
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.code}
                            onChange={(e) =>
                              handleChange("code", e.target.value.toUpperCase())
                            }
                            placeholder="e.g., NYC, LON"
                            maxLength={10}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                          />
                        </div>
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Slug <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) =>
                              handleChange(
                                "slug",
                                e.target.value.toLowerCase().replace(/\s+/g, "-")
                              )
                            }
                            placeholder="city-slug"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors.slug
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                        {errors.slug && (
                          <div className="flex items-center gap-1 mt-1.5 text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-xs">{errors.slug}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-generated from city name
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          handleChange("description", e.target.value)
                        }
                        placeholder="Enter city description..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO Card */}
                <div className="bg-white border border-gray-300 rounded">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h2 className="text-sm font-semibold text-gray-800">
                        SEO Settings
                      </h2>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* SEO Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          SEO Title
                        </label>
                        <span className="text-xs text-gray-500">
                          {formData.seo_title.length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.seo_title}
                        onChange={(e) =>
                          handleChange("seo_title", e.target.value)
                        }
                        placeholder="Enter SEO title"
                        maxLength={60}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* SEO Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          SEO Description
                        </label>
                        <span className="text-xs text-gray-500">
                          {formData.seo_description.length}/160
                        </span>
                      </div>
                      <textarea
                        value={formData.seo_description}
                        onChange={(e) =>
                          handleChange("seo_description", e.target.value)
                        }
                        placeholder="Enter SEO description"
                        rows={3}
                        maxLength={160}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Focus Keyword */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Focus Keyword
                      </label>
                      <input
                        type="text"
                        value={formData.seo_focus_keyword}
                        onChange={(e) =>
                          handleChange("seo_focus_keyword", e.target.value)
                        }
                        placeholder="Enter focus keyword"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Status Card */}
                <div className="bg-white border border-gray-300 rounded">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Status
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => handleChange("status", status.value)}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium border-2 transition-all ${
                            formData.status === status.value
                              ? `${status.bg} ${status.text} border-current`
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image Card */}
                <div className="bg-white border border-gray-300 rounded">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-semibold text-gray-800">
                        City Image
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Current/Preview Image */}
                    {displayImage && (
                      <CityImagePreview
                        src={displayImage}
                        alt={formData.cities}
                        onRemove={handleRemoveImage}
                      />
                    )}

                    {newImage && (
                      <div className="text-xs text-green-600 font-medium">
                        ✓ New image selected
                      </div>
                    )}

                    {/* Upload Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`border-2 border-dashed rounded p-6 text-center ${
                          displayImage
                            ? "border-gray-200 bg-gray-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                        }`}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {displayImage
                            ? "Click to change image"
                            : "Click to upload"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WEBP (max 5MB)
                        </p>
                      </div>
                    </div>

                    {/* Cancel Change Button */}
                    {(newImage || removeImage) && currentImage && (
                      <button
                        type="button"
                        onClick={handleCancelImageChange}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <X className="w-4 h-4" />
                        Cancel Image Change
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50 border border-amber-200 rounded p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-800 mb-1">
                        Editing Tips
                      </h3>
                      <ul className="text-xs text-amber-700 space-y-1">
                        <li>• Changing the slug will affect existing URLs</li>
                        <li>• SEO title should be 50-60 characters</li>
                        <li>• Description helps with search rankings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="mt-4 bg-white border border-gray-300 rounded p-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {hasChanges() ? (
                  <span className="text-amber-600 font-medium">
                    • Unsaved changes
                  </span>
                ) : (
                  "No changes"
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                {hasChanges() && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !hasChanges()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}