"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
} from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";
import SimpleTextEditor from "../../../../components/common/SimpleTextEditor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== DEBUG LOGGER ====================
const DEBUG = true;

const logger = {
  info: (...args) => {
    if (DEBUG) {
      console.log(
        `%c[INFO] ${new Date().toLocaleTimeString()}`,
        "color: #3B82F6; font-weight: bold;",
        ...args
      );
    }
  },
  success: (...args) => {
    if (DEBUG) {
      console.log(
        `%c[SUCCESS] ${new Date().toLocaleTimeString()}`,
        "color: #10B981; font-weight: bold;",
        ...args
      );
    }
  },
  warn: (...args) => {
    if (DEBUG) {
      console.warn(
        `%c[WARN] ${new Date().toLocaleTimeString()}`,
        "color: #F59E0B; font-weight: bold;",
        ...args
      );
    }
  },
  error: (...args) => {
    if (DEBUG) {
      console.error(
        `%c[ERROR] ${new Date().toLocaleTimeString()}`,
        "color: #EF4444; font-weight: bold;",
        ...args
      );
    }
  },
  debug: (...args) => {
    if (DEBUG) {
      console.log(
        `%c[DEBUG] ${new Date().toLocaleTimeString()}`,
        "color: #8B5CF6; font-weight: bold;",
        ...args
      );
    }
  },
  table: (data, label = "Data") => {
    if (DEBUG) {
      console.log(`%c[TABLE] ${label}:`, "color: #EC4899; font-weight: bold;");
      console.table(data);
    }
  },
  group: (label) => {
    if (DEBUG) console.group(`📦 ${label}`);
  },
  groupEnd: () => {
    if (DEBUG) console.groupEnd();
  },
};

// ==================== AUTH HELPERS ====================
const getCurrentSessionType = () => {
  if (typeof window === "undefined") return null;

  const adminToken =
    localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  const userToken =
    localStorage.getItem("userToken") || sessionStorage.getItem("userToken");

  if (adminToken) return "admin";
  if (userToken) return "user";
  return null;
};

const logoutAll = () => {
  if (typeof window === "undefined") return;

  logger.info("Logging out - clearing all tokens");

  localStorage.removeItem("adminToken");
  localStorage.removeItem("userToken");
  localStorage.removeItem("token");
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("userToken");
  sessionStorage.removeItem("token");

  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

// ==================== TOKEN VERIFICATION ====================
const verifyToken = async (token) => {
  logger.info("Verifying token...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/users/admin/verify-token`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    logger.success("Token verified successfully", result);
    return result;
  } catch (error) {
    logger.error("Token verification failed:", error);
    throw error;
  }
};

// ==================== IMAGE URL HELPER ====================
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (!isNaN(imagePath)) {
    return `${API_BASE_URL}/api/v1/media/${imagePath}`;
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("data:")) return imagePath;

  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

  if (cleanPath.startsWith("uploads/projects/")) return `${API_BASE_URL}/${cleanPath}`;
  if (cleanPath.startsWith("uploads/")) return `${API_BASE_URL}/${cleanPath}`;
  if (cleanPath.startsWith("projects/")) return `${API_BASE_URL}/uploads/${cleanPath}`;
  return `${API_BASE_URL}/uploads/projects/${cleanPath}`;
};

