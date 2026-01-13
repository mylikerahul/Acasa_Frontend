"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  Eye,
  Trash2,
  ClipboardList,
  Calendar,
  User,
  Edit3,
  Loader2,
  Search,
  AlertCircle,
  Send,
  RefreshCw,
  CheckCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminToken } from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== INITIAL FORM STATE ====================
const INITIAL_FORM_STATE = {
  Commission: "",
  assign: "",
  date: new Date().toISOString().split("T")[0],
  title: "",
  slug: "",
  descriptions: "",
  heading: "",
  seo_title: "",
  seo_keywork: "",
  seo_description: "",
};

// ==================== MAIN COMPONENT ====================
export default function TaskBoard() {
  // ==================== STATE ====================
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);

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

  // ==================== FETCH TASKS ====================
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiRequest(`/api/v1/tasks`);

      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // ==================== INITIAL FETCH ====================
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ==================== FORM VALIDATION ====================
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.title?.trim() && !formData.heading?.trim()) {
      errors.title = "Title or heading is required";
    }

    if (formData.title && formData.title.trim().length > 255) {
      errors.title = "Title must not exceed 255 characters";
    }

    if (formData.heading && formData.heading.trim().length > 255) {
      errors.heading = "Heading must not exceed 255 characters";
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

  const openEditModal = useCallback((task) => {
    setFormData({
      Commission: task.Commission || "",
      assign: task.assign || "",
      date: task.date ? task.date.split("T")[0] : "",
      title: task.title || "",
      slug: task.slug || "",
      descriptions: task.descriptions || "",
      heading: task.heading || "",
      seo_title: task.seo_title || "",
      seo_keywork: task.seo_keywork || "",
      seo_description: task.seo_description || "",
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingId(task.id);
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
      
      // Auto-generate slug from title or heading
      if (field === 'title' || field === 'heading') {
        if (!prev.slug || prev.slug === generateSlug(prev.title || prev.heading || '')) {
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

  // ==================== CREATE TASK ====================
  const handleCreate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        Commission: formData.Commission?.trim() || null,
        assign: formData.assign?.trim() || null,
        date: formData.date || null,
        title: formData.title?.trim() || null,
        slug: formData.slug?.trim() || null,
        descriptions: formData.descriptions?.trim() || null,
        heading: formData.heading?.trim() || null,
        seo_title: formData.seo_title?.trim() || null,
        seo_keywork: formData.seo_keywork?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
      };

      const data = await apiRequest("/api/v1/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setTasks((prev) => [data.data, ...prev]);
        toast.success("Task created successfully! ✅");
        closeModal();
      }
    } catch (err) {
      console.error("Create error:", err);
      toast.error(err.message || "Failed to create task");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, validateForm, apiRequest, closeModal]);

  // ==================== UPDATE TASK ====================
  const handleUpdate = useCallback(async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        Commission: formData.Commission?.trim() || null,
        assign: formData.assign?.trim() || null,
        date: formData.date || null,
        title: formData.title?.trim() || null,
        slug: formData.slug?.trim() || null,
        descriptions: formData.descriptions?.trim() || null,
        heading: formData.heading?.trim() || null,
        seo_title: formData.seo_title?.trim() || null,
        seo_keywork: formData.seo_keywork?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
      };

      const data = await apiRequest(`/api/v1/tasks/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === editingId ? data.data : t))
        );
        toast.success("Task updated successfully! ✏️");
        closeModal();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Failed to update task");
    } finally {
      setSaveLoading(false);
    }
  }, [formData, editingId, validateForm, apiRequest, closeModal]);

  // ==================== DELETE TASK ====================
  const handleDelete = useCallback(async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setDeleteLoading(id);
    try {
      const data = await apiRequest(`/api/v1/tasks/${id}`, {
        method: "DELETE",
      });

      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        toast.success("Task deleted! 🗑️");

        if (viewingTask?.id === id) {
          setViewingTask(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete task");
    } finally {
      setDeleteLoading(null);
    }
  }, [apiRequest, viewingTask]);

  // ==================== VIEW TASK ====================
  const handleView = useCallback((task) => {
    setViewingTask(task);
  }, []);

  // ==================== REFRESH ====================
  const handleRefresh = useCallback(() => {
    fetchTasks();
    toast.success("Refreshed!");
  }, [fetchTasks]);

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

  // ==================== FILTERED TASKS ====================
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(term) ||
          task.heading?.toLowerCase().includes(term) ||
          task.assign?.toLowerCase().includes(term) ||
          task.Commission?.toLowerCase().includes(term) ||
          task.descriptions?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [tasks, searchTerm]);

  // ==================== RENDER ====================
  return (
    <>
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-800">Task Board</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {tasks.length} tasks
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
              Add Task
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
                placeholder="Search tasks..."
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
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No tasks found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Create your first task to get started"}
              </p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title/Heading */}
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {task.title || task.heading || "Untitled Task"}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {formatDate(task.date)}
                          </span>
                          {task.assign && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assign}
                              </span>
                            </>
                          )}
                          {task.Commission && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {task.Commission}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        {task.descriptions && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.descriptions}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {/* View */}
                        <button
                          onClick={() => handleView(task)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={deleteLoading === task.id}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteLoading === task.id ? (
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
                  {isEditing ? <Edit3 className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {isEditing ? "Edit Task" : "Create New Task"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isEditing ? "Update this task" : "Add a new task to the board"}
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
              {/* Row 1: Title & Heading */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    placeholder="Enter task title..."
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm ${
                      formErrors.title ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={formData.heading}
                    onChange={(e) => handleFormChange("heading", e.target.value)}
                    placeholder="Enter heading..."
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm ${
                      formErrors.heading ? "border-red-300 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {formErrors.heading && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.heading}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Commission & Assign */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Commission
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.Commission}
                      onChange={(e) => handleFormChange("Commission", e.target.value)}
                      placeholder="e.g., 500, 10%"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assign To
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.assign}
                      onChange={(e) => handleFormChange("assign", e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Date & Slug */}
              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Slug <span className="text-xs text-gray-400">(URL-friendly)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleFormChange("slug", e.target.value)}
                    placeholder="auto-generated-from-title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descriptions
                </label>
                <textarea
                  value={formData.descriptions}
                  onChange={(e) => handleFormChange("descriptions", e.target.value)}
                  placeholder="Task details..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm resize-none"
                />
              </div>

              {/* SEO Section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  SEO Settings
                </h4>
                
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
                disabled={saveLoading || (!formData.title?.trim() && !formData.heading?.trim())}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isEditing ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== VIEW TASK MODAL =========== */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingTask(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Task Details</h3>
                </div>
                <button
                  onClick={() => setViewingTask(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {viewingTask.title || viewingTask.heading || "Untitled Task"}
                </p>
              </div>

              {/* Heading (if different from title) */}
              {viewingTask.heading && viewingTask.heading !== viewingTask.title && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Heading</label>
                  <p className="text-sm text-gray-700 mt-1">{viewingTask.heading}</p>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(viewingTask.date)}</span>
                </div>
                {viewingTask.assign && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{viewingTask.assign}</span>
                  </div>
                )}
                {viewingTask.Commission && (
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span>{viewingTask.Commission}</span>
                  </div>
                )}
              </div>

              {/* Descriptions */}
              {viewingTask.descriptions && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Descriptions</label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {viewingTask.descriptions}
                  </p>
                </div>
              )}

              {/* Slug */}
              {viewingTask.slug && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Slug</label>
                  <p className="text-sm text-gray-600 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
                    {viewingTask.slug}
                  </p>
                </div>
              )}

              {/* SEO Info */}
              {(viewingTask.seo_title || viewingTask.seo_keywork || viewingTask.seo_description) && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-xs font-medium text-gray-500 uppercase">SEO Information</label>
                  <div className="mt-2 space-y-2 text-sm">
                    {viewingTask.seo_title && (
                      <p><span className="font-medium">Title:</span> {viewingTask.seo_title}</p>
                    )}
                    {viewingTask.seo_keywork && (
                      <p><span className="font-medium">Keywords:</span> {viewingTask.seo_keywork}</p>
                    )}
                    {viewingTask.seo_description && (
                      <p><span className="font-medium">Description:</span> {viewingTask.seo_description}</p>
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
                    openEditModal(viewingTask);
                    setViewingTask(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(viewingTask.id)}
                  disabled={deleteLoading === viewingTask.id}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleteLoading === viewingTask.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
              <button
                onClick={() => setViewingTask(null)}
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