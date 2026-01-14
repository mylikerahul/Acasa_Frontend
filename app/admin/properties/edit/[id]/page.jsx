"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Upload,
  Copy,
  RotateCcw,
  Save,
  Globe,
  RefreshCw,
  Eye,
  ExternalLink,
} from "lucide-react";

import { toast, Toaster } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
} from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";
import SimpleTextEditor from "../../../../components/common/SimpleTextEditor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => toast.success(message);
const showError = (message) => toast.error(message);
const showWarning = (message) => toast(message, { icon: "⚠️" });
const showLoadingToast = (message) => toast.loading(message);

// ==================== AUTH HELPERS ====================
const getCurrentSessionType = () => {
  if (typeof window === "undefined") return null;
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("userToken");
  if (adminToken) return "admin";
  if (userToken) return "user";
  return null;
};

const logoutAll = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("userToken");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("user");
};

const verifyToken = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// ==================== INITIAL FORM DATA ====================
const INITIAL_FORM_DATA = {
  // Basic Info
  property_name: "",
  property_slug: "",
  listing_type: "sale",
  property_type: "Apartment",
  property_purpose: "Sale",

  // Pricing
  price: "",
  price_end: "",
  askprice: "0",
  currency_id: 1,

  // Property Details
  bedroom: "",
  bathrooms: "",
  area: "",
  area_end: "",
  area_size: "Sq.Ft.",

  // Location IDs
  city_id: 1,
  community_id: 1,
  sub_community_id: 1,

  // Location text fields for display
  city_name: "",
  community_name: "",
  sub_community_name: "",
  location: "",
  address: "",
  BuildingName: "",
  StreetName: "",

  // Description
  description: "",

  // Features
  amenities: "",
  property_features: "",
  parking: "",
  property_status: "Ready",
  furnishing: "Fully Furnished",
  flooring: "Marble",

  // IDs
  developer_id: 1,
  user_id: 1,
  agent_id: "",

  // Status
  status: 1,
  featured_property: "0",

  // Additional
  video_url: "",
  map_latitude: "",
  map_longitude: "",
  rera_number: "",
  completion_date: "",
  unit_number: "",
  floor_number: "",
  dld_permit: "",
  
  // Images from server
  featured_image: "",
  gallery: [],
};

// ==================== REQUIRED FIELDS ====================
const REQUIRED_FIELDS = [
  { field: "property_name", label: "Property Name" },
  { field: "price", label: "Price" },
  { field: "bedroom", label: "Bedrooms" },
  { field: "city_name", label: "City" },
  { field: "community_name", label: "Community" },
  { field: "description", label: "Description" },
];

// ==================== STYLES ====================
const labelCls = "text-sm text-gray-700";
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const fieldErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const selectCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const selectErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800";
const boxBodyCls = "p-3";

// ==================== HELPER FUNCTIONS ====================
const countWordsInHTML = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.split(/\s+/).filter(Boolean).length;
};

const generateSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).substring(2, 8);
};

// Extract city/community names from location string
const parseLocation = (location) => {
  if (!location) return { city: "", community: "" };
  const parts = location.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    return { community: parts[0], city: parts[1] };
  }
  return { city: parts[0] || "", community: "" };
};

