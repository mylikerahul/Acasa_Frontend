"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Building2,
  User,
  Users,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  Briefcase,
  ClipboardCheck,
  Hash,
  Flag,
  Phone,
  MapPin,
  Home,
  Settings,
  AlertCircle,
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

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== API HELPER (Same as Enquiries) ====================
const createApiRequest = () => async (endpoint, options = {}) => {
  const token = getAdminToken();

  if (!token || !isAdminTokenValid()) {
    logoutAll();
    fastNavigate("/admin/login");
    throw new Error("Session expired. Please login again.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
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
      signal: controller.signal,
      headers,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      logoutAll();
      fastNavigate("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      toast.error("Request timeout. Please try again.");
      throw new Error("Request timeout. Please try again.");
    }
    throw error;
  }
};

// ==================== INITIAL FORM DATA ====================
const INITIAL_FORM_DATA = {
  // Transaction Category
  transaction_category: "",

  // Basic Info
  closing_ids: "",
  closing_name: "",
  slug: "",
  listing: "",
  buyers: "",
  sellers: "",
  sales_price: "",
  target_closing: "",
  closing: "",
  closing_status: "Open",
  unknown: "",

  // Buyer Section
  winning_inquiry: "",
  lead_source: "",
  winning_inquiry_status: "",
  buyer_nationality: "",
  buyer_second_nationality: "",
  transfer_fee: "",

  // Seller Section
  seller: "",
  seller_nationality: "",
  seller_second_nationality: "",
  listing_type: "",
  listing_city: "",
  listing_community: "",
  listing_property_address: "",
  tenant: "",
  landlord: "",

  // Admin Zone
  furnished: false,
  closing_date: "",
  listing_unit_number: "",
  documentation: "",
  transaction_type: "",
  freehold: false,
  developer: "",
  title_deed: "",
  status_on_transfer: "",
  conveyancing_fee: "",
  representation: "",
  security_requested: false,
  success_probability: "",
  success_probability_amount: "",
  partial_payment: "",
  full_payment: "",
  accounted_date: "",
  passport_issued_city: "",
  original_price: "",

  // AML Section
  aml: "",
  contract_generating_user: "",
  documentation_check_in_process: false,
  documentation_check_approved: false,
  documentation_check_not_approved: false,
  contact_details_verification_in_process: false,
  contact_details_verified: false,
  contact_details_not_verified: false,
  kyc_completed: false,
  am_kyc_not_completed: false,
  case_with_ami_consultants: false,
  client_type: "",
  purchase_as: "",
  sold_as: "",
  birth: "",
  age: "",
  residence: "",
  passport: "",
  severity: "",

  // Transfer & Transaction
  representing: "",
  probability: "",
  due_to_developer: "",
  amount: "",

  // Commission
  commission: "",
  party_commission: "",
  agency_contact: "",
  party_name: "",
  closing_broker: "",
  split_amount: "",
  second_broker: "",
  second_broker_split_amount: "",
  third_broker: "",
  third_broker_split_amount: "",
  fourth_broker: "",
  fourth_broker_split_amount: "",

  // Closing
  deposit_date: "",
  money_amount: "",
  agreement_date: "",
  created_by: "",
  closing_checklist: "",

  // SEO
  title: "",
  sub_title: "",
  descriptions: "",
  seo_title: "",
  seo_keyword: "",
  seo_description: "",
};

// ==================== REQUIRED FIELDS ====================
const REQUIRED_FIELDS = [
  { field: "transaction_category", label: "Transaction Type" },
  { field: "closing_ids", label: "Closing ID" },
  { field: "buyers", label: "Buyer Name" },
  { field: "sellers", label: "Seller Name" },
  { field: "sales_price", label: "Sales Price" },
  { field: "closing_status", label: "Closing Status" },
];

// ==================== OPTIONS ====================
const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Contract Approval", label: "Contract Approval" },
  { value: "In transfer", label: "In Transfer" },
  { value: "Compliance", label: "Compliance" },
  { value: "Canceled", label: "Canceled" },
  { value: "Closed", label: "Closed" },
];

const LISTING_TYPES = [
  { value: "", label: "Select..." },
  { value: "Apartment", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Studio", label: "Studio" },
  { value: "Office", label: "Office" },
  { value: "Retail", label: "Retail" },
  { value: "Land", label: "Land" },
];

const TRANSACTION_TYPES = [
  { value: "", label: "Select..." },
  { value: "Sale", label: "Sale" },
  { value: "Resale", label: "Resale" },
  { value: "Off-Plan", label: "Off-Plan" },
  { value: "Rental", label: "Rental" },
];

const CLIENT_TYPES = [
  { value: "", label: "Select..." },
  { value: "Individual", label: "Individual" },
  { value: "Corporate", label: "Corporate" },
  { value: "Trust", label: "Trust" },
];

const AML_SEVERITY_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const REPRESENTING_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "Buyer", label: "Buyer" },
  { value: "Seller", label: "Seller" },
  { value: "Both", label: "Both" },
];

// ==================== STYLING CLASSES ====================
const labelCls = "text-[12px] text-gray-700";
const labelRequiredCls = "text-[12px] text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500 rounded";
const fieldErrorCls = "h-8 w-full border border-red-400 bg-red-50 px-2 text-[12px] outline-none focus:border-red-500 rounded";
const selectCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500 rounded";
const selectErrorCls = "h-8 w-full border border-red-400 bg-red-50 px-2 text-[12px] outline-none focus:border-red-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-[13px] font-semibold text-gray-800";
const boxBodyCls = "p-3";

