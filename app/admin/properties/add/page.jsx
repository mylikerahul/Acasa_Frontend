"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Eye,
  Globe,
} from "lucide-react";

import { toast, Toaster } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";
import SimpleTextEditor from "../../../components/common/SimpleTextEditor";

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

  // Location - TEXT FIELDS (required by backend)
  city: "",
  community: "",
  sub_community: "",
  location: "",
  address: "",
  BuildingName: "",
  StreetName: "",
  
  // Location IDs (for database relations)
  city_id: 1,
  community_id: 1,
  sub_community_id: 1,

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
};

// ==================== REQUIRED FIELDS ====================
const REQUIRED_FIELDS = [
  { field: "property_name", label: "Property Name" },
  { field: "price", label: "Price" },
  { field: "bedroom", label: "Bedrooms" },
  { field: "city", label: "City" },
  { field: "community", label: "Community" },
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

// ==================== SEO CHECKLIST COMPONENT ====================
function SeoChecklist({ formData }) {
  const descriptionWordCount = countWordsInHTML(formData.description);

  const checks = [
    { label: "Property name (min 10 chars)", passed: formData.property_name?.length >= 10 },
    { label: "Description (min 50 words)", passed: descriptionWordCount >= 50 },
    { label: "Price specified", passed: !!formData.price },
    { label: "Property type selected", passed: !!formData.property_type },
    { label: "City specified", passed: !!formData.city },
    { label: "Community specified", passed: !!formData.community },
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
export default function AddPropertyPage() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Images
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

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
      setAdmin(null);
      setIsAuthenticated(false);
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // Calculate SEO score
  const calculateSeoScore = useCallback(() => {
    let score = 0;
    const descriptionWordCount = countWordsInHTML(formData.description);

    if (formData.property_name?.length >= 10) score++;
    if (descriptionWordCount >= 50) score++;
    if (formData.price) score++;
    if (formData.property_type) score++;
    if (formData.city) score++;
    if (formData.community) score++;
    if (formData.bedroom) score++;
    if (formData.area) score++;

    setSeoScore(Math.round((score / 8) * 100));
  }, [formData]);

  useEffect(() => {
    calculateSeoScore();
  }, [calculateSeoScore]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug from property name
      if (field === "property_name") {
        updated.property_slug = generateSlug(value);
      }
      
      // Auto-generate location from city and community
      if (field === "city" || field === "community") {
        const city = field === "city" ? value : prev.city;
        const community = field === "community" ? value : prev.community;
        updated.location = [community, city].filter(Boolean).join(", ");
      }

      return updated;
    });

    // Clear error when field is filled
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
        showError(`Image ${f.name} size should be less than 5MB.`);
        return false;
      }
      return true;
    });

    if (type === "main" && validFiles[0]) {
      setSelectedMainImage(validFiles[0]);
      showSuccess("Featured image selected!");
    }
    if (type === "gallery") {
      setSelectedImages((prev) => {
        const total = prev.length + validFiles.length;
        if (total > 10) {
          showError("Maximum 10 images allowed.");
          return prev;
        }
        showSuccess(`${validFiles.length} images added!`);
        return [...prev, ...validFiles];
      });
    }
    e.target.value = "";
  }, []);

  const removeNewImage = useCallback((index, type) => {
    if (type === "main") {
      setSelectedMainImage(null);
      showSuccess("Featured image removed");
    } else {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
      showSuccess("Image removed");
    }
  }, []);

  // ==================== VALIDATION ====================
  const validateForm = useCallback(() => {
    const newErrors = {};
    const descriptionWordCount = countWordsInHTML(formData.description);

    if (!formData.property_name) newErrors.property_name = "Property name is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.bedroom) newErrors.bedroom = "Bedrooms is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.community) newErrors.community = "Community is required";
    if (descriptionWordCount < 10) newErrors.description = "Description is required (at least 10 words)";

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = "Price must be a valid number";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const missingLabels = Object.keys(newErrors).map(key => {
        const field = REQUIRED_FIELDS.find(f => f.field === key);
        return field ? field.label : key;
      });
      showError(`Please fill: ${missingLabels.join(", ")}`);
      return false;
    }

    return true;
  }, [formData]);

  const handleGenerateSlug = useCallback(() => {
    if (!formData.property_name) {
      showError("Please enter property name first");
      return;
    }
    const slug = generateSlug(formData.property_name);
    setFormData((prev) => ({ ...prev, property_slug: slug }));
    showSuccess("Slug generated!");
  }, [formData.property_name]);

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setSaving(true);
    const saveToastId = showLoadingToast("Saving property...");

    try {
      const fd = new FormData();

      // Build location string from city and community
      const locationString = [formData.community, formData.city].filter(Boolean).join(", ");

      // All fields to send - matching backend simpleCreateProperty requirements
      const propertyData = {
        // Required by backend
        property_name: formData.property_name,
        price: formData.price,
        bedroom: formData.bedroom,
        city: formData.city,           // Required TEXT field
        community: formData.community, // Required TEXT field
        
        // Optional but recommended
        property_slug: formData.property_slug || generateSlug(formData.property_name),
        listing_type: formData.listing_type || "sale",
        property_type: formData.property_type || "Apartment",
        property_purpose: formData.property_purpose || "Sale",
        
        // Pricing
        price_end: formData.price_end || "",
        askprice: formData.askprice || "0",
        currency_id: formData.currency_id || 1,
        
        // Property Details
        bathrooms: formData.bathrooms || "",
        area: formData.area || "",
        area_end: formData.area_end || "",
        area_size: formData.area_size || "Sq.Ft.",
        
        // Location details
        sub_community: formData.sub_community || "",
        location: locationString,
        address: formData.address || locationString,
        BuildingName: formData.BuildingName || "",
        StreetName: formData.StreetName || "",
        
        // Location IDs
        city_id: formData.city_id || 1,
        community_id: formData.community_id || 1,
        sub_community_id: formData.sub_community_id || 1,
        
        // Description
        description: formData.description || "",
        
        // Features
        amenities: formData.amenities || "",
        property_features: formData.property_features || "",
        parking: formData.parking || "",
        property_status: formData.property_status || "Ready",
        furnishing: formData.furnishing || "Fully Furnished",
        flooring: formData.flooring || "Marble",
        
        // IDs
        developer_id: formData.developer_id || 1,
        user_id: formData.user_id || 1,
        agent_id: formData.agent_id || "",
        
        // Status
        status: formData.status || 1,
        featured_property: formData.featured_property || "0",
        
        // Additional
        video_url: formData.video_url || "",
        map_latitude: formData.map_latitude || "",
        map_longitude: formData.map_longitude || "",
        rera_number: formData.rera_number || "",
        completion_date: formData.completion_date || "",
        unit_number: formData.unit_number || "",
        floor_number: formData.floor_number || "",
        dld_permit: formData.dld_permit || "",
      };

      // Append all fields to FormData
      Object.entries(propertyData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, value);
        }
      });

      // Add images
      if (selectedMainImage) {
        fd.append("featured_image", selectedMainImage);
      }

      selectedImages.forEach((img) => {
        fd.append("gallery_images", img);
      });

      const token = getAdminToken();
      if (!token) {
        showError("Please login to continue");
        handleAuthFailure();
        return;
      }

      // Use the simple endpoint that matches your backend
      const response = await fetch(`${API_BASE_URL}/api/v1/properties`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Create failed");
      }

      toast.dismiss(saveToastId);
      
      if (result.success) {
        showSuccess("Property created successfully!");
        setTimeout(() => {
          window.location.href = "/admin/properties";
        }, 1500);
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || "Failed to create property");
    } finally {
      setSaving(false);
    }
  }, [formData, selectedMainImage, selectedImages, validateForm, handleAuthFailure]);

  // ==================== UTILITY FUNCTIONS ====================
  const saveAsDraft = useCallback(() => {
    setFormData((prev) => ({ ...prev, status: 0 }));
    showWarning("Set as draft. Click Save to submit.");
  }, []);

  const copyFormData = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    showSuccess("Form data copied!");
  }, [formData]);

  const resetForm = useCallback(() => {
    if (window.confirm("Reset all form data?")) {
      setFormData(INITIAL_FORM_DATA);
      setSelectedMainImage(null);
      setSelectedImages([]);
      setErrors({});
      setTouched({});
      showSuccess("Form reset");
    }
  }, []);

  const fillSampleData = useCallback(() => {
    const sampleData = {
      ...INITIAL_FORM_DATA,
      property_name: "Luxury Villa Palm Jumeirah",
      property_slug: generateSlug("Luxury Villa Palm Jumeirah"),
      listing_type: "sale",
      property_type: "Villa",
      property_purpose: "Sale",
      price: "15000000",
      price_end: "16000000",
      bedroom: "5",
      bathrooms: "6",
      area: "8500",
      area_end: "9000",
      
      // Location TEXT fields (required by backend)
      city: "Dubai",
      community: "Palm Jumeirah",
      sub_community: "Frond A",
      location: "Palm Jumeirah, Dubai",
      address: "Palm Jumeirah, Frond A, Dubai, UAE",
      BuildingName: "Palm Residence",
      StreetName: "Frond A",
      
      // Location IDs
      city_id: 1,
      community_id: 1,
      sub_community_id: 1,
      
      description: `<p>Stunning 5 bedroom luxury villa with private beach access, swimming pool, and panoramic sea views.</p>
<p>Fully furnished with premium finishes. This exceptional property offers the finest waterfront living experience in Dubai's most prestigious address.</p>
<p>Features include a private elevator, home automation system, landscaped gardens, and direct beach access. The property boasts marble flooring throughout, floor-to-ceiling windows, and a state-of-the-art kitchen.</p>
<p>The master bedroom features a walk-in closet and an ensuite bathroom with jacuzzi. Additional amenities include private gym, sauna, and staff quarters.</p>`,
      amenities: "Private Beach,Swimming Pool,Gym,Sauna,Jacuzzi,Garden,Parking,Smart Home",
      property_features: "Sea View,Private Pool,Private Garden,Maids Room,Guest Room",
      parking: "4",
      property_status: "Ready",
      furnishing: "Fully Furnished",
      flooring: "Marble",
      status: 1,
      featured_property: "1",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      map_latitude: "25.1128",
      map_longitude: "55.1392",
      rera_number: "RERA123456",
      completion_date: "2024-12-31",
      unit_number: "Villa 45",
      floor_number: "G+2",
    };

    setFormData(sampleData);
    setErrors({});
    showSuccess("Sample data filled!");
  }, []);

  const getFieldClass = useCallback(
    (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
      return errors[field] && touched[field] ? errorClass : baseClass;
    },
    [errors, touched]
  );

  // ==================== LOADING STATE ====================
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

  const descriptionWordCount = countWordsInHTML(formData.description);

  return (
    <>
      <Toaster position="top-right" />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="max-w-[1250px] mx-auto px-3">
          {/* Top Control Bar */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">Add New Property</h1>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => window.history.forward()}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                >
                  <ArrowRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 border border-gray-200 px-3 py-1 rounded">
                  <Globe className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">SEO:</span>
                  <span className={`ml-1 text-sm font-bold ${seoScore >= 80 ? "text-green-600" : seoScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {seoScore}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fillSampleData}
                  className="px-4 py-2 text-sm font-medium border border-blue-300 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Fill Sample
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
                  {/* Featured + Status */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("featured_property", formData.featured_property === "1" ? "0" : "1")}
                          className={`h-9 border border-gray-300 rounded text-sm ${formData.featured_property === "1" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}
                        >
                          Featured
                        </button>

                        <select
                          className={selectCls}
                          value={formData.status}
                          onChange={(e) => handleChange("status", e.target.value)}
                        >
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
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Property Name</label>
                          <div className="col-span-8">
                            <input
                              className={getFieldClass("property_name")}
                              value={formData.property_name || ""}
                              onChange={(e) => handleChange("property_name", e.target.value)}
                              onBlur={() => handleBlur("property_name")}
                              placeholder="Enter property name"
                            />
                            {errors.property_name && touched.property_name && (
                              <span className="text-xs text-red-500">{errors.property_name}</span>
                            )}
                          </div>
                        </div>

                        {/* Property Slug */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Slug</label>
                          <div className="col-span-8 flex gap-1">
                            <input
                              className={fieldCls}
                              value={formData.property_slug || ""}
                              onChange={(e) => handleChange("property_slug", e.target.value)}
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={handleGenerateSlug}
                              className="h-9 px-3 border border-gray-300 bg-white text-xs rounded hover:bg-gray-50 whitespace-nowrap"
                            >
                              Generate
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Price (AED)</label>
                          <div className="col-span-8">
                            <input
                              className={getFieldClass("price")}
                              type="number"
                              value={formData.price || ""}
                              onChange={(e) => handleChange("price", e.target.value)}
                              onBlur={() => handleBlur("price")}
                              placeholder="15000000"
                            />
                            {errors.price && touched.price && (
                              <span className="text-xs text-red-500">{errors.price}</span>
                            )}
                          </div>
                        </div>

                        {/* Price End */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Price End</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.price_end || ""}
                              onChange={(e) => handleChange("price_end", e.target.value)}
                              placeholder="16000000"
                            />
                          </div>
                        </div>

                        {/* Bedrooms */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Bedrooms</label>
                          <div className="col-span-8">
                            <select
                              className={getFieldClass("bedroom", selectCls, selectErrorCls)}
                              value={formData.bedroom}
                              onChange={(e) => handleChange("bedroom", e.target.value)}
                              onBlur={() => handleBlur("bedroom")}
                            >
                              <option value="">Select</option>
                              <option value="Studio">Studio</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7+">7+</option>
                            </select>
                            {errors.bedroom && touched.bedroom && (
                              <span className="text-xs text-red-500">{errors.bedroom}</span>
                            )}
                          </div>
                        </div>

                        {/* Bathrooms */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Bathrooms</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.bathrooms || ""}
                              onChange={(e) => handleChange("bathrooms", e.target.value)}
                              placeholder="6"
                            />
                          </div>
                        </div>

                        {/* Area */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Area (Sq.Ft.)</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.area || ""}
                              onChange={(e) => handleChange("area", e.target.value)}
                              placeholder="8500"
                            />
                          </div>
                        </div>

                        {/* RERA Number */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>RERA Number</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              value={formData.rera_number || ""}
                              onChange={(e) => handleChange("rera_number", e.target.value)}
                              placeholder="RERA123456"
                            />
                          </div>
                        </div>

                        {/* Unit Number */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Unit Number</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              value={formData.unit_number || ""}
                              onChange={(e) => handleChange("unit_number", e.target.value)}
                              placeholder="Villa 45"
                            />
                          </div>
                        </div>
                        
                        {/* Floor Number */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Floor</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              value={formData.floor_number || ""}
                              onChange={(e) => handleChange("floor_number", e.target.value)}
                              placeholder="G+2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Video Link</div>
                    <div className={boxBodyCls}>
                      <input
                        className={fieldCls}
                        value={formData.video_url || ""}
                        onChange={(e) => handleChange("video_url", e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Images</div>
                    <div className={boxBodyCls}>
                      <div className="text-sm text-gray-700 mb-2">Featured Image</div>
                      {selectedMainImage && (
                        <div className="mb-2 relative">
                          <img
                            src={URL.createObjectURL(selectedMainImage)}
                            alt="Main"
                            className="w-full h-28 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(null, "main")}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "main")}
                        className="text-xs"
                      />

                      <div className="mt-4 text-sm text-gray-700 mb-2">
                        Gallery ({selectedImages.length}/10)
                      </div>
                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {selectedImages.map((img, i) => (
                            <div key={i} className="relative">
                              <img
                                src={URL.createObjectURL(img)}
                                alt={`Gallery ${i}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(i, "gallery")}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, "gallery")}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  {/* Listing Type + Property Type */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="text-sm font-semibold text-gray-800 mb-2">Listing Type *</div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {[["sale", "For Sale"], ["rent", "For Rent"], ["Off plan", "Off Plan"]].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="listing_type"
                              checked={formData.listing_type === val}
                              onChange={() => handleChange("listing_type", val)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>

                      <div className="mt-4 text-sm font-semibold text-gray-800 mb-2">Property Purpose *</div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {[["Sale", "Sale"], ["Rent", "Rent"]].map(([val, label]) => (
                          <label key={val} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="property_purpose"
                              checked={formData.property_purpose === val}
                              onChange={() => handleChange("property_purpose", val)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>

                      <div className="mt-4 text-sm font-semibold text-gray-800 mb-2">Property Type *</div>
                      <div className="grid grid-cols-3 gap-2">
                        {["Apartment", "Villa", "Townhouse", "Penthouse", "Duplex", "Hotel Apartment", "Commercial", "Office", "Land"].map((type) => (
                          <label key={type} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="property_type"
                              checked={formData.property_type === type}
                              onChange={() => handleChange("property_type", type)}
                            />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Location Details</div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-4">
                        {/* City - REQUIRED */}
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>City</label>
                          <input
                            className={getFieldClass("city")}
                            value={formData.city || ""}
                            onChange={(e) => handleChange("city", e.target.value)}
                            onBlur={() => handleBlur("city")}
                            placeholder="Dubai"
                          />
                          {errors.city && touched.city && (
                            <span className="text-xs text-red-500">{errors.city}</span>
                          )}
                        </div>

                        {/* Community - REQUIRED */}
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Community</label>
                          <input
                            className={getFieldClass("community")}
                            value={formData.community || ""}
                            onChange={(e) => handleChange("community", e.target.value)}
                            onBlur={() => handleBlur("community")}
                            placeholder="Palm Jumeirah"
                          />
                          {errors.community && touched.community && (
                            <span className="text-xs text-red-500">{errors.community}</span>
                          )}
                        </div>

                        {/* Sub Community */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Sub Community</label>
                          <input
                            className={fieldCls}
                            value={formData.sub_community || ""}
                            onChange={(e) => handleChange("sub_community", e.target.value)}
                            placeholder="Frond A"
                          />
                        </div>

                        {/* Building Name */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Building Name</label>
                          <input
                            className={fieldCls}
                            value={formData.BuildingName || ""}
                            onChange={(e) => handleChange("BuildingName", e.target.value)}
                            placeholder="Palm Residence"
                          />
                        </div>
                      </div>

                      {/* Location (auto-generated) */}
                      <div className="mt-3">
                        <label className={`${labelCls} block mb-1`}>Location</label>
                        <input
                          className={fieldCls}
                          value={formData.location || ""}
                          onChange={(e) => handleChange("location", e.target.value)}
                          placeholder="Auto-generated from City & Community"
                        />
                        <span className="text-xs text-gray-500">Auto-filled from City & Community</span>
                      </div>

                      {/* Full Address */}
                      <div className="mt-3">
                        <label className={`${labelCls} block mb-1`}>Full Address</label>
                        <textarea
                          className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          rows={2}
                          value={formData.address || ""}
                          onChange={(e) => handleChange("address", e.target.value)}
                          placeholder="Palm Jumeirah, Frond A, Dubai, UAE"
                        />
                      </div>

                      {/* Map Coordinates */}
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className={`${labelCls} block mb-1`}>Latitude</label>
                          <input
                            className={fieldCls}
                            value={formData.map_latitude || ""}
                            onChange={(e) => handleChange("map_latitude", e.target.value)}
                            placeholder="25.1128"
                          />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-1`}>Longitude</label>
                          <input
                            className={fieldCls}
                            value={formData.map_longitude || ""}
                            onChange={(e) => handleChange("map_longitude", e.target.value)}
                            placeholder="55.1392"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description with SimpleTextEditor */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Description *</div>
                    <div className={boxBodyCls}>
                      <div className={`border rounded ${errors.description && touched.description ? "border-red-400" : "border-gray-300"}`}>
                        <SimpleTextEditor
                          value={formData.description || ""}
                          onChange={handleDescriptionChange}
                          placeholder="Write detailed property description... (minimum 50 words recommended for SEO)"
                          minHeight="200px"
                        />
                      </div>

                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500">Words: {descriptionWordCount}</span>
                        <span className={`text-xs ${descriptionWordCount < 50 ? "text-amber-600" : "text-green-600"}`}>
                          {descriptionWordCount < 50 ? `${50 - descriptionWordCount} more needed` : "✓ Good!"}
                        </span>
                      </div>

                      {errors.description && touched.description && (
                        <span className="text-xs text-red-500 block mt-1">{errors.description}</span>
                      )}
                    </div>
                  </div>

                  {/* Amenities & Features */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Amenities & Features</div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`${labelCls} block mb-2`}>Amenities (comma separated)</label>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                            rows={3}
                            value={formData.amenities || ""}
                            onChange={(e) => handleChange("amenities", e.target.value)}
                            placeholder="Pool,Gym,Parking,Garden"
                          />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Features (comma separated)</label>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                            rows={3}
                            value={formData.property_features || ""}
                            onChange={(e) => handleChange("property_features", e.target.value)}
                            placeholder="Sea View,Private Pool,Maids Room"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className={`${labelCls} block mb-2`}>Status</label>
                          <select className={selectCls} value={formData.property_status} onChange={(e) => handleChange("property_status", e.target.value)}>
                            <option value="Ready">Ready</option>
                            <option value="Off Plan">Off Plan</option>
                            <option value="Under Construction">Under Construction</option>
                          </select>
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Furnishing</label>
                          <select className={selectCls} value={formData.furnishing} onChange={(e) => handleChange("furnishing", e.target.value)}>
                            <option value="Fully Furnished">Fully Furnished</option>
                            <option value="Semi Furnished">Semi Furnished</option>
                            <option value="Unfurnished">Unfurnished</option>
                          </select>
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Flooring</label>
                          <input className={fieldCls} value={formData.flooring} onChange={(e) => handleChange("flooring", e.target.value)} placeholder="Marble" />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Parking</label>
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
                      <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={saveAsDraft} className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                          <Save className="w-4 h-4" /> Draft
                        </button>
                        <button type="button" onClick={copyFormData} className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                          <Copy className="w-4 h-4" /> Copy
                        </button>
                        <button type="button" onClick={resetForm} className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                          <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button type="button" onClick={fillSampleData} className="h-9 border border-blue-300 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 flex items-center justify-center gap-1">
                          <Upload className="w-4 h-4" /> Sample
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Bar */}
              <div className="mt-3 bg-white border border-gray-300 p-3 rounded-b flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => (window.location.href = "/admin/properties")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">
                    {REQUIRED_FIELDS.filter(({ field }) => {
                      const value = formData[field];
                      if (field === "description") return countWordsInHTML(value) < 10;
                      return !value;
                    }).length} required fields remaining
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Property
                      </>
                    )}
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