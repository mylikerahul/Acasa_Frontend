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
  Eye,
  Globe,
  Plus,
  X,
  Building2,
  ChevronDown, // Added for dropdown consistency
} from "lucide-react";
// Replaced react-toastify with react-hot-toast for consistency
import { toast, Toaster } from "react-hot-toast";

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar"; // Assuming correct path

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== TOKEN VERIFICATION (Copied from AgentsPage) ====================
const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
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
  // Basic Info - REQUIRED
  ProjectName: "",
  project_slug: "",
  listing_type: "sale",
  property_type: "Apartment",
  
  // Pricing
  price: "",
  price_end: "",
  askprice: "0",
  currency_id: 1,
  
  // Project Details
  bedroom: "",
  area: "",
  area_end: "",
  area_size: "Sq.Ft.",
  
  // Location
  state_id: "",
  city_id: "",
  community_id: "",
  sub_community_id: "",
  LocationName: "",
  BuildingName: "",
  StreetName: "",
  CityName: "",
  StateName: "",
  PinCode: "",
  LandMark: "",
  country: "UAE",
  
  // Description
  Description: "",
  Specifications: "",
  
  // Project Info
  floors: "",
  rooms: "",
  total_building: "",
  kitchen_type: "",
  
  // Dates
  completion_date: "",
  vacating_date: "",
  StartDate: "",
  EndDate: "",
  
  // Status & Features
  status: 1, // 1: Active, 0: Draft/Inactive
  featured_project: "0", // "1": Featured, "0": Not featured
  verified: 0, // 1: Verified, 0: Not verified
  occupancy: "",
  qc: "",
  exclusive_status: "exclusive",
  
  // Developer & Agent
  developer_id: "",
  agent_id: "",
  
  // Amenities (Boolean fields - 0 or 1)
  Lift: 0, Club: 0, RainWaterHaresting: 0, PowerBackup: 0, GasConnection: 0,
  SwimmingPool: 0, Parking: 0, Security: 0, InternetConnection: 0, Gym: 0,
  ServantQuarters: 0, Balcony: 0, PlayArea: 0, CCTV: 0, ReservedPark: 0,
  Intercom: 0, Lawn: 0, Terrace: 0, Garden: 0, EarthquakeConstruction: 0,
  
  // Additional
  amenities: "", // String of comma-separated amenities
  Vaastu: "", // Vaastu compliance
  video_url: "",
  whatsapp_url: "",
  Url: "", // Project URL
  
  // IDs
  user_id: 1, // Default user ID for new project
  ProjectId: "", // External project ID
  ProjectNumber: "", // Project number/code
  
  // SEO
  keyword: "", // Meta keywords
  seo_title: "",
  meta_description: "",
  canonical_tags: "",
  
  // Permits
  dld_permit: "",
  
  // Specs (for project_specs table) - these will be part of main formData and extracted for specs.
  ReraNumber: "",
  DeveloperName: "",
  CompanyName: "",
  MaxArea: "",
  MinArea: "",
  MaxPrice: "",
  MinPrice: "",
  Latitude: "",
  Longitude: "",
};

// ==================== REQUIRED FIELDS ====================
const REQUIRED_FIELDS = [
  { field: "ProjectName", label: "Project Name" },
  { field: "project_slug", label: "Project Slug" },
  { field: "listing_type", label: "Listing Type" },
  { field: "property_type", label: "Property Type" },
  { field: "price", label: "Price" },
  { field: "Description", label: "Description" },
];

// ==================== COMMON STYLES (Adjusted for consistency) ====================
const labelCls = "text-sm text-gray-700";
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const fieldErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const selectCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const selectErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800";
const boxBodyCls = "p-3";

// ==================== TOAST HELPER FUNCTIONS ====================
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