// ==================== FIELD DEFINITIONS ====================
const PROJECT_TABLE_FIELDS = [
  "ProjectName", "project_slug", "listing_type", "property_type",
  "price", "price_end", "askprice", "currency_id",
  "bedroom", "area", "area_end", "area_size",
  "state_id", "city_id", "community_id", "sub_community_id",
  "LocationName", "BuildingName", "StreetName", "CityName", "StateName", "PinCode", "LandMark", "country",
  "Description", "Specifications",
  "floors", "rooms", "total_building", "kitchen_type",
  "completion_date", "vacating_date", "StartDate", "EndDate",
  "status", "featured_project", "verified", "occupancy", "qc", "exclusive_status",
  "developer_id", "agent_id",
  "Lift", "Club", "RainWaterHaresting", "PowerBackup", "GasConnection",
  "SwimmingPool", "Parking", "Security", "InternetConnection", "Gym",
  "ServantQuarters", "Balcony", "PlayArea", "CCTV", "ReservedPark",
  "Intercom", "Lawn", "Terrace", "Garden", "EarthquakeConstruction",
  "amenities", "Vaastu", "video_url", "whatsapp_url", "Url",
  "user_id", "ProjectId", "ProjectNumber",
  "keyword", "seo_title", "meta_description", "canonical_tags",
  "dld_permit",
];

const SPECS_TABLE_FIELDS = [
  "ReraNumber", "DeveloperName", "CompanyName",
  "MaxArea", "MinArea", "MaxPrice", "MinPrice",
  "Latitude", "Longitude",
];

// ==================== INITIAL FORM DATA ====================
const INITIAL_FORM_DATA = {
  ProjectName: "",
  project_slug: "",
  listing_type: "sale",
  property_type: "Apartment",
  price: "",
  price_end: "",
  askprice: "0",
  currency_id: 1,
  bedroom: "",
  area: "",
  area_end: "",
  area_size: "Sq.Ft.",
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
  Description: "",
  Specifications: "",
  floors: "",
  rooms: "",
  total_building: "",
  kitchen_type: "",
  completion_date: "",
  vacating_date: "",
  StartDate: "",
  EndDate: "",
  status: 1,
  featured_project: "0",
  verified: 0,
  occupancy: "",
  qc: "",
  exclusive_status: "exclusive",
  developer_id: "",
  agent_id: "",
  Lift: 0, Club: 0, RainWaterHaresting: 0, PowerBackup: 0, GasConnection: 0,
  SwimmingPool: 0, Parking: 0, Security: 0, InternetConnection: 0, Gym: 0,
  ServantQuarters: 0, Balcony: 0, PlayArea: 0, CCTV: 0, ReservedPark: 0,
  Intercom: 0, Lawn: 0, Terrace: 0, Garden: 0, EarthquakeConstruction: 0,
  amenities: "",
  Vaastu: "",
  video_url: "",
  whatsapp_url: "",
  Url: "",
  user_id: 1,
  ProjectId: "",
  ProjectNumber: "",
  keyword: "",
  seo_title: "",
  meta_description: "",
  canonical_tags: "",
  dld_permit: "",
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

// ==================== COMMON STYLES ====================
const labelCls = "text-sm text-gray-700";
const labelRequiredCls = "text-sm text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const fieldErrorCls = "h-9 w-full border border-red-400 bg-red-50 px-2 text-sm outline-none focus:ring-1 focus:ring-red-500 rounded";
const selectCls = "h-9 w-full border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-sm font-semibold text-gray-800";
const boxBodyCls = "p-3";

// ==================== TOAST HELPER FUNCTIONS ====================
const showSuccess = (message) => {
  logger.success("Toast Success:", message);
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: { background: "#10B981", color: "#fff", fontWeight: "500" },
  });
};

const showError = (message) => {
  logger.error("Toast Error:", message);
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: { background: "#EF4444", color: "#fff", fontWeight: "500" },
  });
};

const showLoadingToast = (message) => {
  logger.info("Toast Loading:", message);
  return toast.loading(message, { position: "top-right" });
};

const showWarning = (message) => {
  logger.warn("Toast Warning:", message);
  toast(message, {
    duration: 3000,
    position: "top-right",
    icon: "⚠️",
    style: { background: "#FFC107", color: "#000", fontWeight: "500" },
  });
};

