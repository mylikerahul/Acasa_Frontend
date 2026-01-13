"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Home,
  DollarSign,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  Target,
  Briefcase,
  AlertCircle,
  Check,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================

// Status Options
const STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "In Progress", label: "In Progress" },
  { value: "Contacted", label: "Contacted" },
  { value: "Qualified", label: "Qualified" },
  { value: "Lost", label: "Lost" },
  { value: "Converted", label: "Converted" },
];

// Priority Options
const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

// Quality Options
const QUALITY_OPTIONS = [
  { value: "Hot", label: "Hot 🔥" },
  { value: "Warm", label: "Warm" },
  { value: "Cold", label: "Cold" },
];

// Lead Status Options
const LEAD_STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Follow Up", label: "Follow Up" },
  { value: "Meeting", label: "Meeting" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Closed", label: "Closed" },
];

// Lost Status Options
const LOST_STATUS_OPTIONS = [
  { value: "not_interested", label: "Not Interested" },
  { value: "budget_issue", label: "Budget Issue" },
  { value: "location_issue", label: "Location Issue" },
  { value: "bought_elsewhere", label: "Bought Elsewhere" },
  { value: "no_response", label: "No Response" },
  { value: "other", label: "Other" },
];

// Type Options
const TYPE_OPTIONS = [
  { value: "property", label: "Property Enquiry" },
  { value: "project", label: "Project Enquiry" },
  { value: "general", label: "General Enquiry" },
  { value: "career", label: "Career Enquiry" },
  { value: "investment", label: "Investment Enquiry" },
];

// Item Type Options
const ITEM_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "studio", label: "Studio" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "warehouse", label: "Warehouse" },
  { value: "land", label: "Land" },
];

// Source Options
const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "walk_in", label: "Walk In" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "property_finder", label: "Property Finder" },
  { value: "bayut", label: "Bayut" },
  { value: "dubizzle", label: "Dubizzle" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google_ads", label: "Google Ads" },
  { value: "exhibition", label: "Exhibition" },
  { value: "other", label: "Other" },
];

// Contact Type Options
const CONTACT_TYPE_OPTIONS = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "investor", label: "Investor" },
  { value: "agent", label: "Agent" },
  { value: "developer", label: "Developer" },
];

// Listing Type Options
const LISTING_TYPE_OPTIONS = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "both", label: "Both (Sale & Rent)" },
];

// Exclusive Status Options
const EXCLUSIVE_STATUS_OPTIONS = [
  { value: "exclusive", label: "Exclusive" },
  { value: "non_exclusive", label: "Non-Exclusive" },
  { value: "semi_exclusive", label: "Semi-Exclusive" },
];

// Construction Status Options
const CONSTRUCTION_STATUS_OPTIONS = [
  { value: "ready", label: "Ready to Move" },
  { value: "off_plan", label: "Off Plan" },
  { value: "under_construction", label: "Under Construction" },
  { value: "completed", label: "Completed" },
];

// Bedroom Options
const BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 BR" },
  { value: 2, label: "2 BR" },
  { value: 3, label: "3 BR" },
  { value: 4, label: "4 BR" },
  { value: 5, label: "5 BR" },
  { value: 6, label: "6 BR" },
  { value: 7, label: "7+ BR" },
];

