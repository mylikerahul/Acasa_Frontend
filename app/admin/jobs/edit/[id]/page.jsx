// app/admin/jobs/[id]/edit/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  FiArrowLeft,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiTrash2,
} from "react-icons/fi";
import { Loader2, Search, Info, RotateCcw, ExternalLink } from "lucide-react";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { id: "details", label: "Job Details", icon: Info },
  { id: "seo", label: "SEO", icon: Search },
];

const JOB_TYPES = ["Remote", "Full-time", "Part-time", "Contract", "Freelance"];
const STATUS_OPTIONS = ["active", "inactive", "closed"];

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id;

  // Auth state
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Job state
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    sub_title: "",
    sub_description: "",
    job_title: "",
    city_name: "",
    job_type: "Full-time",
    about_team: "",
    about_company: "",
    responsibilities: "",
    other_facility: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    status: "active",
    seo_title: "",
    seo_permalink: "",
    seo_description: "",
    focus_keyword: "",
  });

  const [originalForm, setOriginalForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fast navigate helper
  const fastNavigate = (path) => {
    router.push(path);
  };

  // Auth verification
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
            setAdmin({
              id: payload.id,
              name: payload.name,
              email: payload.email,
              role: payload.role || "admin",
              userType: payload.userType,
            });
            setIsAuthenticated(true);
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

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        toast.error("Job ID is missing");
        router.push("/admin/jobs");
        return;
      }

      if (!isAuthenticated) return;

      setJobLoading(true);

      try {
        const token = getAdminToken();
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch job");
        }

        const data = await response.json();

        if (data.success && data.job) {
          setJob(data.job);
        } else {
          throw new Error("Job not found");
        }
      } catch (error) {
        toast.error(error.message || "Failed to load job");
        setJob(null);
      } finally {
        setJobLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchJob();
    }
  }, [jobId, isAuthenticated, router]);

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      const formData = {
        title: job.title || "",
        description: job.description || "",
        sub_title: job.sub_title || "",
        sub_description: job.sub_description || "",
        job_title: job.job_title || "",
        city_name: job.city_name || "",
        job_type: job.job_type || "Full-time",
        about_team: job.about_team || "",
        about_company: job.about_company || "",
        responsibilities: job.responsibilities || "",
        other_facility: job.other_facility || "",
        facebook: job.facebook || "",
        linkedin: job.linkedin || "",
        twitter: job.twitter || "",
        status: job.status || "active",
        seo_title: job.seo_title || "",
        seo_permalink: job.seo_permalink || job.slug || "",
        seo_description: job.seo_description || "",
        focus_keyword: job.focus_keyword || "",
      };
      setForm(formData);
      setOriginalForm(formData);
    }
  }, [job]);

  // Track changes
  useEffect(() => {
    if (originalForm) {
      const changed = JSON.stringify(form) !== JSON.stringify(originalForm);
      setHasChanges(changed);
    }
  }, [form, originalForm]);

  // Handle form change
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!form.job_title.trim()) {
      newErrors.job_title = "Job title is required";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 50) {
      newErrors.description = "Description should be at least 50 characters";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setActiveTab("details");
    }

    return Object.keys(newErrors).length === 0;
  };

  // Update job API call
  const updateJobAPI = async (jobData) => {
    const token = getAdminToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update job");
    }

    return response.json();
  };

  // Delete job API call
  const deleteJobAPI = async () => {
    const token = getAdminToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete job");
    }

    return response.json();
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!jobId) {
      toast.error("Job ID is missing");
      return;
    }

    setUpdateLoading(true);

    try {
      // Prepare job data
      const jobData = {
        title: form.title.trim(),
        description: form.description.trim(),
        sub_title: form.sub_title.trim() || null,
        sub_description: form.sub_description.trim() || null,
        job_title: form.job_title.trim(),
        city_name: form.city_name.trim() || null,
        job_type: form.job_type,
        about_team: form.about_team.trim() || null,
        about_company: form.about_company.trim() || null,
        responsibilities: form.responsibilities.trim() || null,
        other_facility: form.other_facility.trim() || null,
        facebook: form.facebook.trim() || null,
        linkedin: form.linkedin.trim() || null,
        twitter: form.twitter.trim() || null,
        status: form.status,
        seo_title: form.seo_title.trim() || null,
        seo_permalink: form.seo_permalink.trim() || null,
        seo_description: form.seo_description.trim() || null,
        focus_keyword: form.focus_keyword.trim() || null,
      };

      await updateJobAPI(jobData);
      toast.success("Job updated successfully!");
      router.push("/admin/jobs");
    } catch (error) {
      toast.error(error.message || "Failed to update job");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle reset form
  const handleReset = () => {
    if (originalForm) {
      setForm(originalForm);
      setErrors({});
      toast.success("Form reset to original values");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      await deleteJobAPI();
      toast.success("Job deleted successfully!");
      setShowDeleteModal(false);
      router.push("/admin/jobs");
    } catch (error) {
      toast.error(error.message || "Failed to delete job");
    } finally {
      setDeleteLoading(false);
    }
  };

  // SEO Checks
  const seoChecks = [
    {
      label: "Add Focus Keyword to the SEO title",
      passed:
        form.focus_keyword &&
        form.seo_title.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Add Focus Keyword to your SEO Meta Description",
      passed:
        form.focus_keyword &&
        form.seo_description
          .toLowerCase()
          .includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Use Focus Keyword in the URL",
      passed:
        form.focus_keyword &&
        form.seo_permalink
          .toLowerCase()
          .includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Use Focus Keyword in the content",
      passed:
        form.focus_keyword &&
        form.description
          .toLowerCase()
          .includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: `Content is ${
        form.description.split(/\s+/).filter(Boolean).length
      } words long. Consider using at least 600 words.`,
      passed: form.description.split(/\s+/).filter(Boolean).length >= 600,
    },
  ];

  const passedChecks = seoChecks.filter((c) => c.passed).length;
  const seoScore = Math.round((passedChecks / seoChecks.length) * 100);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Job loading state
  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar admin={admin} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading job...</p>
          </div>
        </div>
      </div>
    );
  }

  // Job not found state
  if (!job && !jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar admin={admin} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Job not found
            </p>
            <p className="text-sm text-gray-500 mb-4">
              The job you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push("/admin/jobs")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Toaster position="top-right" />

      {/* Admin Navbar */}
      <AdminNavbar admin={admin} />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Job</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete this job?
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4 p-3 bg-gray-50 rounded-lg">
              "{form.title}"
            </p>
            <p className="text-xs text-red-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Job Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    form.status === "active"
                      ? "bg-green-100 text-green-800"
                      : form.status === "closed"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {form.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {form.job_type}
                </span>
                {form.city_name && (
                  <span className="text-sm text-gray-500">{form.city_name}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {form.title || "Job Title"}
              </h1>
              {form.sub_title && (
                <p className="text-lg text-gray-600 mb-4">{form.sub_title}</p>
              )}
              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {form.description || "Job description will appear here..."}
              </p>

              {form.responsibilities && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Responsibilities
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {form.responsibilities}
                  </p>
                </div>
              )}

              {form.about_team && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    About the Team
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {form.about_team}
                  </p>
                </div>
              )}

              {form.about_company && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    About Company
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {form.about_company}
                  </p>
                </div>
              )}

              {form.other_facility && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Benefits & Facilities
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {form.other_facility}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/jobs")}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Edit Job
                </h1>
                {hasChanges && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ID: {jobId} • Last updated:{" "}
                {job?.updated_at
                  ? new Date(job.updated_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={updateLoading || deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={handleReset}
                disabled={updateLoading || !hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={updateLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <FiEye className="w-4 h-4" />
                Preview
              </button>
              {job?.slug && (
                <a
                  href={`/jobs/${job.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live
                </a>
              )}
              <button
                onClick={handleSubmit}
                disabled={updateLoading || !hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {updateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                Update Job
              </button>
            </div>
          </div>
        </div>

        {/* Job Stats */}
        {job && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Views</p>
              <p className="text-xl font-semibold text-gray-900">
                {job.views || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Status</p>
              <p
                className={`text-xl font-semibold ${
                  job.status === "active"
                    ? "text-green-600"
                    : job.status === "closed"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {job.created_at
                  ? new Date(job.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">SEO Score</p>
              <p
                className={`text-xl font-semibold ${
                  seoScore >= 80
                    ? "text-green-600"
                    : seoScore >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {seoScore}%
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "seo" && form.focus_keyword && (
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        seoScore >= 80
                          ? "bg-green-100 text-green-700"
                          : seoScore >= 50
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {seoScore}%
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleChange("status", status)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          form.status === status
                            ? status === "active"
                              ? "bg-green-100 border-green-300 text-green-800"
                              : status === "inactive"
                              ? "bg-gray-100 border-gray-300 text-gray-800"
                              : "bg-red-100 border-red-300 text-red-800"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Sub Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                        errors.title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter title"
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sub Title
                    </label>
                    <input
                      type="text"
                      value={form.sub_title}
                      onChange={(e) =>
                        handleChange("sub_title", e.target.value)
                      }
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="Enter sub title"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={6}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none ${
                      errors.description
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Write job description..."
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.description ? (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" />
                        {errors.description}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <p className="text-xs text-gray-500">
                      {form.description.split(/\s+/).filter(Boolean).length}{" "}
                      words
                    </p>
                  </div>
                </div>

                {/* Sub Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sub Description
                  </label>
                  <textarea
                    value={form.sub_description}
                    onChange={(e) =>
                      handleChange("sub_description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                    placeholder="Additional description..."
                  />
                </div>

                {/* Job Title, City, Job Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.job_title}
                      onChange={(e) =>
                        handleChange("job_title", e.target.value)
                      }
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                        errors.job_title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="e.g. Senior Developer"
                    />
                    {errors.job_title && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" />
                        {errors.job_title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      City Name
                    </label>
                    <input
                      type="text"
                      value={form.city_name}
                      onChange={(e) =>
                        handleChange("city_name", e.target.value)
                      }
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="e.g. Dubai"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Job Type
                    </label>
                    <select
                      value={form.job_type}
                      onChange={(e) => handleChange("job_type", e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* About the Team */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    About the Team
                  </label>
                  <textarea
                    value={form.about_team}
                    onChange={(e) => handleChange("about_team", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                    placeholder="Describe the team..."
                  />
                </div>

                {/* About Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    About Company
                  </label>
                  <textarea
                    value={form.about_company}
                    onChange={(e) =>
                      handleChange("about_company", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                    placeholder="About the company..."
                  />
                </div>

                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Responsibilities
                  </label>
                  <textarea
                    value={form.responsibilities}
                    onChange={(e) =>
                      handleChange("responsibilities", e.target.value)
                    }
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                    placeholder="List job responsibilities..."
                  />
                </div>

                {/* Other Facility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Benefits & Facilities
                  </label>
                  <textarea
                    value={form.other_facility}
                    onChange={(e) =>
                      handleChange("other_facility", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                    placeholder="Benefits, perks, etc..."
                  />
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Social Media Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={form.facebook}
                        onChange={(e) =>
                          handleChange("facebook", e.target.value)
                        }
                        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={form.linkedin}
                        onChange={(e) =>
                          handleChange("linkedin", e.target.value)
                        }
                        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={form.twitter}
                        onChange={(e) =>
                          handleChange("twitter", e.target.value)
                        }
                        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* SEO Title */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        SEO Title
                      </label>
                      <span
                        className={`text-xs ${
                          form.seo_title.length > 60
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {form.seo_title.length} / 60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) =>
                        handleChange("seo_title", e.target.value)
                      }
                      maxLength={60}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="SEO title..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This appears as the title in search engine results.
                    </p>
                  </div>

                  {/* Permalink */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Permalink / Slug
                      </label>
                      <span
                        className={`text-xs ${
                          form.seo_permalink.length > 75
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {form.seo_permalink.length} / 75
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="h-10 px-3 flex items-center text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg">
                        /jobs/
                      </span>
                      <input
                        type="text"
                        value={form.seo_permalink}
                        onChange={(e) =>
                          handleChange(
                            "seo_permalink",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^\w\s-]/g, "")
                              .replace(/[\s_-]+/g, "-")
                          )
                        }
                        maxLength={75}
                        className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="job-title-slug"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The URL-friendly version of the title.
                    </p>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Meta Description
                      </label>
                      <span
                        className={`text-xs ${
                          form.seo_description.length > 160
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {form.seo_description.length} / 160
                      </span>
                    </div>
                    <textarea
                      value={form.seo_description}
                      onChange={(e) =>
                        handleChange("seo_description", e.target.value)
                      }
                      maxLength={160}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                      placeholder="SEO description..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This appears below the title in search results.
                    </p>
                  </div>

                  {/* Focus Keyword */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Focus Keyword
                      </label>
                      <span className="text-xs text-gray-500">
                        {form.focus_keyword.length} / 100
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.focus_keyword}
                      onChange={(e) =>
                        handleChange("focus_keyword", e.target.value)
                      }
                      maxLength={100}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="e.g. senior developer job"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The main keyword you want this page to rank for.
                    </p>
                  </div>

                  {/* Search Preview */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">
                      Search Preview
                    </h4>
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                        {form.seo_title || form.title || "Page Title"}
                      </p>
                      <p className="text-green-700 text-sm truncate">
                        yourwebsite.com/jobs/{form.seo_permalink || "page-url"}
                      </p>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {form.seo_description ||
                          form.description?.slice(0, 160) ||
                          "Page description will appear here..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SEO Checklist */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        SEO Score
                      </h3>
                      <span
                        className={`text-lg font-bold ${
                          seoScore >= 80
                            ? "text-green-600"
                            : seoScore >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {seoScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          seoScore >= 80
                            ? "bg-green-500"
                            : seoScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${seoScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      SEO Checklist
                    </h3>
                    <div className="space-y-3">
                      {seoChecks.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          {item.passed ? (
                            <FiCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          )}
                          <span
                            className={`text-xs leading-relaxed ${
                              item.passed ? "text-green-700" : "text-yellow-700"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!form.focus_keyword && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-700">
                        💡 Add a focus keyword to see SEO recommendations
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasChanges && (
                <span className="text-sm text-yellow-600 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  You have unsaved changes
                </span>
              )}
              {Object.keys(errors).length > 0 && (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {Object.keys(errors).length} error(s) found
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/jobs")}
                disabled={updateLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateLoading || !hasChanges}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Update Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}