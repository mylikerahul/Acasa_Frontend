// app/admin/jobs/add/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Briefcase,
  MapPin,
  Globe,
  FileText,
  Star,
  Zap,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const JOB_TYPES = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Freelance", label: "Freelance" },
  { value: "Remote", label: "Remote" },
  { value: "Internship", label: "Internship" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

const INITIAL_FORM_DATA = {
  title: "",
  job_title: "",
  description: "",
  sub_title: "",
  sub_description: "",
  about_team: "",
  about_company: "",
  city_name: "",
  responsibilities: "",
  type: "Full-time",
  link: "",
  status: "active",
  slug: "",
  featured: false,
  urgent: false,
  seo_title: "",
  seo_description: "",
  seo_keyword: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "AED",
  experience_min: "",
  experience_max: "",
};

// ==================== MAIN COMPONENT ====================
export default function AddJobPage() {
  const router = useRouter();

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState("basic");

  // ==================== AUTH ====================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getAdminToken();
        if (!token || !isAdminTokenValid() || getCurrentSessionType() !== "admin") {
          logoutAll();
          router.replace("/admin/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          }
        } else {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.userType === "admin") {
            setAdmin({ id: payload.id, name: payload.name, email: payload.email });
            setIsAuthenticated(true);
          } else {
            throw new Error("Not admin");
          }
        }
      } catch (error) {
        logoutAll();
        router.replace("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  // ==================== API HELPER ====================
  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = getAdminToken();
      if (!token) throw new Error("No token");

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
        router.replace("/admin/login");
        throw new Error("Session expired");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      return data;
    },
    [router]
  );

  // ==================== HANDLERS ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    // Auto-generate slug from title
    if (name === "title" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    try {
      setCheckingSlug(true);
      const data = await apiRequest(`/api/v1/jobs/check-slug/${slug}`);
      setSlugAvailable(data.available);
    } catch (err) {
      console.error("Slug check error:", err);
    } finally {
      setCheckingSlug(false);
    }
  };

  // Debounced slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug) {
        checkSlugAvailability(formData.slug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const validate = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.job_title?.trim()) {
      newErrors.job_title = "Job title is required";
    }

    if (!formData.type) {
      newErrors.type = "Job type is required";
    }

    if (formData.slug && slugAvailable === false) {
      newErrors.slug = "This slug is already taken";
    }

    if (formData.salary_min && formData.salary_max) {
      if (Number(formData.salary_min) > Number(formData.salary_max)) {
        newErrors.salary_min = "Minimum salary cannot be greater than maximum";
      }
    }

    if (formData.experience_min && formData.experience_max) {
      if (Number(formData.experience_min) > Number(formData.experience_max)) {
        newErrors.experience_min = "Minimum experience cannot be greater than maximum";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const toastId = toast.loading("Creating job...");

    try {
      setLoading(true);

      // Prepare data
      const submitData = {
        ...formData,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        experience_min: formData.experience_min ? Number(formData.experience_min) : null,
        experience_max: formData.experience_max ? Number(formData.experience_max) : null,
        featured: formData.featured ? 1 : 0,
        urgent: formData.urgent ? 1 : 0,
      };

      await apiRequest("/api/v1/jobs", {
        method: "POST",
        body: JSON.stringify(submitData),
      });

      toast.dismiss(toastId);
      toast.success("Job created successfully!");

      // Redirect to listing
      router.push("/admin/jobs");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      }).catch(() => {});
    } finally {
      logoutAll();
      window.location.href = "/admin/login";
    }
  }, []);

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  const tabs = [
    { id: "basic", label: "Basic Info", icon: FileText },
    { id: "details", label: "Details", icon: Briefcase },
    { id: "seo", label: "SEO", icon: Globe },
  ];

  return (
    <>
      <Toaster position="top-right" />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100">
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/jobs")}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Add New Job</h1>
                <p className="text-sm text-gray-500">Create a new job listing</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/jobs")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Job
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Senior Software Engineer"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      placeholder="e.g., Software Engineer"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.job_title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.job_title && <p className="mt-1 text-sm text-red-500">{errors.job_title}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City / Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="city_name"
                        value={formData.city_name}
                        onChange={handleChange}
                        placeholder="e.g., Dubai"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.type ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slug */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="e.g., senior-software-engineer"
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.slug ? "border-red-500" : slugAvailable === false ? "border-red-500" : slugAvailable === true ? "border-green-500" : "border-gray-300"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        {!checkingSlug && slugAvailable === true && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {!checkingSlug && slugAvailable === false && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                    {slugAvailable === true && (
                      <p className="mt-1 text-sm text-green-600">Slug is available</p>
                    )}
                    {slugAvailable === false && (
                      <p className="mt-1 text-sm text-red-500">Slug is already taken</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Enter job description..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Flags */}
                  <div className="md:col-span-2 flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">Featured Job</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="urgent"
                        checked={formData.urgent}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">Urgent Hiring</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sub Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub Title</label>
                    <input
                      type="text"
                      name="sub_title"
                      value={formData.sub_title}
                      onChange={handleChange}
                      placeholder="Sub title"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Apply Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apply Link</label>
                    <input
                      type="url"
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleChange}
                        placeholder="Min"
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.salary_min ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      <input
                        type="number"
                        name="salary_max"
                        value={formData.salary_max}
                        onChange={handleChange}
                        placeholder="Max"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        name="salary_currency"
                        value={formData.salary_currency}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AED">AED</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    {errors.salary_min && <p className="mt-1 text-sm text-red-500">{errors.salary_min}</p>}
                  </div>

                  {/* Experience Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="experience_min"
                        value={formData.experience_min}
                        onChange={handleChange}
                        placeholder="Min"
                        min="0"
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.experience_min ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      <input
                        type="number"
                        name="experience_max"
                        value={formData.experience_max}
                        onChange={handleChange}
                        placeholder="Max"
                        min="0"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {errors.experience_min && <p className="mt-1 text-sm text-red-500">{errors.experience_min}</p>}
                  </div>

                  {/* Sub Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub Description</label>
                    <textarea
                      name="sub_description"
                      value={formData.sub_description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional description..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Responsibilities */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                      rows={4}
                      placeholder="List job responsibilities..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* About Team */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">About Team</label>
                    <textarea
                      name="about_team"
                      value={formData.about_team}
                      onChange={handleChange}
                      rows={3}
                      placeholder="About the team..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* About Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">About Company</label>
                    <textarea
                      name="about_company"
                      value={formData.about_company}
                      onChange={handleChange}
                      rows={3}
                      placeholder="About the company..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4 p-4 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    SEO settings help your job listing appear in search engine results.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* SEO Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                    <input
                      type="text"
                      name="seo_title"
                      value={formData.seo_title}
                      onChange={handleChange}
                      placeholder="SEO optimized title (60 characters recommended)"
                      maxLength={70}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.seo_title?.length || 0}/70 characters</p>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                    <textarea
                      name="seo_description"
                      value={formData.seo_description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="SEO optimized description (160 characters recommended)"
                      maxLength={200}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.seo_description?.length || 0}/200 characters</p>
                  </div>

                  {/* SEO Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
                    <input
                      type="text"
                      name="seo_keyword"
                      value={formData.seo_keyword}
                      onChange={handleChange}
                      placeholder="Comma separated keywords (e.g., software engineer, dubai, remote)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Separate keywords with commas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => router.push("/admin/jobs")}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Job
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}