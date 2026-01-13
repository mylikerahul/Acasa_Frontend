"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  BookOpen,
  Image as ImageIcon,
  X,
  Hash,
  Tag,
  User,
  Calendar,
  Globe,
  FileText,
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye,
  RefreshCw,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";
import SimpleTextEditor from "../../../../components/common/SimpleTextEditor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/verify`, { // Assumes this endpoint exists
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Removed `withCredentials: true` as it's generally not needed for JWT Bearer token authentication
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
  { value: "draft", label: "Draft", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "published", label: "Published", bg: "bg-green-100", text: "text-green-700" },
  { value: "pending", label: "Pending", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "archived", label: "Archived", bg: "bg-gray-100", text: "text-gray-700" },
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
  category: "",
  description: "",
  content: "",
  author: "",
  status: "draft",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  tags: "",
  published_date: new Date().toISOString().split("T")[0],
  featured_image: null, // This will hold a File object for new uploads
  is_featured: false,
  is_pinned: false,
  allow_comments: true,
  reading_time: "5 min",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// ==================== UTILITY FUNCTIONS ====================
const generateSlugFromTitle = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric chars (except spaces and hyphens)
    .replace(/\s+/g, "-")        // Replace spaces with single hyphens
    .replace(/-+/g, "-")         // Replace multiple hyphens with single
    .replace(/^-|-$/g, "");      // Trim hyphens from start/end
};

const calculateReadingTime = (content) => {
  if (!content) return "1 min";
  const plainText = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
  const words = plainText.split(/\s+/).filter((word) => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200)); // Average reading speed is 200 words per minute
  return `${minutes} min`;
};

const getWordCount = (content) => {
  if (!content) return 0;
  const plainText = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  // If it's a base64 Data URL (e.g., for new local file preview)
  if (imagePath.startsWith("data:")) return imagePath;

  // Assuming relative path, construct full URL
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  if (cleanPath.startsWith("uploads/blogs/")) {
    return `${API_BASE_URL}/${cleanPath}`;
  } else if (cleanPath.startsWith("blogs/")) {
    // If it's like 'blogs/filename.jpg', assume it's under 'uploads/'
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  } else {
    // Fallback for just a filename, assume 'uploads/blogs/'
    return `${API_BASE_URL}/uploads/blogs/${cleanPath}`;
  }
};

// ==================== TOAST HELPER FUNCTIONS (Adapted for react-toastify) ====================
const showSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  });
};

const showError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  });
};

const showLoadingToast = (message) => {
  return toast.loading(message, {
    position: "top-right",
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: false,
    theme: "light",
  });
};

const showWarning = (message) => toast.warn(message, {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
});


