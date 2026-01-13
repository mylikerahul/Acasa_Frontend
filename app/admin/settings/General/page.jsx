"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Save,
  Upload,
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== DYNAMIC IMPORT ====================
const AdminNavbar = dynamic(
  () => import("../../dashboard/header/DashboardNavbar"),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />
    ),
  }
);

// ==================== CONSTANTS ====================
const TABS = [
  { id: "general", label: "General Settings" },
  { id: "footer", label: "Footer Management" },
  { id: "seo", label: "SEO Settings" },
  { id: "widgets", label: "Footer Widgets" },
];

const INITIAL_FORM_STATE = {
  // General
  siteName: "",
  siteEmail: "",
  currencySign: "AED",
  googleMapKey: "",
  reCaptcha: "",
  logo: null,
  favicon: null,

  // SEO
  siteDescription: "",
  siteKeywords: "",

  // Footer
  newsletterEnabled: true,
  addressEnabled: true,
  telephoneEnabled: true,
  footerText: "",
  copyrightText: "",

  // Widgets
  widget1Enabled: true,
  widget1Heading: "Popular Locations",
  widget1Content: "",
  widget2Enabled: true,
  widget2Heading: "Explore",
  widget2Content: "",
  widget3Enabled: true,
  widget3Heading: "Company",
  widget3Content: "",
  widget4Enabled: true,
  widget4Heading: "Footer Bottom Links",
  widget4Content: "",
};

// ==================== STYLES ====================
const labelCls = "text-[13px] font-medium text-slate-700";
const fieldCls = "w-full h-9 px-3 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-blue-500 transition-colors";
const textareaCls = "w-full px-3 py-2 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-blue-500 transition-colors";
const btnPrimary = "h-9 px-5 rounded-sm bg-[#0d6efd] text-white text-[13px] font-medium hover:bg-[#0b5ed7] disabled:opacity-50 flex items-center gap-2 transition-colors";
const btnSecondary = "h-9 px-5 rounded-sm border border-gray-300 bg-white text-[13px] text-slate-800 hover:bg-gray-50 flex items-center gap-2 transition-colors";

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== API HELPER ====================
const createApiRequest = () => async (endpoint, options = {}) => {
  const token = getAdminToken();

  if (!token || !isAdminTokenValid()) {
    logoutAll();
    fastNavigate("/admin/login");
    throw new Error("Session expired. Please login again.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      logoutAll();
      fastNavigate("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout. Please try again.");
    }
    throw error;
  }
};

