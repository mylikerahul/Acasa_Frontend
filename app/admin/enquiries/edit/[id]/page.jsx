"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
  X,
  User,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Calendar,
  FileText,
  Upload,
  Flame,
  Thermometer,
  Snowflake,
  RefreshCw,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { getAdminToken, isAdminTokenValid } from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== AUTH HELPERS ====================
const getCurrentSessionType = () => {
  if (typeof window === "undefined") return null;
  const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  if (adminToken) return "admin";
  return null;
};

const logoutAll = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("userToken");
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("userToken");
};

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = ["New", "In Progress", "Contacted", "Qualified", "Lost", "Converted"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const QUALITY_OPTIONS = ["Hot", "Warm", "Cold"];
const LEAD_STATUS_OPTIONS = ["New", "Follow Up", "Meeting", "Negotiation", "Closed"];
const TYPE_OPTIONS = ["Buy", "Rent", "Sell", "Investment", "General Inquiry"];
const SOURCE_OPTIONS = ["Website", "Phone", "Email", "WhatsApp", "Social Media", "Referral", "Walk-in", "Other"];
const LISTING_TYPE_OPTIONS = ["Sale", "Rent", "Off Plan", "Ready"];
const CONTACT_TYPE_OPTIONS = ["Phone", "Email", "WhatsApp", "Meeting", "Video Call"];

// ==================== INITIAL FORM DATA ====================
const INITIAL_FORM_DATA = {
  contact_id: "",
  contact_type: "",
  contact_source: "",
  contact_date: "",
  type: "",
  source: "",
  item_type: "",
  message: "",
  property_id: "",
  project_id: "",
  project_item_id: "",
  listing_type: "",
  exclusive_status: "",
  construction_status: "",
  country: "",
  state_id: "",
  community_id: "",
  sub_community_id: "",
  building: "",
  price_min: "",
  price_max: "",
  bedroom_min: "",
  bedroom_max: "",
  status: "New",
  priority: "",
  quality: "",
  lead_status: "",
  lost_status: "",
  agent_id: "",
  agent_activity: "",
  admin_activity: "",
  lead_source: "",
  drip_marketing: 0,
};

// ==================== COMMON STYLES ====================
const labelCls = "text-sm text-gray-700";
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const fieldErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const selectCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800";
const boxBodyCls = "p-3";

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: { background: "#10B981", color: "#fff", fontWeight: "500" },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: { background: "#EF4444", color: "#fff", fontWeight: "500" },
  });
};

const showLoadingToast = (message) => toast.loading(message, { position: "top-right" });