// ==================== CHECKLIST ITEMS ====================
const CHECKLIST_ITEMS = [
  { key: "mou_signed", label: "MOU Signed" },
  { key: "deposit_received", label: "Deposit Received" },
  { key: "noc_obtained", label: "NOC Obtained" },
  { key: "title_deed_ready", label: "Title Deed Ready" },
  { key: "transfer_scheduled", label: "Transfer Scheduled" },
  { key: "keys_handed_over", label: "Keys Handed Over" },
];

// ==================== DEAL COMPLETION CHECKLIST ====================
function DealCompletionChecklist({ formData }) {
  const checks = [
    { label: "Transaction type selected", passed: !!formData.transaction_category },
    { label: "Closing ID provided", passed: !!formData.closing_ids },
    { label: "Buyer name specified", passed: !!formData.buyers },
    { label: "Seller name specified", passed: !!formData.sellers },
    { label: "Sales price entered", passed: !!formData.sales_price },
    { label: "Target closing date set", passed: !!formData.target_closing },
    { label: "Location details added", passed: !!(formData.listing_city || formData.listing_community) },
    { label: "Developer information", passed: !!formData.developer },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const percentage = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-gray-700">Deal Score</span>
        <span
          className={`text-[12px] font-bold ${
            percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div
          className={`h-2 rounded transition-all ${
            percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
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
    <div className="bg-white border border-gray-300 p-3 mb-3 rounded">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-gray-700">Form Completion</span>
        <span
          className={`text-[12px] font-bold ${
            percentage === 100 ? "text-green-600" : percentage >= 70 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {completedCount}/{REQUIRED_FIELDS.length} fields
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded mb-2">
        <div
          className={`h-2 rounded transition-all ${
            percentage === 100 ? "bg-green-500" : percentage >= 70 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {missingFields.length > 0 && (
        <div className="text-[11px] text-red-600">Missing: {missingFields.map((f) => f.label).join(", ")}</div>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AddDealPage() {
  // ==================== API REQUEST HELPER ====================
  const apiRequest = useMemo(() => createApiRequest(), []);

  // ==================== AUTH STATE ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==================== FORM STATE ====================
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [dealScore, setDealScore] = useState(0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ==================== CHECKLIST STATE ====================
  const [checklist, setChecklist] = useState({
    mou_signed: false,
    deposit_received: false,
    noc_obtained: false,
    title_deed_ready: false,
    transfer_scheduled: false,
    keys_handed_over: false,
  });

  // ==================== AUTH VERIFICATION (Same as Enquiries) ====================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = getAdminToken();
        const sessionType = getCurrentSessionType();

        if (!token || !isAdminTokenValid()) {
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        if (sessionType !== "admin") {
          logoutAll();
          fastNavigate("/admin/login");
          return;
        }

        try {
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
            throw new Error("Invalid token response");
          }
        } catch (verifyError) {
          console.error("Token verification error:", verifyError);
          // Try to decode token locally as fallback
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.userType === "admin") {
              setAdmin({
                id: payload.id,
                name: payload.name,
                email: payload.email,
                role: payload.role || "admin",
                userType: payload.userType,
              });
              setIsAuthenticated(true);
            } else {
              throw new Error("Invalid user type");
            }
          } catch (decodeError) {
            logoutAll();
            fastNavigate("/admin/login");
            return;
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        logoutAll();
        fastNavigate("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    try {
      setLogoutLoading(true);

      const token = getAdminToken();
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
        } catch (e) {
          console.log("Logout API call failed:", e);
        }
      }

      logoutAll();
      fastNavigate("/admin/login");
    } catch (error) {
      logoutAll();
      fastNavigate("/admin/login");
    } finally {
      setLogoutLoading(false);
    }
  }, []);

  // ==================== CALCULATE DEAL SCORE ====================
  useEffect(() => {
    calculateDealScore();
  }, [formData]);

  const calculateDealScore = () => {
    let score = 0;
    const totalChecks = 8;

    if (formData.transaction_category) score++;
    if (formData.closing_ids) score++;
    if (formData.buyers) score++;
    if (formData.sellers) score++;
    if (formData.sales_price) score++;
    if (formData.target_closing) score++;
    if (formData.listing_city || formData.listing_community) score++;
    if (formData.developer) score++;

    setDealScore(Math.round((score / totalChecks) * 100));
  };

  // ==================== FORM HANDLERS ====================
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };

    // Auto-generate slug from closing name or ID
    if (field === "closing_name" || field === "closing_ids") {
      const slugSource = field === "closing_name" ? value : formData.closing_name || value;
      const slug =
        (slugSource || "")
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/--+/g, "-") +
        "-" +
        Date.now();
      updated.slug = slug;
    }

    setFormData(updated);

    // Clear error when field is filled
    if (value && errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (REQUIRED_FIELDS.find((f) => f.field === field) && !formData[field]) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }));
    }
  };

  const handleChecklistChange = (key, checked) => {
    setChecklist((prev) => ({ ...prev, [key]: checked }));
  };

  // ==================== VALIDATION ====================
  const validateForm = () => {
    const newErrors = {};

    REQUIRED_FIELDS.forEach(({ field, label }) => {
      if (!formData[field]) {
        newErrors[field] = `${label} is required`;
      }
    });

    if (formData.sales_price && isNaN(Number(formData.sales_price))) {
      newErrors.sales_price = "Sales price must be a valid number";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const missingLabels = Object.keys(newErrors).map((key) => {
        const found = REQUIRED_FIELDS.find((f) => f.field === key);
        return found ? found.label : key;
      });
      toast.error(
        `Please fill required fields: ${missingLabels.slice(0, 3).join(", ")}${missingLabels.length > 3 ? "..." : ""}`
      );
      return false;
    }

    return true;
  };

  const generateSlug = () => {
    const source = formData.closing_name || formData.closing_ids;
    if (!source) {
      toast.error("Please enter closing name or ID first");
      return;
    }

    const slug =
      source
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-") +
      "-" +
      Date.now();

    setFormData((prev) => ({ ...prev, slug }));
    toast.success("Slug generated!");
  };

  // ==================== PREPARE DATA FOR API ====================
  const prepareFormData = () => {
    const dealData = { ...formData };

    // Generate slug if not provided
    if (!dealData.slug && (dealData.closing_name || dealData.closing_ids)) {
      dealData.slug =
        (dealData.closing_name || dealData.closing_ids)
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-") +
        "-" +
        Date.now();
    }

    // Convert closing_checklist to JSON string
    dealData.closing_checklist = JSON.stringify(checklist);

    // Numeric fields - convert to numbers or null
    const numericFields = [
      "sales_price",
      "transfer_fee",
      "conveyancing_fee",
      "success_probability_amount",
      "partial_payment",
      "full_payment",
      "original_price",
      "due_to_developer",
      "amount",
      "commission",
      "party_commission",
      "split_amount",
      "second_broker_split_amount",
      "third_broker_split_amount",
      "fourth_broker_split_amount",
      "money_amount",
      "age",
      "probability",
    ];

    numericFields.forEach((field) => {
      if (dealData[field] === "" || dealData[field] === null || dealData[field] === undefined) {
        dealData[field] = null;
      } else {
        const num = parseFloat(dealData[field]);
        dealData[field] = Number.isFinite(num) ? num : null;
      }
    });

    // Date fields - convert empty to null
    const dateFields = ["target_closing", "closing", "closing_date", "accounted_date", "birth", "deposit_date", "agreement_date"];

    dateFields.forEach((field) => {
      if (!dealData[field]) {
        dealData[field] = null;
      }
    });

    // Boolean fields
    const booleanFields = [
      "furnished",
      "freehold",
      "security_requested",
      "documentation_check_in_process",
      "documentation_check_approved",
      "documentation_check_not_approved",
      "contact_details_verification_in_process",
      "contact_details_verified",
      "contact_details_not_verified",
      "kyc_completed",
      "am_kyc_not_completed",
      "case_with_ami_consultants",
    ];

    booleanFields.forEach((field) => {
      dealData[field] = Boolean(dealData[field]);
    });

    // Remove transaction_category (UI only field)
    delete dealData.transaction_category;

    return dealData;
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const dealData = prepareFormData();

      console.log("Submitting deal data:", dealData);

      const result = await apiRequest("/api/v1/deals", {
        method: "POST",
        body: JSON.stringify(dealData),
      });

      if (result.success) {
        toast.success("Deal created successfully!");
        setTimeout(() => {
          fastNavigate("/admin/deals");
        }, 1500);
      } else {
        toast.error(result.message || "Failed to create deal");
      }
    } catch (e) {
      console.error("Submit error:", e);
      toast.error(e.message || "Failed to create deal");
    } finally {
      setSaving(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const copyFormData = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    toast.success("Form data copied to clipboard!");
  };

  const resetForm = () => {
    if (window.confirm("Are you sure you want to reset all form data?")) {
      setFormData(INITIAL_FORM_DATA);
      setChecklist({
        mou_signed: false,
        deposit_received: false,
        noc_obtained: false,
        title_deed_ready: false,
        transfer_scheduled: false,
        keys_handed_over: false,
      });
      setErrors({});
      setTouched({});
      toast.success("Form reset successfully");
    }
  };

  const fillSampleData = () => {
    const sampleData = {
      ...INITIAL_FORM_DATA,
      transaction_category: "Sales",
      closing_ids: "CL-2024-" + Math.floor(Math.random() * 10000),
      closing_name: "Marina Heights Unit 2301 Sale",
      slug: "marina-heights-unit-2301-sale-" + Date.now(),
      listing: "LST-2024-001",
      buyers: "John Smith",
      sellers: "ABC Properties LLC",
      sales_price: "2500000",
      target_closing: "2024-12-31",
      closing_status: "Open",
      buyer_nationality: "United Kingdom",
      seller_nationality: "UAE",
      listing_type: "Apartment",
      listing_city: "Dubai",
      listing_community: "Dubai Marina",
      listing_property_address: "Marina Heights Tower, Unit 2301, Dubai Marina",
      developer: "Emaar Properties",
      transaction_type: "Sale",
      freehold: true,
      title_deed: "TD-2024-123456",
      representing: "Both",
      commission: "75000",
      closing_broker: "Ahmed Hassan",
      split_amount: "50000",
      client_type: "Individual",
      kyc_completed: true,
    };

    setFormData(sampleData);
    setErrors({});
    toast.success("Sample data filled!");
  };

  const getFieldClass = (field, baseClass = fieldCls, errorClass = fieldErrorCls) => {
    return errors[field] && touched[field] ? errorClass : baseClass;
  };

  const getSelectClass = (field) => {
    return errors[field] && touched[field] ? selectErrorCls : selectCls;
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-700 animate-spin mx-auto mb-3" />
          <div className="text-sm text-gray-600">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  // ==================== NOT AUTHENTICATED ====================
  if (!isAuthenticated || !admin) {
    return null;
  }

  // ==================== RENDER ====================
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

      {/* Admin Navbar */}
      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-[#f6f6f6]">
        <div className="max-w-[1250px] mx-auto px-4 py-4">
          {/* Title */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-700" />
              <div className="text-[18px] font-semibold text-gray-800">Add New Deal</div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={fillSampleData}
                className="inline-flex items-center px-3 py-1 border border-blue-300 bg-blue-50 text-blue-700 text-[12px] hover:bg-blue-100 rounded"
              >
                Fill Sample Data
              </button>

              <div className="flex items-center bg-white px-3 py-1 border border-gray-300 rounded">
                <ClipboardCheck className="w-3 h-3 text-blue-600 mr-1" />
                <span className="text-[11px] font-medium text-gray-900">Score:</span>
                <span
                  className={`ml-1 text-[11px] font-bold ${
                    dealScore >= 80 ? "text-green-600" : dealScore >= 60 ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  {dealScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Back/Forward bar */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-10 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => window.history.forward()}
              className="w-10 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4 text-gray-700" />
            </button>
            <a href="/admin/deals" className="ml-2 text-[12px] text-blue-600 hover:underline">
              ← Back to Deals List
            </a>
          </div>

          {/* Validation Indicator */}
          <ValidationIndicator formData={formData} />

          {/* Tabs */}
          <div className="border border-gray-300 bg-white rounded">
            <div className="flex items-center gap-1 border-b border-gray-300 px-2 py-2 flex-wrap">
              {[
                { id: "basic", label: "Basic Info", icon: FileText },
                { id: "buyer", label: "Buyer", icon: User },
                { id: "seller", label: "Seller", icon: Users },
                { id: "admin", label: "Admin Zone", icon: Settings },
                { id: "aml", label: "AML/KYC", icon: Shield },
                { id: "transfer", label: "Transfer", icon: Briefcase },
                { id: "commission", label: "Commission", icon: DollarSign },
                { id: "closing", label: "Closing", icon: ClipboardCheck },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-[12px] border border-gray-300 flex items-center gap-1 rounded ${
                    activeTab === tab.id ? "bg-white font-semibold" : "bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="grid grid-cols-12 gap-3">
                {/* LEFT COLUMN */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  {/* Transaction Type */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>
                      Transaction Type <span className="text-red-500">*</span>
                    </div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-3 gap-2">
                        {["Sales", "Rental", "Others"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleChange("transaction_category", type)}
                            className={`h-10 border text-[12px] transition-all rounded ${
                              formData.transaction_category === type
                                ? "border-gray-900 bg-gray-900 text-white font-semibold"
                                : "border-gray-300 bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      {errors.transaction_category && touched.transaction_category && (
                        <span className="text-[10px] text-red-500 mt-1 block">{errors.transaction_category}</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Closing Status</label>
                          <select
                            className={getSelectClass("closing_status")}
                            value={formData.closing_status}
                            onChange={(e) => handleChange("closing_status", e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <label className="flex items-center gap-2 text-[12px]">
                            <input
                              type="checkbox"
                              checked={formData.kyc_completed}
                              onChange={(e) => handleChange("kyc_completed", e.target.checked)}
                              className="w-3.5 h-3.5"
                            />
                            KYC Completed
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-[12px]">
                            <input
                              type="checkbox"
                              checked={formData.security_requested}
                              onChange={(e) => handleChange("security_requested", e.target.checked)}
                              className="w-3.5 h-3.5"
                            />
                            Security Requested
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Details */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Basic Details</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        {/* Closing ID */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Closing ID</label>
                          <div className="col-span-8">
                            <input
                              className={getFieldClass("closing_ids")}
                              value={formData.closing_ids || ""}
                              onChange={(e) => handleChange("closing_ids", e.target.value)}
                              onBlur={() => handleBlur("closing_ids")}
                              placeholder="CL-2024-001"
                            />
                            {errors.closing_ids && touched.closing_ids && (
                              <span className="text-[10px] text-red-500">{errors.closing_ids}</span>
                            )}
                          </div>
                        </div>

                        {/* Closing Name */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Closing Name</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              value={formData.closing_name || ""}
                              onChange={(e) => handleChange("closing_name", e.target.value)}
                              placeholder="Deal name"
                            />
                          </div>
                        </div>

                        {/* Slug */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Slug</label>
                          <div className="col-span-8 flex gap-1">
                            <input
                              className={fieldCls}
                              value={formData.slug || ""}
                              onChange={(e) => handleChange("slug", e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={generateSlug}
                              className="h-8 px-2 border border-gray-300 bg-white text-[11px] hover:bg-gray-50 whitespace-nowrap rounded"
                            >
                              Generate
                            </button>
                          </div>
                        </div>

                        {/* Sales Price */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelRequiredCls} col-span-4`}>Sales Price</label>
                          <div className="col-span-8">
                            <input
                              className={getFieldClass("sales_price")}
                              type="number"
                              value={formData.sales_price || ""}
                              onChange={(e) => handleChange("sales_price", e.target.value)}
                              onBlur={() => handleBlur("sales_price")}
                              placeholder="2500000"
                            />
                            {errors.sales_price && touched.sales_price && (
                              <span className="text-[10px] text-red-500">{errors.sales_price}</span>
                            )}
                          </div>
                        </div>

                        {/* Target Closing */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Target Closing</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.target_closing || ""}
                              onChange={(e) => handleChange("target_closing", e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Closing Date */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Closing Date</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.closing || ""}
                              onChange={(e) => handleChange("closing", e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Listing Reference */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <label className={`${labelCls} col-span-4`}>Listing Ref</label>
                          <div className="col-span-8">
                            <input
                              className={fieldCls}
                              value={formData.listing || ""}
                              onChange={(e) => handleChange("listing", e.target.value)}
                              placeholder="LST-2024-001"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Parties Involved</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Buyer(s)</label>
                          <input
                            className={getFieldClass("buyers")}
                            value={formData.buyers || ""}
                            onChange={(e) => handleChange("buyers", e.target.value)}
                            onBlur={() => handleBlur("buyers")}
                            placeholder="Buyer name(s)"
                          />
                          {errors.buyers && touched.buyers && (
                            <span className="text-[10px] text-red-500">{errors.buyers}</span>
                          )}
                        </div>

                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Seller(s)</label>
                          <input
                            className={getFieldClass("sellers")}
                            value={formData.sellers || ""}
                            onChange={(e) => handleChange("sellers", e.target.value)}
                            onBlur={() => handleBlur("sellers")}
                            placeholder="Seller name(s)"
                          />
                          {errors.sellers && touched.sellers && (
                            <span className="text-[10px] text-red-500">{errors.sellers}</span>
                          )}
                        </div>

                        {formData.transaction_category === "Rental" && (
                          <>
                            <div>
                              <label className={`${labelCls} block mb-1`}>Tenant</label>
                              <input
                                className={fieldCls}
                                value={formData.tenant || ""}
                                onChange={(e) => handleChange("tenant", e.target.value)}
                                placeholder="Tenant name"
                              />
                            </div>
                            <div>
                              <label className={`${labelCls} block mb-1`}>Landlord</label>
                              <input
                                className={fieldCls}
                                value={formData.landlord || ""}
                                onChange={(e) => handleChange("landlord", e.target.value)}
                                placeholder="Landlord name"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deal Score */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Deal Completion Score</div>
                    <div className={boxBodyCls}>
                      <DealCompletionChecklist formData={formData} />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  {/* TAB: BASIC INFO */}
                  {activeTab === "basic" && (
                    <>
                      {/* Property Details */}
                      <div className={boxCls}>
                        <div className={boxHeaderCls}>Property Details</div>
                        <div className={boxBodyCls}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`${labelCls} block mb-1`}>Listing Type</label>
                              <select
                                className={selectCls}
                                value={formData.listing_type}
                                onChange={(e) => handleChange("listing_type", e.target.value)}
                              >
                                {LISTING_TYPES.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Transaction Type</label>
                              <select
                                className={selectCls}
                                value={formData.transaction_type}
                                onChange={(e) => handleChange("transaction_type", e.target.value)}
                              >
                                {TRANSACTION_TYPES.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>City</label>
                              <input
                                className={fieldCls}
                                value={formData.listing_city || ""}
                                onChange={(e) => handleChange("listing_city", e.target.value)}
                                placeholder="Dubai"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Community</label>
                              <input
                                className={fieldCls}
                                value={formData.listing_community || ""}
                                onChange={(e) => handleChange("listing_community", e.target.value)}
                                placeholder="Dubai Marina"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Unit Number</label>
                              <input
                                className={fieldCls}
                                value={formData.listing_unit_number || ""}
                                onChange={(e) => handleChange("listing_unit_number", e.target.value)}
                                placeholder="Unit 2301"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Developer</label>
                              <input
                                className={fieldCls}
                                value={formData.developer || ""}
                                onChange={(e) => handleChange("developer", e.target.value)}
                                placeholder="Emaar Properties"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className={`${labelCls} block mb-1`}>Property Address</label>
                            <textarea
                              className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500 rounded"
                              rows={3}
                              value={formData.listing_property_address || ""}
                              onChange={(e) => handleChange("listing_property_address", e.target.value)}
                              placeholder="Full property address..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className={`${labelCls} block mb-1`}>Title Deed No</label>
                              <input
                                className={fieldCls}
                                value={formData.title_deed || ""}
                                onChange={(e) => handleChange("title_deed", e.target.value)}
                                placeholder="TD-2024-XXXXX"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Freehold</label>
                              <select
                                className={selectCls}
                                value={formData.freehold ? "1" : "0"}
                                onChange={(e) => handleChange("freehold", e.target.value === "1")}
                              >
                                <option value="0">No (Leasehold)</option>
                                <option value="1">Yes (Freehold)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className={boxCls}>
                        <div className={boxHeaderCls}>Additional Notes</div>
                        <div className={boxBodyCls}>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500 rounded"
                            rows={4}
                            value={formData.unknown || ""}
                            onChange={(e) => handleChange("unknown", e.target.value)}
                            placeholder="Any additional notes about this deal..."
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB: BUYER */}
                  {activeTab === "buyer" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Buyer Information</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Winning Inquiry</label>
                            <input
                              className={fieldCls}
                              value={formData.winning_inquiry || ""}
                              onChange={(e) => handleChange("winning_inquiry", e.target.value)}
                              placeholder="INQ-2024-001"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Lead Source</label>
                            <input
                              className={fieldCls}
                              value={formData.lead_source || ""}
                              onChange={(e) => handleChange("lead_source", e.target.value)}
                              placeholder="Property Finder, Bayut..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Inquiry Status</label>
                            <input
                              className={fieldCls}
                              value={formData.winning_inquiry_status || ""}
                              onChange={(e) => handleChange("winning_inquiry_status", e.target.value)}
                              placeholder="Converted, Active..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Buyer Nationality</label>
                            <input
                              className={fieldCls}
                              value={formData.buyer_nationality || ""}
                              onChange={(e) => handleChange("buyer_nationality", e.target.value)}
                              placeholder="UAE, UK, USA..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Second Nationality</label>
                            <input
                              className={fieldCls}
                              value={formData.buyer_second_nationality || ""}
                              onChange={(e) => handleChange("buyer_second_nationality", e.target.value)}
                              placeholder="If applicable"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Transfer Fee</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.transfer_fee || ""}
                              onChange={(e) => handleChange("transfer_fee", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: SELLER */}
                  {activeTab === "seller" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Seller Information</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Seller Name</label>
                            <input
                              className={fieldCls}
                              value={formData.seller || ""}
                              onChange={(e) => handleChange("seller", e.target.value)}
                              placeholder="Seller name"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Seller Nationality</label>
                            <input
                              className={fieldCls}
                              value={formData.seller_nationality || ""}
                              onChange={(e) => handleChange("seller_nationality", e.target.value)}
                              placeholder="UAE, UK, USA..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Second Nationality</label>
                            <input
                              className={fieldCls}
                              value={formData.seller_second_nationality || ""}
                              onChange={(e) => handleChange("seller_second_nationality", e.target.value)}
                              placeholder="If applicable"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Status on Transfer</label>
                            <input
                              className={fieldCls}
                              value={formData.status_on_transfer || ""}
                              onChange={(e) => handleChange("status_on_transfer", e.target.value)}
                              placeholder="Vacant, Tenanted..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: ADMIN */}
                  {activeTab === "admin" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Admin Zone</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Furnished</label>
                            <select
                              className={selectCls}
                              value={formData.furnished ? "1" : "0"}
                              onChange={(e) => handleChange("furnished", e.target.value === "1")}
                            >
                              <option value="0">No</option>
                              <option value="1">Yes</option>
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Representation</label>
                            <select
                              className={selectCls}
                              value={formData.representation}
                              onChange={(e) => handleChange("representation", e.target.value)}
                            >
                              {REPRESENTING_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Conveyancing Fee</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.conveyancing_fee || ""}
                              onChange={(e) => handleChange("conveyancing_fee", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Success Probability</label>
                            <input
                              className={fieldCls}
                              value={formData.success_probability || ""}
                              onChange={(e) => handleChange("success_probability", e.target.value)}
                              placeholder="High, Medium, Low"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Probability Amount</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.success_probability_amount || ""}
                              onChange={(e) => handleChange("success_probability_amount", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Accounted Date</label>
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.accounted_date || ""}
                              onChange={(e) => handleChange("accounted_date", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Partial Payment</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.partial_payment || ""}
                              onChange={(e) => handleChange("partial_payment", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Full Payment</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.full_payment || ""}
                              onChange={(e) => handleChange("full_payment", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Original Price</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.original_price || ""}
                              onChange={(e) => handleChange("original_price", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className={`${labelCls} block mb-1`}>Documentation Notes</label>
                          <textarea
                            className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500 rounded"
                            rows={3}
                            value={formData.documentation || ""}
                            onChange={(e) => handleChange("documentation", e.target.value)}
                            placeholder="Documentation notes..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: AML/KYC */}
                  {activeTab === "aml" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>AML & KYC Compliance</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Contract Generating User</label>
                            <input
                              className={fieldCls}
                              value={formData.contract_generating_user || ""}
                              onChange={(e) => handleChange("contract_generating_user", e.target.value)}
                              placeholder="admin@company.com"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Client Type</label>
                            <select
                              className={selectCls}
                              value={formData.client_type}
                              onChange={(e) => handleChange("client_type", e.target.value)}
                            >
                              {CLIENT_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Documentation Check */}
                        <div className="p-3 bg-gray-50 border border-gray-200 mb-3 rounded">
                          <div className="text-[12px] font-semibold text-gray-800 mb-2">Documentation Check</div>
                          <div className="grid grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.documentation_check_in_process}
                                onChange={(e) => handleChange("documentation_check_in_process", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              In Process
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.documentation_check_approved}
                                onChange={(e) => handleChange("documentation_check_approved", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              Approved
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.documentation_check_not_approved}
                                onChange={(e) => handleChange("documentation_check_not_approved", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              Not Approved
                            </label>
                          </div>
                        </div>

                        {/* Contact Verification */}
                        <div className="p-3 bg-gray-50 border border-gray-200 mb-3 rounded">
                          <div className="text-[12px] font-semibold text-gray-800 mb-2">Contact Verification</div>
                          <div className="grid grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.contact_details_verification_in_process}
                                onChange={(e) => handleChange("contact_details_verification_in_process", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              In Process
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.contact_details_verified}
                                onChange={(e) => handleChange("contact_details_verified", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              Verified
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.contact_details_not_verified}
                                onChange={(e) => handleChange("contact_details_not_verified", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              Not Verified
                            </label>
                          </div>
                        </div>

                        {/* AML/KYC Status */}
                        <div className="p-3 bg-gray-50 border border-gray-200 mb-3 rounded">
                          <div className="text-[12px] font-semibold text-gray-800 mb-2">AML/KYC Status</div>
                          <div className="grid grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.kyc_completed}
                                onChange={(e) => handleChange("kyc_completed", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              KYC Completed
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.am_kyc_not_completed}
                                onChange={(e) => handleChange("am_kyc_not_completed", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              KYC Not Completed
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                              <input
                                type="checkbox"
                                checked={formData.case_with_ami_consultants}
                                onChange={(e) => handleChange("case_with_ami_consultants", e.target.checked)}
                                className="w-3.5 h-3.5"
                              />
                              With AMI Consultants
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Purchase As</label>
                            <input
                              className={fieldCls}
                              value={formData.purchase_as || ""}
                              onChange={(e) => handleChange("purchase_as", e.target.value)}
                              placeholder="Investment, End Use..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Sold As</label>
                            <input
                              className={fieldCls}
                              value={formData.sold_as || ""}
                              onChange={(e) => handleChange("sold_as", e.target.value)}
                              placeholder="Residential, Commercial..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>AML Severity</label>
                            <select
                              className={selectCls}
                              value={formData.severity}
                              onChange={(e) => handleChange("severity", e.target.value)}
                            >
                              {AML_SEVERITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Date of Birth</label>
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.birth || ""}
                              onChange={(e) => handleChange("birth", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Age</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.age || ""}
                              onChange={(e) => handleChange("age", e.target.value)}
                              placeholder="35"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>UAE Residence</label>
                            <input
                              className={fieldCls}
                              value={formData.residence || ""}
                              onChange={(e) => handleChange("residence", e.target.value)}
                              placeholder="Yes/No"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Passport</label>
                            <input
                              className={fieldCls}
                              value={formData.passport || ""}
                              onChange={(e) => handleChange("passport", e.target.value)}
                              placeholder="Passport number"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Passport Issued City</label>
                            <input
                              className={fieldCls}
                              value={formData.passport_issued_city || ""}
                              onChange={(e) => handleChange("passport_issued_city", e.target.value)}
                              placeholder="City name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: TRANSFER */}
                  {activeTab === "transfer" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Transfer & Transaction</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Representing</label>
                            <select
                              className={selectCls}
                              value={formData.representing}
                              onChange={(e) => handleChange("representing", e.target.value)}
                            >
                              {REPRESENTING_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Closing Probability</label>
                            <input
                              className={fieldCls}
                              value={formData.probability || ""}
                              onChange={(e) => handleChange("probability", e.target.value)}
                              placeholder="95%"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Due to Developer</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.due_to_developer || ""}
                              onChange={(e) => handleChange("due_to_developer", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Amount</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.amount || ""}
                              onChange={(e) => handleChange("amount", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: COMMISSION */}
                  {activeTab === "commission" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Commission Overview</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Total Commission</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.commission || ""}
                              onChange={(e) => handleChange("commission", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>External Party Commission</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.party_commission || ""}
                              onChange={(e) => handleChange("party_commission", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>External Party Name</label>
                            <input
                              className={fieldCls}
                              value={formData.party_name || ""}
                              onChange={(e) => handleChange("party_name", e.target.value)}
                              placeholder="Agency name"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                          <div className="text-[12px] font-semibold text-gray-800 mb-3">Broker Commission Split</div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`${labelCls} block mb-1`}>Closing Broker</label>
                              <input
                                className={fieldCls}
                                value={formData.closing_broker || ""}
                                onChange={(e) => handleChange("closing_broker", e.target.value)}
                                placeholder="Broker name"
                              />
                            </div>
                            <div>
                              <label className={`${labelCls} block mb-1`}>Split Amount</label>
                              <input
                                className={fieldCls}
                                type="number"
                                value={formData.split_amount || ""}
                                onChange={(e) => handleChange("split_amount", e.target.value)}
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Second Broker</label>
                              <input
                                className={fieldCls}
                                value={formData.second_broker || ""}
                                onChange={(e) => handleChange("second_broker", e.target.value)}
                                placeholder="Broker name"
                              />
                            </div>
                            <div>
                              <label className={`${labelCls} block mb-1`}>Second Broker Amount</label>
                              <input
                                className={fieldCls}
                                type="number"
                                value={formData.second_broker_split_amount || ""}
                                onChange={(e) => handleChange("second_broker_split_amount", e.target.value)}
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Third Broker</label>
                              <input
                                className={fieldCls}
                                value={formData.third_broker || ""}
                                onChange={(e) => handleChange("third_broker", e.target.value)}
                                placeholder="Broker name"
                              />
                            </div>
                            <div>
                              <label className={`${labelCls} block mb-1`}>Third Broker Amount</label>
                              <input
                                className={fieldCls}
                                type="number"
                                value={formData.third_broker_split_amount || ""}
                                onChange={(e) => handleChange("third_broker_split_amount", e.target.value)}
                                placeholder="0.00"
                              />
                            </div>

                            <div>
                              <label className={`${labelCls} block mb-1`}>Fourth Broker</label>
                              <input
                                className={fieldCls}
                                value={formData.fourth_broker || ""}
                                onChange={(e) => handleChange("fourth_broker", e.target.value)}
                                placeholder="Broker name"
                              />
                            </div>
                            <div>
                              <label className={`${labelCls} block mb-1`}>Fourth Broker Amount</label>
                              <input
                                className={fieldCls}
                                type="number"
                                value={formData.fourth_broker_split_amount || ""}
                                onChange={(e) => handleChange("fourth_broker_split_amount", e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className={`${labelCls} block mb-1`}>Agency Contact</label>
                            <input
                              className={fieldCls}
                              value={formData.agency_contact || ""}
                              onChange={(e) => handleChange("agency_contact", e.target.value)}
                              placeholder="Agency contact information"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: CLOSING */}
                  {activeTab === "closing" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Closing Details</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Deposit Date</label>
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.deposit_date || ""}
                              onChange={(e) => handleChange("deposit_date", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Deposit Amount</label>
                            <input
                              className={fieldCls}
                              type="number"
                              value={formData.money_amount || ""}
                              onChange={(e) => handleChange("money_amount", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Agreement Date</label>
                            <input
                              className={fieldCls}
                              type="date"
                              value={formData.agreement_date || ""}
                              onChange={(e) => handleChange("agreement_date", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Created By</label>
                            <input
                              className={fieldCls}
                              value={formData.created_by || ""}
                              onChange={(e) => handleChange("created_by", e.target.value)}
                              placeholder="Admin name"
                            />
                          </div>
                        </div>

                        {/* Closing Checklist */}
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded mb-4">
                          <div className="text-[12px] font-semibold text-gray-800 mb-3">Closing Checklist</div>
                          <div className="grid grid-cols-2 gap-2">
                            {CHECKLIST_ITEMS.map((item) => (
                              <label key={item.key} className="flex items-center gap-2 text-[12px]">
                                <input
                                  type="checkbox"
                                  checked={checklist[item.key]}
                                  onChange={(e) => handleChecklistChange(item.key, e.target.checked)}
                                  className="w-3.5 h-3.5"
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* SEO Fields */}
                        <div className="space-y-3">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Title</label>
                            <input
                              className={fieldCls}
                              value={formData.title || ""}
                              onChange={(e) => handleChange("title", e.target.value)}
                              placeholder="SEO title for this deal"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Sub Title</label>
                            <input
                              className={fieldCls}
                              value={formData.sub_title || ""}
                              onChange={(e) => handleChange("sub_title", e.target.value)}
                              placeholder="Sub title or tagline"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>Descriptions</label>
                            <textarea
                              className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500 rounded"
                              rows={3}
                              value={formData.descriptions || ""}
                              onChange={(e) => handleChange("descriptions", e.target.value)}
                              placeholder="Detailed description of the deal..."
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>SEO Title</label>
                            <input
                              className={fieldCls}
                              value={formData.seo_title || ""}
                              onChange={(e) => handleChange("seo_title", e.target.value)}
                              placeholder="Meta title for SEO"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>SEO Keywords</label>
                            <input
                              className={fieldCls}
                              value={formData.seo_keyword || ""}
                              onChange={(e) => handleChange("seo_keyword", e.target.value)}
                              placeholder="Comma separated keywords"
                            />
                          </div>

                          <div>
                            <label className={`${labelCls} block mb-1`}>SEO Description</label>
                            <textarea
                              className="w-full border border-gray-300 bg-white px-2 py-2 text-[12px] outline-none focus:border-gray-500 rounded"
                              rows={2}
                              value={formData.seo_description || ""}
                              onChange={(e) => handleChange("seo_description", e.target.value)}
                              placeholder="Meta description for SEO"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-gray-300 pt-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={copyFormData}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-gray-700 text-[12px] hover:bg-gray-50 gap-1 rounded"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Data
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-gray-700 text-[12px] hover:bg-gray-50 gap-1 rounded"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => fastNavigate("/admin/deals")}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 bg-white text-gray-700 text-[12px] hover:bg-gray-50 gap-1 rounded"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const isValid = validateForm();
                          if (isValid) {
                            console.log("Form data:", prepareFormData());
                            toast.info("Form validated. Check console for data.");
                          }
                        }}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 bg-blue-50 text-blue-700 text-[12px] hover:bg-blue-100 gap-1 rounded"
                      >
                        <Eye className="w-3 h-3" />
                        Preview Data
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 border border-green-600 bg-green-600 text-white text-[12px] hover:bg-green-700 gap-1 disabled:opacity-50 rounded"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            Save Deal
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-1 bg-white px-3 py-1 border border-gray-300 text-[11px] text-gray-500 rounded">
              <AlertCircle className="w-3 h-3" />
              All required fields (<span className="text-red-500">*</span>) must be filled before saving
            </div>
          </div>
        </div>
      </div>
    </>
  );
}