// ==================== STYLES ====================
const inputCls = "h-10 w-full border border-gray-300 bg-white px-3 text-[13px] outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200 rounded transition-all";
const selectCls = "h-10 w-full border border-gray-300 bg-white px-3 text-[13px] outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200 rounded transition-all appearance-none cursor-pointer";
const textareaCls = "w-full border border-gray-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200 rounded transition-all resize-none";
const labelCls = "block text-[12px] font-medium text-gray-700 mb-1.5";
const sectionCls = "bg-white border border-gray-200 rounded-lg p-5 mb-4";
const sectionTitleCls = "text-[14px] font-semibold text-gray-800 mb-4 flex items-center gap-2";
const btnPrimary = "h-10 px-5 bg-green-600 hover:bg-green-700 text-white text-[13px] font-semibold rounded inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "h-10 px-4 border border-gray-300 bg-white text-[13px] hover:bg-gray-50 rounded inline-flex items-center gap-2 transition-colors";
const btnDanger = "h-10 px-4 border border-red-300 bg-white text-red-600 text-[13px] hover:bg-red-50 rounded inline-flex items-center gap-2 transition-colors";

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== INITIAL FORM DATA ====================
const initialFormData = {
  // Basic Info
  type: "property",
  item_type: "",
  source: "website",
  contact_source: "",
  lead_source: "",
  
  // Contact Info
  contact_id: "",
  contact_type: "buyer",
  
  // Property/Project Info
  property_id: "",
  project_id: "",
  project_item_id: "",
  
  // Location
  country: "",
  state_id: "",
  community_id: "",
  sub_community_id: "",
  building: "",
  
  // Requirements
  listing_type: "sale",
  price_min: "",
  price_max: "",
  bedroom_min: "",
  bedroom_max: "",
  
  // Status & Priority
  status: "New",
  priority: "Medium",
  quality: "Warm",
  lead_status: "New",
  lost_status: "",
  
  // Property Status
  exclusive_status: "",
  construction_status: "",
  
  // Assignment
  agent_id: "",
  
  // Communication
  message: "",
  agent_activity: "",
  admin_activity: "",
  
  // Settings
  drip_marketing: false,
  contact_date: "",
  
  // Files
  property_image: null,
  resume: null,
};