// ==================== QUALITY SELECTOR ====================
function QualitySelector({ value, onChange }) {
  const options = [
    { value: "Hot", icon: Flame, color: "bg-red-100 text-red-800 border-red-300", activeColor: "bg-red-500 text-white" },
    { value: "Warm", icon: Thermometer, color: "bg-orange-100 text-orange-800 border-orange-300", activeColor: "bg-orange-500 text-white" },
    { value: "Cold", icon: Snowflake, color: "bg-blue-100 text-blue-800 border-blue-300", activeColor: "bg-blue-500 text-white" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium transition-colors ${
            value === opt.value ? opt.activeColor : opt.color
          }`}
        >
          <opt.icon className="w-4 h-4" />
          {opt.value}
        </button>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function EditEnquiryPage() {
  const params = useParams();
  const enquiryId = params?.id;

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Page state
  const [pageLoading, setPageLoading] = useState(true);
  const [enquiryNotFound, setEnquiryNotFound] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Files
  const [existingPropertyImage, setExistingPropertyImage] = useState(null);
  const [existingResume, setExistingResume] = useState(null);
  const [propertyImage, setPropertyImage] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  // ==================== AUTHENTICATION ====================
  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();
      if (sessionType !== "admin") {
        showError("Please login as admin");
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
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.userType !== "admin") {
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
        handleAuthFailure();
      }
    } catch (error) {
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll();
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // ==================== FETCH ENQUIRY DATA ====================
  const fetchEnquiry = useCallback(async () => {
    if (!enquiryId) {
      setEnquiryNotFound(true);
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/enquiries/${enquiryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Enquiry not found");
      }

      const enquiry = result.data;

      // Map enquiry data to form data
      const mappedData = { ...INITIAL_FORM_DATA };
      Object.keys(mappedData).forEach((key) => {
        if (enquiry[key] !== undefined && enquiry[key] !== null) {
          mappedData[key] = enquiry[key];
        }
      });

      // Handle date formatting
      if (enquiry.contact_date) {
        mappedData.contact_date = enquiry.contact_date.split("T")[0];
      }

      setFormData(mappedData);
      setOriginalData(mappedData);

      // Set existing files
      if (enquiry.property_image) {
        setExistingPropertyImage(enquiry.property_image);
      }
      if (enquiry.resume) {
        setExistingResume(enquiry.resume);
      }

      setEnquiryNotFound(false);
    } catch (err) {
      console.error("Fetch enquiry error:", err);
      showError(err.message || "Failed to load enquiry");
      setEnquiryNotFound(true);
    } finally {
      setPageLoading(false);
    }
  }, [enquiryId]);

  // Check for changes
  useEffect(() => {
    if (originalData) {
      const changed =
        JSON.stringify(formData) !== JSON.stringify(originalData) ||
        propertyImage !== null ||
        resumeFile !== null;
      setHasChanges(changed);
    }
  }, [formData, originalData, propertyImage, resumeFile]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && enquiryId) {
      fetchEnquiry();
    }
  }, [isAuthenticated, enquiryId, fetchEnquiry]);

  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (value && errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleFileUpload = useCallback((e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        showError("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError("Image size should be less than 10MB");
        return;
      }
      setPropertyImage(file);
      showSuccess("Image selected");
    } else if (type === "resume") {
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        showError("Please select a PDF or Word document");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError("File size should be less than 10MB");
        return;
      }
      setResumeFile(file);
      showSuccess("File selected");
    }

    e.target.value = "";
  }, []);

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = useCallback(async () => {
    setSaving(true);
    const saveToastId = showLoadingToast("Updating enquiry...");

    try {
      const fd = new FormData();

      // Append form fields
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, value);
        }
      });

      // Append files
      if (propertyImage) {
        fd.append("property_image", propertyImage);
      }
      if (resumeFile) {
        fd.append("resume", resumeFile);
      }

      const token = getAdminToken();
      if (!token) {
        showError("Please login to continue");
        handleAuthFailure();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/enquiries/update/${enquiryId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      toast.dismiss(saveToastId);

      if (result.success) {
        showSuccess("Enquiry updated successfully!");
        setOriginalData(formData);
        setPropertyImage(null);
        setResumeFile(null);
        setHasChanges(false);

        // Refresh data
        setTimeout(() => {
          fetchEnquiry();
        }, 1000);
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || "Failed to update enquiry");
    } finally {
      setSaving(false);
    }
  }, [formData, enquiryId, propertyImage, resumeFile, handleAuthFailure, fetchEnquiry]);

  // ==================== UTILITY FUNCTIONS ====================
  const resetForm = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      if (originalData) {
        setFormData(originalData);
      }
      setPropertyImage(null);
      setResumeFile(null);
      setErrors({});
      setTouched({});
      showSuccess("Form reset to original values");
    }
  }, [originalData]);

  const getFieldClass = useCallback(
    (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
      return errors[field] && touched[field] ? errorClass : baseClass;
    },
    [errors, touched]
  );

  // ==================== LOADING STATES ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (pageLoading) {
    return (
      <>
        <Toaster />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="max-w-[1250px] mx-auto px-3">
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-4 text-gray-600 font-medium">Loading enquiry...</p>
                <p className="mt-2 text-gray-400 text-sm">Enquiry ID: {enquiryId}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (enquiryNotFound) {
    return (
      <>
        <Toaster />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="max-w-[1250px] mx-auto px-3">
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Enquiry Not Found</h2>
                <p className="text-gray-600 mb-6">The enquiry with ID "{enquiryId}" could not be found.</p>
                <button
                  onClick={() => (window.location.href = "/admin/enquiries")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Enquiries
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} gutter={8} />

      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="max-w-[1250px] mx-auto px-3">
          {/* Top Control Bar */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  Edit Enquiry
                  <span className="text-sm font-normal text-gray-500 ml-2">#{enquiryId}</span>
                </h1>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-700" />
                </button>

                {hasChanges && (
                  <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    Unsaved changes
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchEnquiry}
                  disabled={pageLoading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${pageLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            <div className="p-3">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="grid grid-cols-12 gap-3">
                  {/* LEFT COLUMN */}
                  <div className="col-span-12 md:col-span-4 space-y-3">
                    {/* Status & Priority */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Status & Priority</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-3">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Status</label>
                            <select
                              className={selectCls}
                              value={formData.status}
                              onChange={(e) => handleChange("status", e.target.value)}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Priority</label>
                            <select
                              className={selectCls}
                              value={formData.priority}
                              onChange={(e) => handleChange("priority", e.target.value)}
                            >
                              <option value="">Select Priority</option>
                              {PRIORITY_OPTIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-2`}>Lead Quality</label>
                            <QualitySelector
                              value={formData.quality}
                              onChange={(val) => handleChange("quality", val)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Lead Status</label>
                            <select
                              className={selectCls}
                              value={formData.lead_status}
                              onChange={(e) => handleChange("lead_status", e.target.value)}
                            >
                              <option value="">Select Lead Status</option>
                              {LEAD_STATUS_OPTIONS.map((ls) => (
                                <option key={ls} value={ls}>{ls}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.drip_marketing === 1}
                                onChange={(e) => handleChange("drip_marketing", e.target.checked ? 1 : 0)}
                                className="w-4 h-4 rounded"
                              />
                              Enable Drip Marketing
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enquiry Type & Source */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Enquiry Details</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-3">
                          <div>
                            <label className={`${labelRequiredCls} block mb-1`}>Enquiry Type</label>
                            <select
                              className={selectCls}
                              value={formData.type}
                              onChange={(e) => handleChange("type", e.target.value)}
                            >
                              <option value="">Select Type</option>
                              {TYPE_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelRequiredCls} block mb-1`}>Source</label>
                            <select
                              className={selectCls}
                              value={formData.source}
                              onChange={(e) => handleChange("source", e.target.value)}
                            >
                              <option value="">Select Source</option>
                              {SOURCE_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Item Type</label>
                            <input
                              className={fieldCls}
                              value={formData.item_type}
                              onChange={(e) => handleChange("item_type", e.target.value)}
                              placeholder="e.g., Property, Project"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Lead Source</label>
                            <input
                              className={fieldCls}
                              value={formData.lead_source}
                              onChange={(e) => handleChange("lead_source", e.target.value)}
                              placeholder="e.g., Google Ads, Facebook"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agent Assignment */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Agent Assignment</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-3">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Agent ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.agent_id}
                              onChange={(e) => handleChange("agent_id", e.target.value)}
                              placeholder="Enter agent ID"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Agent Activity</label>
                            <textarea
                              className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                              rows={2}
                              value={formData.agent_activity}
                              onChange={(e) => handleChange("agent_activity", e.target.value)}
                              placeholder="Agent notes..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Admin Activity</label>
                            <textarea
                              className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                              rows={2}
                              value={formData.admin_activity}
                              onChange={(e) => handleChange("admin_activity", e.target.value)}
                              placeholder="Admin notes..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File Uploads */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Attachments</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-3">
                          {/* Property Image */}
                          <div>
                            <label className={`${labelCls} block mb-2`}>Property Image</label>
                            {existingPropertyImage && !propertyImage && (
                              <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
                                <span>Current: {existingPropertyImage.split('/').pop()}</span>
                              </div>
                            )}
                            {propertyImage && (
                              <div className="mb-2 relative">
                                <img
                                  src={URL.createObjectURL(propertyImage)}
                                  alt="Property"
                                  className="w-full h-32 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPropertyImage(null)}
                                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <label className="flex items-center justify-center h-9 border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm text-gray-600 rounded">
                              <Upload className="w-4 h-4 mr-1" />
                              {propertyImage || existingPropertyImage ? "Replace Image" : "Upload Image"}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "image")}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Resume/Document */}
                          <div>
                            <label className={`${labelCls} block mb-2`}>Resume/Document</label>
                            {existingResume && !resumeFile && (
                              <div className="mb-2 text-sm text-gray-600">
                                Current: {existingResume.split('/').pop()}
                              </div>
                            )}
                            {resumeFile && (
                              <div className="mb-2 flex items-center justify-between bg-gray-100 p-2 rounded">
                                <span className="text-sm text-gray-700 truncate">{resumeFile.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setResumeFile(null)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <label className="flex items-center justify-center h-9 border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm text-gray-600 rounded">
                              <FileText className="w-4 h-4 mr-1" />
                              {resumeFile || existingResume ? "Replace File" : "Upload Document"}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileUpload(e, "resume")}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="col-span-12 md:col-span-8 space-y-3">
                    {/* Contact Information */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Contact Information</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Contact ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.contact_id}
                              onChange={(e) => handleChange("contact_id", e.target.value)}
                              placeholder="Existing contact ID"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Contact Type</label>
                            <select
                              className={selectCls}
                              value={formData.contact_type}
                              onChange={(e) => handleChange("contact_type", e.target.value)}
                            >
                              <option value="">Select Type</option>
                              {CONTACT_TYPE_OPTIONS.map((ct) => (
                                <option key={ct} value={ct}>{ct}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Contact Source</label>
                            <input
                              className={fieldCls}
                              value={formData.contact_source}
                              onChange={(e) => handleChange("contact_source", e.target.value)}
                              placeholder="Where did they come from?"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Contact Date</label>
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.contact_date}
                              onChange={(e) => handleChange("contact_date", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Property Requirements */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Property Requirements</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Property ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.property_id}
                              onChange={(e) => handleChange("property_id", e.target.value)}
                              placeholder="Linked property"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Project ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.project_id}
                              onChange={(e) => handleChange("project_id", e.target.value)}
                              placeholder="Linked project"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Listing Type</label>
                            <select
                              className={selectCls}
                              value={formData.listing_type}
                              onChange={(e) => handleChange("listing_type", e.target.value)}
                            >
                              <option value="">Select Type</option>
                              {LISTING_TYPE_OPTIONS.map((lt) => (
                                <option key={lt} value={lt}>{lt}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Construction Status</label>
                            <select
                              className={selectCls}
                              value={formData.construction_status}
                              onChange={(e) => handleChange("construction_status", e.target.value)}
                            >
                              <option value="">Select Status</option>
                              <option value="Ready">Ready</option>
                              <option value="Off Plan">Off Plan</option>
                              <option value="Under Construction">Under Construction</option>
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Exclusive Status</label>
                            <select
                              className={selectCls}
                              value={formData.exclusive_status}
                              onChange={(e) => handleChange("exclusive_status", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Exclusive">Exclusive</option>
                              <option value="Non-Exclusive">Non-Exclusive</option>
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Building</label>
                            <input
                              className={fieldCls}
                              value={formData.building}
                              onChange={(e) => handleChange("building", e.target.value)}
                              placeholder="Building name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Location Preferences</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Country</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.country}
                              onChange={(e) => handleChange("country", e.target.value)}
                              placeholder="Country ID"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>State ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.state_id}
                              onChange={(e) => handleChange("state_id", e.target.value)}
                              placeholder="State ID"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Community ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.community_id}
                              onChange={(e) => handleChange("community_id", e.target.value)}
                              placeholder="Community ID"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Sub Community ID</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.sub_community_id}
                              onChange={(e) => handleChange("sub_community_id", e.target.value)}
                              placeholder="Sub Community ID"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Bedrooms */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Budget & Size Requirements</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Min Price (AED)</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.price_min}
                              onChange={(e) => handleChange("price_min", e.target.value)}
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Max Price (AED)</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.price_max}
                              onChange={(e) => handleChange("price_max", e.target.value)}
                              placeholder="10,000,000"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Min Bedrooms</label>
                            <select
                              className={selectCls}
                              value={formData.bedroom_min}
                              onChange={(e) => handleChange("bedroom_min", e.target.value)}
                            >
                              <option value="">Any</option>
                              <option value="0">Studio</option>
                              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Max Bedrooms</label>
                            <select
                              className={selectCls}
                              value={formData.bedroom_max}
                              onChange={(e) => handleChange("bedroom_max", e.target.value)}
                            >
                              <option value="">Any</option>
                              <option value="0">Studio</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={n}>{n}+</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Message / Notes</div>
                      <div className={boxBodyCls}>
                        <textarea
                          className="w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          rows={5}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="Enter enquiry message, notes, or requirements..."
                        />
                      </div>
                    </div>

                    {/* Lost Status */}
                    {formData.status === "Lost" && (
                      <div className={boxCls}>
                        <div className={boxHeaderCls}>Lost Reason</div>
                        <div className={boxBodyCls}>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                            rows={3}
                            value={formData.lost_status}
                            onChange={(e) => handleChange("lost_status", e.target.value)}
                            placeholder="Why was this lead lost?"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer bar */}
          <div className="mt-3 bg-white border border-gray-300 p-3 rounded-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (window.location.href = "/admin/enquiries")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-xs text-amber-600">You have unsaved changes</span>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Enquiry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}