// ==================== SEO CHECKLIST COMPONENT ====================
function SeoChecklist({ formData }) {
  const descriptionWordCount = countWordsInHTML(formData.description);

  const checks = [
    { label: "Property name (min 10 chars)", passed: formData.property_name?.length >= 10 },
    { label: "Description (min 50 words)", passed: descriptionWordCount >= 50 },
    { label: "Price specified", passed: !!formData.price },
    { label: "Property type selected", passed: !!formData.property_type },
    { label: "City specified", passed: !!formData.city_name },
    { label: "Community specified", passed: !!formData.community_name },
    { label: "Bedrooms specified", passed: !!formData.bedroom },
    { label: "Area specified", passed: !!formData.area },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const percentage = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">SEO Score</span>
        <span className={`text-sm font-bold ${percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-amber-600" : "text-red-600"}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div
          className={`h-2 rounded transition-all ${percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-2 text-xs text-gray-700 py-1">
            {check.passed ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className={check.passed ? "text-green-700" : "text-red-700"}>{check.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== VALIDATION INDICATOR ====================
function ValidationIndicator({ formData }) {
  const missingFields = REQUIRED_FIELDS.filter(({ field }) => {
    const value = formData[field];
    if (field === "description") return countWordsInHTML(value) < 10;
    return !value;
  });

  const completedCount = REQUIRED_FIELDS.length - missingFields.length;
  const percentage = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

  return (
    <div className="bg-white border border-gray-300 rounded p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Form Completion</span>
        <span className={`text-sm font-bold ${percentage === 100 ? "text-green-600" : percentage >= 70 ? "text-amber-600" : "text-red-600"}`}>
          {completedCount}/{REQUIRED_FIELDS.length} fields
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded mb-2">
        <div
          className={`h-2 rounded transition-all ${percentage === 100 ? "bg-green-500" : percentage >= 70 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {missingFields.length > 0 && (
        <div className="text-xs text-red-600">Missing: {missingFields.map((f) => f.label).join(", ")}</div>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Images
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);
  const [deletedGalleryIds, setDeletedGalleryIds] = useState([]);

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
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (e) {
        console.error("Token verification error:", e);
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
        console.error("Token decode error:", e);
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } finally {
      logoutAll();
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // ==================== FETCH PROPERTY DATA ====================
  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      showError("Property ID is required");
      router.push("/admin/properties");
      return;
    }

    setLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch property");
      }

      const property = result.data;
      
      // Parse location to get city and community names
      const { city, community } = parseLocation(property.location);

      // Map API response to form data
      const mappedData = {
        ...INITIAL_FORM_DATA,
        property_name: property.property_name || "",
        property_slug: property.slug || property.property_slug || "",
        listing_type: property.listing_type || "sale",
        property_type: property.property_type || "Apartment",
        property_purpose: property.property_purpose || "Sale",
        
        price: property.price?.toString() || "",
        price_end: property.price_end?.toString() || "",
        askprice: property.askprice || "0",
        currency_id: property.currency_id || 1,
        
        bedroom: property.bedroom?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        area: property.area?.toString() || "",
        area_end: property.area_end?.toString() || "",
        area_size: property.area_size || "Sq.Ft.",
        
        city_id: property.city_id || 1,
        community_id: property.community_id || 1,
        sub_community_id: property.sub_community_id || 1,
        
        city_name: city || property.city || "",
        community_name: community || property.community || "",
        sub_community_name: property.sub_community || "",
        location: property.location || "",
        address: property.address || "",
        BuildingName: property.BuildingName || "",
        StreetName: property.StreetName || "",
        
        description: property.description || "",
        
        amenities: property.amenities || "",
        property_features: property.property_features || "",
        parking: property.parking?.toString() || "",
        property_status: property.property_status || "Ready",
        furnishing: property.furnishing || "Fully Furnished",
        flooring: property.flooring || "Marble",
        
        developer_id: property.developer_id || 1,
        user_id: property.user_id || 1,
        agent_id: property.agent_id?.toString() || "",
        
        status: property.status ?? 1,
        featured_property: property.featured_property ? "1" : "0",
        
        video_url: property.video_url || "",
        map_latitude: property.map_latitude?.toString() || "",
        map_longitude: property.map_longitude?.toString() || "",
        rera_number: property.rera_number || "",
        completion_date: property.completion_date || "",
        unit_number: property.unit_number || "",
        floor_number: property.floor_number || "",
        dld_permit: property.dld_permit || "",
        
        featured_image: property.featured_image || "",
      };

      setFormData(mappedData);
      setOriginalData(mappedData);
      
      // Set existing gallery images
      if (property.gallery && Array.isArray(property.gallery)) {
        setExistingGallery(property.gallery);
      }

      showSuccess("Property loaded successfully");
    } catch (error) {
      console.error("Fetch property error:", error);
      showError(error.message || "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [propertyId, router]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && propertyId) {
      fetchProperty();
    }
  }, [isAuthenticated, propertyId, fetchProperty]);

  // Calculate SEO score
  const calculateSeoScore = useCallback(() => {
    let score = 0;
    const descriptionWordCount = countWordsInHTML(formData.description);

    if (formData.property_name?.length >= 10) score++;
    if (descriptionWordCount >= 50) score++;
    if (formData.price) score++;
    if (formData.property_type) score++;
    if (formData.city_name) score++;
    if (formData.community_name) score++;
    if (formData.bedroom) score++;
    if (formData.area) score++;

    setSeoScore(Math.round((score / 8) * 100));
  }, [formData]);

  useEffect(() => {
    calculateSeoScore();
  }, [calculateSeoScore]);

  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData) ||
        selectedMainImage !== null ||
        selectedImages.length > 0 ||
        deletedGalleryIds.length > 0;
      setHasChanges(changed);
    }
  }, [formData, originalData, selectedMainImage, selectedImages, deletedGalleryIds]);

  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate location
      if (field === "city_name" || field === "community_name") {
        const city = field === "city_name" ? value : prev.city_name;
        const community = field === "community_name" ? value : prev.community_name;
        updated.location = [community, city].filter(Boolean).join(", ");
      }

      return updated;
    });

    if (value) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleDescriptionChange = useCallback((htmlContent) => {
    handleChange("description", htmlContent);
  }, [handleChange]);

  const handleImageUpload = useCallback((e, type) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        showError(`File ${f.name} is not an image.`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        showError(`Image ${f.name} > 5MB.`);
        return false;
      }
      return true;
    });

    if (type === "main" && validFiles[0]) {
      setSelectedMainImage(validFiles[0]);
      showSuccess("Featured image selected!");
    }
    if (type === "gallery") {
      const totalImages = existingGallery.length - deletedGalleryIds.length + selectedImages.length + validFiles.length;
      if (totalImages > 10) {
        showError("Maximum 10 images.");
        return;
      }
      setSelectedImages((prev) => [...prev, ...validFiles]);
      showSuccess(`${validFiles.length} images added!`);
    }
    e.target.value = "";
  }, [existingGallery.length, deletedGalleryIds.length, selectedImages.length]);

  const removeNewImage = useCallback((index, type) => {
    if (type === "main") {
      setSelectedMainImage(null);
    } else {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    }
    showSuccess("Image removed");
  }, []);

  const removeExistingGalleryImage = useCallback((imageId) => {
    setDeletedGalleryIds((prev) => [...prev, imageId]);
    showSuccess("Image marked for deletion");
  }, []);

  const restoreGalleryImage = useCallback((imageId) => {
    setDeletedGalleryIds((prev) => prev.filter(id => id !== imageId));
    showSuccess("Image restored");
  }, []);

  // ==================== VALIDATION ====================
  const validateForm = useCallback(() => {
    const newErrors = {};
    const descriptionWordCount = countWordsInHTML(formData.description);

    if (!formData.property_name) newErrors.property_name = "Required";
    if (!formData.price) newErrors.price = "Required";
    if (!formData.bedroom) newErrors.bedroom = "Required";
    if (!formData.city_name) newErrors.city_name = "Required";
    if (!formData.community_name) newErrors.community_name = "Required";
    if (descriptionWordCount < 10) newErrors.description = "Min 10 words";

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = "Must be a number";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError("Please fill required fields");
      return false;
    }

    return true;
  }, [formData]);

  const handleGenerateSlug = useCallback(() => {
    if (!formData.property_name) {
      showError("Enter property name first");
      return;
    }
    setFormData((prev) => ({ ...prev, property_slug: generateSlug(formData.property_name) }));
    showSuccess("Slug generated!");
  }, [formData.property_name]);

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setSaving(true);
    const saveToastId = showLoadingToast("Updating property...");

    try {
      const fd = new FormData();

      // Build location string
      const locationString = [formData.community_name, formData.city_name].filter(Boolean).join(", ");

      // Property data
      const propertyData = {
        property_name: formData.property_name,
        property_slug: formData.property_slug,
        price: Number(formData.price),
        bedroom: String(formData.bedroom),
        
        city_id: Number(formData.city_id) || 1,
        community_id: Number(formData.community_id) || 1,
        sub_community_id: Number(formData.sub_community_id) || 1,
        
        location: formData.location || locationString,
        address: formData.address || locationString,
        
        listing_type: formData.listing_type || "sale",
        property_type: formData.property_type || "Apartment",
        property_purpose: formData.property_purpose || "Sale",
        
        currency_id: Number(formData.currency_id) || 1,
        
        bathrooms: Number(formData.bathrooms) || 0,
        area: Number(formData.area) || 0,
        area_end: formData.area_end ? Number(formData.area_end) : null,
        
        description: formData.description || "",
        
        amenities: formData.amenities || "",
        property_features: formData.property_features || "",
        parking: formData.parking || "",
        property_status: formData.property_status || "Ready",
        furnishing: formData.furnishing || "",
        flooring: formData.flooring || "",
        
        developer_id: Number(formData.developer_id) || 1,
        
        status: Number(formData.status),
        featured_property: formData.featured_property || "0",
        
        video_url: formData.video_url || "",
        map_latitude: formData.map_latitude || "",
        map_longitude: formData.map_longitude || "",
        rera_number: formData.rera_number || "",
        unit_number: formData.unit_number || "",
        floor_number: formData.floor_number || "",
        dld_permit: formData.dld_permit || "",
      };

      // Append fields to FormData
      Object.entries(propertyData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, String(value));
        }
      });

      // Add deleted gallery IDs
      if (deletedGalleryIds.length > 0) {
        fd.append("deleted_gallery_ids", JSON.stringify(deletedGalleryIds));
      }

      // Add new images
      if (selectedMainImage) {
        fd.append("featured_image", selectedMainImage);
      }
      selectedImages.forEach((img) => {
        fd.append("gallery_images", img);
      });

      const token = getAdminToken();
      if (!token) {
        showError("Please login");
        handleAuthFailure();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const result = await response.json();
      toast.dismiss(saveToastId);

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      if (result.success) {
        showSuccess("Property updated successfully!");
        setHasChanges(false);
        setOriginalData(formData);
        setSelectedMainImage(null);
        setSelectedImages([]);
        setDeletedGalleryIds([]);
        
        // Refresh data
        await fetchProperty();
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  }, [formData, propertyId, selectedMainImage, selectedImages, deletedGalleryIds, validateForm, handleAuthFailure, fetchProperty]);

  // ==================== UTILITY FUNCTIONS ====================
  const copyFormData = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    showSuccess("Copied!");
  }, [formData]);

  const resetForm = useCallback(() => {
    if (window.confirm("Reset to original data?")) {
      if (originalData) {
        setFormData(originalData);
        setSelectedMainImage(null);
        setSelectedImages([]);
        setDeletedGalleryIds([]);
        setErrors({});
        setTouched({});
        showSuccess("Form reset");
      }
    }
  }, [originalData]);

  const previewProperty = useCallback(() => {
    if (formData.property_slug) {
      window.open(`/properties/${formData.property_slug}`, "_blank");
    }
  }, [formData.property_slug]);

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
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  if (loading) {
    return (
      <>
        <Toaster position="top-right" />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="max-w-[1250px] mx-auto px-3">
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Loading property data...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const descriptionWordCount = countWordsInHTML(formData.description);
  const activeGalleryCount = existingGallery.length - deletedGalleryIds.length + selectedImages.length;

  return (
    <>
      <Toaster position="top-right" />
      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="max-w-[1250px] mx-auto px-3">
          {/* Header */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">Edit Property</h1>
                <span className="text-sm text-gray-500">ID: {propertyId}</span>
                <button onClick={() => window.history.back()} className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded">
                  <ArrowLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => window.history.forward()} className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded">
                  <ArrowRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Changes indicator */}
                {hasChanges && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                    Unsaved changes
                  </span>
                )}
                
                {/* SEO Score */}
                <div className="flex items-center bg-gray-100 border px-3 py-1 rounded">
                  <Globe className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm">SEO:</span>
                  <span className={`ml-1 text-sm font-bold ${seoScore >= 80 ? "text-green-600" : seoScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {seoScore}%
                  </span>
                </div>

                {/* Preview button */}
                {formData.property_slug && (
                  <button onClick={previewProperty} className="px-3 py-2 text-sm border border-gray-300 bg-white rounded hover:bg-gray-50 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                )}

                {/* Refresh button */}
                <button onClick={fetchProperty} className="px-3 py-2 text-sm border border-gray-300 bg-white rounded hover:bg-gray-50 flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            <ValidationIndicator formData={formData} />
          </div>

          {/* Form Content */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            <div className="p-3">
              <div className="grid grid-cols-12 gap-3">
                {/* LEFT COLUMN */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  {/* Status */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("featured_property", formData.featured_property === "1" ? "0" : "1")}
                          className={`h-9 border rounded text-sm ${formData.featured_property === "1" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-gray-100 text-gray-700 border-gray-300"}`}
                        >
                          Featured
                        </button>
                        <select className={selectCls} value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
                          <option value={1}>Active</option>
                          <option value={0}>Inactive</option>
                          <option value={2}>Draft</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Basic Details */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Basic Details</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        {/* Property Name */}
                        <div>
                          <label className={labelRequiredCls}>Property Name</label>
                          <input
                            className={getFieldClass("property_name")}
                            value={formData.property_name}
                            onChange={(e) => handleChange("property_name", e.target.value)}
                            onBlur={() => handleBlur("property_name")}
                            placeholder="Enter property name"
                          />
                          {errors.property_name && touched.property_name && <span className="text-xs text-red-500">{errors.property_name}</span>}
                        </div>

                        {/* Slug */}
                        <div>
                          <label className={labelCls}>Slug</label>
                          <div className="flex gap-1">
                            <input 
                              className={fieldCls} 
                              value={formData.property_slug} 
                              onChange={(e) => handleChange("property_slug", e.target.value)}
                            />
                            <button onClick={handleGenerateSlug} className="h-9 px-3 border border-gray-300 bg-white text-xs rounded hover:bg-gray-50">
                              Generate
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div>
                          <label className={labelRequiredCls}>Price (AED)</label>
                          <input
                            className={getFieldClass("price")}
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            onBlur={() => handleBlur("price")}
                            placeholder="15000000"
                          />
                          {errors.price && touched.price && <span className="text-xs text-red-500">{errors.price}</span>}
                        </div>

                        {/* Price End */}
                        <div>
                          <label className={labelCls}>Price End</label>
                          <input
                            className={fieldCls}
                            type="number"
                            value={formData.price_end}
                            onChange={(e) => handleChange("price_end", e.target.value)}
                            placeholder="16000000"
                          />
                        </div>

                        {/* Bedrooms */}
                        <div>
                          <label className={labelRequiredCls}>Bedrooms</label>
                          <select
                            className={getFieldClass("bedroom", selectCls, selectErrorCls)}
                            value={formData.bedroom}
                            onChange={(e) => handleChange("bedroom", e.target.value)}
                            onBlur={() => handleBlur("bedroom")}
                          >
                            <option value="">Select</option>
                            <option value="Studio">Studio</option>
                            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                            <option value="7+">7+</option>
                          </select>
                          {errors.bedroom && touched.bedroom && <span className="text-xs text-red-500">{errors.bedroom}</span>}
                        </div>

                        {/* Bathrooms */}
                        <div>
                          <label className={labelCls}>Bathrooms</label>
                          <input className={fieldCls} type="number" value={formData.bathrooms} onChange={(e) => handleChange("bathrooms", e.target.value)} placeholder="6" />
                        </div>

                        {/* Area */}
                        <div>
                          <label className={labelCls}>Area (Sq.Ft.)</label>
                          <input className={fieldCls} type="number" value={formData.area} onChange={(e) => handleChange("area", e.target.value)} placeholder="8500" />
                        </div>

                        {/* RERA */}
                        <div>
                          <label className={labelCls}>RERA Number</label>
                          <input className={fieldCls} value={formData.rera_number} onChange={(e) => handleChange("rera_number", e.target.value)} placeholder="RERA123456" />
                        </div>

                        {/* Unit Number */}
                        <div>
                          <label className={labelCls}>Unit Number</label>
                          <input className={fieldCls} value={formData.unit_number} onChange={(e) => handleChange("unit_number", e.target.value)} placeholder="Villa 45" />
                        </div>

                        {/* Floor Number */}
                        <div>
                          <label className={labelCls}>Floor</label>
                          <input className={fieldCls} value={formData.floor_number} onChange={(e) => handleChange("floor_number", e.target.value)} placeholder="G+2" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Video Link</div>
                    <div className={boxBodyCls}>
                      <input className={fieldCls} value={formData.video_url} onChange={(e) => handleChange("video_url", e.target.value)} placeholder="https://youtube.com/..." />
                    </div>
                  </div>

                  {/* Images */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Images</div>
                    <div className={boxBodyCls}>
                      {/* Current Featured Image */}
                      <div className="text-sm text-gray-700 mb-2">Featured Image</div>
                      
                      {/* Show existing featured image */}
                      {formData.featured_image && !selectedMainImage && (
                        <div className="mb-2 relative">
                          <img src={formData.featured_image} alt="Current featured" className="w-full h-28 object-cover rounded border" />
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Current</span>
                        </div>
                      )}
                      
                      {/* Show new selected image */}
                      {selectedMainImage && (
                        <div className="mb-2 relative">
                          <img src={URL.createObjectURL(selectedMainImage)} alt="New featured" className="w-full h-28 object-cover rounded border ring-2 ring-green-500" />
                          <span className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">New</span>
                          <button onClick={() => removeNewImage(null, "main")} className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "main")} className="text-xs" />
                      {formData.featured_image && <p className="text-xs text-gray-500 mt-1">Upload new to replace current</p>}

                      {/* Gallery Images */}
                      <div className="mt-4 text-sm text-gray-700 mb-2">Gallery ({activeGalleryCount}/10)</div>
                      
                      {/* Existing Gallery Images */}
                      {existingGallery.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {existingGallery.map((img) => {
                            const isDeleted = deletedGalleryIds.includes(img.id);
                            return (
                              <div key={img.id} className={`relative ${isDeleted ? "opacity-50" : ""}`}>
                                <img src={img.Url} alt="Gallery" className="w-full h-20 object-cover rounded border" />
                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">Existing</span>
                                {isDeleted ? (
                                  <button
                                    onClick={() => restoreGalleryImage(img.id)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center"
                                    title="Restore"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => removeExistingGalleryImage(img.id)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                {isDeleted && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Will be deleted</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* New Gallery Images */}
                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {selectedImages.map((img, i) => (
                            <div key={i} className="relative">
                              <img src={URL.createObjectURL(img)} alt={`New ${i}`} className="w-full h-20 object-cover rounded border ring-2 ring-green-500" />
                              <span className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1 rounded">New</span>
                              <button onClick={() => removeNewImage(i, "gallery")} className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center">
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, "gallery")} className="text-xs" />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  {/* Type Selection */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="text-sm font-semibold text-gray-800 mb-2">Listing Type *</div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {[["sale", "For Sale"], ["rent", "For Rent"], ["Off plan", "Off Plan"]].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2">
                            <input type="radio" name="listing_type" checked={formData.listing_type === val} onChange={() => handleChange("listing_type", val)} />
                            {label}
                          </label>
                        ))}
                      </div>

                      <div className="mt-4 text-sm font-semibold text-gray-800 mb-2">Property Purpose *</div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {[["Sale", "Sale"], ["Rent", "Rent"]].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2">
                            <input type="radio" name="property_purpose" checked={formData.property_purpose === val} onChange={() => handleChange("property_purpose", val)} />
                            {label}
                          </label>
                        ))}
                      </div>

                      <div className="mt-4 text-sm font-semibold text-gray-800 mb-2">Property Type *</div>
                      <div className="grid grid-cols-3 gap-2">
                        {["Apartment", "Villa", "Townhouse", "Penthouse", "Duplex", "Hotel Apartment", "Commercial", "Office", "Land"].map((type) => (
                          <label key={type} className="flex items-center gap-2 text-sm">
                            <input type="radio" name="property_type" checked={formData.property_type === type} onChange={() => handleChange("property_type", type)} />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Location Details</div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-4">
                        {/* City Name */}
                        <div>
                          <label className={labelRequiredCls}>City</label>
                          <input
                            className={getFieldClass("city_name")}
                            value={formData.city_name}
                            onChange={(e) => handleChange("city_name", e.target.value)}
                            onBlur={() => handleBlur("city_name")}
                            placeholder="Dubai"
                          />
                          {errors.city_name && touched.city_name && <span className="text-xs text-red-500">{errors.city_name}</span>}
                        </div>

                        {/* Community Name */}
                        <div>
                          <label className={labelRequiredCls}>Community</label>
                          <input
                            className={getFieldClass("community_name")}
                            value={formData.community_name}
                            onChange={(e) => handleChange("community_name", e.target.value)}
                            onBlur={() => handleBlur("community_name")}
                            placeholder="Palm Jumeirah"
                          />
                          {errors.community_name && touched.community_name && <span className="text-xs text-red-500">{errors.community_name}</span>}
                        </div>

                        {/* Sub Community */}
                        <div>
                          <label className={labelCls}>Sub Community</label>
                          <input className={fieldCls} value={formData.sub_community_name} onChange={(e) => handleChange("sub_community_name", e.target.value)} placeholder="Frond A" />
                        </div>

                        {/* Building Name */}
                        <div>
                          <label className={labelCls}>Building Name</label>
                          <input className={fieldCls} value={formData.BuildingName} onChange={(e) => handleChange("BuildingName", e.target.value)} placeholder="Palm Residence" />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mt-3">
                        <label className={labelCls}>Location (auto-generated)</label>
                        <input className={fieldCls} value={formData.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Auto-filled" />
                      </div>

                      {/* Address */}
                      <div className="mt-3">
                        <label className={labelCls}>Full Address</label>
                        <textarea
                          className="w-full border border-gray-300 bg-white px-2 py-2 text-sm rounded focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={formData.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                          placeholder="Full address"
                        />
                      </div>

                      {/* Coordinates */}
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className={labelCls}>Latitude</label>
                          <input className={fieldCls} value={formData.map_latitude} onChange={(e) => handleChange("map_latitude", e.target.value)} placeholder="25.1128" />
                        </div>
                        <div>
                          <label className={labelCls}>Longitude</label>
                          <input className={fieldCls} value={formData.map_longitude} onChange={(e) => handleChange("map_longitude", e.target.value)} placeholder="55.1392" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Description *</div>
                    <div className={boxBodyCls}>
                      <div className={`border rounded ${errors.description && touched.description ? "border-red-400" : "border-gray-300"}`}>
                        <SimpleTextEditor
                          value={formData.description}
                          onChange={handleDescriptionChange}
                          placeholder="Write detailed property description..."
                          minHeight="200px"
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500">Words: {descriptionWordCount}</span>
                        <span className={`text-xs ${descriptionWordCount < 50 ? "text-amber-600" : "text-green-600"}`}>
                          {descriptionWordCount < 50 ? `${50 - descriptionWordCount} more needed` : "✓ Good!"}
                        </span>
                      </div>
                      {errors.description && touched.description && <span className="text-xs text-red-500">{errors.description}</span>}
                    </div>
                  </div>

                  {/* Features */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Amenities & Features</div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Amenities (comma separated)</label>
                          <textarea className="w-full border border-gray-300 bg-white px-2 py-2 text-sm rounded" rows={3} value={formData.amenities} onChange={(e) => handleChange("amenities", e.target.value)} placeholder="Pool,Gym,Parking" />
                        </div>
                        <div>
                          <label className={labelCls}>Features (comma separated)</label>
                          <textarea className="w-full border border-gray-300 bg-white px-2 py-2 text-sm rounded" rows={3} value={formData.property_features} onChange={(e) => handleChange("property_features", e.target.value)} placeholder="Sea View,Private Pool" />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className={labelCls}>Status</label>
                          <select className={selectCls} value={formData.property_status} onChange={(e) => handleChange("property_status", e.target.value)}>
                            <option value="Ready">Ready</option>
                            <option value="Off Plan">Off Plan</option>
                            <option value="Under Construction">Under Construction</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Furnishing</label>
                          <select className={selectCls} value={formData.furnishing} onChange={(e) => handleChange("furnishing", e.target.value)}>
                            <option value="Fully Furnished">Fully Furnished</option>
                            <option value="Semi Furnished">Semi Furnished</option>
                            <option value="Unfurnished">Unfurnished</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Flooring</label>
                          <input className={fieldCls} value={formData.flooring} onChange={(e) => handleChange("flooring", e.target.value)} placeholder="Marble" />
                        </div>
                        <div>
                          <label className={labelCls}>Parking</label>
                          <input className={fieldCls} value={formData.parking} onChange={(e) => handleChange("parking", e.target.value)} placeholder="4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>SEO Analysis</div>
                    <div className={boxBodyCls}>
                      <SeoChecklist formData={formData} />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Quick Actions</div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={copyFormData} className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                          <Copy className="w-4 h-4" /> Copy Data
                        </button>
                        <button onClick={resetForm} className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                          <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button onClick={fetchProperty} className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                          <RefreshCw className="w-4 h-4" /> Reload
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 bg-white border border-gray-300 p-3 rounded-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push("/admin/properties")} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                    Cancel
                  </button>
                  {hasChanges && (
                    <span className="text-xs text-amber-600">You have unsaved changes</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {deletedGalleryIds.length > 0 && (
                    <span className="text-xs text-red-600">{deletedGalleryIds.length} image(s) will be deleted</span>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <><Save className="w-4 h-4" /> Update Property</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}