"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation"; // For getting URL parameters (blog ID for edit)
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Save,
  Eye, // For preview, keeping for consistency
  Globe, // For SEO score/publish
  Plus, // For image upload
  X, // For removing images
  Image as ImageIcon, // For image upload placeholder
  Hash, // For slug
  Tag, // For tags
  User, // For author
  Calendar, // For publish date
  FileText, // For content tab
  Search, // For SEO tab
  Settings, // For settings tab
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast"; // Using react-hot-toast for consistency

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar"; // Assuming correct path
import SimpleTextEditor from "../../../components/common/SimpleTextEditor"; // Assuming correct path for the editor

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Removed `credentials: "include"` as it's typically for cookie-based auth
      // and can interfere with JWT flow if not specifically needed/configured.
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown verification error" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// ==================== CONSTANTS ====================
const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending Review" }, // Added pending review
  { value: "archived", label: "Archived" },
];

const TABS = [
  { id: "content", label: "Content", icon: FileText },
  { id: "seo", label: "SEO", icon: Search },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "settings", label: "Settings", icon: Settings },
];

const INITIAL_FORM_STATE = {
  title: "",
  slug: "",
  category: "", // Will store category ID
  description: "",
  content: "",
  author: "",
  status: "draft", // Default to draft
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  tags: "", // Comma-separated string
  published_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  featured_image: null, // Will store File object for new upload, or URL for existing (handled by imagePreview)
  is_featured: false,
  is_pinned: false,
  allow_comments: true,
  reading_time: "1 min", // Initial value, will be calculated
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// ==================== COMMON STYLES (Adjusted for consistency) ====================
const labelCls = "text-sm text-gray-700";
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"; // Adjusted height for better input experience
const fieldErrorCls = "w-full border border-red-400 bg-red-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const selectCls = "w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const selectErrorCls = "w-full border border-red-400 bg-red-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800";
const boxBodyCls = "p-3";

// ==================== TOAST HELPER FUNCTIONS (Copied from Project Add) ====================
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

// ==================== UTILITY FUNCTIONS ====================
const generateSlugFromTitle = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, "-")    // Replace spaces with hyphens
    .replace(/-+/g, "-")     // Replace multiple hyphens with single
    .replace(/^-|-$/g, "");  // Trim hyphens from start/end
};

const calculateReadingTime = (content) => {
  if (!content) return "1 min";
  // Remove HTML tags for accurate word count
  const plainText = content.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/).filter((word) => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200)); // Average reading speed is 200 words per minute
  return `${minutes} min`;
};

const getWordCount = (content) => {
  if (!content) return 0;
  // Remove HTML tags for accurate word count
  const plainText = content.replace(/<[^>]*>/g, "");
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
};

