"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Eye,
  Trash2,
  Bell,
  Calendar,
  User,
  Edit3,
  Loader2,
  Search,
  AlertCircle,
  Send,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminToken } from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== INITIAL FORM STATE ====================
const INITIAL_FORM_STATE = {
  Headings: "",
  Description: "",
  assign: "",
  date: new Date().toISOString().split("T")[0],
  title: "",
  slug: "",
  descriptions: "",
  seo_title: "",
  seo_keywork: "",
  seo_description: "",
};

// ==================== MAIN COMPONENT ====================
export default function NoticeBoard() {
  // ==================== STATE ====================
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingNotice, setViewingNotice] = useState(null);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Action Loading States
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ==================== API HELPER ====================
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }, []);

  // ==================== FETCH NOTICES ====================
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`/api/v1/notices`);

      if (data.success) {
        setNotices(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // ==================== FORM VALIDATION ====================
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.Headings?.trim() && !formData.title?.trim()) {
      errors.Headings = "Headings or title is required";
    }

    if (formData.Headings && formData.Headings.trim().length > 255) {
      errors.Headings = "Headings must not exceed 255 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ==================== GENERATE SLUG ====================
  const generateSlug = useCallback((text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, []);

  // ==================== MODAL HANDLERS ====================
  const openCreateModal = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_STATE,
      date: new Date().toISOString().split("T")[0],
    });
    setFormErrors({});
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((notice) => {
    setFormData({
      Headings: notice.Headings || "",
      Description: notice.Description || "",
      assign: notice.assign || "",
      date: notice.date ? notice.date.split("T")[0] : "",
      title: notice.title || "",
      slug: notice.slug || "",
      descriptions: notice.descriptions || "",
      seo_title: notice.seo_title || "",
      seo_keywork: notice.seo_keywork || "",
      seo_description: notice.seo_description || "",
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingId(notice.id);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsEditing(false);
    setEditingId(null);
  }, []);

  // ==================== FORM CHANGE HANDLER ====================
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate slug from Headings or title
      if (field === 'Headings' || field === 'title') {
        if (!prev.slug || prev.slug === generateSlug(prev.Headings || prev.title || '')) {
          newData.slug = generateSlug(value);
        }
      }
      
      return newData;
    });

    // Clear error for this field
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, [generateSlug]);

  // ==================== CREATE NOTICE ====================
  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        Headings: formData.Headings?.trim() || null,
        Description: formData.Description?.trim() || null,
        assign: formData.assign?.trim() || null,
        date: formData.date || null,
        title: formData.title?.trim() || null,
        slug: formData.slug?.trim() || null,
        descriptions: formData.descriptions?.trim() || null,
        seo_title: formData.seo_title?.trim() || null,
        seo_keywork: formData.seo_keywork?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
      };

      const data = await apiRequest("/api/v1/notices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setNotices((prev) => [data.data, ...prev]);
        toast.success("Notice created successfully! 📢");
        closeModal();
      }
    } catch (err) {
      console.error("Create error:", err);
      toast.error(err.message || "Failed to create notice");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, validateForm, apiRequest, closeModal]);

  // ==================== UPDATE NOTICE ====================
  const handleUpdate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        Headings: formData.Headings?.trim() || null,
        Description: formData.Description?.trim() || null,
        assign: formData.assign?.trim() || null,
        date: formData.date || null,
        title: formData.title?.trim() || null,
        slug: formData.slug?.trim() || null,
        descriptions: formData.descriptions?.trim() || null,
        seo_title: formData.seo_title?.trim() || null,
        seo_keywork: formData.seo_keywork?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
      };

      const data = await apiRequest(`/api/v1/notices/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setNotices((prev) =>
          prev.map((n) => (n.id === editingId ? data.data : n))
        );
        toast.success("Notice updated successfully! ✏️");
        closeModal();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Failed to update notice");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, editingId, validateForm, apiRequest, closeModal]);

  // ==================== DELETE NOTICE ====================
  const handleDelete = useCallback(async (id) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    setDeleteLoading(id);
    try {
      const data = await apiRequest(`/api/v1/notices/${id}`, {
        method: "DELETE",
      });

      if (data.success) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        toast.success("Notice deleted! 🗑️");

        if (viewingNotice?.id === id) {
          setViewingNotice(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete notice");
    } finally {
      setDeleteLoading(null);
    }
  }, [apiRequest, viewingNotice]);

  // ==================== VIEW NOTICE ====================
  const handleView = useCallback((notice) => {
    setViewingNotice(notice);
  }, []);

  // ==================== REFRESH ====================
  const handleRefresh = useCallback(() => {
    fetchNotices();
    toast.success("Refreshed!");
  }, [fetchNotices]);

  // ==================== UTILITY FUNCTIONS ====================
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // ==================== FILTERED NOTICES ====================
  const filteredNotices = useMemo(() => {
    let filtered = [...notices];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notice) =>
          notice.Headings?.toLowerCase().includes(term) ||
          notice.Description?.toLowerCase().includes(term) ||
          notice.assign?.toLowerCase().includes(term) ||
          notice.title?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notices, searchTerm]);

  // ==================== RENDER ====================
  return (
    <>
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Noticeboard</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {notices.length} notices
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 text-gray-600" />
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Notice
            </button>
          </div>
        </div>

        {/* Search Filter */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notices..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-4 py-3">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No notices found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Create your first notice to get started"}
              </p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredNotices.map((notice) => (
                <li
                  key={notice.id}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Heading */}
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {notice.Headings || notice.title || "No Title"}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {formatDate(notice.date)}
                          </span>
                          {notice.assign && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {notice.assign}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        {notice.Description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notice.Description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {/* View */}
                        <button
                          onClick={() => handleView(notice)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(notice)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(notice.id)}
                          disabled={deleteLoading === notice.id}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteLoading === notice.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* =========== CREATE/EDIT MODAL =========== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md">
                  {isEditing ? <Edit3 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {isEditing ? "Edit Notice" : "Create New Notice"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isEditing ? "Update this notice" : "Add a new notice to the board"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Row 1: Headings & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Headings <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.Headings}
                    onChange={(e) => handleFormChange("Headings", e.target.value)}
                    placeholder="Enter notice heading..."
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm ${
                      formErrors.Headings ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {formErrors.Headings && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.Headings}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="Enter title..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Assign & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assign To
                  </label>
                  <input
                    type="text"
                    value={formData.assign}
                    onChange={(e) => handleFormChange("assign", e.target.value)}
                    placeholder="e.g., John Doe, Team A"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFormChange("date", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug <span className="text-xs text-gray-400">(URL-friendly)</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFormChange("slug", e.target.value)}
                  placeholder="auto-generated-from-heading"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.Description}
                  onChange={(e) => handleFormChange("Description", e.target.value)}
                  placeholder="Short description..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm resize-none"
                />
              </div>

              {/* Full Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Details
                </label>
                <textarea
                  value={formData.descriptions}
                  onChange={(e) => handleFormChange("descriptions", e.target.value)}
                  placeholder="Detailed content..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm resize-none"
                />
              </div>

              {/* SEO Section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">SEO Settings</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleFormChange("seo_title", e.target.value)}
                      placeholder="SEO optimized title..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.seo_keywork}
                      onChange={(e) => handleFormChange("seo_keywork", e.target.value)}
                      placeholder="keyword1, keyword2, keyword3..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      SEO Description
                    </label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => handleFormChange("seo_description", e.target.value)}
                      placeholder="Meta description for search engines..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
              <button
                onClick={closeModal}
                disabled={saveLoading}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleUpdate : handleCreate}
                disabled={saveLoading || (!formData.Headings?.trim() && !formData.title?.trim())}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isEditing ? "Update Notice" : "Create Notice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== VIEW NOTICE MODAL =========== */}
      {viewingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingNotice(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Notice Details</h3>
                </div>
                <button
                  onClick={() => setViewingNotice(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Heading */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Heading</label>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {viewingNotice.Headings || viewingNotice.title || "No Title"}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(viewingNotice.date)}</span>
                </div>
                {viewingNotice.assign && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{viewingNotice.assign}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewingNotice.Description && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {viewingNotice.Description}
                  </p>
                </div>
              )}

              {/* Full Details */}
              {viewingNotice.descriptions && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Full Details</label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {viewingNotice.descriptions}
                  </p>
                </div>
              )}

              {/* SEO Info */}
              {(viewingNotice.seo_title || viewingNotice.seo_keywork || viewingNotice.seo_description) && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-xs font-medium text-gray-500 uppercase">SEO Information</label>
                  <div className="mt-2 space-y-2 text-sm">
                    {viewingNotice.seo_title && (
                      <p><span className="font-medium">Title:</span> {viewingNotice.seo_title}</p>
                    )}
                    {viewingNotice.seo_keywork && (
                      <p><span className="font-medium">Keywords:</span> {viewingNotice.seo_keywork}</p>
                    )}
                    {viewingNotice.seo_description && (
                      <p><span className="font-medium">Description:</span> {viewingNotice.seo_description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openEditModal(viewingNotice);
                    setViewingNotice(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(viewingNotice.id)}
                  disabled={deleteLoading === viewingNotice.id}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleteLoading === viewingNotice.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
              <button
                onClick={() => setViewingNotice(null)}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}