// ==================== SEO CHECKLIST COMPONENT ====================
function SeoChecklist({ formData }) {
  const checks = [
    {
      label: "Project name is descriptive (min 10 chars)",
      passed: formData.ProjectName && formData.ProjectName.length >= 10,
    },
    {
      label: "Description has at least 50 words",
      passed:
        formData.Description &&
        formData.Description.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length >= 50,
    },
    { label: "Price is specified", passed: !!formData.price },
    { label: "Property type is selected", passed: !!formData.property_type },
    { label: "Location is specified", passed: !!(formData.LocationName || formData.CityName) },
    { label: "Area is specified", passed: !!formData.area },
    { label: "Developer name added", passed: !!formData.DeveloperName },
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
  const missingFields = REQUIRED_FIELDS.filter(({ field }) => !formData[field]);
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
        <div className="text-xs text-red-600">
          Missing: {missingFields.map((f) => f.label).join(", ")}
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

// ==================== EXISTING IMAGE COMPONENT ====================
function ExistingImage({ src, onRemove, label, isMain = false }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = getImageUrl(src);

  if (!imageUrl || imageError) {
    return (
      <div className={`relative overflow-hidden border ${isMain ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"} bg-gray-100 rounded`}>
        <div className="w-full h-28 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        {label && (
          <div className={`absolute top-2 left-2 px-2 py-1 ${isMain ? "bg-blue-600" : "bg-gray-600"} text-white text-xs rounded-full`}>
            {label}
          </div>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden border ${isMain ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"} bg-white rounded`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={label || "Image"}
        className={`w-full h-28 object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      {label && (
        <div className={`absolute top-2 left-2 px-2 py-1 ${isMain ? "bg-blue-600" : "bg-gray-600"} text-white text-xs rounded-full`}>
          {label}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function EditProjectPage() {
  const params = useParams();
  const projectId = params?.id;

  // Component mount logging
  useEffect(() => {
    logger.group("EditProjectPage Component");
    logger.info("Component mounted");
    logger.debug("Project ID:", projectId);
    logger.debug("API_BASE_URL:", API_BASE_URL);
    logger.groupEnd();

    return () => {
      logger.info("EditProjectPage Component unmounted");
    };
  }, [projectId]);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Page state
  const [pageLoading, setPageLoading] = useState(true);
  const [projectNotFound, setProjectNotFound] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Form state
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Images
  const [existingMainImage, setExistingMainImage] = useState(null);
  const [existingGallery, setExistingGallery] = useState([]);
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [removeMainImage, setRemoveMainImage] = useState(false);

  // ==================== AUTHENTICATION ====================
  const handleAuthFailure = useCallback(() => {
    logger.error("Authentication failed - redirecting to login");
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  const checkAuth = useCallback(async () => {
    logger.group("Authentication Check");
    try {
      const sessionType = getCurrentSessionType();
      logger.debug("Session type:", sessionType);

      if (sessionType !== "admin") {
        logger.warn("Not an admin session");
        toast.error("Please login as admin to access this page");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();
      logger.debug("Token exists:", !!token);

      if (!token || !isAdminTokenValid()) {
        logger.error("Token invalid or expired");
        toast.error("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        logger.error("Token verification error:", verifyError);
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        logger.debug("Token payload:", payload);

        if (payload.userType !== "admin") {
          logger.error("Invalid user type in token");
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
        };

        logger.success("Admin authenticated:", adminData);
        setAdmin(adminData);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        logger.error("Token decode error:", e);
        handleAuthFailure();
      }
    } catch (error) {
      logger.error("Auth check error:", error);
      handleAuthFailure();
    }
    logger.groupEnd();
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    logger.info("Logout initiated");
    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => logger.warn("Logout API error (ignored):", err));
    } catch (err) {
      logger.error("Logout error:", err);
      showError("Logout failed. Please try again.");
    } finally {
      toast.dismiss(logoutToastId);
      logoutAll();
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // ==================== FETCH PROJECT DATA ====================
  const fetchProject = useCallback(async () => {
    if (!projectId) {
      logger.error("No project ID provided");
      setProjectNotFound(true);
      setPageLoading(false);
      return;
    }

    logger.group("Fetching Project");
    logger.info("Project ID:", projectId);

    try {
      setPageLoading(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      logger.debug("API Response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Project not found");
      }

      const project = result.data;
      logger.success("Project loaded:", project.ProjectName);

      // Map project data to form data
      const mappedData = { ...INITIAL_FORM_DATA };

      // Map all fields from project
      Object.keys(mappedData).forEach((key) => {
        if (project[key] !== undefined && project[key] !== null) {
          mappedData[key] = project[key];
        }
      });

      // Handle specific field mappings
      mappedData.status = project.status === 1 || project.status === "1" ? 1 : 0;
      mappedData.featured_project = project.featured_project === "1" || project.featured_project === 1 ? "1" : "0";
      mappedData.verified = project.verified === 1 || project.verified === "1" ? 1 : 0;

      // Handle amenity boolean fields
      AMENITY_FIELDS.forEach(({ key }) => {
        mappedData[key] = project[key] === 1 || project[key] === "1" ? 1 : 0;
      });

      // Handle date fields
      if (project.completion_date) {
        mappedData.completion_date = project.completion_date.split("T")[0];
      }

      logger.debug("Mapped form data:", mappedData);

      setFormData(mappedData);
      setOriginalData(mappedData);

      // Set existing images
      if (project.featured_image) {
        setExistingMainImage(project.featured_image);
        logger.debug("Existing main image:", project.featured_image);
      }

      if (project.gallery && Array.isArray(project.gallery)) {
        setExistingGallery(project.gallery);
        logger.debug("Existing gallery images:", project.gallery.length);
      } else if (project.images && Array.isArray(project.images)) {
        // Handle different API response formats
        setExistingGallery(project.images.map((img, i) => ({
          id: i,
          Url: typeof img === "string" ? img : img.Url,
        })));
      }

      setProjectNotFound(false);
    } catch (err) {
      logger.error("Fetch project error:", err);
      showError(err.message || "Failed to load project");
      setProjectNotFound(true);
    } finally {
      setPageLoading(false);
      logger.groupEnd();
    }
  }, [projectId]);

  // Calculate SEO score
  useEffect(() => {
    let score = 0;
    const totalChecks = 7;
    const plainDescription = formData.Description?.replace(/<[^>]*>/g, "") || "";

    if (formData.ProjectName && formData.ProjectName.length >= 10) score++;
    if (plainDescription.split(/\s+/).filter(Boolean).length >= 50) score++;
    if (formData.price) score++;
    if (formData.property_type) score++;
    if (formData.LocationName || formData.CityName) score++;
    if (formData.area) score++;
    if (formData.DeveloperName) score++;

    setSeoScore(Math.round((score / totalChecks) * 100));
  }, [formData]);

  // Check for changes
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData) ||
        selectedMainImage !== null ||
        selectedImages.length > 0 ||
        imagesToRemove.length > 0 ||
        removeMainImage;
      setHasChanges(changed);
    }
  }, [formData, originalData, selectedMainImage, selectedImages, imagesToRemove, removeMainImage]);

  // Auth and data loading
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
    }
  }, [isAuthenticated, projectId, fetchProject]);

  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((field, value) => {
    logger.debug(`Field changed: ${field}`, value);

    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "ProjectName") {
        const slug = (value || "")
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/--+/g, "-");
        updated.project_slug = slug;
      }

      return updated;
    });

    if (value && errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleDescriptionChange = useCallback((content) => {
    handleChange("Description", content);
  }, [handleChange]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (REQUIRED_FIELDS.find((f) => f.field === field) && !formData[field]) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }));
    }
  }, [formData]);

  const handleImageUpload = useCallback((e, type) => {
    const files = Array.from(e.target.files || []);
    logger.info(`Image upload - Type: ${type}, Files count: ${files.length}`);

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
      setRemoveMainImage(false);
      showSuccess("New featured image selected!");
    }

    if (type === "gallery") {
      const total = existingGallery.length - imagesToRemove.length + selectedImages.length + validFiles.length;
      if (total > 20) {
        showError("Maximum 20 images allowed in gallery.");
        return;
      }
      setSelectedImages((prev) => [...prev, ...validFiles]);
      showSuccess(`${validFiles.length} images added to gallery!`);
    }

    e.target.value = "";
  }, [existingGallery.length, imagesToRemove.length, selectedImages.length]);

  const removeNewImage = useCallback((index, type) => {
    if (type === "main") {
      setSelectedMainImage(null);
      showSuccess("New featured image removed");
    } else {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
      showSuccess("Image removed from selection");
    }
  }, []);

  const removeExistingImage = useCallback((imageId, type) => {
    if (type === "main") {
      setRemoveMainImage(true);
      setExistingMainImage(null);
      showSuccess("Featured image marked for removal");
    } else {
      setImagesToRemove((prev) => [...prev, imageId]);
      setExistingGallery((prev) => prev.filter((img) => img.id !== imageId));
      showSuccess("Gallery image marked for removal");
    }
  }, []);

  // ==================== VALIDATION ====================
  const validateForm = useCallback(() => {
    logger.group("Form Validation");
    const newErrors = {};
    const plainDescription = formData.Description?.replace(/<[^>]*>/g, "") || "";

    REQUIRED_FIELDS.forEach(({ field, label }) => {
      const value = field === "Description" ? plainDescription : formData[field];
      if (!value) {
        newErrors[field] = `${label} is required`;
        logger.warn(`Missing required field: ${field}`);
      }
    });

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = "Price must be a valid number";
    }

    if (formData.area && isNaN(Number(formData.area))) {
      newErrors.area = "Area must be a valid number";
    }

    const descriptionWordCount = plainDescription.split(/\s+/).filter(Boolean).length;
    if (descriptionWordCount < 50) {
      newErrors.Description = `Description should have at least 50 words (${descriptionWordCount}/50)`;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      logger.error("Validation failed:", newErrors);
      const missingLabels = Object.keys(newErrors).map((key) => {
        const found = REQUIRED_FIELDS.find((f) => f.field === key);
        return found ? found.label : key;
      });
      showError(`Please fill required fields: ${missingLabels.slice(0, 3).join(", ")}${missingLabels.length > 3 ? "..." : ""}`);
      logger.groupEnd();
      return false;
    }

    logger.success("Validation passed");
    logger.groupEnd();
    return true;
  }, [formData]);

  const generateSlug = useCallback(() => {
    if (!formData.ProjectName) {
      showError("Please enter project name first");
      return;
    }

    const slug = formData.ProjectName.toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");

    setFormData((prev) => ({ ...prev, project_slug: slug }));
    showSuccess("Project slug generated!");
  }, [formData.ProjectName]);

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = useCallback(async () => {
    logger.group("Form Submission (Update)");
    logger.info("Update initiated for project:", projectId);

    if (!validateForm()) {
      logger.groupEnd();
      return;
    }

    setSaving(true);
    const saveToastId = showLoadingToast("Updating project...");

    try {
      const fd = new FormData();

      // Separate project fields from specs fields
      const projectData = {};
      const specsData = {};

      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          if (SPECS_TABLE_FIELDS.includes(key)) {
            specsData[key] = value;
          } else if (PROJECT_TABLE_FIELDS.includes(key)) {
            projectData[key] = value;
          }
        }
      });

      logger.debug("Project Data:", Object.keys(projectData));
      logger.debug("Specs Data:", specsData);

      // Append project fields to FormData
      Object.keys(projectData).forEach((key) => {
        fd.append(key, projectData[key]);
      });

      // Append specs as JSON string
      if (Object.keys(specsData).length > 0) {
        fd.append("specs", JSON.stringify(specsData));
      }

      // Handle main image
      if (selectedMainImage) {
        fd.append("featured_image", selectedMainImage);
        logger.debug("New featured image attached");
      } else if (removeMainImage) {
        fd.append("remove_featured_image", "true");
        logger.debug("Featured image marked for removal");
      }

      // Add new gallery images
      selectedImages.forEach((img, index) => {
        fd.append("gallery_images", img);
        logger.debug(`Gallery image [${index}] attached`);
      });

      // Handle removed gallery images
      if (imagesToRemove.length > 0) {
        fd.append("remove_gallery_images", JSON.stringify(imagesToRemove));
        logger.debug("Gallery images to remove:", imagesToRemove);
      }

      const token = getAdminToken();
      if (!token) {
        logger.error("No auth token found");
        showError("Please login to continue");
        handleAuthFailure();
        return;
      }

      logger.info(`Sending PUT request to /api/v1/projects/${projectId}`);

      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const result = await response.json();
      logger.debug("API Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      toast.dismiss(saveToastId);

      if (result.success) {
        logger.success("Project updated successfully!", result);
        showSuccess("Project updated successfully!");

        // Reset change tracking
        setOriginalData(formData);
        setSelectedMainImage(null);
        setSelectedImages([]);
        setImagesToRemove([]);
        setRemoveMainImage(false);
        setHasChanges(false);

        // Refresh project data
        setTimeout(() => {
          fetchProject();
        }, 1000);
      }
    } catch (e) {
      logger.error("Submit error:", e);
      toast.dismiss(saveToastId);
      showError(e.message || "Failed to update project");
    } finally {
      setSaving(false);
      logger.groupEnd();
    }
  }, [formData, projectId, selectedMainImage, selectedImages, imagesToRemove, removeMainImage, validateForm, handleAuthFailure, fetchProject]);

  // ==================== UTILITY FUNCTIONS ====================
  const copyFormData = useCallback(() => {
    const dataToCopy = JSON.stringify(formData, null, 2);
    navigator.clipboard.writeText(dataToCopy);
    showSuccess("Form data copied to clipboard!");
  }, [formData]);

  const resetForm = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      if (originalData) {
        setFormData(originalData);
      }
      setSelectedMainImage(null);
      setSelectedImages([]);
      setImagesToRemove([]);
      setRemoveMainImage(false);
      setErrors({});
      setTouched({});
      fetchProject(); // Reload original data
      showSuccess("Form reset to original values");
    }
  }, [originalData, fetchProject]);

  const previewProject = useCallback(() => {
    if (!formData.project_slug) {
      showError("Project has no slug");
      return;
    }
    window.open(`${window.location.origin}/projects/${formData.project_slug}`, "_blank");
  }, [formData.project_slug]);

  const getFieldClass = useCallback(
    (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
      return errors[field] && touched[field] ? errorClass : baseClass;
    },
    [errors, touched]
  );

  const getWordCount = useCallback((htmlContent) => {
    if (!htmlContent) return 0;
    const plainText = htmlContent.replace(/<[^>]*>/g, "");
    return plainText.split(/\s+/).filter(Boolean).length;
  }, []);

  // ==================== LOADING STATES ====================
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

  if (pageLoading) {
    return (
      <>
        <Toaster />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="max-w-[1250px] mx-auto px-3">
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-4 text-gray-600 font-medium">Loading project...</p>
                <p className="mt-2 text-gray-400 text-sm">Project ID: {projectId}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (projectNotFound) {
    return (
      <>
        <Toaster />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="max-w-[1250px] mx-auto px-3">
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Project Not Found</h2>
                <p className="text-gray-600 mb-6">The project with ID "{projectId}" could not be found.</p>
                <button
                  onClick={() => (window.location.href = "/admin/projects")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const descriptionWordCount = getWordCount(formData.Description);
  const totalGalleryCount = existingGallery.length - imagesToRemove.length + selectedImages.length;

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} gutter={8} toastOptions={{ duration: 4000 }} />

      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="max-w-[1250px] mx-auto px-3">
          {/* Top Control Bar */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  Edit Project
                  <span className="text-sm font-normal text-gray-500 ml-2">#{projectId}</span>
                </h1>

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

                {hasChanges && (
                  <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    Unsaved changes
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Debug Console Button */}
                <button
                  type="button"
                  onClick={() => {
                    logger.group("Current Form State");
                    const projectFields = {};
                    const specsFields = {};
                    Object.keys(formData).forEach((key) => {
                      if (SPECS_TABLE_FIELDS.includes(key)) {
                        specsFields[key] = formData[key];
                      } else if (PROJECT_TABLE_FIELDS.includes(key)) {
                        projectFields[key] = formData[key];
                      }
                    });
                    logger.table(projectFields, "Project Table Fields");
                    logger.table(specsFields, "Specs Table Fields");
                    logger.debug("Errors:", errors);
                    logger.debug("Existing Main Image:", existingMainImage);
                    logger.debug("New Main Image:", selectedMainImage?.name || null);
                    logger.debug("Existing Gallery:", existingGallery.length);
                    logger.debug("New Gallery:", selectedImages.map((img) => img.name));
                    logger.debug("Images to Remove:", imagesToRemove);
                    logger.groupEnd();
                    showSuccess("Check browser console for debug info");
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium border border-purple-300 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                >
                  🐛 Debug
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchProject}
                  disabled={pageLoading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${pageLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>

                {/* SEO Score Display */}
                <div className="flex items-center bg-gray-100 border border-gray-200 px-3 py-1 rounded">
                  <Globe className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">SEO:</span>
                  <span className={`ml-1 text-sm font-bold ${seoScore >= 80 ? "text-green-600" : seoScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {seoScore}%
                  </span>
                </div>

                {formData.project_slug && (
                  <button
                    type="button"
                    onClick={previewProject}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                )}
              </div>
            </div>

            <ValidationIndicator formData={formData} />

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
              {["details", "location", "amenities", "media", "seo"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium border rounded capitalize ${
                    activeTab === tab
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content Area */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            <div className="p-3">
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
                            onChange={(e) => handleChange("status", Number(e.target.value))}
                          >
                            <option value={1}>Active</option>
                            <option value={0}>Draft</option>
                          </select>
                        </div>

                        <div className="mt-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.verified === 1}
                              onChange={(e) => handleChange("verified", e.target.checked ? 1 : 0)}
                              className="w-3.5 h-3.5 rounded"
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

                          {/* Bedrooms */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <label className={`${labelCls} col-span-4`}>Bedrooms</label>
                            <div className="col-span-8">
                              <select
                                className={selectCls}
                                value={formData.bedroom || ""}
                                onChange={(e) => handleChange("bedroom", e.target.value)}
                              >
                                <option value="">Select</option>
                                <option value="Studio">Studio</option>
                                {[1, 2, 3, 4, 5, 6].map((n) => (
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

                    {/* Developer Info (SPECS FIELDS) */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>
                        Developer Information
                        <span className="text-xs text-blue-600 ml-2">(Specs)</span>
                      </div>
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
                            <label className={`${labelCls} block mb-1`}>RERA Number</label>
                            <input
                              className={fieldCls}
                              value={formData.ReraNumber || ""}
                              onChange={(e) => handleChange("ReraNumber", e.target.value)}
                              placeholder="RERA123456"
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
                        <div className="text-sm text-gray-700 mb-2 font-medium">Featured Image</div>

                        {/* Existing Main Image */}
                        {existingMainImage && !removeMainImage && !selectedMainImage && (
                          <div className="mb-3">
                            <ExistingImage
                              src={existingMainImage}
                              label="Current"
                              isMain={true}
                              onRemove={() => removeExistingImage(null, "main")}
                            />
                          </div>
                        )}

                        {/* New Main Image */}
                        {selectedMainImage && (
                          <div className="mb-3">
                            <div className="relative overflow-hidden border border-green-500 ring-2 ring-green-300 bg-white rounded">
                              <img
                                src={URL.createObjectURL(selectedMainImage)}
                                alt="New Featured"
                                className="w-full h-32 object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                New
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
                          {existingMainImage || selectedMainImage ? "Replace Featured Image" : "Add Featured Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "main")}
                            className="hidden"
                          />
                        </label>

                        {/* Gallery Images */}
                        <div className="mt-4 text-sm text-gray-700 mb-2 font-medium">
                          Gallery Images ({totalGalleryCount}/20)
                        </div>

                        {/* Existing Gallery */}
                        {existingGallery.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {existingGallery.map((img) => (
                              <ExistingImage
                                key={img.id}
                                src={img.Url}
                                label="Existing"
                                onRemove={() => removeExistingImage(img.id, "gallery")}
                              />
                            ))}
                          </div>
                        )}

                        {/* New Gallery Images */}
                        {selectedImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {selectedImages.map((img, i) => (
                              <div key={i} className="relative group">
                                <div className="relative overflow-hidden border border-green-400 bg-white rounded">
                                  <img
                                    src={URL.createObjectURL(img)}
                                    alt={`New ${i}`}
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
                        <div className="grid grid-cols-3 gap-2">
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
                            onClick={() => window.open(`/admin/projects`, "_self")}
                            className="h-9 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            List
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
                            "Commercial", "Office", "Mixed Use",
                          ].map((type) => (
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

                        {/* Coordinates (SPECS FIELDS) */}
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div>
                            <label className={`${labelCls} block mb-1`}>
                              Latitude <span className="text-xs text-blue-600">(Specs)</span>
                            </label>
                            <input
                              className={fieldCls}
                              value={formData.Latitude || ""}
                              onChange={(e) => handleChange("Latitude", e.target.value)}
                              placeholder="25.0772"
                            />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>
                              Longitude <span className="text-xs text-blue-600">(Specs)</span>
                            </label>
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

                    {/* Description with SimpleTextEditor */}
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>
                        Description <span className="text-red-500">*</span>
                      </div>
                      <div className={boxBodyCls}>
                        <div className={`${errors.Description && touched.Description ? "ring-1 ring-red-400 rounded" : ""}`}>
                          <SimpleTextEditor
                            value={formData.Description || ""}
                            onChange={handleDescriptionChange}
                            placeholder="Write detailed project description... (minimum 50 words recommended)"
                            minHeight="200px"
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-500">Words: {descriptionWordCount}</span>
                          <span className={`text-xs ${descriptionWordCount < 50 ? "text-amber-600" : "text-green-600"}`}>
                            {descriptionWordCount < 50 ? `Minimum 50 words recommended (${50 - descriptionWordCount} more needed)` : "Good length!"}
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
                        <SimpleTextEditor
                          value={formData.Specifications || ""}
                          onChange={(content) => handleChange("Specifications", content)}
                          placeholder="Technical specifications, construction details..."
                          minHeight="150px"
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
                          <label className={`${labelCls} block mb-2`}>
                            Additional Amenities (comma separated)
                          </label>
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
                              className="w-full h-16 border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded"
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

          {/* Footer bar */}
          <div className="mt-3 bg-white border border-gray-300 p-3 rounded-b flex items-center justify-between">
            <button
              type="button"
              onClick={() => (window.location.href = "/admin/projects")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-xs text-amber-600">You have unsaved changes</span>
              )}
              <div className="text-xs text-gray-500">
                {REQUIRED_FIELDS.filter(({ field }) => {
                  if (field === "Description") {
                    return descriptionWordCount < 50;
                  }
                  return !formData[field];
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Project
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