// ==================== MAIN COMPONENT ====================
export default function AddEnquiryPage() {
  // ==================== AUTH STATE ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ==================== RELATED DATA STATE ====================
  const [agents, setAgents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [subCommunities, setSubCommunities] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // ==================== FILE PREVIEW STATE ====================
  const [imagePreview, setImagePreview] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");

  // ==================== API HELPER ====================
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token || !isAdminTokenValid()) {
      logoutAll();
      fastNavigate("/admin/login");
      throw new Error("Session expired");
    }

    const isFormData = options.body instanceof FormData;

    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      logoutAll();
      fastNavigate("/admin/login");
      throw new Error("Session expired");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  }, []);

  // ==================== AUTH VERIFICATION ====================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getAdminToken();
        const sessionType = getCurrentSessionType();

        if (!token || !isAdminTokenValid() || sessionType !== "admin") {
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) throw new Error("Token verification failed");

        const data = await response.json();

        if (data.success && data.admin) {
          setAdmin(data.admin);
          setIsAuthenticated(true);
        } else {
          throw new Error("Invalid token");
        }
      } catch (error) {
        logoutAll();
        fastNavigate("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // ==================== FETCH RELATED DATA ====================
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!isAuthenticated) return;

      setLoadingRelated(true);
      try {
        // Fetch all related data in parallel
        const [agentsRes, contactsRes, propertiesRes, projectsRes, countriesRes] = await Promise.all([
          apiRequest("/api/v1/users?role=agent").catch(() => ({ data: [] })),
          apiRequest("/api/v1/contacts").catch(() => ({ data: [] })),
          apiRequest("/api/v1/properties").catch(() => ({ data: [] })),
          apiRequest("/api/v1/projects").catch(() => ({ data: [] })),
          apiRequest("/api/v1/countries").catch(() => ({ data: [] })),
        ]);

        setAgents(agentsRes.data || agentsRes.users || []);
        setContacts(contactsRes.data || contactsRes.contacts || []);
        setProperties(propertiesRes.data || propertiesRes.properties || []);
        setProjects(projectsRes.data || projectsRes.projects || []);
        setCountries(countriesRes.data || countriesRes.countries || []);
      } catch (err) {
        console.warn("Error fetching related data:", err);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedData();
  }, [isAuthenticated, apiRequest]);

  // ==================== FETCH STATES WHEN COUNTRY CHANGES ====================
  useEffect(() => {
    const fetchStates = async () => {
      if (!formData.country) {
        setStates([]);
        return;
      }

      try {
        const res = await apiRequest(`/api/v1/states?country_id=${formData.country}`);
        setStates(res.data || res.states || []);
      } catch (err) {
        console.warn("Error fetching states:", err);
        setStates([]);
      }
    };

    fetchStates();
  }, [formData.country, apiRequest]);

  // ==================== FETCH COMMUNITIES WHEN STATE CHANGES ====================
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!formData.state_id) {
        setCommunities([]);
        return;
      }

      try {
        const res = await apiRequest(`/api/v1/community?state_id=${formData.state_id}`);
        setCommunities(res.data || res.communities || []);
      } catch (err) {
        console.warn("Error fetching communities:", err);
        setCommunities([]);
      }
    };

    fetchCommunities();
  }, [formData.state_id, apiRequest]);

  // ==================== FETCH SUB-COMMUNITIES WHEN COMMUNITY CHANGES ====================
  useEffect(() => {
    const fetchSubCommunities = async () => {
      if (!formData.community_id) {
        setSubCommunities([]);
        return;
      }

      try {
        const res = await apiRequest(`/api/v1/sub-community?community_id=${formData.community_id}`);
        setSubCommunities(res.data || res.subCommunities || []);
      } catch (err) {
        console.warn("Error fetching sub-communities:", err);
        setSubCommunities([]);
      }
    };

    fetchSubCommunities();
  }, [formData.community_id, apiRequest]);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    try {
      setLogoutLoading(true);
      const token = getAdminToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }).catch(() => {});
      }
      logoutAll();
      fastNavigate("/admin/login");
    } finally {
      setLogoutLoading(false);
    }
  }, []);

  // ==================== FORM HANDLERS ====================
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Reset dependent fields
    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        state_id: "",
        community_id: "",
        sub_community_id: "",
      }));
    } else if (name === "state_id") {
      setFormData((prev) => ({
        ...prev,
        community_id: "",
        sub_community_id: "",
      }));
    } else if (name === "community_id") {
      setFormData((prev) => ({
        ...prev,
        sub_community_id: "",
      }));
    }
  }, [errors]);

  // ==================== FILE HANDLERS ====================
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setFormData((prev) => ({ ...prev, property_image: file }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleResumeChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid document (PDF or Word)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume size should be less than 10MB");
      return;
    }

    setFormData((prev) => ({ ...prev, resume: file }));
    setResumeFileName(file.name);
  }, []);

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, property_image: null }));
    setImagePreview(null);
  }, []);

  const removeResume = useCallback(() => {
    setFormData((prev) => ({ ...prev, resume: null }));
    setResumeFileName("");
  }, []);

  // ==================== VALIDATION ====================
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required validations
    if (!formData.type) {
      newErrors.type = "Enquiry type is required";
    }

    if (!formData.source) {
      newErrors.source = "Source is required";
    }

    // Price validation
    if (formData.price_min && formData.price_max) {
      if (parseFloat(formData.price_min) > parseFloat(formData.price_max)) {
        newErrors.price_min = "Min price cannot be greater than max price";
      }
    }

    // Bedroom validation
    if (formData.bedroom_min && formData.bedroom_max) {
      if (parseInt(formData.bedroom_min) > parseInt(formData.bedroom_max)) {
        newErrors.bedroom_min = "Min bedrooms cannot be greater than max";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ==================== SUBMIT HANDLER ====================
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (key === "property_image" || key === "resume") {
            if (value instanceof File) {
              submitData.append(key, value);
            }
          } else if (key === "drip_marketing") {
            submitData.append(key, value ? "1" : "0");
          } else {
            submitData.append(key, value);
          }
        }
      });

      const result = await apiRequest("/api/v1/enquiries/create", {
        method: "POST",
        body: submitData,
      });

      if (result.success) {
        setSubmitSuccess(true);
        toast.success("Enquiry created successfully!");
        
        // Redirect after short delay
        setTimeout(() => {
          fastNavigate("/admin/enquiries");
        }, 1500);
      } else {
        toast.error(result.message || "Failed to create enquiry");
      }
    } catch (err) {
      toast.error(err.message || "Error creating enquiry");
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, apiRequest]);

  // ==================== RESET FORM ====================
  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset the form?")) {
      setFormData(initialFormData);
      setErrors({});
      setImagePreview(null);
      setResumeFileName("");
    }
  }, []);

  // ==================== LOADING SCREEN ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-700 animate-spin mx-auto mb-3" />
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  // ==================== RENDER ====================
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-[#f6f6f6]">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          {/* ==================== HEADER ==================== */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fastNavigate("/admin/enquiries")}
                className="w-10 h-10 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-[20px] font-semibold text-gray-800">Add New Enquiry</h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Create a new lead/enquiry in the system
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleReset} className={btnSecondary}>
                <X className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || submitSuccess}
                className={btnPrimary}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : submitSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {submitting ? "Saving..." : submitSuccess ? "Saved!" : "Save Enquiry"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ==================== LEFT COLUMN ==================== */}
              <div className="lg:col-span-2 space-y-4">
                {/* ==================== BASIC INFO ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <Target className="w-4 h-4 text-gray-600" />
                    Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div>
                      <label className={labelCls}>
                        Enquiry Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className={`${selectCls} ${errors.type ? "border-red-500" : ""}`}
                        >
                          {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.type && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.type}</p>
                      )}
                    </div>

                    {/* Item Type */}
                    <div>
                      <label className={labelCls}>Property Type</label>
                      <div className="relative">
                        <select
                          name="item_type"
                          value={formData.item_type}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Select Property Type</option>
                          {ITEM_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Source */}
                    <div>
                      <label className={labelCls}>
                        Source <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="source"
                          value={formData.source}
                          onChange={handleChange}
                          className={`${selectCls} ${errors.source ? "border-red-500" : ""}`}
                        >
                          {SOURCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.source && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.source}</p>
                      )}
                    </div>

                    {/* Contact Type */}
                    <div>
                      <label className={labelCls}>Contact Type</label>
                      <div className="relative">
                        <select
                          name="contact_type"
                          value={formData.contact_type}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          {CONTACT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Contact Source */}
                    <div>
                      <label className={labelCls}>Contact Source</label>
                      <input
                        type="text"
                        name="contact_source"
                        value={formData.contact_source}
                        onChange={handleChange}
                        placeholder="e.g., John's Referral"
                        className={inputCls}
                      />
                    </div>

                    {/* Lead Source */}
                    <div>
                      <label className={labelCls}>Lead Source</label>
                      <input
                        type="text"
                        name="lead_source"
                        value={formData.lead_source}
                        onChange={handleChange}
                        placeholder="e.g., Property Finder Ad"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* ==================== CONTACT / PROPERTY LINKING ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <Users className="w-4 h-4 text-gray-600" />
                    Link to Contact / Property
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact */}
                    <div>
                      <label className={labelCls}>Link to Contact</label>
                      <div className="relative">
                        <select
                          name="contact_id"
                          value={formData.contact_id}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Select Contact (Optional)</option>
                          {contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name} - {contact.email || contact.phone}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Property */}
                    <div>
                      <label className={labelCls}>Link to Property</label>
                      <div className="relative">
                        <select
                          name="property_id"
                          value={formData.property_id}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Select Property (Optional)</option>
                          {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.title || property.reference_no || `Property #${property.id}`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Project */}
                    <div>
                      <label className={labelCls}>Link to Project</label>
                      <div className="relative">
                        <select
                          name="project_id"
                          value={formData.project_id}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Select Project (Optional)</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name || project.title || `Project #${project.id}`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Project Item ID */}
                    <div>
                      <label className={labelCls}>Project Item/Unit ID</label>
                      <input
                        type="number"
                        name="project_item_id"
                        value={formData.project_item_id}
                        onChange={handleChange}
                        placeholder="Enter unit ID"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* ==================== LOCATION ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <MapPin className="w-4 h-4 text-gray-600" />
                    Location Preferences
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Country */}
                    <div>
                      <label className={labelCls}>Country</label>
                      <div className="relative">
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Select Country</option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* State */}
                    <div>
                      <label className={labelCls}>State/Emirate</label>
                      <div className="relative">
                        <select
                          name="state_id"
                          value={formData.state_id}
                          onChange={handleChange}
                          className={selectCls}
                          disabled={!formData.country}
                        >
                          <option value="">Select State</option>
                          {states.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Community */}
                    <div>
                      <label className={labelCls}>Community</label>
                      <div className="relative">
                        <select
                          name="community_id"
                          value={formData.community_id}
                          onChange={handleChange}
                          className={selectCls}
                          disabled={!formData.state_id}
                        >
                          <option value="">Select Community</option>
                          {communities.map((community) => (
                            <option key={community.id} value={community.id}>
                              {community.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sub Community */}
                    <div>
                      <label className={labelCls}>Sub Community</label>
                      <div className="relative">
                        <select
                          name="sub_community_id"
                          value={formData.sub_community_id}
                          onChange={handleChange}
                          className={selectCls}
                          disabled={!formData.community_id}
                        >
                          <option value="">Select Sub Community</option>
                          {subCommunities.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Building */}
                    <div className="md:col-span-2">
                      <label className={labelCls}>Building / Tower Name</label>
                      <input
                        type="text"
                        name="building"
                        value={formData.building}
                        onChange={handleChange}
                        placeholder="e.g., Burj Khalifa, Marina Tower"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* ==================== REQUIREMENTS ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <Home className="w-4 h-4 text-gray-600" />
                    Property Requirements
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Listing Type */}
                    <div>
                      <label className={labelCls}>Looking For</label>
                      <div className="relative">
                        <select
                          name="listing_type"
                          value={formData.listing_type}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          {LISTING_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Construction Status */}
                    <div>
                      <label className={labelCls}>Construction Status</label>
                      <div className="relative">
                        <select
                          name="construction_status"
                          value={formData.construction_status}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Any Status</option>
                          {CONSTRUCTION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Price Min */}
                    <div>
                      <label className={labelCls}>Budget Min (AED)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          name="price_min"
                          value={formData.price_min}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                          className={`${inputCls} pl-9 ${errors.price_min ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.price_min && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.price_min}</p>
                      )}
                    </div>

                    {/* Price Max */}
                    <div>
                      <label className={labelCls}>Budget Max (AED)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          name="price_max"
                          value={formData.price_max}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>

                    {/* Bedroom Min */}
                    <div>
                      <label className={labelCls}>Bedrooms (Min)</label>
                      <div className="relative">
                        <select
                          name="bedroom_min"
                          value={formData.bedroom_min}
                          onChange={handleChange}
                          className={`${selectCls} ${errors.bedroom_min ? "border-red-500" : ""}`}
                        >
                          <option value="">Any</option>
                          {BEDROOM_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.bedroom_min && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.bedroom_min}</p>
                      )}
                    </div>

                    {/* Bedroom Max */}
                    <div>
                      <label className={labelCls}>Bedrooms (Max)</label>
                      <div className="relative">
                        <select
                          name="bedroom_max"
                          value={formData.bedroom_max}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Any</option>
                          {BEDROOM_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Exclusive Status */}
                    <div>
                      <label className={labelCls}>Exclusive Status</label>
                      <div className="relative">
                        <select
                          name="exclusive_status"
                          value={formData.exclusive_status}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Not Specified</option>
                          {EXCLUSIVE_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ==================== MESSAGE & ACTIVITY ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    Message & Activity Notes
                  </h2>

                  <div className="space-y-4">
                    {/* Message */}
                    <div>
                      <label className={labelCls}>Enquiry Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Enter client's message or requirements..."
                        rows={4}
                        className={textareaCls}
                      />
                    </div>

                    {/* Agent Activity */}
                    <div>
                      <label className={labelCls}>Agent Activity Notes</label>
                      <textarea
                        name="agent_activity"
                        value={formData.agent_activity}
                        onChange={handleChange}
                        placeholder="Notes from agent interactions..."
                        rows={3}
                        className={textareaCls}
                      />
                    </div>

                    {/* Admin Activity */}
                    <div>
                      <label className={labelCls}>Admin Activity Notes</label>
                      <textarea
                        name="admin_activity"
                        value={formData.admin_activity}
                        onChange={handleChange}
                        placeholder="Admin notes and remarks..."
                        rows={3}
                        className={textareaCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================== RIGHT COLUMN ==================== */}
              <div className="space-y-4">
                {/* ==================== STATUS & PRIORITY ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <Settings className="w-4 h-4 text-gray-600" />
                    Status & Priority
                  </h2>

                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className={labelCls}>Status</label>
                      <div className="relative">
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Lead Status */}
                    <div>
                      <label className={labelCls}>Lead Status</label>
                      <div className="relative">
                        <select
                          name="lead_status"
                          value={formData.lead_status}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          {LEAD_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className={labelCls}>Priority</label>
                      <div className="flex flex-wrap gap-2">
                        {PRIORITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, priority: opt.value }))}
                            className={`px-3 py-1.5 text-[12px] border rounded transition-colors ${
                              formData.priority === opt.value
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality */}
                    <div>
                      <label className={labelCls}>Lead Quality</label>
                      <div className="flex flex-wrap gap-2">
                        {QUALITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, quality: opt.value }))}
                            className={`px-3 py-1.5 text-[12px] border rounded transition-colors ${
                              formData.quality === opt.value
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lost Status (show only if status is Lost) */}
                    {formData.status === "Lost" && (
                      <div>
                        <label className={labelCls}>Lost Reason</label>
                        <div className="relative">
                          <select
                            name="lost_status"
                            value={formData.lost_status}
                            onChange={handleChange}
                            className={selectCls}
                          >
                            <option value="">Select Reason</option>
                            {LOST_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ==================== ASSIGNMENT ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <Briefcase className="w-4 h-4 text-gray-600" />
                    Assignment
                  </h2>

                  <div className="space-y-4">
                    {/* Assign Agent */}
                    <div>
                      <label className={labelCls}>Assign to Agent</label>
                      <div className="relative">
                        <select
                          name="agent_id"
                          value={formData.agent_id}
                          onChange={handleChange}
                          className={selectCls}
                        >
                          <option value="">Select Agent</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name || agent.username}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Contact Date */}
                    <div>
                      <label className={labelCls}>Contact Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          name="contact_date"
                          value={formData.contact_date}
                          onChange={handleChange}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>

                    {/* Drip Marketing */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="drip_marketing"
                        name="drip_marketing"
                        checked={formData.drip_marketing}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor="drip_marketing" className="text-[13px] text-gray-700 cursor-pointer">
                        Enable Drip Marketing
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Auto-send scheduled marketing emails
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ==================== FILES ==================== */}
                <div className={sectionCls}>
                  <h2 className={sectionTitleCls}>
                    <Upload className="w-4 h-4 text-gray-600" />
                    Attachments
                  </h2>

                  <div className="space-y-4">
                    {/* Property Image */}
                    <div>
                      <label className={labelCls}>Property Image</label>
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-40 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-[12px] text-gray-500">Click to upload image</span>
                          <span className="text-[11px] text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Resume (for career enquiries) */}
                    {formData.type === "career" && (
                      <div>
                        <label className={labelCls}>Resume / CV</label>
                        {resumeFileName ? (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <span className="text-[12px] text-gray-700 truncate max-w-[180px]">
                                {resumeFileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={removeResume}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                            <FileText className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-[12px] text-gray-500">Upload Resume</span>
                            <span className="text-[11px] text-gray-400">PDF, DOC up to 10MB</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ==================== SUBMIT BUTTON (Mobile) ==================== */}
                <div className="lg:hidden">
                  <button
                    type="submit"
                    disabled={submitting || submitSuccess}
                    className={`${btnPrimary} w-full justify-center`}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : submitSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {submitting ? "Saving..." : submitSuccess ? "Saved!" : "Save Enquiry"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}