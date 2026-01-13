"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Plus,
  X,
  RefreshCw,
  Building2,
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
  Lift: 0,
  Club: 0,
  RainWaterHaresting: 0,
  PowerBackup: 0,
  GasConnection: 0,
  SwimmingPool: 0,
  Parking: 0,
  Security: 0,
  InternetConnection: 0,
  Gym: 0,
  ServantQuarters: 0,
  Balcony: 0,
  PlayArea: 0,
  CCTV: 0,
  ReservedPark: 0,
  Intercom: 0,
  Lawn: 0,
  Terrace: 0,
  Garden: 0,
  EarthquakeConstruction: 0,
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
  const imageUrl = image.Url || image.url || image;
  const imageId = image.id || image.image_id;
  
  return (
    <div className="relative group">
      <div className={`relative overflow-hidden border ${isFeatured ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'} bg-white`}>
        <img 
          src={imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`} 
          alt="Project" 
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
              <Building2 className="w-4 h-4" />
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
export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;

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

  // ==================== FETCH PROJECT DATA ====================
  const fetchProjectData = useCallback(async () => {
    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    try {
      setLoading(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const project = result.data;
        
        // Map API response to form data
        const mappedData = {
          ProjectName: project.ProjectName || "",
          project_slug: project.project_slug || "",
          listing_type: project.listing_type || "sale",
          property_type: project.property_type || "Apartment",
          price: project.price?.toString() || "",
          price_end: project.price_end?.toString() || "",
          askprice: project.askprice?.toString() || "0",
          currency_id: project.currency_id || 1,
          bedroom: project.bedroom?.toString() || "",
          area: project.area?.toString() || "",
          area_end: project.area_end?.toString() || "",
          area_size: project.area_size || "Sq.Ft.",
          state_id: project.state_id?.toString() || "",
          city_id: project.city_id?.toString() || "",
          community_id: project.community_id?.toString() || "",
          sub_community_id: project.sub_community_id?.toString() || "",
          LocationName: project.LocationName || "",
          BuildingName: project.BuildingName || "",
          StreetName: project.StreetName || "",
          CityName: project.CityName || "",
          StateName: project.StateName || "",
          PinCode: project.PinCode || "",
          LandMark: project.LandMark || "",
          country: project.country || "UAE",
          Description: project.Description || "",
          Specifications: project.Specifications || "",
          floors: project.floors?.toString() || "",
          rooms: project.rooms?.toString() || "",
          total_building: project.total_building?.toString() || "",
          kitchen_type: project.kitchen_type || "",
          completion_date: project.completion_date ? project.completion_date.split('T')[0] : "",
          vacating_date: project.vacating_date ? project.vacating_date.split('T')[0] : "",
          StartDate: project.StartDate ? project.StartDate.split('T')[0] : "",
          EndDate: project.EndDate ? project.EndDate.split('T')[0] : "",
          status: project.status ?? 1,
          featured_project: project.featured_project?.toString() || "0",
          verified: project.verified || 0,
          occupancy: project.occupancy || "",
          qc: project.qc || "",
          exclusive_status: project.exclusive_status || "exclusive",
          developer_id: project.developer_id?.toString() || "",
          agent_id: project.agent_id?.toString() || "",
          
          // Amenities (boolean to number)
          Lift: project.Lift || 0,
          Club: project.Club || 0,
          RainWaterHaresting: project.RainWaterHaresting || 0,
          PowerBackup: project.PowerBackup || 0,
          GasConnection: project.GasConnection || 0,
          SwimmingPool: project.SwimmingPool || 0,
          Parking: project.Parking || 0,
          Security: project.Security || 0,
          InternetConnection: project.InternetConnection || 0,
          Gym: project.Gym || 0,
          ServantQuarters: project.ServantQuarters || 0,
          Balcony: project.Balcony || 0,
          PlayArea: project.PlayArea || 0,
          CCTV: project.CCTV || 0,
          ReservedPark: project.ReservedPark || 0,
          Intercom: project.Intercom || 0,
          Lawn: project.Lawn || 0,
          Terrace: project.Terrace || 0,
          Garden: project.Garden || 0,
          EarthquakeConstruction: project.EarthquakeConstruction || 0,
          
          amenities: project.amenities || "",
          Vaastu: project.Vaastu || "",
          video_url: project.video_url || "",
          whatsapp_url: project.whatsapp_url || "",
          Url: project.Url || "",
          user_id: project.user_id || 1,
          ProjectId: project.ProjectId || "",
          ProjectNumber: project.ProjectNumber || "",
          keyword: project.keyword || "",
          seo_title: project.seo_title || "",
          meta_description: project.meta_description || "",
          canonical_tags: project.canonical_tags || "",
          dld_permit: project.dld_permit || "",
          
          // Specs data
          ReraNumber: project.specs?.ReraNumber || project.ReraNumber || "",
          DeveloperName: project.specs?.DeveloperName || project.DeveloperName || "",
          CompanyName: project.specs?.CompanyName || project.CompanyName || "",
          MaxArea: project.specs?.MaxArea?.toString() || "",
          MinArea: project.specs?.MinArea?.toString() || "",
          MaxPrice: project.specs?.MaxPrice?.toString() || "",
          MinPrice: project.specs?.MinPrice?.toString() || "",
          Latitude: project.specs?.Latitude || "",
          Longitude: project.specs?.Longitude || "",
        };

        setFormData(mappedData);
        setOriginalData(mappedData);

        // Handle images
        if (project.featured_image) {
          setExistingFeaturedImage(project.featured_image);
        }
        
        if (project.gallery && Array.isArray(project.gallery)) {
          setExistingImages(project.gallery);
        }

        toast.success("Project data loaded successfully");
      } else {
        throw new Error(result.message || "Failed to load project");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProjectData();
    }
  }, [isAuthenticated, projectId, fetchProjectData]);

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

      const response = await fetch(`${API_BASE_URL}/api/v1/projects/gallery/${imageId}`, {
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

    if (formData.Description && formData.Description.split(/\s+/).filter(Boolean).length < 20) {
      newErrors.Description = "Description should have at least 20 words";
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
    if (!formData.ProjectName) {
      toast.error("Please enter project name first");
      return;
    }
    
    const slug = formData.ProjectName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      + "-" + Date.now();
    
    setFormData(prev => ({ ...prev, project_slug: slug }));
    toast.success("Project slug generated!");
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const fd = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, value);
        }
      });

      // Add new images
      if (selectedMainImage) {
        fd.append("featured_image", selectedMainImage);
      }
      
      selectedImages.forEach((img) => {
        fd.append("gallery_images", img);
      });

      // Prepare specs data
      const specs = {
        ReraNumber: formData.ReraNumber,
        DeveloperName: formData.DeveloperName,
        CompanyName: formData.CompanyName,
        MaxArea: formData.MaxArea,
        MinArea: formData.MinArea,
        MaxPrice: formData.MaxPrice,
        MinPrice: formData.MinPrice,
        Latitude: formData.Latitude,
        Longitude: formData.Longitude,
      };
      
      fd.append("specs", JSON.stringify(specs));

      const token = getAdminToken();
      if (!token) {
        toast.error("Please login to continue");
        handleAuthFailure();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
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
        toast.success("Project updated successfully!");
        setOriginalData(formData);
        setSelectedMainImage(null);
        setSelectedImages([]);
        setHasChanges(false);
        
        // Refresh project data
        await fetchProjectData();
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.error(e.message || "Failed to update project");
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

  const previewProject = () => {
    if (!formData.project_slug) {
      toast.error("Project slug not found");
      return;
    }
    window.open(`${window.location.origin}/projects/${formData.project_slug}`, '_blank');
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
          <div className="text-sm text-gray-600">Loading project data...</div>
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
                Edit Project
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
                onClick={fetchProjectData}
                className="inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </button>
              
              <button
                type="button"
                onClick={previewProject}
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

          {/* Project ID Badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-[11px] rounded">
              ID: {projectId}
            </span>
            {formData.project_slug && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[11px] rounded">
                Slug: {formData.project_slug}
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
              onClick={() => router.push("/admin/projects")}
              className="h-8 px-3 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
            >
              ← Back to Projects
            </button>
          </div>

          {/* Validation Indicator */}
          <ValidationIndicator formData={formData} />

          {/* Main Content - Same structure as Add page but with edit functionality */}
          <div className="border border-gray-300 bg-white">
            <div className="flex items-center gap-1 border-b border-gray-300 px-2 py-2">
              <span className="px-3 py-1 text-[12px] bg-white font-semibold border border-gray-300">
                Project Details
              </span>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-12 gap-3">
                {/* LEFT COLUMN - Same as Add page */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  {/* Featured + Status + Verified */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange("featured_project", formData.featured_project === "1" ? "0" : "1")}
                          className={`h-9 border border-gray-300 text-[12px] ${
                            formData.featured_project === "1" ? "bg-[#f6d6be]" : "bg-gray-100"
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
                      
                      <div className="mt-2">
                        <label className="flex items-center gap-2 text-[12px]">
                          <input
                            type="checkbox"
                            checked={formData.verified === 1}
                            onChange={(e) => handleChange("verified", e.target.checked ? 1 : 0)}
                            className="w-3.5 h-3.5"
                          />
                          Verified Project
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Basic Details - Same as Add page */}
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
                            />
                            {errors.ProjectName && touched.ProjectName && (
                              <span className="text-[10px] text-red-500">{errors.ProjectName}</span>
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

                        {/* Bathrooms */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Bathrooms</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.bathrooms || ""} 
                              onChange={(e) => handleChange("bathrooms", e.target.value)}
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
                        {/* Developer Name */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Developer Name</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.DeveloperName || ""} 
                              onChange={(e) => handleChange("DeveloperName", e.target.value)}
                              placeholder="e.g., Emaar Properties"
                            />
                          </div>
                        </div>

                        {/* Company Name */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Company Name</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.CompanyName || ""} 
                              onChange={(e) => handleChange("CompanyName", e.target.value)}
                              placeholder="e.g., Emaar Properties PJSC"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MIDDLE COLUMN */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  {/* Location Details */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Location Details</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        {/* Country */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Country</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls}
                              value={formData.country} 
                              onChange={(e) => handleChange("country", e.target.value)}
                            >
                              <option value="UAE">UAE</option>
                              <option value="India">India</option>
                              <option value="USA">USA</option>
                              <option value="UK">UK</option>
                              <option value="Canada">Canada</option>
                            </select>
                          </div>
                        </div>

                        {/* State/Emirate */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>State/Emirate</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.StateName || ""} 
                              onChange={(e) => handleChange("StateName", e.target.value)}
                              placeholder="e.g., Dubai"
                            />
                          </div>
                        </div>

                        {/* City */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>City</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.CityName || ""} 
                              onChange={(e) => handleChange("CityName", e.target.value)}
                              placeholder="e.g., Dubai"
                            />
                          </div>
                        </div>

                        {/* Community */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Community</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.community_id || ""} 
                              onChange={(e) => handleChange("community_id", e.target.value)}
                              placeholder="Community ID"
                            />
                          </div>
                        </div>

                        {/* Sub Community */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Sub Community</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.sub_community_id || ""} 
                              onChange={(e) => handleChange("sub_community_id", e.target.value)}
                              placeholder="Sub Community ID"
                            />
                          </div>
                        </div>

                        {/* Building Name */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Building Name</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.BuildingName || ""} 
                              onChange={(e) => handleChange("BuildingName", e.target.value)}
                              placeholder="e.g., Burj Khalifa"
                            />
                          </div>
                        </div>

                        {/* Street Name */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Street Name</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.StreetName || ""} 
                              onChange={(e) => handleChange("StreetName", e.target.value)}
                              placeholder="e.g., Sheikh Zayed Road"
                            />
                          </div>
                        </div>

                        {/* Landmark */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Landmark</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.LandMark || ""} 
                              onChange={(e) => handleChange("LandMark", e.target.value)}
                              placeholder="e.g., Near Dubai Mall"
                            />
                          </div>
                        </div>

                        {/* Pin Code */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Pin Code</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.PinCode || ""} 
                              onChange={(e) => handleChange("PinCode", e.target.value)}
                              placeholder="e.g., 12345"
                            />
                          </div>
                        </div>

                        {/* Location Name */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Location Name</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.LocationName || ""} 
                              onChange={(e) => handleChange("LocationName", e.target.value)}
                              placeholder="e.g., Downtown Dubai"
                            />
                          </div>
                        </div>

                        {/* Latitude */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Latitude</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.Latitude || ""} 
                              onChange={(e) => handleChange("Latitude", e.target.value)}
                              placeholder="e.g., 25.2048"
                            />
                          </div>
                        </div>

                        {/* Longitude */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Longitude</label>
                          <div className="col-span-8">
                            <input 
                              className={fieldCls}
                              value={formData.Longitude || ""} 
                              onChange={(e) => handleChange("Longitude", e.target.value)}
                              placeholder="e.g., 55.2708"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Type & Status */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Property Type & Status</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        {/* Listing Type */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Listing Type</label>
                          <div className="col-span-8">
                            <select 
                              className={getFieldClass("listing_type", selectCls, selectErrorCls)}
                              value={formData.listing_type} 
                              onChange={(e) => handleChange("listing_type", e.target.value)}
                              onBlur={() => handleBlur("listing_type")}
                            >
                              <option value="sale">Sale</option>
                              <option value="rent">Rent</option>
                              <option value="short-term">Short Term</option>
                            </select>
                            {errors.listing_type && touched.listing_type && (
                              <span className="text-[10px] text-red-500">{errors.listing_type}</span>
                            )}
                          </div>
                        </div>

                        {/* Property Type */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Property Type</label>
                          <div className="col-span-8">
                            <select 
                              className={getFieldClass("property_type", selectCls, selectErrorCls)}
                              value={formData.property_type} 
                              onChange={(e) => handleChange("property_type", e.target.value)}
                              onBlur={() => handleBlur("property_type")}
                            >
                              <option value="Apartment">Apartment</option>
                              <option value="Villa">Villa</option>
                              <option value="Townhouse">Townhouse</option>
                              <option value="Penthouse">Penthouse</option>
                              <option value="Office">Office</option>
                              <option value="Shop">Shop</option>
                              <option value="Warehouse">Warehouse</option>
                              <option value="Land">Land</option>
                              <option value="Building">Building</option>
                            </select>
                            {errors.property_type && touched.property_type && (
                              <span className="text-[10px] text-red-500">{errors.property_type}</span>
                            )}
                          </div>
                        </div>

                        {/* Kitchen Type */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Kitchen Type</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls}
                              value={formData.kitchen_type} 
                              onChange={(e) => handleChange("kitchen_type", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Modular">Modular</option>
                              <option value="Open">Open</option>
                              <option value="Closed">Closed</option>
                              <option value="Semi-Modular">Semi-Modular</option>
                            </select>
                          </div>
                        </div>

                        {/* Occupancy */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Occupancy</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls}
                              value={formData.occupancy} 
                              onChange={(e) => handleChange("occupancy", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Vacant">Vacant</option>
                              <option value="Tenanted">Tenanted</option>
                              <option value="Owner">Owner</option>
                            </select>
                          </div>
                        </div>

                        {/* Exclusive Status */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Exclusive Status</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls}
                              value={formData.exclusive_status} 
                              onChange={(e) => handleChange("exclusive_status", e.target.value)}
                            >
                              <option value="exclusive">Exclusive</option>
                              <option value="non-exclusive">Non-Exclusive</option>
                            </select>
                          </div>
                        </div>

                        {/* Vaastu */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Vaastu</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls}
                              value={formData.Vaastu} 
                              onChange={(e) => handleChange("Vaastu", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>

                        {/* QC */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>QC Status</label>
                          <div className="col-span-8">
                            <select 
                              className={selectCls}
                              value={formData.qc} 
                              onChange={(e) => handleChange("qc", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="approved">Approved</option>
                              <option value="pending">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  {/* Media Section */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Media</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-3">
                        {/* Featured Image */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Featured Image</label>
                          <div className="border border-gray-300 border-dashed p-2">
                            {existingFeaturedImage ? (
                              <div className="space-y-2">
                                <p className="text-[11px] text-gray-600 mb-1">Current Featured Image:</p>
                                <div className="relative">
                                  <img 
                                    src={existingFeaturedImage.Url || existingFeaturedImage.url} 
                                    alt="Featured" 
                                    className="w-full h-40 object-cover border"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-500 mb-2">No featured image set</p>
                            )}
                            
                            {selectedMainImage ? (
                              <div className="mt-2">
                                <p className="text-[11px] text-green-600 mb-1">New Featured Image Selected:</p>
                                <div className="flex items-center justify-between bg-green-50 p-2 border border-green-200">
                                  <span className="text-[11px] truncate">{selectedMainImage.name}</span>
                                  <button 
                                    type="button"
                                    onClick={() => removeNewImage(null, "main")}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <label className="flex items-center justify-center h-10 border border-gray-300 bg-gray-50 text-[12px] cursor-pointer hover:bg-gray-100">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Upload New Featured Image
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(e, "main")}
                                  />
                                </label>
                                <p className="text-[10px] text-gray-500 mt-1">Max 5MB, JPG/PNG/WebP</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Gallery Images */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Gallery Images</label>
                          <div className="border border-gray-300 border-dashed p-2">
                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[11px] text-gray-600 mb-2">Existing Images ({existingImages.length}):</p>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  {existingImages.map((img, idx) => (
                                    <ExistingImageCard
                                      key={idx}
                                      image={img}
                                      isFeatured={existingFeaturedImage && 
                                        (existingFeaturedImage.id === (img.id || img.image_id))}
                                      deleting={deletingImageId === (img.id || img.image_id)}
                                      onDelete={handleDeleteExistingImage}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Selected New Images */}
                            {selectedImages.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[11px] text-green-600 mb-2">New Images to Upload ({selectedImages.length}):</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative border border-green-300 bg-green-50">
                                      <img 
                                        src={URL.createObjectURL(img)} 
                                        alt="New" 
                                        className="w-full h-20 object-cover"
                                      />
                                      <button 
                                        type="button"
                                        onClick={() => removeNewImage(idx, "gallery")}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                      <div className="p-1 text-[9px] truncate">{img.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upload Button */}
                            <div>
                              <label className="flex items-center justify-center h-10 border border-gray-300 bg-gray-50 text-[12px] cursor-pointer hover:bg-gray-100">
                                <Plus className="w-3 h-3 mr-1" />
                                Add More Images to Gallery
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  multiple 
                                  className="hidden" 
                                  onChange={(e) => handleImageUpload(e, "gallery")}
                                />
                              </label>
                              <p className="text-[10px] text-gray-500 mt-1">
                                Max {20 - (existingImages.length + selectedImages.length)} more, 5MB each
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Video URL */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Video URL (YouTube)</label>
                          <input 
                            className={fieldCls}
                            value={formData.video_url || ""} 
                            onChange={(e) => handleChange("video_url", e.target.value)}
                            placeholder="https://youtube.com/embed/..."
                          />
                        </div>

                        {/* WhatsApp URL */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>WhatsApp URL</label>
                          <input 
                            className={fieldCls}
                            value={formData.whatsapp_url || ""} 
                            onChange={(e) => handleChange("whatsapp_url", e.target.value)}
                            placeholder="https://wa.me/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO Checklist */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>SEO Checklist</div>
                    <div className={boxBodyCls}>
                      <SeoChecklist formData={formData} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Description & Specifications */}
          <div className="mt-3 border border-gray-300 bg-white">
            <div className={boxHeaderCls}>Description & Specifications</div>
            <div className={boxBodyCls}>
              <div className="grid grid-cols-12 gap-3">
                {/* Description */}
                <div className="col-span-12 md:col-span-6">
                  <label className={`${labelRequiredCls} block mb-1`}>Description</label>
                  <textarea 
                    className={`w-full h-48 border ${errors.Description && touched.Description ? 'border-red-400 bg-red-50' : 'border-gray-300'} p-2 text-[12px] outline-none focus:border-gray-500`}
                    value={formData.Description || ""} 
                    onChange={(e) => handleChange("Description", e.target.value)}
                    onBlur={() => handleBlur("Description")}
                    placeholder="Enter detailed project description (minimum 50 words)..."
                  />
                  {errors.Description && touched.Description && (
                    <span className="text-[10px] text-red-500">{errors.Description}</span>
                  )}
                  <div className="text-[11px] text-gray-500 mt-1">
                    Word Count: {formData.Description ? formData.Description.split(/\s+/).filter(Boolean).length : 0} words
                  </div>
                </div>

                {/* Specifications */}
                <div className="col-span-12 md:col-span-6">
                  <label className={`${labelCls} block mb-1`}>Specifications</label>
                  <textarea 
                    className="w-full h-48 border border-gray-300 p-2 text-[12px] outline-none focus:border-gray-500"
                    value={formData.Specifications || ""} 
                    onChange={(e) => handleChange("Specifications", e.target.value)}
                    placeholder="Enter project specifications..."
                  />
                  <div className="text-[11px] text-gray-500 mt-1">
                    Add bullet points or detailed specs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row: Amenities */}
          <div className="mt-3 border border-gray-300 bg-white">
            <div className={boxHeaderCls}>Amenities</div>
            <div className={boxBodyCls}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {AMENITY_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-[12px] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData[key] === 1}
                      onChange={(e) => handleChange(key, e.target.checked ? 1 : 0)}
                      className="w-3.5 h-3.5"
                    />
                    {label}
                  </label>
                ))}
              </div>
              
              {/* Additional Amenities Text */}
              <div className="mt-3">
                <label className={`${labelCls} block mb-1`}>Additional Amenities (comma separated)</label>
                <input 
                  className={fieldCls}
                  value={formData.amenities || ""} 
                  onChange={(e) => handleChange("amenities", e.target.value)}
                  placeholder="e.g., Spa, Concierge, Business Center"
                />
              </div>
            </div>
          </div>

          {/* Fourth Row: SEO Fields */}
          <div className="mt-3 border border-gray-300 bg-white">
            <div className={boxHeaderCls}>SEO Fields</div>
            <div className={boxBodyCls}>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6 space-y-2">
                  <div>
                    <label className={`${labelCls} block mb-1`}>SEO Title</label>
                    <input 
                      className={fieldCls}
                      value={formData.seo_title || ""} 
                      onChange={(e) => handleChange("seo_title", e.target.value)}
                      placeholder="Optimal length: 50-60 characters"
                    />
                    <div className="text-[11px] text-gray-500 mt-1">
                      Length: {formData.seo_title?.length || 0} characters
                    </div>
                  </div>

                  <div>
                    <label className={`${labelCls} block mb-1`}>Keywords</label>
                    <input 
                      className={fieldCls}
                      value={formData.keyword || ""} 
                      onChange={(e) => handleChange("keyword", e.target.value)}
                      placeholder="Comma separated keywords"
                    />
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className={`${labelCls} block mb-1`}>Meta Description</label>
                  <textarea 
                    className="w-full h-32 border border-gray-300 p-2 text-[12px] outline-none focus:border-gray-500"
                    value={formData.meta_description || ""} 
                    onChange={(e) => handleChange("meta_description", e.target.value)}
                    placeholder="Optimal length: 150-160 characters"
                  />
                  <div className="text-[11px] text-gray-500 mt-1">
                    Length: {formData.meta_description?.length || 0} characters
                  </div>
                </div>

                <div className="col-span-12">
                  <label className={`${labelCls} block mb-1`}>Canonical Tags</label>
                  <input 
                    className={fieldCls}
                    value={formData.canonical_tags || ""} 
                    onChange={(e) => handleChange("canonical_tags", e.target.value)}
                    placeholder="Canonical URL tags"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={!hasChanges}
                className="h-9 px-4 border border-gray-300 bg-white text-[12px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard Changes
              </button>
              
              <button
                type="button"
                onClick={copyFormData}
                className="h-9 px-4 border border-gray-300 bg-white text-[12px] hover:bg-gray-50 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Data
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/admin/projects")}
                className="h-9 px-4 border border-gray-300 bg-white text-[12px] hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !hasChanges}
                className="h-9 px-4 bg-blue-600 text-white text-[12px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Update Project
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save Status Indicator */}
          {saving && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 text-[12px] text-blue-700 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Updating project data...
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasChanges && !saving && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 text-[12px] text-yellow-700">
              You have unsaved changes. Please save or discard them before leaving.
            </div>
          )}
        </div>
      </div>
    </>
  );
}