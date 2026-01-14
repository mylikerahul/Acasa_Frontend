// app/admin/jobs/edit/[id]/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Eye,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth";

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
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
];

// ==================== MAIN COMPONENT ====================
export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState("basic");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // ==================== FETCH JOB ====================
  useEffect(() => {
    const fetchJob = async () => {
      if (!isAuthenticated || !jobId) return;

      try {
        setFetchLoading(true);
        const data = await apiRequest(`/api/v1/jobs/id/${jobId}`);

        if (data.success && data.data) {
          const job = data.data;
          // Parse JSON fields if needed
          const formattedJob = {
            ...job,
            featured: job.featured === 1 || job.featured === true,
            urgent: job.urgent === 1 || job.urgent === true,
            salary_min: job.salary_min || "",
            salary_max: job.salary_max || "",
            experience_min: job.experience_min || "",
            experience_max: job.experience_max || "",
          };
          setFormData(formattedJob);
          setOriginalData(formattedJob);
        } else {
          throw new Error("Job not found");
        }
      } catch (err) {
        toast.error(err.message || "Failed to load job");
        router.push("/admin/jobs");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchJob();
  }, [isAuthenticated, jobId, apiRequest, router]);

  // ==================== HANDLERS ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 3 || slug === originalData?.slug) {
      setSlugAvailable(null);
      return;
    }

    try {
      setCheckingSlug(true);
      const data = await apiRequest(`/api/v1/jobs/check-slug/${slug}?exclude_id=${jobId}`);
      setSlugAvailable(data.available);
    } catch (err) {
      console.error("Slug check error:", err);
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => {
    if (!formData?.slug || formData.slug === originalData?.slug) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      checkSlugAvailability(formData.slug);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData?.slug, originalData?.slug]);

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

    if (formData.slug && formData.slug !== originalData?.slug && slugAvailable === false) {
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

    const toastId = toast.loading("Updating job...");

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        experience_min: formData.experience_min ? Number(formData.experience_min) : null,
        experience_max: formData.experience_max ? Number(formData.experience_max) : null,
        featured: formData.featured ? 1 : 0,
        urgent: formData.urgent ? 1 : 0,
      };

      await apiRequest(`/api/v1/jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(submitData),
      });

      toast.dismiss(toastId);
      toast.success("Job updated successfully!");

      router.push("/admin/jobs");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const toastId = toast.loading("Deleting job...");

    try {
      setDeleteLoading(true);
      await apiRequest(`/api/v1/jobs/${jobId}`, { method: "DELETE" });

      toast.dismiss(toastId);
      toast.success("Job deleted successfully!");
      router.push("/admin/jobs");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to delete job");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
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

  const hasChanges = () => {
    if (!formData || !originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  // ==================== LOADING STATE ====================
  if (authLoading || fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">
            {authLoading ? "Verifying authentication..." : "Loading job..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin || !formData) return null;

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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Job</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100">
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/jobs")}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit Job</h1>
                <p className="text-sm text-gray-500">ID: #{jobId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {formData.slug && (
                <a
                  href={`/jobs/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !hasChanges()}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border mb-6">
            <div className="flex border-b">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title || ""}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.job_title ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="e.g., Senior Frontend Developer"
                      />
                      {errors.job_title && (
                        <p className="mt-1 text-sm text-red-600">{errors.job_title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        value={formData.type || ""}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.type ? "border-red-300" : "border-gray-300"
                        }`}
                      >
                        <option value="">Select type</option>
                        {JOB_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Remote, Dubai, UAE"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug || ""}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.slug ? "border-red-300" : "border-gray-300"
                          }`}
                          placeholder="auto-generated-from-title"
                        />
                        {checkingSlug && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          </div>
                        )}
                        {slugAvailable === true && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                        {slugAvailable === false && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-red-600">
                            <X className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                      <p className="mt-1 text-xs text-gray-500">
                        Leave empty to auto-generate from title
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      name="title"
                      value={formData.title || ""}
                      onChange={handleChange}
                      rows={3}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.title ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Brief description (appears in listings)"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Salary (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          name="salary_min"
                          value={formData.salary_min || ""}
                          onChange={handleChange}
                          min="0"
                          className={`w-full pl-8 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.salary_min ? "border-red-300" : "border-gray-300"
                          }`}
                          placeholder="0"
                        />
                      </div>
                      {errors.salary_min && (
                        <p className="mt-1 text-sm text-red-600">{errors.salary_min}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Salary (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          name="salary_max"
                          value={formData.salary_max || ""}
                          onChange={handleChange}
                          min="0"
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Experience (years)
                      </label>
                      <input
                        type="number"
                        name="experience_min"
                        value={formData.experience_min || ""}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.experience_min ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="0"
                      />
                      {errors.experience_min && (
                        <p className="mt-1 text-sm text-red-600">{errors.experience_min}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Experience (years)
                      </label>
                      <input
                        type="number"
                        name="experience_max"
                        value={formData.experience_max || ""}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">Flags</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured || false}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">Featured</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            name="urgent"
                            checked={formData.urgent || false}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Urgent</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        value={formData.deadline || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      rows={8}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Detailed job description, requirements, benefits..."
                    />
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === "seo" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      name="seo_title"
                      value={formData.seo_title || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO optimized title for search engines"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {formData.seo_title?.length || 0}/60 characters
                      </p>
                      <p className="text-xs text-gray-500">Recommended: 50-60 characters</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      name="seo_description"
                      value={formData.seo_description || ""}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="SEO meta description for search engines"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {formData.seo_description?.length || 0}/160 characters
                      </p>
                      <p className="text-xs text-gray-500">Recommended: 150-160 characters</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      name="seo_keyword"
                      value={formData.seo_keyword || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="comma, separated, keywords"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate keywords with commas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Status */}
          {hasChanges() && (
            <div className="fixed bottom-6 right-6">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                <Info className="w-5 h-5" />
                <span className="text-sm font-medium">You have unsaved changes</span>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="ml-2 px-4 py-1.5 bg-white text-blue-600 text-sm font-medium rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}