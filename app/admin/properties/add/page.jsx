"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Upload,
  Copy,
  RotateCcw,
  Save,
  ChevronDown, // Added for dropdown/overview
  Eye,
  Globe,
  RefreshCw, // Added for refresh button
} from "lucide-react";
// Replaced react-toastify with react-hot-toast
import { toast, Toaster } from "react-hot-toast"; 
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar"; // Path corrected assuming it's in a common location

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION (copied from AgentsPage) ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, { // Corrected endpoint
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// ==================== INITIAL FORM DATA (DATABASE SCHEMA COMPATIBLE) ====================
const INITIAL_FORM_DATA = {
  // Basic Info - REQUIRED
  property_name: "",
  property_slug: "",
  listing_type: "sale",
  property_type: "Apartment",
  property_purpose: "Sale",
  
  // Pricing - REQUIRED
  price: "",
  price_end: "",
  askprice: "0",
  currency_id: 1, // Assuming default currency ID
  
  // Property Details - REQUIRED
  bedroom: "",
  bathrooms: "",
  area: "",
  area_end: "",
  area_size: "Sq.Ft.",
  
  // Location - REQUIRED
  city: "",
  community: "",
  sub_community: "",
  location: "",
  address: "",
  
  // Description - REQUIRED
  description: "",
  
  // Features
  amenities: "",
  property_features: "",
  parking: "",
  property_status: "Ready",
  furnishing: "Fully Furnished",
  flooring: "Marble",
  
  // IDs - Assuming default values for new properties
  developer_id: 1,
  user_id: 1,
  agent_id: "",
  
  // Status
  status: 1, // 1 for active, 0 for inactive, 2 for draft
  featured_property: "0", // "1" for featured, "0" for not featured
  
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

// ==================== REQUIRED FIELDS LIST ====================
const REQUIRED_FIELDS = [
  { field: "property_name", label: "Property Name" },
  { field: "property_slug", label: "Property Slug" },
  { field: "listing_type", label: "Listing Type" },
  { field: "property_type", label: "Property Type" },
  { field: "property_purpose", label: "Property Purpose" },
  { field: "price", label: "Price" },
  { field: "bedroom", label: "Bedrooms" },
  { field: "bathrooms", label: "Bathrooms" },
  { field: "area", label: "Area" },
  { field: "city", label: "City" },
  { field: "community", label: "Community" },
  { field: "location", label: "Location" },
  { field: "address", label: "Address" },
  { field: "description", label: "Description" },
];

// ==================== STYLES (Adjusted for consistency) ====================
const labelCls = "text-sm text-gray-700"; // Changed text-[12px] to text-sm
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5"; // Changed text-[12px] to text-sm
const fieldCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"; // Changed text-[12px] to text-sm, added rounded
const fieldErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded"; // Changed text-[12px] to text-sm, added rounded
const selectCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"; // Changed text-[12px] to text-sm, added rounded
const selectErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded"; // Changed text-[12px] to text-sm, added rounded
const boxCls = "border border-gray-300 bg-white rounded"; // Added rounded
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800"; // Changed text-[13px] to text-sm
const boxBodyCls = "p-3";

// ==================== SEO CHECKLIST COMPONENT ====================
function SeoChecklist({ formData }) {
  const checks = [
    {
      label: "Property name is descriptive (min 10 chars)",
      passed: formData.property_name && formData.property_name.length >= 10
    },
    {
      label: "Description has at least 50 words",
      passed: formData.description && formData.description.split(/\s+/).filter(Boolean).length >= 50
    },
    {
      label: "Price is specified",
      passed: !!formData.price
    },
    {
      label: "Property type is selected",
      passed: !!formData.property_type
    },
    {
      label: "Location is specified",
      passed: !!(formData.location && formData.city)
    },
    {
      label: "Area is specified",
      passed: !!formData.area
    },
    {
      label: "Bedrooms specified",
      passed: !!formData.bedroom
    },
    {
      label: "Amenities added",
      passed: formData.amenities && formData.amenities.length > 10
    }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const percentage = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">SEO Score</span> {/* Changed text-[12px] to text-sm */}
        <span className={`text-sm font-bold ${ // Changed text-[12px] to text-sm
          percentage >= 80 ? 'text-green-600' :
          percentage >= 60 ? 'text-amber-600' : 'text-red-600'
        }`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div 
          className={`h-2 rounded transition-all ${
            percentage >= 80 ? 'bg-green-500' :
            percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-2 text-xs text-gray-700 py-1"> {/* Changed text-[11px] to text-xs */}
            {check.passed ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className={check.passed ? "text-green-700" : "text-red-700"}>
              {check.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== VALIDATION INDICATOR ====================
function ValidationIndicator({ formData }) {
  const missingFields = REQUIRED_FIELDS.filter(({ field }) => !formData[field]);
  const completedCount = REQUIRED_FIELDS.length - missingFields.length;
  const percentage = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

  return (
    <div className="bg-white border border-gray-300 rounded p-3 mb-3"> {/* Added rounded */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Form Completion</span> {/* Changed text-[12px] to text-sm */}
        <span className={`text-sm font-bold ${ // Changed text-[12px] to text-sm
          percentage === 100 ? 'text-green-600' :
          percentage >= 70 ? 'text-amber-600' : 'text-red-600'
        }`}>
          {completedCount}/{REQUIRED_FIELDS.length} fields
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded mb-2">
        <div 
          className={`h-2 rounded transition-all ${
            percentage === 100 ? 'bg-green-500' :
            percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {missingFields.length > 0 && (
        <div className="text-xs text-red-600"> {/* Changed text-[11px] to text-xs */}
          Missing: {missingFields.map(f => f.label).join(", ")}
        </div>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AddPropertyPage() {
  // Navbar/Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form state
  const [activeTab, setActiveTab] = useState("details"); // Note: Tabs are not fully implemented visually in this refactor, but kept for future use if needed.
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Images
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // ==================== AUTHENTICATION (copied from AgentsPage) ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        if (sessionType === "user") {
          toast.error("Please login as admin to access this dashboard");
        } else {
          toast.error("Please login to access dashboard");
        }
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        toast.error("Please login to access dashboard");
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        toast.error("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        console.error("Token verification error:", verifyError);
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.userType !== "admin") {
          toast.error("Invalid session type. Please login as admin.");
          handleAuthFailure();
          return;
        }

        const adminData = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || "admin",
          userType: payload.userType,
          avatar: null,
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        console.error("Token decode error:", e);
        toast.error("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      toast.error("Authentication failed. Please login again.");
      handleAuthFailure();
    }
  }, []);

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToast = showLoadingToast("Logging out...");
    
    try {
      const token = getAdminToken();
      
      await fetch(
        `${API_BASE_URL}/api/v1/users/logout`, // Corrected endpoint for logout
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      ).catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
      toast.dismiss(logoutToast); // Dismiss toast on error
      showError("Logout failed. Please try again.");
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      toast.dismiss(logoutToast); // Dismiss toast on success
      showSuccess("Logged out successfully"); // Show success toast
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // Calculate SEO score
  useEffect(() => {
    calculateSeoScore();
  }, [formData]);

  const calculateSeoScore = () => {
    let score = 0;
    const totalChecks = 8;

    if (formData.property_name && formData.property_name.length >= 10) score++;
    if (formData.description && formData.description.split(/\s+/).filter(Boolean).length >= 50) score++;
    if (formData.price) score++;
    if (formData.property_type) score++;
    if (formData.location && formData.city) score++;
    if (formData.area) score++;
    if (formData.bedroom) score++;
    if (formData.amenities && formData.amenities.length > 10) score++;

    setSeoScore(Math.round((score / totalChecks) * 100));
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== FORM HANDLERS ====================
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    
    // Auto-generate slug from property name
    if (field === "property_name") {
      const slug = (value || "")
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-");
      updated.property_slug = slug;
    }
    
    setFormData(updated);
    
    // Clear error when field is filled
    if (value && errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (REQUIRED_FIELDS.find(f => f.field === field) && !formData[field]) {
      setErrors(prev => ({ ...prev, [field]: "This field is required" }));
    }
  };

  const handleImageUpload = (e, type) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
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
      const total = selectedImages.length + validFiles.length;
      if (total > 10) {
        showError("Maximum 10 images allowed in gallery.");
        return;
      }
      setSelectedImages((prev) => [...prev, ...validFiles]);
      showSuccess(`${validFiles.length} images added to gallery!`);
    }
    e.target.value = ""; // Clear file input
  };

  const removeNewImage = (index, type) => {
    if (type === "main") {
      setSelectedMainImage(null);
      showSuccess("Featured image removed");
    } else {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
      showSuccess("Gallery image removed");
    }
  };

  // ==================== VALIDATION ====================
  const validateForm = () => {
    const newErrors = {};
    
    REQUIRED_FIELDS.forEach(({ field, label }) => {
      if (!formData[field]) {
        newErrors[field] = `${label} is required`;
      }
    });

    // Additional validations
    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = "Price must be a valid number";
    }

    if (formData.area && isNaN(Number(formData.area))) {
      newErrors.area = "Area must be a valid number";
    }
    
    const descriptionWordCount = formData.description?.split(/\s+/).filter(Boolean).length || 0;
    if (descriptionWordCount < 50) { // Changed to 50 for better SEO practice
      newErrors.description = `Description should have at least 50 words (${descriptionWordCount}/50)`;
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const missingLabels = Object.keys(newErrors).map(key => {
        const found = REQUIRED_FIELDS.find(f => f.field === key);
        return found ? found.label : key;
      });
      showError(`Please fill required fields: ${missingLabels.slice(0, 3).join(", ")}${missingLabels.length > 3 ? '...' : ''}`);
      return false;
    }
    
    return true;
  };

  const generateSlug = () => {
    if (!formData.property_name) {
      showError("Please enter property name first");
      return;
    }
    
    const slug = formData.property_name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");
      // Removed Date.now() from slug generation for cleaner slugs, can be added if uniqueness is an issue for initial save.
    
    setFormData(prev => ({ ...prev, property_slug: slug }));
    showSuccess("Property slug generated successfully!");
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const saveToastId = showLoadingToast("Saving property...");

    try {
      // Prepare FormData for multipart request
      const fd = new FormData();
      
      // Add all form fields
      const databaseFields = [
        'property_name', 'property_slug', 'listing_type', 'property_type', 'property_purpose',
        'price', 'price_end', 'askprice', 'currency_id', 'bedroom', 'bathrooms',
        'area', 'area_end', 'area_size', 'city', 'community', 'sub_community',
        'location', 'address', 'description', 'amenities', 'property_features',
        'parking', 'property_status', 'furnishing', 'flooring', 'developer_id',
        'user_id', 'agent_id', 'status', 'featured_property', 'video_url',
        'map_latitude', 'map_longitude', 'rera_number', 'completion_date',
        'unit_number', 'floor_number', 'dld_permit'
      ];
      
      databaseFields.forEach(field => {
        const value = formData[field];
        if (value !== null && value !== undefined && value !== "") {
          fd.append(field, typeof value === 'boolean' ? String(value) : value);
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

      const response = await fetch(`${API_BASE_URL}/api/v1/properties`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' is typically set automatically by browser when FormData is used.
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
          window.location.href = "/admin/properties"; // Redirect to property list
        }, 1500);
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || "Failed to create property");
    } finally {
      setSaving(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const saveAsDraft = () => {
    setFormData(prev => ({ ...prev, status: 0 })); // Assuming 0 is draft/inactive status
    showWarning("Set as draft. Click Save to submit.");
  };

  const copyFormData = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    showSuccess("Form data copied to clipboard!");
  };

  const resetForm = () => {
    if (window.confirm("Are you sure you want to reset all form data?")) {
      setFormData(INITIAL_FORM_DATA);
      setSelectedMainImage(null);
      setSelectedImages([]);
      setErrors({});
      setTouched({});
      showSuccess("Form reset successfully");
    }
  };

  const previewProperty = () => {
    if (!formData.property_slug) {
      showError("Please generate a slug first");
      return;
    }
    
    const url = `${window.location.origin}/properties/${formData.property_slug}`;
    window.open(url, '_blank');
  };

  const fillSampleData = () => {
    const sampleData = {
      property_name: "Luxury Villa Palm Jumeirah",
      property_slug: "luxury-villa-palm-jumeirah-" + Date.now(), // Unique slug
      listing_type: "sale",
      property_type: "Villa",
      property_purpose: "Sale",
      price: "15000000",
      price_end: "16000000",
      askprice: "0",
      currency_id: 1,
      bedroom: "5",
      bathrooms: "6",
      area: "8500",
      area_end: "9000",
      area_size: "Sq.Ft.",
      city: "Dubai",
      community: "Palm Jumeirah",
      sub_community: "Frond A",
      location: "Palm Jumeirah, Dubai",
      address: "Palm Jumeirah, Frond A, Dubai, UAE",
      description: "Stunning 5 bedroom luxury villa with private beach access, swimming pool, and panoramic sea views. Fully furnished with premium finishes. This exceptional property offers the finest waterfront living experience in Dubai's most prestigious address. Features include a private elevator, home automation system, landscaped gardens, and direct beach access. This is a very detailed description to ensure it meets SEO word count recommendations.", // Ensure enough words
      amenities: "Private Beach,Swimming Pool,Gym,Sauna,Jacuzzi,Garden,Parking,Smart Home",
      property_features: "Sea View,Private Pool,Private Garden,Maids Room,Guest Room",
      parking: "4",
      property_status: "Ready",
      furnishing: "Fully Furnished",
      flooring: "Marble",
      developer_id: 1,
      user_id: 1,
      status: 1,
      featured_property: "1",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Sample YouTube video
      map_latitude: "25.1128",
      map_longitude: "55.1392",
      rera_number: "RERA123456",
      completion_date: "2024-12-31",
      unit_number: "Villa 45",
      floor_number: "G+2"
    };
    
    setFormData(sampleData);
    setErrors({});
    showSuccess("Sample data filled!");
  };

  // Helper function to get field classes
  const getFieldClass = (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
    return errors[field] && touched[field] ? errorClass : baseClass;
  };

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
    return null; // Should redirect via handleAuthFailure
  }

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
      
      {/* AdminNavbar - consistent with AgentsPage */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4"> {/* Consistent background and padding */}
        <div className="max-w-[1250px] mx-auto px-3"> {/* Adjusted padding */}
          {/* Top Control Bar - consistent with AgentsPage */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">Add New Property</h1> {/* Larger heading */}
                
                {/* Back/Forward Nav Buttons */}
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => window.history.forward()}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
                  title="Forward"
                >
                  <ArrowRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* SEO Score Display */}
                <div className="flex items-center bg-gray-100 border border-gray-200 px-3 py-1 rounded">
                  <Globe className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">SEO Score:</span>
                  <span className={`ml-1 text-sm font-bold ${
                    seoScore >= 80 ? 'text-green-600' :
                    seoScore >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {seoScore}%
                  </span>
                </div>
                
                {/* Fill Sample Data */}
                <button
                  type="button"
                  onClick={fillSampleData}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium border border-blue-300 bg-blue-50 text-blue-700 rounded hover:bg-blue-100" // AgentsPage button style
                >
                  Fill Sample Data
                </button>
                
                {/* Preview Button */}
                {formData.property_slug && (
                  <button
                    type="button"
                    onClick={previewProperty}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50" // AgentsPage button style
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                )}
              </div>
            </div>

            {/* Validation Indicator */}
            <ValidationIndicator formData={formData} />
          </div>

          {/* Form Content - Main container consistent with AgentsPage */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}> {/* Consistent table background */}
            <div className="p-3"> {/* Padding for content within this background */}
              {/* Note: Tabs structure is simplified here as the original tabs had minimal content difference */}
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
                          className={`h-9 border border-gray-300 rounded text-sm ${ // Added rounded, text-sm
                            formData.featured_property === "1" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700" // Amber for featured
                          }`}
                        >
                          Featured
                        </button>

                        <select
                          className={selectCls}
                          value={formData.status}
                          onChange={(e) => handleChange("status", e.target.value)}
                          title="Status"
                        >
                          <option value={1}>Active</option>
                          <option value={0}>Inactive</option>
                          <option value={2}>Draft</option>
                        </select>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Toggle featured & set status</div> {/* Changed text-[11px] to text-xs */}
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
                          <label className={`${labelRequiredCls} col-span-4`}>Property Slug</label>
                          <div className="col-span-8 flex gap-1">
                            <input 
                              className={getFieldClass("property_slug")}
                              value={formData.property_slug || ""} 
                              onChange={(e) => handleChange("property_slug", e.target.value)}
                              onBlur={() => handleBlur("property_slug")}
                            />
                            <button type="button" onClick={generateSlug} className="h-9 px-3 border border-gray-300 bg-white text-xs rounded hover:bg-gray-50 whitespace-nowrap"> {/* Changed text-[11px] to text-xs, added rounded, h-9 */}
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

                        {/* Price End (Optional) */}
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

                        {/* Ask to Price */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Ask to Price</label>
                          <div className="col-span-8">
                            <select className={selectCls} value={formData.askprice} onChange={(e) => handleChange("askprice", e.target.value)}>
                              <option value="0">No</option>
                              <option value="1">Yes</option>
                            </select>
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
                          <label className={`${labelRequiredCls} col-span-4`}>Bathrooms</label>
                          <div className="col-span-8">
                            <input 
                              className={getFieldClass("bathrooms")}
                              value={formData.bathrooms || ""} 
                              onChange={(e) => handleChange("bathrooms", e.target.value)}
                              onBlur={() => handleBlur("bathrooms")}
                              placeholder="6"
                            />
                            {errors.bathrooms && touched.bathrooms && (
                              <span className="text-xs text-red-500">{errors.bathrooms}</span> 
                            )}
                          </div>
                        </div>

                        {/* Area */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Area (Sq.Ft.)</label>
                          <div className="col-span-8">
                            <input 
                              className={getFieldClass("area")}
                              type="number" 
                              value={formData.area || ""} 
                              onChange={(e) => handleChange("area", e.target.value)}
                              onBlur={() => handleBlur("area")}
                              placeholder="8500"
                            />
                            {errors.area && touched.area && (
                              <span className="text-xs text-red-500">{errors.area}</span> 
                            )}
                          </div>
                        </div>

                        {/* Area End (Optional) */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Area End</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              type="number" 
                              value={formData.area_end || ""} 
                              onChange={(e) => handleChange("area_end", e.target.value)}
                              placeholder="9000"
                            />
                          </div>
                        </div>

                        {/* DLD Permit */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>DLD Permit</label>
                          <div className="col-span-8">
                            <input className={fieldCls} value={formData.dld_permit || ""} onChange={(e) => handleChange("dld_permit", e.target.value)} />
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
                          <label className={`${labelCls} col-span-4`}>Floor Number</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.floor_number || ""} 
                              onChange={(e) => handleChange("floor_number", e.target.value)}
                              placeholder="G+2"
                            />
                          </div>
                        </div>

                        {/* Completion Date */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Completion Date</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              type="date"
                              value={formData.completion_date || ""} 
                              onChange={(e) => handleChange("completion_date", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Agent</div>
                    <div className={boxBodyCls}>
                      <input className={fieldCls} value={formData.agent_id || ""} onChange={(e) => handleChange("agent_id", e.target.value)} placeholder="Agent ID" />
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
                      {/* Featured Image */}
                      <div className="text-sm text-gray-700 mb-2">Featured Image</div> {/* Changed text-[12px] to text-sm */}
                      {selectedMainImage && (
                        <div className="mb-2">
                          <div className="relative group">
                            <div className="relative overflow-hidden border border-gray-300 bg-white ring-1 ring-blue-400 rounded"> {/* Added rounded */}
                              <img src={URL.createObjectURL(selectedMainImage)} alt="Main" className="w-full h-28 object-cover" />
                              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full"> {/* Added rounded-full, text-xs */}
                                Featured Image
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewImage(null, "main")}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full" // Added rounded-full
                                title="Delete image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "main")} className="text-xs" /> {/* Changed text-[11px] to text-xs */}

                      {/* Gallery Images */}
                      <div className="mt-4 text-sm text-gray-700 mb-2"> {/* Changed text-[12px] to text-sm */}
                        Gallery Images ({selectedImages.length}/10)
                      </div>
                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {selectedImages.map((img, i) => (
                            <div key={i} className="relative group">
                              <div className="relative overflow-hidden border border-gray-300 bg-white rounded"> {/* Added rounded */}
                                <img src={URL.createObjectURL(img)} alt={`Gallery ${i}`} className="w-full h-28 object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(i, "gallery")}
                                  className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-full" // Added rounded-full
                                  title="Delete image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, "gallery")} className="text-xs" /> {/* Changed text-[11px] to text-xs */}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  {/* Listing type + Property Purpose + Property Type */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="text-sm font-semibold text-gray-800 mb-2"> {/* Changed text-[13px] to text-sm */}
                        Listing Type <span className="text-red-500">*</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-800"> {/* Changed text-[12px] to text-sm */}
                        {[
                          ["sale", "For Sale"],
                          ["rent", "For Rent"],
                          ["Off plan", "Off Plan"],
                          ["Ready", "Ready"],
                        ].map(([val, label]) => (
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

                      <div className="mt-4 text-sm font-semibold text-gray-800 mb-2"> {/* Changed text-[13px] to text-sm */}
                        Property Purpose <span className="text-red-500">*</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-800"> {/* Changed text-[12px] to text-sm */}
                        {[
                          ["Sale", "Sale"],
                          ["Rent", "Rent"],
                        ].map(([val, label]) => (
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

                      <div className="mt-4 text-sm font-semibold text-gray-800 mb-2"> {/* Changed text-[13px] to text-sm */}
                        Property Type <span className="text-red-500">*</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          "Apartment", "Villa", "Townhouse",
                          "Penthouse", "Duplex", "Hotel Apartment",
                          "Commercial", "Office", "Land"
                        ].map(type => (
                          <label key={type} className="flex items-center gap-2 text-sm"> {/* Changed text-[12px] to text-sm */}
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
                        {/* City */}
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

                        {/* Community */}
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

                        {/* Location */}
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Location</label>
                          <input 
                            className={getFieldClass("location")}
                            value={formData.location || ""} 
                            onChange={(e) => handleChange("location", e.target.value)}
                            onBlur={() => handleBlur("location")}
                            placeholder="Palm Jumeirah, Dubai"
                          />
                          {errors.location && touched.location && (
                            <span className="text-xs text-red-500">{errors.location}</span>
                          )}
                        </div>
                      </div>

                      {/* Address */}
                      <div className="mt-3">
                        <label className={`${labelRequiredCls} block mb-1`}>Full Address</label>
                        <textarea
                          className={`w-full border ${errors.address && touched.address ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded`} // Added rounded, text-sm
                          rows={2}
                          value={formData.address || ""}
                          onChange={(e) => handleChange("address", e.target.value)}
                          onBlur={() => handleBlur("address")}
                          placeholder="Palm Jumeirah, Frond A, Dubai, UAE"
                        />
                        {errors.address && touched.address && (
                          <span className="text-xs text-red-500">{errors.address}</span>
                        )}
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

                  {/* Description */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>
                      Description <span className="text-red-500">*</span>
                    </div>
                    <div className={boxBodyCls}>
                      <textarea
                        className={`w-full border ${errors.description && touched.description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded`} // Added rounded, text-sm
                        rows={6}
                        value={formData.description || ""}
                        onChange={(e) => handleChange("description", e.target.value)}
                        onBlur={() => handleBlur("description")}
                        placeholder="Write detailed property description... (minimum 50 words recommended)"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500"> 
                          Words: {formData.description?.split(/\s+/).filter(Boolean).length || 0}
                        </span>
                        <span className={`text-xs ${ // Changed text-[11px] to text-xs
                          (formData.description?.split(/\s+/).filter(Boolean).length || 0) < 50 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {((formData.description?.split(/\s+/).filter(Boolean).length || 0) < 50) ? 
                            'Minimum 50 words recommended for SEO' : 'Good length!'
                          }
                        </span>
                      </div>
                      {errors.description && touched.description && (
                        <span className="text-xs text-red-500">{errors.description}</span>
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
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded" // Added rounded, text-sm
                            rows={3}
                            value={formData.amenities || ""}
                            onChange={(e) => handleChange("amenities", e.target.value)}
                            placeholder="Private Beach,Swimming Pool,Gym,Sauna,Jacuzzi,Garden,Parking,Smart Home"
                          />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Property Features (comma separated)</label>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded" // Added rounded, text-sm
                            rows={3}
                            value={formData.property_features || ""}
                            onChange={(e) => handleChange("property_features", e.target.value)}
                            placeholder="Sea View,Private Pool,Private Garden,Maids Room,Guest Room"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className={`${labelCls} block mb-2`}>Property Status</label>
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
                        <button
                          type="button"
                          onClick={saveAsDraft}
                          className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1" // Adjusted text, rounded, h-9
                        >
                          <Save className="w-4 h-4" />
                          Save Draft
                        </button>
                        <button
                          type="button"
                          onClick={copyFormData}
                          className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1" // Adjusted text, rounded, h-9
                        >
                          <Copy className="w-4 h-4" />
                          Copy Data
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1" // Adjusted text, rounded, h-9
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={fillSampleData}
                          className="h-9 border border-blue-300 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 flex items-center justify-center gap-1" // Adjusted text, rounded, h-9
                        >
                          <Upload className="w-4 h-4" />
                          Sample
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer bar - consistent with AgentsPage pagination/footer bar */}
              <div className="mt-3 bg-white border border-gray-300 p-3 rounded-b flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => window.location.href = "/admin/properties"}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200" // Consistent secondary button style
                >
                  Cancel
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500"> {/* Changed text-[11px] to text-xs */}
                    {REQUIRED_FIELDS.filter(({ field }) => !formData[field]).length} required fields remaining
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50" // Consistent green save button style
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