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
  Copy,
  RotateCcw,
  Save,
  Eye,
  Globe,
  RefreshCw,
  Image as ImageIcon,
  X,
  Plus
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/verify`, {
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

// ==================== INITIAL FORM DATA ====================
const INITIAL_FORM_DATA = {
  property_name: "",
  property_slug: "",
  listing_type: "sale",
  property_type: "Apartment",
  property_purpose: "Sale",
  price: "",
  price_end: "",
  askprice: "0",
  currency_id: 1,
  bedroom: "",
  bathrooms: "",
  area: "",
  area_end: "",
  area_size: "Sq.Ft.",
  city: "",
  community: "",
  sub_community: "",
  location: "",
  address: "",
  description: "",
  amenities: "",
  property_features: "",
  parking: "",
  property_status: "Ready",
  furnishing: "Fully Furnished",
  flooring: "Marble",
  developer_id: 1,
  user_id: 1,
  agent_id: "",
  status: 1,
  featured_property: "0",
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

// ==================== STYLES ====================
const labelCls = "text-[12px] text-gray-700";
const labelRequiredCls = "text-[12px] text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500";
const fieldErrorCls = "h-8 w-full border border-red-400 bg-red-50 px-2 text-[12px] outline-none focus:border-red-500";
const selectCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500";
const selectErrorCls = "h-8 w-full border border-red-400 bg-red-50 px-2 text-[12px] outline-none focus:border-red-500";
const boxCls = "border border-gray-300 bg-white";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-[13px] font-semibold text-gray-800";
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
        <span className="text-[12px] font-medium text-gray-700">SEO Score</span>
        <span className={`text-[12px] font-bold ${
          percentage >= 80 ? 'text-green-600' :
          percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div 
          className={`h-2 rounded transition-all ${
            percentage >= 80 ? 'bg-green-500' :
            percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-2 text-[11px] text-gray-700 py-1">
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
    <div className="bg-white border border-gray-300 p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-gray-700">Form Completion</span>
        <span className={`text-[12px] font-bold ${
          percentage === 100 ? 'text-green-600' :
          percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {completedCount}/{REQUIRED_FIELDS.length} fields
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded mb-2">
        <div 
          className={`h-2 rounded transition-all ${
            percentage === 100 ? 'bg-green-500' :
            percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {missingFields.length > 0 && (
        <div className="text-[11px] text-red-600">
          Missing: {missingFields.map(f => f.label).join(", ")}
        </div>
      )}
    </div>
  );
}

// ==================== EXISTING IMAGE COMPONENT ====================
function ExistingImageCard({ image, onDelete, onSetFeatured, isFeatured, deleting }) {
  const imageUrl = image.image_url || image.url || image;
  const imageId = image.id || image.image_id;
  
  return (
    <div className="relative group">
      <div className={`relative overflow-hidden border ${isFeatured ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'} bg-white`}>
        <img 
          src={imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`} 
          alt="Property" 
          className="w-full h-28 object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
        {isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[10px]">
            Featured
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          {!isFeatured && onSetFeatured && (
            <button
              type="button"
              onClick={() => onSetFeatured(imageId)}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center rounded"
              title="Set as featured"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(imageId)}
            disabled={deleting}
            className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded disabled:opacity-50"
            title="Delete image"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id;

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Images state
  const [existingImages, setExistingImages] = useState([]);
  const [existingFeaturedImage, setExistingFeaturedImage] = useState(null);
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);

  // ==================== AUTHENTICATION ====================
  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        toast.error("Please login as admin to access this page");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token || !isAdminTokenValid()) {
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
  }, []);

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  // ==================== FETCH PROPERTY DATA ====================
  const fetchPropertyData = useCallback(async () => {
    if (!propertyId) {
      toast.error("Property ID not found");
      return;
    }

    try {
      setLoading(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch property");
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const property = result.data;
        
        // Map API response to form data
        const mappedData = {
          property_name: property.property_name || property.title || "",
          property_slug: property.property_slug || property.slug || "",
          listing_type: property.listing_type || "sale",
          property_type: property.property_type || "Apartment",
          property_purpose: property.property_purpose || "Sale",
          price: property.price?.toString() || "",
          price_end: property.price_end?.toString() || "",
          askprice: property.askprice?.toString() || "0",
          currency_id: property.currency_id || 1,
          bedroom: property.bedroom?.toString() || property.bedrooms?.toString() || "",
          bathrooms: property.bathrooms?.toString() || "",
          area: property.area?.toString() || "",
          area_end: property.area_end?.toString() || "",
          area_size: property.area_size || "Sq.Ft.",
          city: property.city || "",
          community: property.community || "",
          sub_community: property.sub_community || "",
          location: property.location || "",
          address: property.address || "",
          description: property.description || "",
          amenities: Array.isArray(property.amenities) 
            ? property.amenities.join(",") 
            : (property.amenities || ""),
          property_features: Array.isArray(property.property_features) 
            ? property.property_features.join(",") 
            : (property.property_features || ""),
          parking: property.parking?.toString() || "",
          property_status: property.property_status || "Ready",
          furnishing: property.furnishing || "Fully Furnished",
          flooring: property.flooring || "Marble",
          developer_id: property.developer_id || 1,
          user_id: property.user_id || 1,
          agent_id: property.agent_id?.toString() || "",
          status: property.status ?? 1,
          featured_property: property.featured_property?.toString() || "0",
          video_url: property.video_url || "",
          map_latitude: property.map_latitude?.toString() || "",
          map_longitude: property.map_longitude?.toString() || "",
          rera_number: property.rera_number || property.ReraNumber || "",
          completion_date: property.completion_date 
            ? property.completion_date.split('T')[0] 
            : "",
          unit_number: property.unit_number || property.unit_no || "",
          floor_number: property.floor_number || property.floor_no || "",
          dld_permit: property.dld_permit || "",
        };

        setFormData(mappedData);
        setOriginalData(mappedData);

        // Handle images
        if (property.featured_image) {
          setExistingFeaturedImage(property.featured_image);
        }
        
        if (property.gallery_images && Array.isArray(property.gallery_images)) {
          setExistingImages(property.gallery_images);
        } else if (property.images && Array.isArray(property.images)) {
          setExistingImages(property.images);
        }

        toast.success("Property data loaded successfully");
      } else {
        throw new Error(result.message || "Failed to load property");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load property data");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && propertyId) {
      fetchPropertyData();
    }
  }, [isAuthenticated, propertyId, fetchPropertyData]);

  useEffect(() => {
    calculateSeoScore();
  }, [formData]);

  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData) ||
                      selectedMainImage !== null ||
                      selectedImages.length > 0;
      setHasChanges(changed);
    }
  }, [formData, originalData, selectedMainImage, selectedImages]);

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

  // ==================== FORM HANDLERS ====================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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
    
    if (REQUIRED_FIELDS.find(f => f.field === field) && !formData[field]) {
      setErrors(prev => ({ ...prev, [field]: "This field is required" }));
    }
  };

  const handleImageUpload = (e, type) => {
    const files = Array.from(e.target.files || []);
    
    if (type === "main" && files[0]) {
      const f = files[0];
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setSelectedMainImage(f);
      toast.success("New featured image selected!");
    }
    
    if (type === "gallery") {
      const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
      const total = existingImages.length + selectedImages.length + valid.length;
      if (total > 20) {
        toast.error("Maximum 20 images allowed");
        return;
      }
      setSelectedImages((prev) => [...prev, ...valid]);
      toast.success(`${valid.length} images added to gallery!`);
    }
    
    e.target.value = "";
  };

  const removeNewImage = (index, type) => {
    if (type === "main") {
      setSelectedMainImage(null);
      toast.success("New featured image removed");
    } else {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image removed from selection");
    }
  };

  // ==================== DELETE EXISTING IMAGE ====================
  const handleDeleteExistingImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/properties/gallery/${imageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setExistingImages(prev => prev.filter(img => (img.id || img.image_id) !== imageId));
        toast.success("Image deleted successfully");
      } else {
        throw new Error(result.message || "Failed to delete image");
      }
    } catch (error) {
      console.error("Delete image error:", error);
      toast.error(error.message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
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

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = "Price must be a valid number";
    }

    if (formData.area && isNaN(Number(formData.area))) {
      newErrors.area = "Area must be a valid number";
    }

    if (formData.description && formData.description.split(/\s+/).filter(Boolean).length < 20) {
      newErrors.description = "Description should have at least 20 words";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const missingLabels = Object.keys(newErrors).map(key => {
        const found = REQUIRED_FIELDS.find(f => f.field === key);
        return found ? found.label : key;
      });
      toast.error(`Please fill required fields: ${missingLabels.slice(0, 3).join(", ")}${missingLabels.length > 3 ? '...' : ''}`);
      return false;
    }
    
    return true;
  };

  const generateSlug = () => {
    if (!formData.property_name) {
      toast.error("Please enter property name first");
      return;
    }
    
    const slug = formData.property_name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      + "-" + Date.now();
    
    setFormData(prev => ({ ...prev, property_slug: slug }));
    toast.success("Property slug generated!");
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

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

      // Add new images
      if (selectedMainImage) {
        fd.append("featured_image", selectedMainImage);
      }
      
      selectedImages.forEach((img) => {
        fd.append("gallery_images", img);
      });

      const token = getAdminToken();
      if (!token) {
        toast.error("Please login to continue");
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
      
      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      if (result.success) {
        toast.success("Property updated successfully!");
        setOriginalData(formData);
        setSelectedMainImage(null);
        setSelectedImages([]);
        setHasChanges(false);
        
        // Refresh property data
        await fetchPropertyData();
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.error(e.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const resetForm = () => {
    if (window.confirm("Are you sure you want to discard all changes?")) {
      setFormData(originalData);
      setSelectedMainImage(null);
      setSelectedImages([]);
      setErrors({});
      setTouched({});
      toast.success("Changes discarded");
    }
  };

  const copyFormData = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    toast.success("Form data copied to clipboard!");
  };

  const previewProperty = () => {
    if (!formData.property_slug) {
      toast.error("Property slug not found");
      return;
    }
    window.open(`${window.location.origin}/properties/${formData.property_slug}`, '_blank');
  };

  const getFieldClass = (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
    return errors[field] && touched[field] ? errorClass : baseClass;
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-700 animate-spin mx-auto mb-3" />
          <div className="text-sm text-gray-600">Verifying authentication...</div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-700 animate-spin mx-auto mb-3" />
          <div className="text-sm text-gray-600">Loading property data...</div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

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

      <div className="min-h-screen bg-[#f6f6f6]">
        <div className="max-w-[1250px] mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-[18px] font-semibold text-gray-800">
                Edit Property
              </div>
              {hasChanges && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[11px] rounded">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={fetchPropertyData}
                className="inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </button>
              
              <button
                type="button"
                onClick={previewProperty}
                className="inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </button>
              
              <div className="flex items-center bg-white px-3 py-1 border border-gray-300">
                <Globe className="w-3 h-3 text-blue-600 mr-1" />
                <span className="text-[11px] font-medium text-gray-900">SEO:</span>
                <span className={`ml-1 text-[11px] font-bold ${
                  seoScore >= 80 ? 'text-green-600' :
                  seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {seoScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Property ID Badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-[11px] rounded">
              ID: {propertyId}
            </span>
            {formData.property_slug && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[11px] rounded">
                Slug: {formData.property_slug}
              </span>
            )}
          </div>

          {/* Back/Forward bar */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (hasChanges) {
                  if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                    router.back();
                  }
                } else {
                  router.back();
                }
              }}
              className="w-10 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => router.forward()}
              className="w-10 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/properties")}
              className="h-8 px-3 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
            >
              ← Back to Properties
            </button>
          </div>

          {/* Validation Indicator */}
          <ValidationIndicator formData={formData} />

          {/* Main Content */}
          <div className="border border-gray-300 bg-white">
            <div className="flex items-center gap-1 border-b border-gray-300 px-2 py-2">
              <span className="px-3 py-1 text-[12px] bg-white font-semibold border border-gray-300">
                Property Details
              </span>
            </div>

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
                          className={`h-9 border border-gray-300 text-[12px] ${
                            formData.featured_property === "1" ? "bg-[#f6d6be]" : "bg-gray-100"
                          }`}
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
                            />
                            {errors.property_name && touched.property_name && (
                              <span className="text-[10px] text-red-500">{errors.property_name}</span>
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
                            <button 
                              type="button" 
                              onClick={generateSlug} 
                              className="h-8 px-2 border border-gray-300 bg-white text-[11px] hover:bg-gray-50 whitespace-nowrap"
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
                            />
                            {errors.price && touched.price && (
                              <span className="text-[10px] text-red-500">{errors.price}</span>
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
                            />
                          </div>
                        </div>

                        {/* Ask to Price */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Ask to Price</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls} 
                              value={formData.askprice} 
                              onChange={(e) => handleChange("askprice", e.target.value)}
                            >
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
                              {[1,2,3,4,5,6].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                              <option value="7+">7+</option>
                            </select>
                            {errors.bedroom && touched.bedroom && (
                              <span className="text-[10px] text-red-500">{errors.bedroom}</span>
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
                            />
                            {errors.bathrooms && touched.bathrooms && (
                              <span className="text-[10px] text-red-500">{errors.bathrooms}</span>
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
                            />
                            {errors.area && touched.area && (
                              <span className="text-[10px] text-red-500">{errors.area}</span>
                            )}
                          </div>
                        </div>

                        {/* Area End */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Area End</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              type="number" 
                              value={formData.area_end || ""} 
                              onChange={(e) => handleChange("area_end", e.target.value)}
                            />
                          </div>
                        </div>

                        {/* DLD Permit */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>DLD Permit</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls} 
                              value={formData.dld_permit || ""} 
                              onChange={(e) => handleChange("dld_permit", e.target.value)} 
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
                      <input 
                        className={fieldCls} 
                        value={formData.agent_id || ""} 
                        onChange={(e) => handleChange("agent_id", e.target.value)} 
                        placeholder="Agent ID" 
                      />
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

                  {/* Images Section */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Images</div>
                    <div className={boxBodyCls}>
                      {/* Existing Featured Image */}
                      <div className="text-[12px] text-gray-700 mb-2 font-medium">Featured Image</div>
                      
                      {existingFeaturedImage && !selectedMainImage && (
                        <div className="mb-3">
                          <div className="relative overflow-hidden border border-blue-500 ring-2 ring-blue-300 bg-white">
                            <img 
                              src={existingFeaturedImage.startsWith('http') ? existingFeaturedImage : `${API_BASE_URL}${existingFeaturedImage}`} 
                              alt="Featured" 
                              className="w-full h-32 object-cover"
                              onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[10px]">
                              Current Featured
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Featured Image */}
                      {selectedMainImage && (
                        <div className="mb-3">
                          <div className="relative overflow-hidden border border-green-500 ring-2 ring-green-300 bg-white">
                            <img 
                              src={URL.createObjectURL(selectedMainImage)} 
                              alt="New Featured" 
                              className="w-full h-32 object-cover" 
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-[10px]">
                              New Featured
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNewImage(null, "main")}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <label className="flex items-center justify-center h-10 border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer text-[12px] text-gray-600">
                        <Plus className="w-4 h-4 mr-1" />
                        {existingFeaturedImage || selectedMainImage ? "Replace Featured Image" : "Add Featured Image"}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, "main")} 
                          className="hidden" 
                        />
                      </label>

                      {/* Gallery Images */}
                      <div className="mt-4 text-[12px] text-gray-700 mb-2 font-medium">
                        Gallery Images ({existingImages.length + selectedImages.length}/20)
                      </div>
                      
                      {/* Existing Gallery Images */}
                      {existingImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {existingImages.map((img, i) => (
                            <ExistingImageCard
                              key={img.id || img.image_id || i}
                              image={img}
                              onDelete={handleDeleteExistingImage}
                              deleting={deletingImageId === (img.id || img.image_id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* New Gallery Images */}
                      {selectedImages.length > 0 && (
                        <>
                          <div className="text-[11px] text-green-600 mb-2">
                            New images to upload ({selectedImages.length})
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {selectedImages.map((img, i) => (
                              <div key={i} className="relative group">
                                <div className="relative overflow-hidden border border-green-400 bg-white">
                                  <img 
                                    src={URL.createObjectURL(img)} 
                                    alt={`New ${i}`} 
                                    className="w-full h-28 object-cover" 
                                  />
                                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-600 text-white text-[9px]">
                                    New
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeNewImage(i, "gallery")}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <label className="flex items-center justify-center h-10 border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer text-[12px] text-gray-600">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Gallery Images
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={(e) => handleImageUpload(e, "gallery")} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  {/* Listing type + Property Purpose + Property Type */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="text-[13px] font-semibold text-gray-800 mb-2">
                        Listing Type <span className="text-red-500">*</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[12px] text-gray-800">
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

                      <div className="mt-4 text-[13px] font-semibold text-gray-800 mb-2">
                        Property Purpose <span className="text-red-500">*</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[12px] text-gray-800">
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

                      <div className="mt-4 text-[13px] font-semibold text-gray-800 mb-2">
                        Property Type <span className="text-red-500">*</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          "Apartment", "Villa", "Townhouse",
                          "Penthouse", "Duplex", "Hotel Apartment",
                          "Commercial", "Office", "Land"
                        ].map(type => (
                          <label key={type} className="flex items-center gap-2 text-[12px]">
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
                            <span className="text-[10px] text-red-500">{errors.city}</span>
                          )}
                        </div>

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
                            <span className="text-[10px] text-red-500">{errors.community}</span>
                          )}
                        </div>

                        <div>
                          <label className={`${labelCls} block mb-1`}>Sub Community</label>
                          <input 
                            className={fieldCls}
                            value={formData.sub_community || ""} 
                            onChange={(e) => handleChange("sub_community", e.target.value)}
                            placeholder="Frond A"
                          />
                        </div>

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
                            <span className="text-[10px] text-red-500">{errors.location}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className={`${labelRequiredCls} block mb-1`}>Full Address</label>
                        <textarea
                          className={`w-full border ${errors.address && touched.address ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} px-2 py-2 text-[12px] outline-none focus:border-gray-500`}
                          rows={2}
                          value={formData.address || ""}
                          onChange={(e) => handleChange("address", e.target.value)}
                          onBlur={() => handleBlur("address")}
                          placeholder="Full address..."
                        />
                        {errors.address && touched.address && (
                          <span className="text-[10px] text-red-500">{errors.address}</span>
                        )}
                      </div>

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
                        className={`w-full border ${errors.description && touched.description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} px-2 py-2 text-[12px] outline-none focus:border-gray-500`}
                        rows={6}
                        value={formData.description || ""}
                        onChange={(e) => handleChange("description", e.target.value)}
                        onBlur={() => handleBlur("description")}
                        placeholder="Write detailed property description..."
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-[11px] text-gray-500">
                          Words: {formData.description?.split(/\s+/).filter(Boolean).length || 0}
                        </span>
                        <span className={`text-[11px] ${
                          (formData.description?.split(/\s+/).filter(Boolean).length || 0) < 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {((formData.description?.split(/\s+/).filter(Boolean).length || 0) < 50) ? 
                            'Minimum 50 words recommended' : 'Good length!'
                          }
                        </span>
                      </div>
                      {errors.description && touched.description && (
                        <span className="text-[10px] text-red-500">{errors.description}</span>
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
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500"
                            rows={3}
                            value={formData.amenities || ""}
                            onChange={(e) => handleChange("amenities", e.target.value)}
                            placeholder="Swimming Pool,Gym,Parking..."
                          />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Property Features</label>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500"
                            rows={3}
                            value={formData.property_features || ""}
                            onChange={(e) => handleChange("property_features", e.target.value)}
                            placeholder="Sea View,Private Pool..."
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <label className={`${labelCls} block mb-2`}>Property Status</label>
                          <select 
                            className={selectCls} 
                            value={formData.property_status} 
                            onChange={(e) => handleChange("property_status", e.target.value)}
                          >
                            <option value="Ready">Ready</option>
                            <option value="Off Plan">Off Plan</option>
                            <option value="Under Construction">Under Construction</option>
                          </select>
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Furnishing</label>
                          <select 
                            className={selectCls} 
                            value={formData.furnishing} 
                            onChange={(e) => handleChange("furnishing", e.target.value)}
                          >
                            <option value="Fully Furnished">Fully Furnished</option>
                            <option value="Semi Furnished">Semi Furnished</option>
                            <option value="Unfurnished">Unfurnished</option>
                          </select>
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Flooring</label>
                          <input 
                            className={fieldCls} 
                            value={formData.flooring} 
                            onChange={(e) => handleChange("flooring", e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-2`}>Parking</label>
                          <input 
                            className={fieldCls} 
                            value={formData.parking} 
                            onChange={(e) => handleChange("parking", e.target.value)} 
                          />
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
                        <button
                          type="button"
                          onClick={copyFormData}
                          className="h-8 border border-gray-300 bg-white text-[12px] hover:bg-gray-50 flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Data
                        </button>
                        <button
                          type="button"
                          onClick={resetForm}
                          disabled={!hasChanges}
                          className="h-8 border border-gray-300 bg-white text-[12px] hover:bg-gray-50 flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Discard Changes
                        </button>
                        <button
                          type="button"
                          onClick={fetchPropertyData}
                          className="h-8 border border-gray-300 bg-white text-[12px] hover:bg-gray-50 flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reload Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer bar */}
              <div className="mt-3 border-t border-gray-300 bg-[#efefef] p-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChanges) {
                      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                        router.push("/admin/properties");
                      }
                    } else {
                      router.push("/admin/properties");
                    }
                  }}
                  className="h-9 px-4 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <span className="text-[11px] text-yellow-600">
                      You have unsaved changes
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || !hasChanges}
                    className="h-9 px-6 border border-green-600 bg-green-600 text-white text-[12px] hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Property
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