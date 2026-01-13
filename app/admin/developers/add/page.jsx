"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";
import TextEditor from "../../../components/common/SimpleTextEditor";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ All possible image extensions for preview
const IMAGE_EXTENSIONS = [".jpg", ".png", ".webp", ".jpeg", ".gif", ".svg"];

const TABS = [
  { id: "details", label: "Details" },
  { id: "info", label: "Info" },
  { id: "projects", label: "Projects" },
  { id: "properties", label: "Properties" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

const verifyToken = async (token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/users/admin/verify-token`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  // ✅ Generate slug from name
  generateSlug: (name) => {
    if (!name?.trim()) return "";
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  // ✅ Strip HTML tags
  stripHtml: (html) =>
    typeof html === "string"
      ? html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
      : "",

  // ✅ Count words
  countWords: (text) => text.split(/\s+/).filter(Boolean).length,

  // ✅ Get base image path (without extension)
  getBaseImagePath: (imagePath) => {
    if (!imagePath) return null;

    // Already full URL
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // Clean the path
    const cleanPath = imagePath.replace(/^\/+/, "");

    // Remove extension if already present
    const pathWithoutExt = cleanPath.replace(
      /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      ""
    );

    // Return base URL path
    return `${API_BASE_URL}/uploads/developers/${pathWithoutExt}`;
  },

  // ✅ Get initials from name
  getInitials: (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART IMAGE PREVIEW COMPONENT - Tries multiple extensions
// ═══════════════════════════════════════════════════════════════════════════════

const SmartImagePreview = ({ imagePath, name, onRemove, className = "" }) => {
  const [currentExtIndex, setCurrentExtIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const basePath = utils.getBaseImagePath(imagePath);

  // Reset state when basePath changes
  useEffect(() => {
    setCurrentExtIndex(0);
    setLoaded(false);
    setFailed(false);
  }, [basePath]);

  const handleError = () => {
    const nextIndex = currentExtIndex + 1;

    if (nextIndex < IMAGE_EXTENSIONS.length) {
      setCurrentExtIndex(nextIndex);
    } else {
      setFailed(true);
    }
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  // If no base path or all failed, show fallback
  if (!basePath || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
            {utils.getInitials(name)}
          </div>
          <p className="text-xs text-gray-500">No image available</p>
        </div>
      </div>
    );
  }

  const currentUrl = `${basePath}${IMAGE_EXTENSIONS[currentExtIndex]}`;

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
        {!loaded && !failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        <img
          src={currentUrl}
          alt={name || "Developer Logo"}
          className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
        />
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AddDeveloperPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    year_established: "",
    country: "",
    ceo_name: "",
    website: "",
    responsible_agent: "",
    email: "",
    mobile: "",
    address: "",
    informations: "",
    seo_title: "",
    seo_slug: "",
    seo_description: "",
    seo_keyword: "",
    status: 1,
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("details");

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        if (sessionType === "user") {
          toast.error("Please login as admin to access this page");
        } else {
          toast.error("Please login to access this page");
        }
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        toast.error("Please login to access this page");
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

      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== FETCH AGENTS ====================
  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const token = getAdminToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/users/admin/type/agents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const agentsList = response.data.users || [];
        setAgents(agentsList);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logoutAll();
        window.location.href = "/admin/login";
      }
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAgents();
    }
  }, [isAuthenticated, fetchAgents]);

  // ==================== FORM HELPERS ====================
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // Auto-generate slug & seo_title from name
    if (field === "name") {
      const slug = utils.generateSlug(value);
      setForm((prev) => ({ ...prev, seo_slug: slug, seo_title: value }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    toast.success("Logo uploaded successfully");
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Developer name is required";
    if (!form.seo_slug.trim()) newErrors.seo_slug = "Slug is required";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      newErrors.website = "Website must start with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkSlugExists = async (slug) => {
    try {
      const token = getAdminToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/developers/check-slug/${slug}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.exists;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    const token = getAdminToken();

    if (!token) {
      toast.error("Please login to continue");
      window.location.href = "/admin/login";
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      if (errors.name || errors.seo_slug) {
        setActiveTab("details");
      }
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating developer...");

    try {
      // Check if slug exists
      const slugExists = await checkSlugExists(form.seo_slug);

      if (slugExists) {
        setErrors({ seo_slug: "This slug already exists" });
        setActiveTab("details");
        setLoading(false);
        toast.dismiss(loadingToast);
        toast.error("Slug already exists. Please choose a different one.");
        return;
      }

      // Create FormData
      const formData = new FormData();

      // ✅ Map form fields to API expected fields
      const fieldMapping = {
        name: "name",
        year_established: "year_established",
        country: "country",
        website: "website",
        email: "email",
        mobile: "mobile",
        address: "address",
        informations: "informations",
        seo_title: "seo_title",
        seo_slug: "seo_slug",
        seo_description: "seo_description",
        seo_keyword: "seo_keywork", // Note: API might have typo
        status: "status",
        total_project: "total_project",
        total_project_withus: "total_project_withus",
      };

      Object.keys(fieldMapping).forEach((key) => {
        const value = form[key];
        if (value !== null && value !== undefined && value !== "") {
          formData.append(fieldMapping[key], value);
        }
      });

      // Add logo if uploaded
      if (logo) {
        formData.append("image", logo);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/developers`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success(
          response.data.message || "Developer created successfully!"
        );
        setTimeout(() => {
          router.push("/admin/developers");
        }, 1000);
      } else {
        throw new Error(response.data.message || "Failed to create developer");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.dismiss(loadingToast);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logoutAll();
        window.location.href = "/admin/login";
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create developer. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==================== SEO CALCULATIONS ====================
  const descriptionText = utils.stripHtml(form.informations || "");
  const descriptionWordCount = utils.countWords(descriptionText);

  const seoChecks = [
    {
      label: "Add Focus Keyword to the SEO title.",
      passed:
        form.seo_keyword &&
        form.seo_title.toLowerCase().includes(form.seo_keyword.toLowerCase()),
    },
    {
      label: "Add Focus Keyword to your SEO Meta Description.",
      passed:
        form.seo_keyword &&
        form.seo_description
          .toLowerCase()
          .includes(form.seo_keyword.toLowerCase()),
    },
    {
      label: "Use Focus Keyword in the URL.",
      passed:
        form.seo_keyword &&
        form.seo_slug.toLowerCase().includes(form.seo_keyword.toLowerCase()),
    },
    {
      label: "Use Focus Keyword in the content.",
      passed:
        form.seo_keyword &&
        descriptionText.toLowerCase().includes(form.seo_keyword.toLowerCase()),
    },
    {
      label: `Content is ${descriptionWordCount} words long. Consider using at least 100 words.`,
      passed: descriptionWordCount >= 100,
    },
  ];

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
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  // ==================== RENDER ====================
  return (
    <>
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-[#f5f5f5] pt-14 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-800">
              Add Developer
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/admin/developers")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-green-600 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {loading ? "Saving..." : "Save Developer"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-300 mb-4">
            <div className="flex text-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 border border-gray-300 border-b-0 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? "bg-white font-medium text-gray-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="flex-1 border-b border-gray-300" />
            </div>
          </div>

          {/* DETAILS TAB */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(260px,1fr)] gap-6">
              {/* LEFT: Developer Details */}
              <div className="border border-gray-300 bg-white">
                <div className="px-4 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800">
                  Developer Details
                </div>

                <div className="p-4 space-y-3">
                  {/* Name */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">
                      Name of the Developer{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter developer name"
                        className={`w-full px-2 py-1.5 text-sm border ${
                          errors.name ? "border-red-300" : "border-gray-300"
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Year Established */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">
                      Year Established
                    </label>
                    <input
                      type="text"
                      value={form.year_established}
                      onChange={(e) =>
                        handleChange("year_established", e.target.value)
                      }
                      placeholder="e.g., 2010"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Country */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">Country</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      placeholder="e.g., UAE, India"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Website */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">Website</label>
                    <div>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) =>
                          handleChange("website", e.target.value)
                        }
                        placeholder="https://example.com"
                        className={`w-full px-2 py-1.5 text-sm border ${
                          errors.website ? "border-red-300" : "border-gray-300"
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {errors.website && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.website}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Responsible Agent */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">
                      Responsible Agent
                    </label>
                    <div>
                      <select
                        value={form.responsible_agent}
                        onChange={(e) =>
                          handleChange("responsible_agent", e.target.value)
                        }
                        disabled={agentsLoading}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="">
                          {agentsLoading
                            ? "Loading agents..."
                            : "Select an agent"}
                        </option>
                        {agents.map((agent) => {
                          const agentName =
                            agent.full_name ||
                            agent.name ||
                            `${agent.first_name || ""} ${agent.last_name || ""}`.trim();
                          return (
                            <option key={agent.id} value={agent.id}>
                              {agentName} {agent.email ? `(${agent.email})` : ""}
                            </option>
                          );
                        })}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {agents.length} agents available
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">Email</label>
                    <div>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="developer@example.com"
                        className={`w-full px-2 py-1.5 text-sm border ${
                          errors.email ? "border-red-300" : "border-gray-300"
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">Mobile</label>
                    <input
                      type="text"
                      value={form.mobile}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Address */}
                  <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">Address</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Enter address"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description / Informations */}
                  <div className="pt-4">
                    <div className="inline-block bg-purple-700 text-white text-xs font-semibold px-2 py-1 mb-2">
                      Description / About
                    </div>
                    <div className="border border-gray-300">
                      <TextEditor
                        value={form.informations}
                        onChange={(value) =>
                          handleChange("informations", value)
                        }
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {descriptionWordCount} words
                    </p>
                  </div>

                  {/* Status */}
                  <div className="pt-2 grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] items-center gap-3">
                    <label className="text-xs text-gray-700">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        handleChange("status", Number(e.target.value))
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* RIGHT: Logo + SEO */}
              <div className="space-y-4">
                {/* Developer Logo */}
                <div className="border border-gray-300 bg-white">
                  <div className="px-4 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800">
                    Developer Logo
                  </div>
                  <div className="p-4 text-xs text-gray-600 space-y-2">
                    <p>Recommended: 482W x 334H pixels</p>
                    <p>Max File Size: 5MB</p>
                    <p>Allowed: JPG, PNG, WebP</p>

                    {logoPreview ? (
                      <div className="relative mt-2">
                        <div className="w-full h-40 bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label className="flex flex-col items-center justify-center h-36 border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">
                            Click to Upload
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {logoPreview && (
                      <label className="mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors">
                        <Upload className="w-3 h-3" />
                        Change Logo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* SEO Title */}
                <div className="border border-gray-300 bg-gray-100">
                  <div className="px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      SEO Title
                    </span>
                    <span className="text-xs text-gray-500">
                      {form.seo_title.length} / 60
                    </span>
                  </div>
                  <div className="p-4">
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) =>
                        handleChange("seo_title", e.target.value)
                      }
                      maxLength={60}
                      placeholder="Enter SEO title"
                      className="w-full px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Appears in search results as the page title.
                    </p>
                  </div>
                </div>

                {/* Permalink / Slug */}
                <div className="border border-gray-300 bg-gray-100">
                  <div className="px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Permalink <span className="text-red-500">*</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {form.seo_slug.length} / 75
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-xs text-gray-600 bg-white border border-r-0 border-gray-300">
                        /developers/
                      </span>
                      <input
                        type="text"
                        value={form.seo_slug}
                        onChange={(e) =>
                          handleChange(
                            "seo_slug",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-")
                              .replace(/-+/g, "-")
                          )
                        }
                        maxLength={75}
                        placeholder="developer-slug"
                        className={`flex-1 px-3 py-2 text-sm border border-gray-300 border-l-0 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors.seo_slug ? "border-red-300" : ""
                        }`}
                      />
                    </div>
                    {errors.seo_slug && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.seo_slug}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Unique URL for this developer page.
                    </p>
                  </div>
                </div>

                {/* SEO Description */}
                <div className="border border-gray-300 bg-gray-100">
                  <div className="px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Meta Description
                    </span>
                    <span className="text-xs text-gray-500">
                      {form.seo_description.length} / 160
                    </span>
                  </div>
                  <div className="p-4">
                    <textarea
                      rows={3}
                      maxLength={160}
                      value={form.seo_description}
                      onChange={(e) =>
                        handleChange("seo_description", e.target.value)
                      }
                      placeholder="Enter meta description for search engines"
                      className="w-full px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Appears in search results below the title.
                    </p>
                  </div>
                </div>

                {/* Focus Keyword */}
                <div className="border border-gray-300 bg-gray-100">
                  <div className="px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Focus Keyword
                    </span>
                    <span className="text-xs text-gray-500">
                      {form.seo_keyword.length} / 100
                    </span>
                  </div>
                  <div className="p-4">
                    <input
                      type="text"
                      maxLength={100}
                      value={form.seo_keyword}
                      onChange={(e) =>
                        handleChange("seo_keyword", e.target.value)
                      }
                      placeholder="Enter focus keyword"
                      className="w-full px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Main keyword for SEO optimization.
                    </p>

                    {/* SEO Checklist */}
                    <ul className="mt-3 space-y-1.5">
                      {seoChecks.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-1.5 text-[11px]"
                        >
                          {item.passed ? (
                            <Check className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mt-0.5 text-yellow-600 flex-shrink-0" />
                          )}
                          <span
                            className={
                              item.passed ? "text-green-700" : "text-gray-700"
                            }
                          >
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="border border-gray-300 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Projects */}
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    Total Projects
                  </label>
                  <input
                    type="number"
                    value={form.total_project || ""}
                    onChange={(e) =>
                      handleChange("total_project", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Total Projects With Us */}
                <div>
                  <label className="block text-xs text-gray-700 mb-1">
                    Projects With Us
                  </label>
                  <input
                    type="number"
                    value={form.total_project_withus || ""}
                    onChange={(e) =>
                      handleChange("total_project_withus", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className="border border-gray-300 bg-white p-6 text-center">
              <div className="py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  No Projects Yet
                </h3>
                <p className="text-xs text-gray-500">
                  Projects will appear here after creating the developer.
                </p>
              </div>
            </div>
          )}

          {/* PROPERTIES TAB */}
          {activeTab === "properties" && (
            <div className="border border-gray-300 bg-white p-6 text-center">
              <div className="py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  No Properties Yet
                </h3>
                <p className="text-xs text-gray-500">
                  Properties will appear here after creating the developer.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Missing import
import { Building2, Home } from "lucide-react";