// ==================== MAIN COMPONENT ====================
export default function AddBlogPage() {
  const params = useParams();
  const isEdit = Boolean(params?.id);
  const blogId = params?.id;

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Data States
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Form State
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); // To show errors only after interaction
  const [imagePreview, setImagePreview] = useState(null); // URL for image preview (File object or existing URL)
  const [activeTab, setActiveTab] = useState("content");

  // Loading States
  const [pageLoading, setPageLoading] = useState(false); // For fetching blog data in edit mode
  const [saving, setSaving] = useState(false);

  // ==================== AUTHENTICATION ====================
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
        console.error("Token verification failed after existence check:", verifyError);
        // If token verification fails, it's likely invalid/expired
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
        console.error("Error decoding token payload:", e);
        showError("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error (outer catch):", error);
      showError("Authentication failed. Please login again.");
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

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

      // Assuming a general user logout endpoint for token invalidation on the server
      await fetch(
        `${API_BASE_URL}/api/v1/users/logout`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      ).catch((err) => console.error("Backend logout request failed:", err)); // Don't block client-side logout if backend fails
    } catch (err) {
      console.error("Error during logout process:", err);
      showError("Logout failed. Please try again.");
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll(); // Clear client-side tokens
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // API Helper
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      showError("Authentication token missing. Please login.");
      handleAuthFailure();
      throw new Error("No token found");
    }

    const requestHeaders = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    // IMPORTANT: Do NOT set 'Content-Type' for FormData bodies. The browser handles it.
    if (!(options.body instanceof FormData)) {
      requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
    } else {
        // Ensure no Content-Type header if body is FormData
        delete requestHeaders['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: requestHeaders,
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


  // ==================== MEMOIZED VALUES ====================
  const wordCount = useMemo(() => getWordCount(form.content), [form.content]);

  // SEO Checklist
  const seoChecklist = useMemo(
    () => [
      {
        label: "Meta title length (50-60 chars)",
        passed: form.meta_title.length >= 50 && form.meta_title.length <= 60,
        current: form.meta_title.length,
      },
      {
        label: "Meta description (120-160 chars)",
        passed:
          form.meta_description.length >= 120 &&
          form.meta_description.length <= 160,
        current: form.meta_description.length,
      },
      {
        label: "Content length (300+ words)",
        passed: wordCount >= 300,
        current: wordCount,
      },
      {
        label: "Has featured image",
        // Check if there's an image preview, implying an image is present (new or existing)
        passed: Boolean(imagePreview),
      },
      {
        label: "Has meta keywords",
        // Check if meta_keywords is a non-empty string after cleaning
        passed: form.meta_keywords.split(",").filter(Boolean).length > 0,
      },
      {
        label: "Has category",
        passed: Boolean(form.category),
      },
      {
        label: "Has slug",
        passed: Boolean(form.slug),
      },
    ],
    [form.meta_title, form.meta_description, wordCount, imagePreview, form.meta_keywords, form.category, form.slug]
  );

  const seoScore = useMemo(() => {
    const passed = seoChecklist.filter((item) => item.passed).length;
    // Calculate score out of total checks, prevent division by zero
    const totalChecks = seoChecklist.length;
    return totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;
  }, [seoChecklist]);


  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((field, value) => {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };

      if (field === "title") {
        // Only auto-generate slug if it hasn't been manually set or if it matches the old autogenerated slug
        const prevAutoSlug = generateSlugFromTitle(prev.title);
        if (!prev.slug || prev.slug === prevAutoSlug) {
          newForm.slug = generateSlugFromTitle(value);
        }
        // Auto-fill meta_title if not already set by user AND not explicitly cleared/changed by user
        if (!prev.meta_title || prev.meta_title === prev.title) {
          newForm.meta_title = value;
        }
      }

      if (field === "content") {
        newForm.reading_time = calculateReadingTime(value);
      }

      return newForm;
    });

    // Clear error for the field if it's no longer empty (only if it was touched)
    if (touched[field] && errors[field] && value) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [errors, touched]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Re-run validation for the specific field on blur
    validateField(field, form[field]);
  }, [form, validateField]);

  const validateField = useCallback((field, value) => {
    let error = "";
    if (field === "title" && (!value || value.trim().length < 3)) {
      error = "Title must be at least 3 characters.";
    } else if (field === "slug" && (!value || !/^[a-z0-9-]+$/.test(value))) {
      error = "Slug can only contain lowercase letters, numbers, and hyphens.";
    } else if (field === "category" && !value) {
      error = "Category is required.";
    } else if (field === "description" && (!value || value.trim().length < 10)) {
      error = "Description is required and should be at least 10 characters.";
    } else if (field === "author" && (!value || value.trim().length < 3)) {
      error = "Author is required and should be at least 3 characters.";
    } else if (field === "content" && (getWordCount(value) < 50)) {
      error = `Content should have at least 50 words (current: ${getWordCount(value)}).`;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file (JPG, PNG, GIF, WebP).");
      e.target.value = ""; // Clear file input
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showError(`Image size should be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`);
      e.target.value = ""; // Clear file input
      return;
    }

    setForm((prev) => ({ ...prev, featured_image: file })); // Store the File object
    setImagePreview(URL.createObjectURL(file)); // Create URL for immediate preview
    showSuccess("Featured image selected!");
    e.target.value = ""; // Clear file input
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, featured_image: null })); // Explicitly set to null to indicate removal
    showSuccess("Featured image removed.");
  }, []);

  const generateSlug = useCallback(() => {
    if (!form.title) {
      showError("Please enter a title first to generate a slug.");
      return;
    }
    const slug = generateSlugFromTitle(form.title);
    setForm((prev) => ({ ...prev, slug }));
    showSuccess("Slug generated!");
    validateField("slug", slug); // Validate immediately after generation
  }, [form.title, validateField]);


  // ==================== VALIDATION ====================
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate all required fields and fields with specific length/format rules
    if (!form.title.trim() || form.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }
    if (!form.slug.trim() || !/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
    }
    if (!form.category) {
      newErrors.category = "Category is required.";
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      newErrors.description = "Description is required and should be at least 10 characters.";
    }
    if (!form.content.trim()) {
      newErrors.content = "Content is required.";
    } else if (getWordCount(form.content) < 50) {
      newErrors.content = `Content should have at least 50 words (current: ${getWordCount(form.content)}).`;
    }
    if (!form.author.trim() || form.author.trim().length < 3) {
      newErrors.author = "Author is required and should be at least 3 characters.";
    }
    // No specific validation for meta fields, assuming they can be empty if user desires.

    setErrors(newErrors);
    // Mark all fields as touched to display all validation errors on submit attempt
    setTouched(Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(newErrors).length > 0) {
      showError("Please correct the highlighted errors before saving/publishing.");
      // Automatically switch to the tab with the first error
      const firstErrorField = Object.keys(newErrors)[0];
      if (['title', 'slug', 'category', 'description', 'content', 'author'].includes(firstErrorField)) {
        setActiveTab('content');
      } else if (['meta_title', 'meta_description', 'meta_keywords'].includes(firstErrorField)) {
        setActiveTab('seo');
      } else if (firstErrorField === 'featured_image') { // If featured_image needs validation
        setActiveTab('media');
      }
      return false;
    }
    return true;
  }, [form]);

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = useCallback(async (submitStatus) => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    const saveToastId = showLoadingToast(isEdit ? "Updating blog post..." : "Creating blog post...");

    try {
      const formDataToSend = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "featured_image") {
          // Only append if it's a new file object.
          // If value is null, it means no new image was selected.
          if (value instanceof File) {
            formDataToSend.append("imageurl", value); // Ensure field name matches uploader: 'imageurl'
          } else if (value === null && imagePreview === null && isEdit) {
            // If image was explicitly removed in edit mode (form.featured_image is null and imagePreview is null),
            // send a signal to the backend to clear the existing image.
            formDataToSend.append("remove_image", "true");
          }
          // If value is null but imagePreview is NOT null, it means existing image is kept, so don't send anything for 'imageurl'
        } else if (key === "tags") {
          // Send tags as a JSON string for easy parsing on backend
          const tagsArray = value.split(",").map(tag => tag.trim()).filter(Boolean);
          formDataToSend.append(key, JSON.stringify(tagsArray));
        } else if (key === "published_date") {
          formDataToSend.append(key, new Date(value).toISOString());
        } else if (typeof value === "boolean") {
          formDataToSend.append(key, value ? "true" : "false");
        } else if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(key, String(value));
        }
      });
      
      formDataToSend.set("status", submitStatus); // Set the status explicitly for save/publish

      const endpoint = isEdit ? `/api/v1/blogs/${blogId}` : "/api/v1/blogs";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
          // IMPORTANT: Do NOT set 'Content-Type' header here for FormData.
          // The browser automatically sets it with the correct boundary.
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'create'} blog post.`);
      }

      toast.dismiss(saveToastId);
      showSuccess(`Blog post ${isEdit ? 'updated' : 'created'} successfully!`);

      setTimeout(() => {
        window.location.href = "/admin/blogs"; // Redirect to blog list
      }, 1500);

    } catch (e) {
      console.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || `Failed to ${isEdit ? 'update' : 'create'} blog post.`);
    } finally {
      setSaving(false);
    }
  }, [form, validateForm, isEdit, blogId, imagePreview]); // Added imagePreview to dependencies

  // ==================== FETCH DATA ====================
  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const data = await apiRequest("/api/v1/blogs-categories");
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch blog categories:", error);
      showError("Failed to load blog categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, [apiRequest]);

  // Fetch Blog for Edit
  const fetchBlog = useCallback(async () => {
    if (!isEdit || !blogId) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    try {
      const data = await apiRequest(`/api/v1/blogs/${blogId}`);
      if (data.success && data.data) {
        const blog = data.data;
        const processedForm = {
          title: blog.title || "",
          slug: blog.slug || "",
          // Handle category object (if populated) or just ID string
          category: blog.category?._id || blog.category || "",
          description: blog.description || "",
          content: blog.content || "",
          author: blog.author || "",
          status: blog.status || "draft",
          meta_title: blog.meta_title || blog.title || "",
          meta_description: blog.meta_description || "",
          meta_keywords: blog.meta_keywords || "",
          tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || "",
          published_date: blog.published_date
            ? new Date(blog.published_date).toISOString().split("T")[0] // Format for date input
            : new Date().toISOString().split("T")[0],
          featured_image: null, // Always null initially; new file will replace this
          is_featured: Boolean(blog.is_featured),
          is_pinned: Boolean(blog.is_pinned),
          allow_comments: blog.allow_comments !== false, // Default true if not explicitly false
          reading_time: blog.reading_time || calculateReadingTime(blog.content),
        };
        setForm(processedForm);
        if (blog.featured_image) {
          setImagePreview(blog.featured_image); // Set existing image URL for preview
        }
      } else {
        showError("Blog post not found for editing.");
        window.location.href = "/admin/blogs"; // Redirect if not found
      }
    } catch (error) {
      console.error(`Failed to fetch blog post (ID: ${blogId}):`, error);
      showError("Failed to load blog post for editing.");
      window.location.href = "/admin/blogs"; // Redirect on error
    } finally {
      setPageLoading(false);
    }
  }, [isEdit, blogId, apiRequest]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchBlog();
    }
  }, [isAuthenticated, fetchCategories, fetchBlog]);

  // ==================== RENDER HELPERS ====================
  const getFieldClass = (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
    return errors[field] && touched[field] ? errorClass : baseClass;
  };

  const handleBackToList = () => {
    window.location.href = "/admin/blogs";
  };

  const handlePreviewBlog = () => {
    if (form.slug) {
      // Assuming a public blog preview URL structure like /blog/:slug
      window.open(`/blog/${form.slug}`, '_blank');
    } else {
      showError("Please create a slug first to preview the blog post.");
    }
  };


  // ==================== TAB RENDERING FUNCTIONS ====================
  const renderContentTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Main Content Column */}
      <div className="md:col-span-2 space-y-4">
        {/* Title */}
        <div>
          <label className={labelRequiredCls}>Blog Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            onBlur={() => handleBlur("title")}
            placeholder="Enter blog title..."
            className={getFieldClass("title")}
            maxLength={120}
          />
          <div className="flex justify-between mt-1">
            {errors.title && touched.title && (
              <span className="text-xs text-red-600">{errors.title}</span>
            )}
            <span className={`text-xs ${form.title.length > 100 ? 'text-amber-600' : 'text-gray-500'}`}>
              {form.title.length}/120
            </span>
          </div>
        </div>

        {/* Slug */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelRequiredCls}>Blog Slug</label>
            <button
              type="button"
              onClick={generateSlug}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Generate from title
            </button>
          </div>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-100 rounded-l text-gray-500 text-sm">
              <Hash className="w-4 h-4 mr-1" />
              /blogs/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                handleChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              onBlur={() => handleBlur("slug")}
              placeholder="your-blog-post-slug"
              className={`${getFieldClass("slug")} rounded-l-none`}
            />
          </div>
          {errors.slug && touched.slug && (
            <span className="text-xs text-red-600 mt-1 block">{errors.slug}</span>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelRequiredCls}>Short Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            rows={3}
            placeholder="A brief summary of the blog post (100-150 characters ideal for snippets)."
            className={getFieldClass("description") + " resize-none"}
            maxLength={300} // Limiting description length
          />
          <div className="flex justify-between mt-1">
            {errors.description && touched.description && (
              <span className="text-xs text-red-600">{errors.description}</span>
            )}
            <span className={`text-xs ${form.description.length > 250 ? 'text-amber-600' : 'text-gray-500'}`}>
              {form.description.length}/300
            </span>
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelRequiredCls}>Blog Content</label>
            <span className="text-xs text-gray-500">
              {form.reading_time} read • {wordCount} words
            </span>
          </div>
          <div className={`border rounded ${errors.content && touched.content ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
            <SimpleTextEditor
              value={form.content}
              onChange={(value) => handleChange("content", value)}
              onBlur={() => handleBlur("content")}
              placeholder="Write your blog content here..."
            />
          </div>
          {errors.content && touched.content && (
            <span className="text-xs text-red-600 mt-1 block">{errors.content}</span>
          )}
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="md:col-span-1 space-y-4">
        {/* Status */}
        <div className={boxCls}>
          <div className={boxHeaderCls}>Publication Details</div>
          <div className={boxBodyCls}>
            <label className={`${labelCls} block mb-1.5`}>Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className={selectCls}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <label className={`${labelCls} block mb-1.5`}>Publish Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.published_date}
                  onChange={(e) => handleChange("published_date", e.target.value)}
                  className={`${fieldCls} pl-10`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category & Tags */}
        <div className={boxCls}>
          <div className={boxHeaderCls}>Categorization</div>
          <div className={boxBodyCls}>
            <label className={labelRequiredCls}>Category</label>
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  onBlur={() => handleBlur("category")}
                  className={getFieldClass("category", selectCls)}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && touched.category && (
                  <span className="text-xs text-red-600 mt-1 block">{errors.category}</span>
                )}
                {categories.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No categories found.{" "}
                    <button
                      onClick={() => (window.location.href = "/admin/blogs/categories/add")} // Adjust path if needed
                      className="underline font-medium"
                    >
                      Add new
                    </button>
                  </p>
                )}
              </>
            )}

            <div className="mt-4">
              <label className={`${labelCls} block mb-1.5`}>Tags</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  onBlur={() => handleBlur("tags")}
                  placeholder="react, nextjs, javascript"
                  className={`${fieldCls} pl-10`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
            </div>
          </div>
        </div>

        {/* Author */}
        <div className={boxCls}>
          <div className={boxHeaderCls}>Author Information</div>
          <div className={boxBodyCls}>
            <label className={labelRequiredCls}>Author Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.author}
                onChange={(e) => handleChange("author", e.target.value)}
                onBlur={() => handleBlur("author")}
                placeholder="Author's Name"
                className={`${getFieldClass("author")} pl-10`}
              />
            </div>
            {errors.author && touched.author && (
              <span className="text-xs text-red-600 mt-1 block">{errors.author}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSeoTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${labelCls} font-medium`}>Meta Title</label>
            <span
              className={`text-xs ${
                form.meta_title.length >= 50 && form.meta_title.length <= 60
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {form.meta_title.length}/60
            </span>
          </div>
          <input
            type="text"
            value={form.meta_title}
            onChange={(e) => handleChange("meta_title", e.target.value)}
            onBlur={() => handleBlur("meta_title")}
            placeholder="SEO optimized title for search engines"
            className={getFieldClass("meta_title")}
            maxLength={60}
          />
          <p className="mt-1 text-xs text-gray-500">Optimal: 50-60 characters</p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${labelCls} font-medium`}>Meta Description</label>
            <span
              className={`text-xs ${
                form.meta_description.length >= 120 && form.meta_description.length <= 160
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {form.meta_description.length}/160
            </span>
          </div>
          <textarea
            value={form.meta_description}
            onChange={(e) => handleChange("meta_description", e.target.value)}
            onBlur={() => handleBlur("meta_description")}
            rows={4}
            placeholder="Compelling summary for search engine results. Include keywords."
            className={getFieldClass("meta_description") + " resize-none"}
            maxLength={160}
          />
          <p className="mt-1 text-xs text-gray-500">Optimal: 120-160 characters</p>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className={`${labelCls} block mb-1.5`}>Meta Keywords</label>
          <textarea
            value={form.meta_keywords}
            onChange={(e) => handleChange("meta_keywords", e.target.value)}
            onBlur={() => handleBlur("meta_keywords")}
            rows={2}
            placeholder="keyword1, keyword2, long phrase keyword"
            className={getFieldClass("meta_keywords") + " resize-none"}
          />
          <p className="mt-1 text-xs text-gray-500">Separate keywords with commas.</p>
        </div>

        {/* Search Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Google Search Snippet Preview</h4>
          <div className="space-y-1">
            <p className="text-blue-600 text-lg font-medium hover:underline cursor-pointer truncate">
              {form.meta_title || form.title || "Your Blog Post Title Here"}
            </p>
            <p className="text-green-700 text-sm">
              <span className="text-gray-500">yoursite.com</span>/blogs/{form.slug || "your-blog-slug"}
            </p>
            <p className="text-gray-600 text-sm line-clamp-2">
              {form.meta_description || form.description || "A compelling meta description should go here, describing the content of your blog post to attract clicks."}
            </p>
          </div>
        </div>
      </div>

      {/* SEO Score Sidebar */}
      <div className="md:col-span-1">
        <div className={boxCls}>
          <div className={boxHeaderCls}>SEO Optimization Score</div>
          <div className={boxBodyCls}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Current Score:</span>
              <span
                className={`text-lg font-bold ${
                  seoScore >= 80
                    ? "text-green-600"
                    : seoScore >= 50
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {seoScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  seoScore >= 80
                    ? "bg-green-500"
                    : seoScore >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${seoScore}%` }}
              />
            </div>
            <div className="space-y-2">
              {seoChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  {item.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs ${item.passed ? "text-green-700" : "text-amber-700"}`}
                  >
                    {item.label}{" "}
                    {typeof item.current !== "undefined" && item.label.includes("length") && (
                      <span className="ml-1 text-gray-500">({item.current})</span>
                    )}
                    {typeof item.current !== "undefined" && item.label.includes("words") && (
                      <span className="ml-1 text-gray-500">({item.current})</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Featured Image for Blog Post</h3>

      {imagePreview ? (
        <div className="relative max-w-lg mb-6 mx-auto">
          <img
            src={imagePreview}
            alt="Featured Image Preview"
            className="w-full h-64 object-cover rounded-lg shadow-md border border-gray-200"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={removeImage}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600 text-center">Current featured image.</p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50 max-w-lg mx-auto">
          <ImageIcon className="w-14 h-14 text-gray-400 mx-auto mb-4" />
          <p className="text-base text-gray-700 font-medium mb-2">Drag & Drop or Click to Upload</p>
          <p className="text-sm text-gray-500 mb-4">
            Recommended: Landscape (e.g., 1200x630px) • JPG, PNG, GIF, WebP • Max 5MB
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer shadow-md transition-colors">
            <Upload className="w-5 h-5" />
            Choose Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Image Guidelines */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-3xl mx-auto">
        <h4 className="text-base font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Image Best Practices
        </h4>
        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
          <li>Use high-resolution, relevant images that visually summarize your blog content.</li>
          <li>Ensure images are optimized for web (compressed) to improve page load speed.</li>
          <li>For social media sharing, an aspect ratio of 1.91:1 (e.g., 1200x628px) is often ideal.</li>
          <li>Add descriptive `alt` text to images for accessibility and SEO benefits.</li>
        </ul>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="max-w-xl mx-auto space-y-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Blog Post Settings</h3>

      {[
        {
          key: "is_featured",
          label: "Mark as Featured Post",
          desc: "Highlights this blog post in a special section (e.g., homepage banner).",
        },
        {
          key: "is_pinned",
          label: "Pin Post to Top",
          desc: "Keeps this post at the very top of blog listings, overriding recency.",
        },
        {
          key: "allow_comments",
          label: "Allow Reader Comments",
          desc: "Enables or disables the comment section for this specific blog post.",
        },
      ].map((setting) => (
        <div
          key={setting.key}
          className="flex items-center justify-between p-4 bg-white border border-gray-300 rounded-lg shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{setting.label}</p>
            <p className="text-xs text-gray-600 mt-1">{setting.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form[setting.key]}
              onChange={(e) => handleChange(setting.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:border after:border-300"></div>
          </label>
        </div>
      ))}
      
      {/* Reading Time - Display Only / Auto-calculated */}
      <div className={boxCls}>
          <div className={boxHeaderCls}>Reading Time</div>
          <div className={boxBodyCls}>
            <p className="text-lg font-bold text-gray-800">{form.reading_time}</p>
            <p className="text-sm text-gray-600 mt-1">This is automatically calculated based on the content word count.</p>
          </div>
      </div>

    </div>
  );


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
    return null; // Should trigger redirect via handleAuthFailure
  }

  if (pageLoading) {
    return (
      <>
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <Toaster /> {/* hot-toast Toaster */}
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <p className="mt-4 text-lg text-gray-700">Loading blog details...</p>
          </div>
        </div>
      </>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <>
      {/* hot-toast Toaster Configuration */}
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

      {/* AdminNavbar */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4 pb-24"> {/* Consistent background and padding, added pb-24 for bottom bar */}
        <div className="max-w-[1250px] mx-auto px-3"> {/* Adjusted padding */}
          {/* Top Control Bar */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  {isEdit ? "Edit Blog Post" : "Add New Blog Post"}
                </h1>

                {/* Back to list button */}
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="h-9 px-3 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded text-sm font-medium"
                  title="Back to Blog List"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-700 mr-1" />
                  Back
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* SEO Score Display */}
                <div className="hidden sm:flex items-center bg-gray-100 border border-gray-200 px-3 py-1 rounded">
                  <Globe className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">SEO Score:</span>
                  <span className={`ml-1 text-sm font-bold ${
                    seoScore >= 80 ? 'text-green-600' :
                    seoScore >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {seoScore}%
                  </span>
                </div>

                {/* Preview Button */}
                {form.slug && (
                  <button
                    type="button"
                    onClick={handlePreviewBlog}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                )}
              </div>
            </div>

            {/* Tabs (Horizontal) */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded ${
                    activeTab === tab.id
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "seo" && (
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        activeTab === "seo"
                          ? "bg-white/20"
                          : seoScore >= 80
                          ? "bg-green-100 text-green-700"
                          : seoScore >= 60
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {seoScore}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content Area */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            <div className="p-4"> {/* Padding for content within this background */}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(form.status); }}>
                {activeTab === "content" && renderContentTab()}
                {activeTab === "seo" && renderSeoTab()}
                {activeTab === "media" && renderMediaTab()}
                {activeTab === "settings" && renderSettingsTab()}
              </form>
            </div>
          </div>

          {/* Info Card - Consistent with Project Add's Quick Actions but for Blog tips */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-blue-800 mb-1">
                  Blog Post Writing Guidelines
                </h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                  <li>Aim for a minimum of 300 words for better SEO performance.</li>
                  <li>Break down your content using headings and subheadings for readability.</li>
                  <li>Use bullet points or numbered lists to highlight key information.</li>
                  <li>Include a clear call-to-action where appropriate.</li>
                  <li>Review for grammar, spelling, and factual accuracy before publishing.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-3 z-50 shadow-lg">
        <div className="max-w-[1250px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Word Count: <span className="font-semibold">{wordCount}</span></span>
            <span>•</span>
            <span>Est. Read: <span className="font-semibold">{form.reading_time}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("published")} // Pass "published" status
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? "Updating..." : "Publishing..."}
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  {isEdit ? "Update Blog" : "Publish Blog"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}