// ==================== SEO CHECKLIST COMPONENT ====================
function SeoChecklist({ formData }) {
  const checks = [
    {
      label: "Project name is descriptive (min 10 chars)",
      passed: formData.ProjectName && formData.ProjectName.length >= 10
    },
    {
      label: "Description has at least 50 words",
      passed: formData.Description && formData.Description.split(/\s+/).filter(Boolean).length >= 50
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
      passed: !!(formData.LocationName || formData.CityName)
    },
    {
      label: "Area is specified",
      passed: !!formData.area
    },
    {
      label: "Developer name added",
      passed: !!formData.DeveloperName
    }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const percentage = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">SEO Score</span>
        <span className={`text-sm font-bold ${
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
          <div key={index} className="flex items-start gap-2 text-xs text-gray-700 py-1">
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
    <div className="bg-white border border-gray-300 rounded p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Form Completion</span>
        <span className={`text-sm font-bold ${
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
        <div className="text-xs text-red-600">
          Missing: {missingFields.map(f => f.label).join(", ")}
        </div>
      )}
    </div>
  );
}

// ==================== AMENITIES CHECKBOXES ====================
const AMENITY_FIELDS = [
  { key: "Lift", label: "Lift/Elevator" },
  { key: "Club", label: "Club House" },
  { key: "RainWaterHaresting", label: "Rain Water Harvesting" },
  { key: "PowerBackup", label: "Power Backup" },
  { key: "GasConnection", label: "Gas Connection" },
  { key: "SwimmingPool", label: "Swimming Pool" },
  { key: "Parking", label: "Parking" },
  { key: "Security", label: "24/7 Security" },
  { key: "InternetConnection", label: "Internet/WiFi" },
  { key: "Gym", label: "Gymnasium" },
  { key: "ServantQuarters", label: "Servant Quarters" },
  { key: "Balcony", label: "Balcony" },
  { key: "PlayArea", label: "Play Area" },
  { key: "CCTV", label: "CCTV Surveillance" },
  { key: "ReservedPark", label: "Reserved Parking" },
  { key: "Intercom", label: "Intercom" },
  { key: "Lawn", label: "Lawn" },
  { key: "Terrace", label: "Terrace" },
  { key: "Garden", label: "Garden" },
  { key: "EarthquakeConstruction", label: "Earthquake Resistant" },
];

