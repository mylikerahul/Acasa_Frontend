"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"; // Eye/EyeOff removed as password is not in agent model
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth"; // Adjust path as necessary
import AdminNavbar from "../../dashboard/header/DashboardNavbar"; // Adjust path as necessary

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; // Ensure fallback

// ==================== TOKEN VERIFICATION (re-used from AgentsPage) ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
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

export default function AddAgentPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [loading, setLoading] = useState(false);
  // const [showPassword, setShowPassword] = useState(false); // Password field removed, so this state is not needed
  const [form, setForm] = useState({
    // Fields matching agent.model.js schema
    title: "",
    slug: "",
    sub_title: "",
    name: "", // Full name, derived or direct
    first_name: "",
    last_name: "",
    nationality: "",
    orn_number: "",
    orn: "",
    brn: "",
    mobile: "", // Maps from previous 'mobile_phone'
    designation: "", // Maps from previous 'job_title'
    languages: "",
    aos: "",
    company: "",
    email: "",
    descriptions: "",
    seo_title: "",
    seo_keywork: "",
    seo_description: "",
    status: 1, // Default to active
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // ==================== TOAST HELPERS ====================
  const showSuccess = (message) => {
    toast.success(message, { duration: 3000, position: "top-right" });
  };

  const showError = (message) => {
    toast.error(message, { duration: 4000, position: "top-right" });
  };

  const showLoadingToast = (message) => {
    return toast.loading(message, { position: "top-right" });
  };


  // ==================== AUTHENTICATION (re-used from AgentsPage) ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        showError(sessionType === "user" ? "Please login as admin to access this page" : "Please login to access this page");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();
      if (!token) {
        showError("Please login to access this page");
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
        if (verifyError.message === "Unauthorized") {
          showError("Invalid or expired token. Please login again.");
        } else {
          showError("Token verification failed. Please login again.");
        }
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
    router.push("/admin/login");
  }, [router]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");
    
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  // ==================== FORM HELPERS ====================
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file (JPG, PNG, or WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image must be less than 5MB");
      return;
    }

    setAvatar(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    showSuccess("Avatar selected");
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    // Validate name (either first_name + last_name or explicit 'name' field)
    const effectiveName = form.name.trim() || `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
    if (!effectiveName) {
        newErrors.first_name = "Agent's full name (or first name) is required";
        newErrors.name = "Agent's full name (or first name) is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const token = getAdminToken();

    if (!token) {
      showError("Please login to continue");
      router.push("/admin/login");
      return;
    }

    if (!validateForm()) {
      showError("Please fill all required fields correctly.");
      // Optional: scroll to first error
      // const firstErrorField = Object.keys(errors)[0];
      // if (firstErrorField) {
      //   document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth' });
      // }
      return;
    }

    setLoading(true);
    const submitToastId = showLoadingToast("Creating agent...");

    try {
      const formData = new FormData();

      // Determine the 'name' field for the backend
      const effectiveName = form.name.trim() || `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
      formData.append("name", effectiveName);

      // Append all form fields to formData, handling empty strings as null
      Object.entries(form).forEach(([key, value]) => {
        // Skip 'name' as it's handled above.
        // Skip first_name/last_name if form.name is explicitly set, otherwise append.
        if (key === 'name') return;
        if ((key === 'first_name' || key === 'last_name') && form.name.trim()) return;

        // Ensure empty strings are sent as null for non-required fields where applicable
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
          // Do not append, or append empty string which backend should handle as null
          // Backend controller should convert empty strings to null.
          // For FormData, not appending is often equivalent to null for DB.
          return;
        }
        formData.append(key, String(value).trim());
      });
      
      // If an avatar is selected, append it under the key 'image' as expected by multer middleware
      if (avatar) {
        formData.append("image", avatar);
      }

      // Determine the correct endpoint based on whether an image is being uploaded
      const endpoint = avatar ? `/api/agents/admin/create-with-image` : `/api/agents/admin/create`;

      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' is NOT explicitly set here.
            // When using FormData with fetch, the browser automatically sets the correct
            // 'Content-Type' header including the boundary, which is crucial for file uploads.
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        logoutAll();
        router.push("/admin/login");
        throw new Error("Session expired. Please login again.");
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
      }

      if (responseData.success) {
        toast.dismiss(submitToastId);
        showSuccess(responseData.message || "Agent created successfully");
        router.push("/admin/agents"); // Redirect to agents listing page
      } else {
        throw new Error(responseData.message || "Failed to create agent.");
      }
    } catch (error) {
      console.error("❌ Error creating agent:", error);
      toast.dismiss(submitToastId);
      showError(error.message || "Failed to create agent.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOADING & AUTH PROTECTION ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  return (
    <>
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Add Agent</h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/agents")}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Picture (Avatar) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                      <Upload className="w-4 h-4" />
                      {avatarPreview ? "Change Picture" : "Upload Picture"}
                    </span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or WEBP. Max size 5MB.
                  <br/>
                  <span className="text-orange-600">Note: This will be saved in 'cuid' field temporarily.</span>
                </p>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300`}
                  placeholder="Enter last name"
                />
              </div>

              {/* OR Full Name (Alternative if first_name/last_name not preferred) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name (Optional, overrides First/Last Name if set)
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., John Doe"
                />
                {errors.name && !errors.first_name && ( // Only show if first_name error isn't already showing
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="agent@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mr. / Mrs. / Ms."
                />
              </div>

              {/* Sub Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Title
                </label>
                <input
                  type="text"
                  value={form.sub_title}
                  onChange={(e) => handleChange("sub_title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expert Real Estate Agent"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (Optional - auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john-doe-real-estate"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Unique identifier for URLs.
                </p>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+971 50 123 4567"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter nationality"
                />
              </div>

              {/* Designation (was Job Title) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => handleChange("designation", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Agent"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="XYZ Real Estate"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.languages}
                  onChange={(e) => handleChange("languages", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="English, Arabic, Hindi"
                />
              </div>

              {/* ORN Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ORN Number
                </label>
                <input
                  type="text"
                  value={form.orn_number}
                  onChange={(e) => handleChange("orn_number", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ORN123456"
                />
              </div>

              {/* ORN (If different from ORN_number) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ORN (Optional, if separate from ORN Number)
                </label>
                <input
                  type="text"
                  value={form.orn}
                  onChange={(e) => handleChange("orn", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alternative ORN"
                />
              </div>

              {/* BRN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BRN
                </label>
                <input
                  type="text"
                  value={form.brn}
                  onChange={(e) => handleChange("brn", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="BRN789"
                />
              </div>

              {/* Area of Specialization (AOS) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Specialization (AOS)
                </label>
                <textarea
                  value={form.aos}
                  onChange={(e) => handleChange("aos", e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Residential sales, Commercial leasing, Off-plan properties..."
                ></textarea>
              </div>

              {/* Descriptions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descriptions
                </label>
                <textarea
                  value={form.descriptions}
                  onChange={(e) => handleChange("descriptions", e.target.value)}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the agent's profile and experience."
                ></textarea>
              </div>

              {/* SEO Fields */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  SEO Information
                </h3>
                {/* SEO Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={form.seo_title}
                    onChange={(e) => handleChange("seo_title", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO friendly title for the agent page"
                  />
                </div>
                {/* SEO Keywords */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={form.seo_keywork}
                    onChange={(e) => handleChange("seo_keywork", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="agent name, real estate, dubai, properties"
                  />
                </div>
                {/* SEO Description */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={form.seo_description}
                    onChange={(e) => handleChange("seo_description", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A brief, keyword-rich summary of the agent for search engines."
                  ></textarea>
                </div>
              </div>


              {/* Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}