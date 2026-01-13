"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Folder,
  Hash,
  FileText,
  X,
  AlertCircle,
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
      withCredentials: true,
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

export default function EditCategoryPage() {
  const { id } = useParams();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [errors, setErrors] = useState({});

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
        await verifyToken(token);
      } catch (verifyError) {
        if (verifyError.response?.status === 401) {
          toast.error("Invalid or expired token. Please login again.");
          handleAuthFailure();
          return;
        }
        console.error("Token verification error:", verifyError);
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
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }, []);

  // Fetch Category
  const fetchCategory = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await apiRequest(`/api/v1/blogs-categories/${id}`);

      if (data.success && data.data) {
        const categoryData = {
          name: data.data.name || "",
          slug: data.data.slug || "",
          description: data.data.description || "",
        };
        setFormData(categoryData);
        setOriginalData(categoryData);
      } else {
        toast.error("Category not found");
        window.location.href = "/admin/categories";
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load category");
      window.location.href = "/admin/categories";
    } finally {
      setLoading(false);
    }
  }, [id, apiRequest]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchCategory();
    }
  }, [isAuthenticated, id, fetchCategory]);

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Auto-generate slug when name changes
    if (field === "name") {
      const newSlug = generateSlug(value);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    try {
      setSaving(true);

      const data = await apiRequest(`/api/v1/blogs-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (data.success) {
        toast.success("Category updated successfully!");
        setTimeout(() => {
          window.location.href = "/admin/categories";
        }, 1000);
      } else {
        throw new Error(data.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalData) return false;
    return (
      formData.name !== originalData.name ||
      formData.slug !== originalData.slug ||
      formData.description !== originalData.description
    );
  };

  // Reset form
  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      setErrors({});
    }
  };

  // Navigate back
  const handleBack = () => {
    window.location.href = "/admin/categories";
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
            <p className="mt-4 text-gray-600">Loading category...</p>
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
              Back to Categories
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Edit Category
            </h1>
            <p className="text-gray-600 text-sm">
              Update category details for ID: #{id}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-300 rounded">
            {/* Card Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Category Information
                  </h2>
                  <p className="text-xs text-gray-500">
                    Fill in the details below
                  </p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter category name"
                    className={`w-full px-4 py-2.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      errors.name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.name && (
                    <div className="flex items-center gap-1 mt-1.5 text-red-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs">{errors.name}</span>
                    </div>
                  )}
                </div>

                {/* Slug Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-gray-500 text-sm">
                      <Hash className="w-4 h-4 mr-1" />
                      /category/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        handleChange("slug", e.target.value.toLowerCase())
                      }
                      placeholder="category-slug"
                      className={`flex-1 px-4 py-2.5 border rounded-r text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
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
                    URL-friendly identifier (auto-generated from name)
                  </p>
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter category description (optional)"
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Brief description of what this category contains
                  </p>
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {hasChanges() && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving || !hasChanges()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </form>
          </div>

          {/* Info Card */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Category Guidelines
                </h3>
                <ul className="mt-1 text-xs text-blue-700 space-y-1">
                  <li>• Category names should be clear and descriptive</li>
                  <li>• Slugs are automatically generated but can be customized</li>
                  <li>• Changing the slug will affect all existing URLs</li>
                  <li>• Description helps with SEO and user understanding</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}