// ==================== MAIN COMPONENT ====================
export default function AddProjectPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form state
  const [activeTab, setActiveTab] = useState("details"); // For internal tab navigation
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Images
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // ==================== AUTHENTICATION (Copied from AgentsPage) ====================
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

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");
    
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
      showError("Logout failed. Please try again.");
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll();
      showSuccess("Logged out successfully");
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
    const totalChecks = 7;

    if (formData.ProjectName && formData.ProjectName.length >= 10) score++;
    if (formData.Description && formData.Description.split(/\s+/).filter(Boolean).length >= 50) score++;
    if (formData.price) score++;
    if (formData.property_type) score++;
    if (formData.LocationName || formData.CityName) score++;
    if (formData.area) score++;
    if (formData.DeveloperName) score++;

    setSeoScore(Math.round((score / totalChecks) * 100));
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== FORM HANDLERS ====================
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    
    // Auto-generate slug from project name
    if (field === "ProjectName") {
      const slug = (value || "")
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-");
      updated.project_slug = slug;
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
      if (total > 20) {
        showError("Maximum 20 images allowed in gallery.");
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
      showSuccess("Image removed from selection");
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
    
    const descriptionWordCount = formData.Description?.split(/\s+/).filter(Boolean).length || 0;
    if (descriptionWordCount < 50) {
      newErrors.Description = `Description should have at least 50 words (${descriptionWordCount}/50)`;
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
    if (!formData.ProjectName) {
      showError("Please enter project name first");
      return;
    }
    
    const slug = formData.ProjectName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");
    
    setFormData(prev => ({ ...prev, project_slug: slug }));
    showSuccess("Project slug generated!");
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const saveToastId = showLoadingToast("Saving project...");

    try {
      const fd = new FormData();
      
      // Main project fields
      Object.keys(formData).forEach(key => {
        const value = formData[key];
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

      const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
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
        showSuccess("Project created successfully!");
        setTimeout(() => {
          window.location.href = "/admin/projects"; // Redirect to project list
        }, 1500);
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const saveAsDraft = () => {
    setFormData(prev => ({ ...prev, status: 0 })); // Assuming 0 is draft status
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

  const previewProject = () => {
    if (!formData.project_slug) {
      showError("Please generate a slug first");
      return;
    }
    window.open(`${window.location.origin}/projects/${formData.project_slug}`, '_blank');
  };

  const fillSampleData = () => {
    const sampleData = {
      ...INITIAL_FORM_DATA,
      ProjectName: "Luxury Waterfront Residences",
      project_slug: "luxury-waterfront-residences-" + Date.now(),
      listing_type: "sale",
      property_type: "Apartment",
      price: "2500000",
      price_end: "3500000",
      bedroom: "2",
      area: "1200",
      area_end: "1800",
      LocationName: "Dubai Marina",
      BuildingName: "Marina Heights Tower",
      CityName: "Dubai",
      StateName: "Dubai",
      country: "UAE",
      Description: "Experience luxury waterfront living at its finest in this stunning residential project. Featuring world-class amenities, breathtaking views, and premium finishes throughout. Perfect for those seeking an upscale lifestyle in the heart of Dubai Marina. Each residence is meticulously designed with attention to detail and modern aesthetics. This property is an investment opportunity you won't want to miss. It offers high returns and a prime location, making it ideal for discerning buyers. The spacious interiors and modern architecture provide comfort and elegance. Located close to major attractions, shopping malls, and fine dining restaurants, ensuring a vibrant and convenient lifestyle.", // Long description for SEO
      DeveloperName: "Emaar Properties",
      CompanyName: "Emaar Development LLC",
      floors: "40",
      total_building: "250",
      SwimmingPool: 1,
      Gym: 1,
      Security: 1,
      Parking: 1,
      Lift: 1,
      featured_project: "1",
      status: 1,
      ReraNumber: "RERA123456789",
      Latitude: "25.0772",
      Longitude: "55.1095",
      seo_title: "Luxury Waterfront Residences in Dubai Marina by Emaar",
      meta_description: "Discover luxury apartments in Marina Heights Tower, Dubai Marina. World-class amenities, stunning views, and prime location. Invest in your dream home today!",
      keyword: "luxury apartments Dubai, waterfront residences, Dubai Marina, Emaar, Marina Heights Tower, investment property Dubai",
    };
    
    setFormData(sampleData);
    setErrors({});
    showSuccess("Sample data filled!");
  };

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
                <h1 className="text-2xl font-bold text-gray-800">Add New Project</h1> {/* Larger heading */}
                
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
                {formData.project_slug && (
                  <button
                    type="button"
                    onClick={previewProject}
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

            {/* Tabs (Horizontal) - Consistent with AgentsPage */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`px-3 py-1.5 text-sm font-medium border rounded ${
                  activeTab === "details" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("location")}
                className={`px-3 py-1.5 text-sm font-medium border rounded ${
                  activeTab === "location" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Location
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("amenities")}
                className={`px-3 py-1.5 text-sm font-medium border rounded ${
                  activeTab === "amenities" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Amenities
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`px-3 py-1.5 text-sm font-medium border rounded ${
                  activeTab === "media" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("seo")}
                className={`px-3 py-1.5 text-sm font-medium border rounded ${
                  activeTab === "seo" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                SEO
              </button>
            </div>

          </div> {/* End of Top Control Bar */}


          {/* Form Content Area */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}> {/* Consistent background */}
            <div className="p-3"> {/* Padding for content within this background */}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="grid grid-cols-12 gap-3">
                  {/* LEFT COLUMN */}
                  <div className="col-span-12 md:col-span-4 space-y-3">
                    {/* Featured + Status */}
                    <div className={boxCls}>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleChange("featured_project", formData.featured_project === "1" ? "0" : "1")}
                            className={`h-9 border border-gray-300 rounded text-sm ${
                              formData.featured_project === "1" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
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
                            <option value={0}>Draft</option>
                          </select>
                        </div>
                        
                        <div className="mt-2">
                          <label className="flex items-center gap-2 text-sm"> {/* Changed text-[12px] to text-sm */}
                            <input
                              type="checkbox"
                              checked={formData.verified === 1}
                              onChange={(e) => handleChange("verified", e.target.checked ? 1 : 0)}
                              className="w-3.5 h-3.5 rounded" // Added rounded
                            />
                            Verified Project
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Basic Details */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Basic Details</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-2">
                          {/* Project Name */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <label className={`${labelRequiredCls} col-span-4`}>Project Name</label>
                            <div className="col-span-8">
                              <input 
                                className={getFieldClass("ProjectName")}
                                value={formData.ProjectName || ""} 
                                onChange={(e) => handleChange("ProjectName", e.target.value)}
                                onBlur={() => handleBlur("ProjectName")}
                                placeholder="Enter project name"
                              />
                              {errors.ProjectName && touched.ProjectName && (
                                <span className="text-xs text-red-500">{errors.ProjectName}</span>
                              )}
                            </div>
                          </div>

                          {/* Project Slug */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <label className={`${labelRequiredCls} col-span-4`}>Project Slug</label>
                            <div className="col-span-8 flex gap-1">
                              <input 
                                className={getFieldClass("project_slug")}
                                value={formData.project_slug || ""} 
                                onChange={(e) => handleChange("project_slug", e.target.value)}
                                onBlur={() => handleBlur("project_slug")}
                              />
                              <button 
                                type="button" 
                                onClick={generateSlug} 
                                className="h-9 px-3 border border-gray-300 bg-white text-xs rounded hover:bg-gray-50 whitespace-nowrap" // Adjusted for consistency
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
                                placeholder="2500000"
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
                                placeholder="3500000"
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
                            <label className={`${labelCls} col-span-4`}>Bedrooms</label>
                            <div className="col-span-8">
                              <select 
                                className={selectCls}
                                value={formData.bedroom} 
                                onChange={(e) => handleChange("bedroom", e.target.value)}
                              >
                                <option value="">Select</option>
                                <option value="Studio">Studio</option>
                                {[1,2,3,4,5,6].map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                                <option value="7+">7+</option>
                              </select>
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
                                placeholder="1200"
                              />
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
                                placeholder="1800"
                              />
                            </div>
                          </div>

                          {/* Floors */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <label className={`${labelCls} col-span-4`}>Total Floors</label>
                            <div className="col-span-8">
                              <input 
                                className={fieldCls}
                                type="number" 
                                value={formData.floors || ""} 
                                onChange={(e) => handleChange("floors", e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Total Units */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <label className={`${labelCls} col-span-4`}>Total Units</label>
                            <div className="col-span-8">
                              <input 
                                className={fieldCls}
                                type="number" 
                                value={formData.total_building || ""} 
                                onChange={(e) => handleChange("total_building", e.target.value)}
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
                                value={formData.ReraNumber || ""} 
                                onChange={(e) => handleChange("ReraNumber", e.target.value)}
                                placeholder="RERA123456"
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

                    {/* Developer Info */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Developer Information</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-2">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Developer Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.DeveloperName || ""} 
                              onChange={(e) => handleChange("DeveloperName", e.target.value)}
                              placeholder="Emaar Properties"
                            />
                          </div>
                          
                          <div>
                            <label className={`${labelCls} block mb-1`}>Company Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.CompanyName || ""} 
                              onChange={(e) => handleChange("CompanyName", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Developer ID</label>
                            <input 
                              className={fieldCls}
                              type="number"
                              value={formData.developer_id || ""} 
                              onChange={(e) => handleChange("developer_id", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Agent ID</label>
                            <input 
                              className={fieldCls}
                              type="number"
                              value={formData.agent_id || ""} 
                              onChange={(e) => handleChange("agent_id", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Images */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Images</div>
                      <div className={boxBodyCls}>
                        {/* Featured Image */}
                        <div className="text-sm text-gray-700 mb-2 font-medium">Featured Image</div>
                        
                        {selectedMainImage && (
                          <div className="mb-3">
                            <div className="relative overflow-hidden border border-green-500 ring-2 ring-green-300 bg-white rounded">
                              <img 
                                src={URL.createObjectURL(selectedMainImage)} 
                                alt="Featured" 
                                className="w-full h-32 object-cover" 
                              />
                              <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                Featured
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewImage(null, "main")}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        <label className="flex items-center justify-center h-9 border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm text-gray-600 rounded">
                          <Plus className="w-4 h-4 mr-1" />
                          {selectedMainImage ? "Replace Featured Image" : "Add Featured Image"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, "main")} 
                            className="hidden" 
                          />
                        </label>

                        {/* Gallery Images */}
                        <div className="mt-4 text-sm text-gray-700 mb-2 font-medium">
                          Gallery Images ({selectedImages.length}/20)
                        </div>
                        
                        {selectedImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {selectedImages.map((img, i) => (
                              <div key={i} className="relative group">
                                <div className="relative overflow-hidden border border-green-400 bg-white rounded">
                                  <img 
                                    src={URL.createObjectURL(img)} 
                                    alt={`Gallery ${i}`} 
                                    className="w-full h-28 object-cover" 
                                  />
                                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-600 text-white text-[9px] rounded-full">
                                    New
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeNewImage(i, "gallery")}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="flex items-center justify-center h-9 border border-dashed border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm text-gray-600 rounded">
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

                    {/* Quick Actions */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Quick Actions</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={saveAsDraft}
                            className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                          >
                            <Save className="w-4 h-4" />
                            Draft
                          </button>
                          <button
                            type="button"
                            onClick={copyFormData}
                            className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={resetForm}
                            className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={fillSampleData}
                            className="h-9 border border-blue-300 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 flex items-center justify-center gap-1"
                          >
                            <Upload className="w-4 h-4" />
                            Sample
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="col-span-12 md:col-span-8 space-y-3">
                    {/* Listing Type + Property Type */}
                    <div className={boxCls}>
                      <div className={boxBodyCls}>
                        <div className="text-sm font-semibold text-gray-800 mb-2">
                          Listing Type <span className="text-red-500">*</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-800">
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

                        <div className="mt-4 text-sm font-semibold text-gray-800 mb-2">
                          Property Type <span className="text-red-500">*</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            "Apartment", "Villa", "Townhouse",
                            "Penthouse", "Duplex", "Hotel Apartment",
                            "Commercial", "Office", "Mixed Use"
                          ].map(type => (
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
                          <div>
                            <label className={`${labelCls} block mb-1`}>City Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.CityName || ""} 
                              onChange={(e) => handleChange("CityName", e.target.value)}
                              placeholder="Dubai"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>State Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.StateName || ""} 
                              onChange={(e) => handleChange("StateName", e.target.value)}
                              placeholder="Dubai"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Location Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.LocationName || ""} 
                              onChange={(e) => handleChange("LocationName", e.target.value)}
                              placeholder="Dubai Marina"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Building Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.BuildingName || ""} 
                              onChange={(e) => handleChange("BuildingName", e.target.value)}
                              placeholder="Marina Heights"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Street Name</label>
                            <input 
                              className={fieldCls}
                              value={formData.StreetName || ""} 
                              onChange={(e) => handleChange("StreetName", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Landmark</label>
                            <input 
                              className={fieldCls}
                              value={formData.LandMark || ""} 
                              onChange={(e) => handleChange("LandMark", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Pin Code</label>
                            <input 
                              className={fieldCls}
                              value={formData.PinCode || ""} 
                              onChange={(e) => handleChange("PinCode", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Country</label>
                            <input 
                              className={fieldCls}
                              value={formData.country || ""} 
                              onChange={(e) => handleChange("country", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Latitude</label>
                            <input 
                              className={fieldCls}
                              value={formData.Latitude || ""} 
                              onChange={(e) => handleChange("Latitude", e.target.value)}
                              placeholder="25.0772"
                            />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Longitude</label>
                            <input 
                              className={fieldCls}
                              value={formData.Longitude || ""} 
                              onChange={(e) => handleChange("Longitude", e.target.value)}
                              placeholder="55.1095"
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
                          className={`w-full border ${errors.Description && touched.Description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'} px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded`}
                          rows={6}
                          value={formData.Description || ""}
                          onChange={(e) => handleChange("Description", e.target.value)}
                          onBlur={() => handleBlur("Description")}
                          placeholder="Write detailed project description... (minimum 50 words recommended)"
                        />
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            Words: {formData.Description?.split(/\s+/).filter(Boolean).length || 0}
                          </span>
                          <span className={`text-xs ${
                            (formData.Description?.split(/\s+/).filter(Boolean).length || 0) < 50 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {((formData.Description?.split(/\s+/).filter(Boolean).length || 0) < 50) ? 
                              'Minimum 50 words recommended for SEO' : 'Good length!'
                            }
                          </span>
                        </div>
                        {errors.Description && touched.Description && (
                          <span className="text-xs text-red-500">{errors.Description}</span>
                        )}
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Specifications</div>
                      <div className={boxBodyCls}>
                        <textarea
                          className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          rows={4}
                          value={formData.Specifications || ""}
                          onChange={(e) => handleChange("Specifications", e.target.value)}
                          placeholder="Technical specifications, construction details..."
                        />
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Project Amenities</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-3">
                          {AMENITY_FIELDS.map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={formData[key] === 1}
                                onChange={(e) => handleChange(key, e.target.checked ? 1 : 0)}
                                className="w-3.5 h-3.5 rounded"
                              />
                              {label}
                            </label>
                          ))}
                        </div>

                        <div className="mt-4">
                          <label className={`${labelCls} block mb-2`}>Additional Amenities (comma separated)</label>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
                            rows={2}
                            value={formData.amenities || ""}
                            onChange={(e) => handleChange("amenities", e.target.value)}
                            placeholder="Jogging Track, Kids Pool, BBQ Area..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEO */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>SEO</div>
                      <div className={boxBodyCls}>
                        <div className="space-y-2">
                          <div>
                            <label className={`${labelCls} block mb-1`}>SEO Title</label>
                            <input 
                              className={fieldCls}
                              value={formData.seo_title || ""} 
                              onChange={(e) => handleChange("seo_title", e.target.value)}
                              placeholder="Meta Title"
                            />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Meta Description</label>
                            <textarea
                              className={fieldCls}
                              rows={2}
                              value={formData.meta_description || ""} 
                              onChange={(e) => handleChange("meta_description", e.target.value)}
                              placeholder="Meta Description"
                            />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Keywords</label>
                            <input 
                              className={fieldCls}
                              value={formData.keyword || ""} 
                              onChange={(e) => handleChange("keyword", e.target.value)}
                              placeholder="keyword1, keyword2"
                            />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Canonical Tags</label>
                            <input 
                              className={fieldCls}
                              value={formData.canonical_tags || ""} 
                              onChange={(e) => handleChange("canonical_tags", e.target.value)}
                              placeholder="Canonical URL"
                            />
                          </div>
                        </div>
                        <SeoChecklist formData={formData} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer bar - consistent with AgentsPage pagination/footer bar */}
          <div className="mt-3 bg-white border border-gray-300 p-3 rounded-b flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.location.href = "/admin/projects"}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200" // Consistent secondary button style
            >
              Cancel
            </button>
            
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
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
                    Save Project
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