"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Folder,
  Hash,
  FileText,
  AlertCircle,
  RefreshCw,
  Eye,
  Plus,
} from "lucide-react";
// Replaced react-toastify with react-hot-toast for consistency
import { toast, Toaster } from "react-hot-toast";

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar"; // Assuming correct path

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION (Copied from Project/Blog Add) ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, { // Using /users/admin/verify-token for consistency
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

// ==================== COMMON STYLES (Copied from Project/Blog Add) ====================
const labelCls = "text-sm text-gray-700";
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const fieldErrorCls = "w-full border border-red-400 bg-red-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const selectCls = "w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"; // Not used in this page, but kept for consistency
const selectErrorCls = "w-full border border-red-400 bg-red-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded"; // Not used in this page, but kept for consistency
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-4 py-3 border-b border-gray-200 bg-gray-50"; // Adjusted padding/bg for header consistency
const boxBodyCls = "p-4"; // Adjusted padding for body consistency

// ==================== TOAST HELPER FUNCTIONS (Copied from Project/Blog Add) ====================
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

const showWarning = (message) => toast.warning(message, {
  duration: 3000,
  position: "top-right",
  style: {
    background: '#FFC107', // Amber
    color: '#fff',
    fontWeight: '500',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#FFC107',
  },
});


export default function AddCategoryPage() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); // To show errors only after interaction

  // ==================== AUTHENTICATION (Copied from Project/Blog Add) ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        showError("Please login as admin to access this page");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token || !isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        console.error("Token verification error:", verifyError);
        showError("Authentication failed. Please login again.");
        handleAuthFailure();
        return;
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
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();

      await fetch(
        `${API_BASE_URL}/api/v1/users/logout`, // Assuming a general user logout endpoint
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      ).catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
      showError("Logout failed. Please try again.");
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll();
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // API Helper (Copied from Project/Blog Add)
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      showError("Please login to continue");
      handleAuthFailure();
      throw new Error("No token found");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json", // Explicitly set Content-Type for JSON body
        Authorization: `Bearer ${token}`,
        ...options.headers, // Allow overriding headers
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        showError("Session expired or unauthorized. Please login again.");
        handleAuthFailure();
      }
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [handleAuthFailure]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Generate slug from name
  const generateSlug = useCallback((name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }, []);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for the field if it's no longer empty
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-generate slug when name changes
    if (field === "name") {
      const newSlug = generateSlug(value);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Re-validate field on blur
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = "";
    if (field === "name") {
      if (!value.trim()) error = "Category name is required";
      else if (value.length < 2) error = "Name must be at least 2 characters";
      else if (value.length > 100) error = "Name must be less than 100 characters";
    } else if (field === "slug") {
      if (!value.trim()) error = "URL slug is required";
      else if (!/^[a-z0-9-]+$/.test(value)) error = "Slug can only contain lowercase letters, numbers and hyphens";
      else if (value.length > 100) error = "Slug must be less than 100 characters";
    } else if (field === "description" && value && value.length > 500) {
      error = "Description must be less than 500 characters";
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Regenerate slug manually
  const handleRegenerateSlug = useCallback(() => {
    if (!formData.name.trim()) {
      showError("Enter category name first.");
      return;
    }
    const newSlug = generateSlug(formData.name);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    showSuccess("Slug regenerated!");
    validateField("slug", newSlug); // Validate immediately
  }, [formData.name, generateSlug]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers and hyphens";
    } else if (formData.slug.length > 100) {
      newErrors.slug = "Slug must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})); // Mark all as touched

    if (Object.keys(newErrors).length > 0) {
      showError("Please fix the errors below.");
      return false;
    }
    return true;
  }, [formData]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    const saveToastId = showLoadingToast("Creating category...");

    try {
      const data = await apiRequest("/api/v1/blogs-categories", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.dismiss(saveToastId);
      if (data.success) {
        showSuccess("Category created successfully!");
        setTimeout(() => {
          window.location.href = "/admin/blogs/categories"; // Changed redirect path for consistency with blog path
        }, 1000);
      } else {
        throw new Error(data.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.dismiss(saveToastId);
      showError(error.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  // Check if form is filled
  const isFormFilled = useCallback(() => {
    return formData.name.trim() && formData.slug.trim();
  }, [formData.name, formData.slug]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData({
      name: "",
      slug: "",
      description: "",
    });
    setErrors({});
    setTouched({});
    showSuccess("Form reset successfully");
  }, []);

  // Navigate back
  const handleBack = () => {
    window.location.href = "/admin/blogs/categories"; // Changed redirect path for consistency
  };

  const getFieldClass = (field) => {
    return errors[field] && touched[field] ? fieldErrorCls : fieldCls;
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster /> {/* hot-toast Toaster */}
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
    return null; // Should redirect via handleAuthFailure
  }

  return (
    <>
      {/* hot-toast Toaster Configuration (Copied from Project/Blog Add) */}
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
              primary: '#fff',
              secondary: '#10B981',
            },
            style: {
              background: '#10B981',
              fontWeight: '500',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
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

      {/* Admin Navbar - consistent with Project/Blog Add */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4 pb-24"> {/* Consistent background and padding, added pb-24 for bottom bar */}
        <div className="max-w-[1250px] mx-auto px-3"> {/* Adjusted padding */}
          {/* Top Control Bar - consistent with Project/Blog Add */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  Add New Category
                </h1>

                {/* Back to list button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="h-9 px-3 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded text-sm font-medium"
                  title="Back to Categories List"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-700 mr-1" />
                  Back
                </button>
              </div>
            </div>
            {/* No tabs needed for categories page */}
          </div>

          {/* Form Content Area */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            <div className="p-4"> {/* Padding for content within this background */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Main Form */}
                <div className="md:col-span-2">
                  <div className={boxCls}>
                    {/* Card Header */}
                    <div className={boxHeaderCls}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-800">
                            Category Information
                          </h2>
                          <p className="text-xs text-gray-500">
                            Fill in the details below to create a new category
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit}>
                      <div className={boxBodyCls + " space-y-4"}>
                        {/* Name Field */}
                        <div>
                          <label className={labelRequiredCls}>Category Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            onBlur={() => handleBlur("name")}
                            placeholder="e.g., Technology, Lifestyle, Business"
                            className={getFieldClass("name")}
                          />
                          {errors.name && touched.name ? (
                            <div className="flex items-center gap-1 mt-1.5 text-red-600">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-xs">{errors.name}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              This will be displayed as the category name on your website.
                            </p>
                          )}
                        </div>

                        {/* Slug Field */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={labelRequiredCls}>URL Slug</label>
                            <button
                              type="button"
                              onClick={handleRegenerateSlug}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Regenerate
                            </button>
                          </div>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-100 rounded-l text-gray-500 text-sm">
                              <Hash className="w-4 h-4 mr-1" />
                              /category/
                            </span>
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={(e) =>
                                handleChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                              }
                              onBlur={() => handleBlur("slug")}
                              placeholder="technology-news"
                              className={`${getFieldClass("slug")} rounded-l-none`}
                            />
                          </div>
                          {errors.slug && touched.slug ? (
                            <div className="flex items-center gap-1 mt-1.5 text-red-600">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-xs">{errors.slug}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              URL-friendly identifier (auto-generated from name)
                            </p>
                          )}
                        </div>

                        {/* Description Field */}
                        <div>
                          <label className={`${labelCls} block mb-1.5`}>
                            Description{" "}
                            <span className="text-gray-400 font-normal">
                              (Optional)
                            </span>
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) =>
                              handleChange("description", e.target.value)
                            }
                            onBlur={() => handleBlur("description")}
                            placeholder="Brief description of what this category contains..."
                            rows={4}
                            className={getFieldClass("description") + " resize-none"}
                          />
                          {errors.description && touched.description ? (
                            <div className="flex items-center gap-1 mt-1.5 text-red-600">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-xs">{errors.description}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                Helps with SEO and user understanding.
                              </p>
                              <span className="text-xs text-gray-400">
                                {formData.description.length}/500
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Form Footer is now part of the fixed bottom bar for consistency */}
                    </form>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-1 space-y-4">
                  {/* Preview Card */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                          Live Preview
                        </h3>
                      </div>
                    </div>
                    <div className={boxBodyCls + " space-y-3"}>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category Name</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                            <Folder className="w-3 h-3 text-amber-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {formData.name || "Your category name"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">URL Path</p>
                        <p className="text-sm text-blue-600 break-all">
                          /blogs/categories/{formData.slug || "your-slug"}
                        </p>
                      </div>
                      {formData.description && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {formData.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Guidelines Card */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"> {/* Adjusted to rounded-lg */}
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-base font-semibold text-blue-800 mb-2"> {/* Adjusted heading size */}
                          Category Creation Guidelines
                        </h3>
                        <ul className="text-sm text-blue-700 space-y-1.5 list-disc pl-5"> {/* Added list-disc pl-5 */}
                          <li>Choose a clear, descriptive, and concise name for your category.</li>
                          <li>The URL slug is crucial for SEO; keep it relevant and keyword-rich.</li>
                          <li>A short, unique description can improve search engine visibility.</li>
                          <li>Avoid creating too many narrow categories; aim for broader topics.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips Card */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4"> {/* Adjusted to rounded-lg */}
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-base font-semibold text-amber-800 mb-2"> {/* Adjusted heading size */}
                          Quick Optimization Tips
                        </h3>
                        <ul className="text-sm text-amber-700 space-y-1.5 list-disc pl-5"> {/* Added list-disc pl-5 */}
                          <li>Keep category names short and memorable for users.</li>
                          <li>Ensure slugs contain only lowercase letters, numbers, and hyphens.</li>
                          <li>Double-check for any typos in the name or slug before saving.</li>
                          <li>Avoid creating duplicate or very similar categories to prevent content dilution.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar (Copied from Project/Blog Add) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-3 z-50 shadow-lg">
        <div className="max-w-[1250px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {/* Can add status/info here if needed, e.g., "Ready to save" */}
            <span className="text-gray-500">
              {isFormFilled() ? "Ready to create" : "Fill required fields"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving || !isFormFilled()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Reset Form
            </button>
            <button
              type="submit"
              onClick={handleSubmit} // Call handleSubmit when this button is clicked
              disabled={saving || !isFormFilled()}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Category
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}