// ==================== MAIN COMPONENT ====================
export default function SettingsPage() {
  const apiRequest = useMemo(() => createApiRequest(), []);

  // ==================== AUTH STATE ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==================== UI STATE ====================
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [originalData, setOriginalData] = useState(INITIAL_FORM_STATE);

  // ==================== FILE PREVIEWS ====================
  const [previews, setPreviews] = useState({
    logo: null,
    favicon: null,
  });

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

        // Verify token with backend
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/admin/verify`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Token verification failed");
          }

          const data = await response.json();

          if (data.success && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
          } else {
            throw new Error("Invalid token response");
          }
        } catch (verifyError) {
          console.error("Token verification error:", verifyError);
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        logoutAll();
        fastNavigate("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // ==================== FETCH SETTINGS ====================
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest("/api/v1/settings");

      if (response.success && response.data) {
        const settings = response.data;
        setFormData((prev) => ({ ...prev, ...settings }));
        setOriginalData((prev) => ({ ...prev, ...settings }));

        // Set previews for existing images
        if (settings.logoUrl) {
          setPreviews((prev) => ({ ...prev, logo: settings.logoUrl }));
        }
        if (settings.faviconUrl) {
          setPreviews((prev) => ({ ...prev, favicon: settings.faviconUrl }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, apiRequest]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    try {
      setLogoutLoading(true);

      const token = getAdminToken();
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
        } catch (e) {
          console.log("Logout API call failed:", e);
        }
      }

      logoutAll();
      fastNavigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      logoutAll();
      fastNavigate("/admin/login");
    } finally {
      setLogoutLoading(false);
    }
  }, []);

  // ==================== FORM HANDLERS ====================
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setIsDirty(true);
    setSaved(false);
  }, []);

  const handleToggle = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaved(false);
  }, []);

  const handleFileChange = useCallback((field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    setIsDirty(true);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev) => {
      // Revoke old preview URL
      if (prev[field] && prev[field].startsWith("blob:")) {
        URL.revokeObjectURL(prev[field]);
      }
      return { ...prev, [field]: previewUrl };
    });
  }, []);

  // ==================== SAVE HANDLER ====================
  const handleSave = useCallback(async () => {
    if (!isAdminTokenValid()) {
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Build FormData for file uploads
      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (value instanceof File) {
          fd.append(key, value);
        } else if (typeof value === "boolean") {
          fd.append(key, value.toString());
        } else if (typeof value === "object") {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, value.toString());
        }
      });

      const response = await apiRequest("/api/v1/settings", {
        method: "PUT",
        body: fd,
      });

      if (response.success) {
        setSaved(true);
        setIsDirty(false);
        setOriginalData({ ...formData });
        toast.success("Settings saved successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(response.message || "Failed to save settings");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [formData, apiRequest]);

  // ==================== RESET HANDLER ====================
  const handleReset = useCallback(() => {
    if (!isDirty) return;

    if (!window.confirm("Are you sure you want to reset all changes?")) return;

    setFormData({ ...originalData });
    setIsDirty(false);
    toast.success("Changes reset successfully");
  }, [isDirty, originalData]);

  // ==================== CLEANUP ====================
  useEffect(() => {
    return () => {
      // Cleanup blob URLs
      Object.values(previews).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // ==================== LOADING SCREEN ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-700" />
          <p className="mt-2 text-sm text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="max-w-[1280px] mx-auto px-4 pt-6 pb-10">
        {/* Success Message */}
        {saved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">Settings saved successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-semibold text-slate-800">
              Site Settings
            </h1>

            {/* Navigation Buttons */}
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4 text-gray-700" />
            </button>

            {isDirty && (
              <span className="text-xs text-orange-600 font-medium">
                (Unsaved changes)
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={btnPrimary}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-1 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-[13px] font-medium border rounded-t-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-white border-gray-300 border-b-white text-slate-900"
                  : "bg-[#f8f9fa] border-transparent text-slate-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
            </div>
          ) : (
            <>
              <div className="p-6">
                {/* GENERAL SETTINGS TAB */}
                {activeTab === "general" && (
                  <GeneralSettingsTab
                    formData={formData}
                    onChange={handleInputChange}
                    onFileChange={handleFileChange}
                    previews={previews}
                  />
                )}

                {/* SEO SETTINGS TAB */}
                {activeTab === "seo" && (
                  <SeoSettingsTab
                    formData={formData}
                    onChange={handleInputChange}
                  />
                )}

                {/* FOOTER MANAGEMENT TAB */}
                {activeTab === "footer" && (
                  <FooterSettingsTab
                    formData={formData}
                    onChange={handleInputChange}
                    onToggle={handleToggle}
                  />
                )}

                {/* FOOTER WIDGETS TAB */}
                {activeTab === "widgets" && (
                  <WidgetsSettingsTab
                    formData={formData}
                    onChange={handleInputChange}
                  />
                )}
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 border-t border-gray-200 bg-[#f8f9fa] flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {isDirty ? "You have unsaved changes" : "All changes saved"}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || saving}
                    className={`${btnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={`${btnPrimary} disabled:cursor-not-allowed`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

const GeneralSettingsTab = ({ formData, onChange, onFileChange, previews }) => (
  <div className="space-y-6">
    <SectionHeader title="General Information" />

    {/* Logo Upload */}
    <FormRow label="Logo">
      <FileUpload
        preview={previews.logo}
        onFileChange={onFileChange("logo")}
        placeholder="Logo Preview"
        size="200x75px"
        previewSize="h-16 w-40"
      />
    </FormRow>

    {/* Favicon Upload */}
    <FormRow label="Favicon">
      <FileUpload
        preview={previews.favicon}
        onFileChange={onFileChange("favicon")}
        placeholder="F"
        size="16x16px"
        previewSize="h-8 w-8"
      />
    </FormRow>

    {/* Site Name */}
    <FormRow label="Site Name">
      <input
        type="text"
        name="siteName"
        value={formData.siteName}
        onChange={onChange}
        className={fieldCls}
        placeholder="Your website name"
      />
    </FormRow>

    {/* Site Email */}
    <FormRow label="Site Email">
      <input
        type="email"
        name="siteEmail"
        value={formData.siteEmail}
        onChange={onChange}
        className={fieldCls}
        placeholder="contact@example.com"
      />
    </FormRow>

    {/* Currency Sign */}
    <FormRow label="Currency Sign">
      <input
        type="text"
        name="currencySign"
        value={formData.currencySign}
        onChange={onChange}
        className="w-32 h-9 px-3 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-blue-500"
      />
    </FormRow>

    {/* Google Map Key */}
    <FormRow label="Google Map Key">
      <input
        type="text"
        name="googleMapKey"
        value={formData.googleMapKey}
        onChange={onChange}
        className={fieldCls}
        placeholder="AIzaSy..."
      />
    </FormRow>

    {/* reCaptcha */}
    <FormRow label="reCaptcha Key">
      <input
        type="text"
        name="reCaptcha"
        value={formData.reCaptcha}
        onChange={onChange}
        className={fieldCls}
        placeholder="6Le..."
      />
    </FormRow>
  </div>
);

const SeoSettingsTab = ({ formData, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="SEO Configuration" />

    {/* Site Description */}
    <FormRow label="Site Description">
      <textarea
        name="siteDescription"
        value={formData.siteDescription}
        onChange={onChange}
        rows={4}
        className={textareaCls}
        placeholder="Brief description of your website..."
      />
    </FormRow>

    {/* Site Keywords */}
    <FormRow label="Site Keywords">
      <input
        type="text"
        name="siteKeywords"
        value={formData.siteKeywords}
        onChange={onChange}
        className={fieldCls}
        placeholder="keyword1, keyword2, keyword3"
      />
      <p className="text-[11px] text-gray-500 mt-1">Separate keywords with commas</p>
    </FormRow>
  </div>
);

const FooterSettingsTab = ({ formData, onChange, onToggle }) => (
  <div className="space-y-6">
    <SectionHeader title="Footer Configuration" />

    {/* Newsletter Toggle */}
    <ToggleRow
      label="Sign Up Newsletter"
      enabled={formData.newsletterEnabled}
      onToggle={(v) => onToggle("newsletterEnabled", v)}
    />

    {/* Address Toggle */}
    <ToggleRow
      label="Address"
      enabled={formData.addressEnabled}
      onToggle={(v) => onToggle("addressEnabled", v)}
    />

    {/* Telephone Toggle */}
    <ToggleRow
      label="Telephone"
      enabled={formData.telephoneEnabled}
      onToggle={(v) => onToggle("telephoneEnabled", v)}
    />

    {/* Footer Text */}
    <FormRow label="Footer Text">
      <textarea
        name="footerText"
        value={formData.footerText}
        onChange={onChange}
        rows={6}
        placeholder="Enter footer content..."
        className={`${textareaCls} font-mono`}
      />
      <p className="text-[11px] text-gray-500 mt-1">HTML allowed</p>
    </FormRow>

    {/* Copyright Text */}
    <FormRow label="Copyright Text">
      <input
        type="text"
        name="copyrightText"
        value={formData.copyrightText}
        onChange={onChange}
        className={fieldCls}
        placeholder="© 2024 Company Name. All rights reserved."
      />
    </FormRow>
  </div>
);

const WidgetsSettingsTab = ({ formData, onChange }) => (
  <div className="space-y-6">
    <SectionHeader title="Footer Widget Columns" />

    {/* Widget 1 */}
    <WidgetBox
      title="Widget Column 1"
      enabled={formData.widget1Enabled}
      heading={formData.widget1Heading}
      content={formData.widget1Content}
      enabledName="widget1Enabled"
      headingName="widget1Heading"
      contentName="widget1Content"
      onChange={onChange}
    />

    {/* Widget 2 */}
    <WidgetBox
      title="Widget Column 2"
      enabled={formData.widget2Enabled}
      heading={formData.widget2Heading}
      content={formData.widget2Content}
      enabledName="widget2Enabled"
      headingName="widget2Heading"
      contentName="widget2Content"
      onChange={onChange}
    />

    {/* Widget 3 */}
    <WidgetBox
      title="Widget Column 3"
      enabled={formData.widget3Enabled}
      heading={formData.widget3Heading}
      content={formData.widget3Content}
      enabledName="widget3Enabled"
      headingName="widget3Heading"
      contentName="widget3Content"
      onChange={onChange}
    />

    {/* Widget 4 */}
    <WidgetBox
      title="Widget Column 4"
      enabled={formData.widget4Enabled}
      heading={formData.widget4Heading}
      content={formData.widget4Content}
      enabledName="widget4Enabled"
      headingName="widget4Heading"
      contentName="widget4Content"
      onChange={onChange}
    />
  </div>
);

// ==================== HELPER COMPONENTS ====================

const SectionHeader = ({ title }) => (
  <h2 className="text-[16px] font-semibold text-slate-800 pb-2 border-b">
    {title}
  </h2>
);

const FormRow = ({ label, children }) => (
  <div className="grid grid-cols-4 gap-4 items-start">
    <label className={`${labelCls} pt-2`}>{label}</label>
    <div className="col-span-3">{children}</div>
  </div>
);

const ToggleRow = ({ label, enabled, onToggle }) => (
  <div className="grid grid-cols-4 gap-4 items-center">
    <label className={labelCls}>{label}</label>
    <div className="col-span-3 flex items-center gap-4">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={enabled}
          onChange={() => onToggle(true)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-[13px]">Enable</span>
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={!enabled}
          onChange={() => onToggle(false)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-[13px]">Disable</span>
      </label>
    </div>
  </div>
);

const FileUpload = ({ preview, onFileChange, placeholder, size, previewSize }) => (
  <div className="flex items-center gap-4">
    <div
      className={`${previewSize} border border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden`}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
      ) : (
        <span className="text-gray-400 text-sm">{placeholder}</span>
      )}
    </div>
    <div>
      <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-[13px] bg-white hover:bg-gray-50 cursor-pointer transition-colors">
        <Upload className="w-4 h-4" />
        Choose File
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </label>
      <p className="text-[11px] text-gray-500 mt-1">Size: {size}</p>
    </div>
  </div>
);

const WidgetBox = ({
  title,
  enabled,
  heading,
  content,
  enabledName,
  headingName,
  contentName,
  onChange,
}) => (
  <div className="p-4 border border-gray-200 rounded-sm bg-gray-50">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name={enabledName}
            checked={enabled}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
          />
          <span className="text-[13px]">Enable</span>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-4 items-center">
        <label className={labelCls}>Heading</label>
        <input
          type="text"
          name={headingName}
          value={heading}
          onChange={onChange}
          disabled={!enabled}
          className="col-span-3 h-9 px-3 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-4 gap-4 items-start">
        <label className={`${labelCls} pt-2`}>Content</label>
        <textarea
          name={contentName}
          value={content}
          onChange={onChange}
          disabled={!enabled}
          rows={4}
          className="col-span-3 px-3 py-2 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter widget content (one item per line)..."
        />
      </div>
    </div>
  </div>
);