export default function EditBlogPage() {
  const params = useParams();
  const blogId = params?.id;

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Data States
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [originalBlog, setOriginalBlog] = useState(null); // Stores initial blog data for comparison/reset

  // Form State
  const [form, setForm] = useState({ ...INITIAL_FORM_STATE });
  const [errors, setErrors] = useState({}); // Stores validation errors
  const [imagePreview, setImagePreview] = useState(null); // Data URL for new image, or existing image URL if not changed
  const [existingImage, setExistingImage] = useState(null); // URL of the image currently on the server for this blog
  const [activeTab, setActiveTab] = useState("content"); // Active tab for form sections

  // Loading States
  const [pageLoading, setPageLoading] = useState(true); // For initial blog data fetch
  const [saving, setSaving] = useState(false); // For form submission

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        const msg = sessionType === "user" ? "Please login as admin to access this dashboard" : "Please login to access dashboard";
        showError(msg);
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        showError("Please login to access dashboard");
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token); // Verify token with backend
      } catch (verifyError) {
        console.error("Token verification failed:", verifyError);
        showError("Invalid or expired token. Please login again.");
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
          avatar: null, // Assuming avatar not in token payload or fetched separately
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        console.error("Token decode error:", e);
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
    window.location.href = "/admin/login"; // Redirect to login page
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");
    try {
      const token = getAdminToken();
      // Assuming a dedicated admin logout endpoint on the backend
      await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("Backend logout request failed:", err)); // Don't block client-side logout
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      toast.dismiss(logoutToastId); // Dismiss loading toast
      logoutAll(); // Clear client-side tokens
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login"; // Redirect after logout
      setLogoutLoading(false);
    }
  }, []);

  // ==================== MEMOIZED VALUES ====================
  const wordCount = useMemo(() => getWordCount(form.content), [form.content]);

  // SEO Checklist for score calculation
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
        passed: Boolean(imagePreview || existingImage), // True if a new image is selected OR an existing image is present
      },
      {
        label: "Has meta keywords",
        passed: form.meta_keywords.split(",").filter(Boolean).length > 0, // Checks for non-empty keywords after splitting
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
    [form.meta_title, form.meta_description, wordCount, imagePreview, existingImage, form.meta_keywords, form.category, form.slug]
  );

  const seoScore = useMemo(() => {
    const passed = seoChecklist.filter((item) => item.passed).length;
    const totalChecks = seoChecklist.length;
    return totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;
  }, [seoChecklist]);

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]; // Default to first option (draft)
  };

  // Check if form has any unsaved changes compared to original blog data
  const hasChanges = useMemo(() => {
    if (!originalBlog) return false;

    // Check if new image is selected
    if (form.featured_image instanceof File) return true;

    // Check if existing image was removed
    if (originalBlog.existingImage && imagePreview === null && form.featured_image === null) return true;

    // Compare all other fields
    const formFields = Object.keys(INITIAL_FORM_STATE).filter(key => key !== 'featured_image' && key !== 'reading_time');
    for (const field of formFields) {
      if (form[field] !== originalBlog[field]) {
        return true;
      }
    }
    return false;
  }, [form, originalBlog, imagePreview]);

  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((field, value) => {
    setErrors((prev) => { // Clear error for the field as user types
      if (prev[field]) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });

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
    e.target.value = ""; // Clear file input to allow re-uploading same file
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null); // Clear new image preview
    setExistingImage(null); // Clear existing image
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
  }, [form.title]);

  // Reset form to original values
  const handleReset = useCallback(() => {
    if (originalBlog) {
      setForm(originalBlog);
      setImagePreview(null); // Clear any new image preview
      setExistingImage(originalBlog.existingImage || null); // Restore original existing image
      setErrors({}); // Clear all errors
      showSuccess("Form reset to original values.");
    }
  }, [originalBlog]);

  // Validate Form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required.";
    } else if (form.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }

    if (!form.slug.trim()) {
      newErrors.slug = "Slug is required.";
    } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
    }

    if (!form.category) {
      newErrors.category = "Please select a category.";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required.";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters.";
    }

    if (!form.author.trim()) {
      newErrors.author = "Author is required.";
    } else if (form.author.trim().length < 3) {
      newErrors.author = "Author name must be at least 3 characters.";
    }

    if (!form.content.trim()) {
      newErrors.content = "Content is required.";
    } else if (wordCount < 50) {
      newErrors.content = `Content should have at least 50 words (current: ${wordCount}).`;
    }

    setErrors(newErrors);

    // If there are errors, automatically switch to the tab containing the first error
    if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        if (['title', 'slug', 'category', 'description', 'content', 'author'].includes(firstErrorField)) {
            setActiveTab('content');
        } else if (['meta_title', 'meta_description', 'meta_keywords'].includes(firstErrorField)) {
            setActiveTab('seo');
        } else if (firstErrorField === 'featured_image') { // If you had specific image validation errors
            setActiveTab('media');
        }
    }

    return Object.keys(newErrors).length === 0;
  }, [form, wordCount]);

  // Handle Submit - Using PUT /api/v1/blogs/:id
  const handleSubmit = useCallback(
    async (status) => {
      if (!validateForm()) {
        showError("Please fix the highlighted errors.");
        return;
      }

      if (!blogId) {
        showError("Blog ID is missing. Cannot update.");
        return;
      }

      setSaving(true);
      const saveToastId = showLoadingToast("Updating blog post...");

      try {
        const token = getAdminToken();

        if (!token) {
          showError("Authentication token missing. Please login.");
          handleAuthFailure();
          return;
        }

        const formData = new FormData();

        // Append all form fields
        Object.entries(form).forEach(([key, value]) => {
          if (key === "featured_image") {
            // This is handled separately below based on File object
            return;
          } else if (key === "tags") {
            const tagsArray = typeof value === "string"
              ? value.split(",").map((t) => t.trim()).filter((t) => t)
              : value || [];
            formData.append("tags", JSON.stringify(tagsArray));
          } else if (key === "published_date") {
            formData.append(key, new Date(value).toISOString());
          } else if (typeof value === "boolean") {
            formData.append(key, String(value));
          } else if (value !== null && value !== undefined && value !== "") {
            formData.append(key, String(value));
          }
        });

        // Always set the final status based on the button clicked (draft or published)
        formData.append("status", status);

        // Handle image upload or removal
        if (form.featured_image instanceof File) {
          // A new image file was selected for upload
          formData.append("imageurl", form.featured_image); // IMPORTANT: Use 'imageurl' as per your Express route config
        } else if (originalBlog?.existingImage && imagePreview === null && form.featured_image === null) {
          // An existing image was present but explicitly removed by user
          formData.append("remove_image", "true"); // Signal backend to remove existing image
        }
        // If form.featured_image is null AND existingImage is NOT null, and no new imagePreview,
        // it means the existing image is kept, so no 'imageurl' or 'remove_image' is appended.

        const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${blogId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // IMPORTANT: Do NOT set 'Content-Type' for FormData. Browser sets it with boundary.
          },
          body: formData,
        });

        if (response.status === 401) {
          logoutAll();
          toast.dismiss(saveToastId);
          showError("Session expired. Please login again.");
          window.location.href = "/admin/login";
          return;
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: "Network error or malformed response" }));
          throw new Error(error.message || "Failed to update blog post.");
        }

        const data = await response.json();

        if (data.success) {
          toast.dismiss(saveToastId);
          showSuccess("Blog post updated successfully!");

          setTimeout(() => {
            window.location.href = "/admin/blogs"; // Redirect to blog list
          }, 1000);
        } else {
          throw new Error(data.message || "Failed to update blog post.");
        }
      } catch (error) {
        console.error("Update error:", error);
        toast.dismiss(saveToastId);
        showError(error.message || "Failed to update blog post.");
      } finally {
        setSaving(false);
      }
    },
    [form, validateForm, blogId, originalBlog, imagePreview, handleAuthFailure]
  );

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/blogs-categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch categories" }));
        throw new Error(errorData.message);
      }

      const data = await response.json();

      if (data.success) {
        const cats = (data.data || []).map((cat) => ({
          _id: cat._id || cat.id,
          name: cat.name || cat.title || "Unnamed",
          slug: cat.slug || "",
        }));
        setCategories(cats);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      showError("Failed to load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch Blog by ID for editing
  const fetchBlog = useCallback(async () => {
    if (!blogId) {
      showError("Blog ID is missing.");
      window.location.href = "/admin/blogs"; // Redirect if ID is missing
      return;
    }

    try {
      setPageLoading(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/blogs/${blogId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        logoutAll();
        showError("Session expired. Please login again.");
        window.location.href = "/admin/login";
        return;
      }

      if (response.status === 404) {
        showError("Blog post not found.");
        window.location.href = "/admin/blogs";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch blog" }));
        throw new Error(errorData.message);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const blog = data.data;

        // Normalize the blog data to fit the form state structure
        const normalizedForm = {
          title: blog.title || "",
          slug: blog.slug || "",
          category: blog.category?._id || blog.category || "", // Handle category object or ID string
          description: blog.description || "",
          content: blog.content || "",
          author: blog.author || "",
          status: blog.status || "draft",
          meta_title: blog.meta_title || blog.title || "",
          meta_description: blog.meta_description || "",
          meta_keywords: blog.meta_keywords || "",
          tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || "",
          published_date: blog.published_date
            ? new Date(blog.published_date).toISOString().split("T")[0] // Format for <input type="date">
            : new Date().toISOString().split("T")[0],
          featured_image: null, // Always null initially; new file will replace this
          is_featured: Boolean(blog.is_featured),
          is_pinned: Boolean(blog.is_pinned),
          allow_comments: blog.allow_comments !== false, // Default true if not explicitly false
          reading_time: blog.reading_time || calculateReadingTime(blog.content),
        };

        setForm(normalizedForm);

        // Store the original form data, including the existing image URL for comparison/reset
        setOriginalBlog({
          ...normalizedForm,
          existingImage: getImageUrl(blog.featured_image || blog.main_image || blog.image || null),
        });

        // Set the URL for the currently existing image to be displayed
        const blogImage = blog.featured_image || blog.main_image || blog.image;
        if (blogImage) {
          setExistingImage(getImageUrl(blogImage));
        }
      } else {
        showError("Blog post data not found.");
        window.location.href = "/admin/blogs";
      }
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      showError(error.message || "Failed to load blog post.");
      window.location.href = "/admin/blogs";
    } finally {
      setPageLoading(false);
    }
  }, [blogId]);

  // Effects
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchBlog();
    }
  }, [isAuthenticated, fetchCategories, fetchBlog]);

  // Navigate back to blog list
  const handleBack = () => {
    window.location.href = "/admin/blogs";
  };

  // View blog on frontend (preview)
  const handlePreview = () => {
    if (form.slug) {
      window.open(`/blogs/${form.slug}`, "_blank");
    } else if (blogId) { // Fallback to ID if slug is not ready/available
      window.open(`/blogs/${blogId}`, "_blank");
    } else {
      showWarning("Please save a slug or ID first to preview.");
    }
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ToastContainer position="top-right" autoClose={3000} /> {/* React Toastify */}
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
    return null; // Should redirect via handleAuthFailure
  }

  if (pageLoading) {
    return (
      <>
        <AdminNavbar
          admin={admin}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />
        <div className="min-h-screen bg-gray-100 pt-4 flex items-center justify-center">
          <ToastContainer position="top-right" autoClose={3000} /> {/* React Toastify */}
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog details...</p>
          </div>
        </div>
      </>
    );
  }

  // ==================== RENDER TAB CONTENT ====================
  const renderContentTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter blog title..."
            className={`w-full px-4 py-2.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.title ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            maxLength={120}
          />
          <div className="flex justify-between mt-1">
            {errors.title ? (
              <span className="text-xs text-red-600">{errors.title}</span>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-500">{form.title.length}/120</span>
          </div>
        </div>

        {/* Slug */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              Slug <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={generateSlug}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          </div>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-gray-500 text-sm">
              <Hash className="w-4 h-4 mr-1" />
              /blogs/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                handleChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              placeholder="blog-url-slug"
              className={`flex-1 px-4 py-2.5 border rounded-r text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.slug ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
          </div>
          {errors.slug && (
            <span className="text-xs text-red-600 mt-1 block">{errors.slug}</span>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Changing the slug will affect the blog URL
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            placeholder="Brief description of the blog post..."
            className={`w-full px-4 py-2.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
              errors.description ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.description && (
            <span className="text-xs text-red-600 mt-1 block">{errors.description}</span>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {form.reading_time} read • {wordCount} words
            </span>
          </div>
          <div className={errors.content ? "border border-red-300 rounded" : ""}>
            <SimpleTextEditor
              value={form.content}
              onChange={(value) => handleChange("content", value)}
              placeholder="Write your blog content here..."
            />
          </div>
          {errors.content && (
            <span className="text-xs text-red-600 mt-1 block">{errors.content}</span>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status */}
        <div className="bg-white border border-gray-300 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">Status</h3>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                getStatusInfo(form.status).bg
              } ${getStatusInfo(form.status).text}`}
            >
              {getStatusInfo(form.status).label}
            </span>
          </div>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="mt-3">
            <label className="text-xs text-gray-600 mb-1 block">Publish Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={form.published_date}
                onChange={(e) => handleChange("published_date", e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white border border-gray-300 rounded p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Category</h3>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.category ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="text-xs text-red-600 mt-1 block">{errors.category}</span>
              )}
            </>
          )}

          {/* Tags */}
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="react, nextjs, javascript"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
          </div>
        </div>

        {/* Author */}
        <div className="bg-white border border-gray-300 rounded p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Author</h3>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={form.author}
              onChange={(e) => handleChange("author", e.target.value)}
              placeholder="Author name"
              className={`w-full pl-10 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.author ? "border-red-300" : "border-gray-300"
              }`}
            />
          </div>
          {errors.author && (
            <span className="text-xs text-red-600 mt-1 block">{errors.author}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderSeoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Meta Title</label>
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
            placeholder="SEO optimized title..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            maxLength={60}
          />
          <p className="mt-1 text-xs text-gray-500">Optimal: 50-60 characters</p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Meta Description</label>
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
            rows={4}
            placeholder="Compelling description for search engines..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            maxLength={160}
          />
          <p className="mt-1 text-xs text-gray-500">Optimal: 120-160 characters</p>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Meta Keywords
          </label>
          <textarea
            value={form.meta_keywords}
            onChange={(e) => handleChange("meta_keywords", e.target.value)}
            rows={2}
            placeholder="keyword1, keyword2, keyword3..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Search Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Search Preview</h4>
          <div className="space-y-1">
            <p className="text-blue-600 text-base hover:underline cursor-pointer truncate">
              {form.meta_title || form.title || "Page Title"}
            </p>
            <p className="text-green-700 text-sm">
              yoursite.com/blogs/{form.slug || "your-blog-slug"}
            </p>
            <p className="text-gray-600 text-sm line-clamp-2">
              {form.meta_description || form.description || "Meta description..."}
            </p>
          </div>
        </div>
      </div>

      {/* SEO Score */}
      <div className="bg-white border border-gray-300 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-800">SEO Score</h3>
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
            className={`h-2 rounded-full transition-all ${
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
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="max-w-xl">
      <h3 className="text-sm font-medium text-gray-800 mb-4">Featured Image</h3>

      {/* Current/Preview Image */}
      {(imagePreview || existingImage) ? (
        <div className="relative inline-block mb-4">
          <img
            src={imagePreview || existingImage}
            alt="Preview"
            className="max-w-md h-48 object-cover rounded border border-gray-300"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          {imagePreview && existingImage && (
            <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
              New Image
            </span>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center hover:border-gray-400 transition-colors mb-4">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-1">No featured image</p>
          <p className="text-xs text-gray-500 mb-4">
            Upload an image to display with this blog
          </p>
        </div>
      )}

      {/* Upload Button */}
      <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer">
        <Upload className="w-4 h-4" />
        {imagePreview || existingImage ? "Change Image" : "Upload Image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>

      <p className="text-xs text-gray-500 mt-2">
        Recommended: 1200×630px • JPG, PNG, GIF, WebP • Max 5MB
      </p>

      {/* Image Guidelines */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Image Guidelines</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use high-quality images for better engagement</li>
          <li>• Optimal size is 1200×630 pixels for social sharing</li>
          <li>• Compress images before uploading for faster loading</li>
        </ul>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="max-w-xl space-y-4">
      <h3 className="text-sm font-medium text-gray-800 mb-4">Display Settings</h3>

      {[
        {
          key: "is_featured",
          label: "Featured Post",
          desc: "Highlight this post in the featured section",
        },
        {
          key: "is_pinned",
          label: "Pinned Post",
          desc: "Keep this post at the top of the list",
        },
        {
          key: "allow_comments",
          label: "Allow Comments",
          desc: "Enable readers to leave comments",
        },
      ].map((setting) => (
        <div
          key={setting.key}
          className="flex items-center justify-between p-4 bg-white border border-gray-300 rounded"
        >
          <div>
            <p className="text-sm font-medium text-gray-700">{setting.label}</p>
            <p className="text-xs text-gray-500">{setting.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form[setting.key]}
              onChange={(e) => handleChange(setting.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm after:border after:border-gray-300"></div> {/* Fixed border-gray-300 */}
          </label>
        </div>
      ))}

      {/* Reading Time */}
      <div className="p-4 bg-white border border-gray-300 rounded">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Reading Time
        </label>
        <input
          type="text"
          value={form.reading_time}
          onChange={(e) => handleChange("reading_time", e.target.value)}
          placeholder="5 min"
          className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Auto-calculated based on content
        </p>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Admin Navbar */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4 pb-24">
        <div className="p-3">
          {/* Header */}
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blogs
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  Edit Blog
                </h1>
                <p className="text-gray-600 text-sm">
                  Update blog post • ID: #{blogId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleSubmit("draft")}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => handleSubmit("published")}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "seo" && (
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        activeTab === tab.id
                          ? "bg-white/20"
                          : seoScore >= 80
                          ? "bg-green-100 text-green-700"
                          : seoScore >= 50
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

          {/* Tab Content */}
          <div className="bg-white border border-gray-300 rounded p-4">
            {activeTab === "content" && renderContentTab()}
            {activeTab === "seo" && renderSeoTab()}
            {activeTab === "media" && renderMediaTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </div>

          {/* Info Card */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-800 mb-1">
                  Editing Tips
                </h3>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Changing the slug will affect existing links to this blog</li>
                  <li>• Save as draft to continue editing later</li>
                  <li>• Preview your changes before publishing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-3 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{form.reading_time}</span>
            {hasChanges && (
              <>
                <span>•</span>
                <span className="text-amber-600 font-medium">Unsaved changes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            {hasChanges && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => handleSubmit("draft")}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit("published")}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Update & Publish
            </button>
          </div>
        </div>
      </div>
    </>
  );
}