"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  RotateCcw,
  Save,
  Eye,
  User,
  Users,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  Briefcase,
  ClipboardCheck,
  Settings,
  AlertCircle,
  RefreshCw,
  Database,
  Wrench,
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

// ==================== SLUG CONFIGURATION ====================
const MAX_SLUG_LENGTH = 50;

// ==================== FAST NAVIGATION ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

// ==================== SLUG GENERATOR ====================
const createSafeSlug = (name) => {
  if (!name) return "";

  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Math.random().toString(36).substring(2, 6);
  const maxBaseLength = MAX_SLUG_LENGTH - 5;

  if (slug.length > maxBaseLength) {
    slug = slug.substring(0, maxBaseLength);
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > 3) {
      slug = slug.substring(0, lastHyphen);
    }
    slug = slug.replace(/-$/, "");
  }

  const finalSlug = `${slug}-${suffix}`;
  console.log(`Slug: "${finalSlug}" (${finalSlug.length}/${MAX_SLUG_LENGTH})`);
  return finalSlug;
};

// ==================== API HELPER ====================
const createApiRequest = () => async (endpoint, options = {}) => {
  const token = getAdminToken();

  if (!token || !isAdminTokenValid()) {
    logoutAll();
    fastNavigate("/admin/login");
    throw new Error("Session expired");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

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
      throw new Error("Session expired");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ==================== INITIAL FORM DATA ====================
const INITIAL_FORM_DATA = {
  transaction_category: "",
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
  winning_inquiry: "",
  lead_source: "",
  winning_inquiry_status: "",
  buyer_nationality: "",
  buyer_second_nationality: "",
  transfer_fee: "",
  seller: "",
  seller_nationality: "",
  seller_second_nationality: "",
  listing_type: "",
  listing_city: "",
  listing_community: "",
  listing_property_address: "",
  tenant: "",
  landlord: "",
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
  representing: "",
  probability: "",
  due_to_developer: "",
  amount: "",
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
  deposit_date: "",
  money_amount: "",
  agreement_date: "",
  created_by: "",
  closing_checklist: "",
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

// ==================== STYLING CLASSES ====================
const labelCls = "text-[12px] text-gray-700";
const labelRequiredCls = "text-[12px] text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500 rounded";
const fieldErrorCls = "h-8 w-full border border-red-400 bg-red-50 px-2 text-[12px] outline-none focus:border-red-500 rounded";
const selectCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500 rounded";
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

// ==================== MAIN COMPONENT ====================
export default function AddDealPage() {
  const apiRequest = useMemo(() => createApiRequest(), []);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Checklist State
  const [checklist, setChecklist] = useState({
    mou_signed: false,
    deposit_received: false,
    noc_obtained: false,
    title_deed_ready: false,
    transfer_scheduled: false,
    keys_handed_over: false,
  });

  // Slug validation
  const slugLength = formData.slug?.length || 0;
  const isSlugValid = slugLength >= 3 && slugLength <= MAX_SLUG_LENGTH;
  const isSlugTooLong = slugLength > MAX_SLUG_LENGTH;

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
      } catch (error) {
        console.error("Auth error:", error);
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
    setLogoutLoading(true);
    logoutAll();
    fastNavigate("/admin/login");
  }, []);

  // ==================== FORM HANDLERS ====================
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };

    // Auto-generate slug
    if (field === "closing_name" || field === "closing_ids") {
      const slugSource = field === "closing_name" ? value : formData.closing_name || value;
      if (slugSource) {
        updated.slug = createSafeSlug(slugSource);
      }
    }

    setFormData(updated);

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
      setErrors((prev) => ({ ...prev, [field]: "Required" }));
    }
  };

  const handleChecklistChange = (key, checked) => {
    setChecklist((prev) => ({ ...prev, [key]: checked }));
  };

  const generateSlug = () => {
    const source = formData.closing_name || formData.closing_ids;
    if (!source) {
      toast.error("Enter closing name or ID first");
      return;
    }
    const newSlug = createSafeSlug(source);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    toast.success(`Slug: ${newSlug} (${newSlug.length} chars)`);
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
      newErrors.sales_price = "Must be a valid number";
    }

    if (!formData.slug || formData.slug.length < 3) {
      newErrors.slug = "Slug required (min 3 chars)";
    } else if (formData.slug.length > MAX_SLUG_LENGTH) {
      newErrors.slug = `Slug too long (max ${MAX_SLUG_LENGTH})`;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors).slice(0, 2).join(", "));
      return false;
    }

    return true;
  };

  // ==================== PREPARE DATA ====================
  const prepareFormData = () => {
    const dealData = {};

    // Only include non-empty values
    for (const [key, value] of Object.entries(formData)) {
      // Skip transaction_category (UI only)
      if (key === "transaction_category") continue;
      
      // Skip empty values
      if (value === "" || value === null || value === undefined) continue;
      
      dealData[key] = value;
    }

    // Ensure slug is valid
    if (!dealData.slug || dealData.slug.length > MAX_SLUG_LENGTH) {
      dealData.slug = createSafeSlug(dealData.closing_name || dealData.closing_ids || "deal");
    }

    // Add checklist
    dealData.closing_checklist = JSON.stringify(checklist);

    // Convert numeric fields
    const numericFields = [
      "sales_price", "transfer_fee", "conveyancing_fee", "success_probability_amount",
      "partial_payment", "full_payment", "original_price", "due_to_developer", "amount",
      "commission", "party_commission", "split_amount", "second_broker_split_amount",
      "third_broker_split_amount", "fourth_broker_split_amount", "money_amount", "age"
    ];

    numericFields.forEach((field) => {
      if (dealData[field]) {
        const num = parseFloat(dealData[field]);
        dealData[field] = Number.isFinite(num) ? num : null;
      }
    });

    console.log("📤 Prepared deal data:", dealData);
    console.log("📤 Slug:", dealData.slug, "Length:", dealData.slug?.length);

    return dealData;
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (isSlugTooLong) {
      toast.error(`Slug too long (${slugLength}/${MAX_SLUG_LENGTH})`);
      return;
    }

    try {
      setSaving(true);

      const dealData = prepareFormData();

      console.log("🚀 Submitting...", dealData);

      const result = await apiRequest("/api/v1/deals", {
        method: "POST",
        body: JSON.stringify(dealData),
      });

      if (result.success) {
        toast.success("✅ Deal created successfully!");
        setTimeout(() => fastNavigate("/admin/deals"), 1500);
      } else {
        toast.error(result.message || "Failed to create deal");
      }
    } catch (e) {
      console.error("❌ Submit error:", e);

      // Handle specific errors
      if (e.message.includes("id") && e.message.includes("default")) {
        toast.error("Database error: Run ALTER TABLE deals MODIFY id INT AUTO_INCREMENT;");
      } else if (e.message.includes("slug") || e.message.includes("Data too long")) {
        toast.error("Slug too long. Regenerate with shorter name.");
      } else {
        toast.error(e.message || "Failed to create deal");
      }
    } finally {
      setSaving(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const resetForm = () => {
    if (window.confirm("Reset all form data?")) {
      setFormData(INITIAL_FORM_DATA);
      setChecklist({
        mou_signed: false, deposit_received: false, noc_obtained: false,
        title_deed_ready: false, transfer_scheduled: false, keys_handed_over: false,
      });
      setErrors({});
      setTouched({});
      toast.success("Form reset");
    }
  };

  const fillSampleData = () => {
    const sampleSlug = createSafeSlug("Marina Sale");
    setFormData({
      ...INITIAL_FORM_DATA,
      transaction_category: "Sales",
      closing_ids: "CL-" + Math.floor(Math.random() * 10000),
      closing_name: "Marina Sale",
      slug: sampleSlug,
      listing: "LST-001",
      buyers: "John Smith",
      sellers: "ABC Properties",
      sales_price: "2500000",
      target_closing: "2024-12-31",
      closing_status: "Open",
      listing_type: "Apartment",
      listing_city: "Dubai",
      listing_community: "Dubai Marina",
      developer: "Emaar",
      transaction_type: "Sale",
      freehold: true,
      commission: "75000",
      closing_broker: "Ahmed",
      kyc_completed: true,
    });
    setErrors({});
    toast.success(`Sample filled! Slug: ${sampleSlug} (${sampleSlug.length} chars)`);
  };

  const getFieldClass = (field) => {
    return errors[field] && touched[field] ? fieldErrorCls : fieldCls;
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-700 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  // ==================== RENDER ====================
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-[#f6f6f6]">
        <div className="max-w-[1250px] mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-700" />
              <div className="text-[18px] font-semibold text-gray-800">Add New Deal</div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={fillSampleData} className="px-3 py-1 border border-blue-300 bg-blue-50 text-blue-700 text-[12px] hover:bg-blue-100 rounded">
                Fill Sample
              </button>
            </div>
          </div>

          {/* Database Fix Alert */}
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded mb-3 text-[11px]">
            <strong>⚠️ If you see "Field 'id' doesn't have a default value":</strong><br/>
            Run: <code className="bg-amber-100 px-1 rounded">ALTER TABLE deals MODIFY COLUMN id INT AUTO_INCREMENT;</code>
          </div>

          {/* Back Button */}
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => window.history.back()} className="w-10 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded">
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <a href="/admin/deals" className="text-[12px] text-blue-600 hover:underline">← Back to Deals</a>
          </div>

          {/* Form Completion Status */}
          <div className="bg-white border border-gray-300 p-3 mb-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium">Form Status</span>
              <span className={`text-[12px] font-bold ${isSlugValid ? 'text-green-600' : 'text-red-600'}`}>
                Slug: {slugLength}/{MAX_SLUG_LENGTH} {isSlugValid ? '✓' : '⚠️'}
              </span>
            </div>
            <div className="text-[11px] text-gray-500">
              Required: {REQUIRED_FIELDS.filter(f => formData[f.field]).length}/{REQUIRED_FIELDS.length}
            </div>
          </div>

          {/* Tabs */}
          <div className="border border-gray-300 bg-white rounded">
            <div className="flex items-center gap-1 border-b border-gray-300 px-2 py-2 flex-wrap">
              {[
                { id: "basic", label: "Basic Info", icon: FileText },
                { id: "buyer", label: "Buyer", icon: User },
                { id: "seller", label: "Seller", icon: Users },
                { id: "admin", label: "Admin", icon: Settings },
                { id: "aml", label: "AML/KYC", icon: Shield },
                { id: "commission", label: "Commission", icon: DollarSign },
                { id: "closing", label: "Closing", icon: ClipboardCheck },
              ].map((tab) => (
                <button
                  key={tab.id}
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
                    <div className={boxHeaderCls}>Transaction Type *</div>
                    <div className={boxBodyCls}>
                      <div className="grid grid-cols-3 gap-2">
                        {["Sales", "Rental", "Others"].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleChange("transaction_category", type)}
                            className={`h-10 border text-[12px] rounded ${
                              formData.transaction_category === type
                                ? "border-gray-900 bg-gray-900 text-white font-semibold"
                                : "border-gray-300 bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <label className={`${labelCls} block mb-1`}>Status</label>
                      <select
                        className={selectCls}
                        value={formData.closing_status}
                        onChange={(e) => handleChange("closing_status", e.target.value)}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Basic Details */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Basic Details</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        {/* Closing ID */}
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Closing ID</label>
                          <input
                            className={getFieldClass("closing_ids")}
                            value={formData.closing_ids}
                            onChange={(e) => handleChange("closing_ids", e.target.value)}
                            onBlur={() => handleBlur("closing_ids")}
                            placeholder="CL-2024-001"
                          />
                        </div>

                        {/* Closing Name */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Closing Name</label>
                          <input
                            className={fieldCls}
                            value={formData.closing_name}
                            onChange={(e) => handleChange("closing_name", e.target.value)}
                            placeholder="Deal name"
                            maxLength={50}
                          />
                        </div>

                        {/* Slug */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Slug</label>
                          <div className="flex gap-1">
                            <input
                              className={`${isSlugTooLong ? fieldErrorCls : fieldCls} flex-1 text-[10px]`}
                              value={formData.slug}
                              readOnly
                            />
                            <button onClick={generateSlug} className="h-8 px-2 border border-gray-300 bg-white rounded">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                          <span className={`text-[10px] ${isSlugTooLong ? 'text-red-600' : 'text-green-600'}`}>
                            {slugLength}/{MAX_SLUG_LENGTH}
                          </span>
                        </div>

                        {/* Sales Price */}
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Sales Price</label>
                          <input
                            className={getFieldClass("sales_price")}
                            type="number"
                            value={formData.sales_price}
                            onChange={(e) => handleChange("sales_price", e.target.value)}
                            onBlur={() => handleBlur("sales_price")}
                            placeholder="2500000"
                          />
                        </div>

                        {/* Dates */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Target Closing</label>
                          <input
                            className={fieldCls}
                            type="date"
                            value={formData.target_closing}
                            onChange={(e) => handleChange("target_closing", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Parties</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Buyer(s)</label>
                          <input
                            className={getFieldClass("buyers")}
                            value={formData.buyers}
                            onChange={(e) => handleChange("buyers", e.target.value)}
                            onBlur={() => handleBlur("buyers")}
                            placeholder="Buyer name"
                          />
                        </div>
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Seller(s)</label>
                          <input
                            className={getFieldClass("sellers")}
                            value={formData.sellers}
                            onChange={(e) => handleChange("sellers", e.target.value)}
                            onBlur={() => handleBlur("sellers")}
                            placeholder="Seller name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  {/* BASIC TAB */}
                  {activeTab === "basic" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Property Details</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Listing Type</label>
                            <select className={selectCls} value={formData.listing_type} onChange={(e) => handleChange("listing_type", e.target.value)}>
                              {LISTING_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Transaction Type</label>
                            <select className={selectCls} value={formData.transaction_type} onChange={(e) => handleChange("transaction_type", e.target.value)}>
                              {TRANSACTION_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>City</label>
                            <input className={fieldCls} value={formData.listing_city} onChange={(e) => handleChange("listing_city", e.target.value)} placeholder="Dubai" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Community</label>
                            <input className={fieldCls} value={formData.listing_community} onChange={(e) => handleChange("listing_community", e.target.value)} placeholder="Dubai Marina" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Developer</label>
                            <input className={fieldCls} value={formData.developer} onChange={(e) => handleChange("developer", e.target.value)} placeholder="Emaar" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Title Deed</label>
                            <input className={fieldCls} value={formData.title_deed} onChange={(e) => handleChange("title_deed", e.target.value)} placeholder="TD-123456" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BUYER TAB */}
                  {activeTab === "buyer" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Buyer Information</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Lead Source</label>
                            <input className={fieldCls} value={formData.lead_source} onChange={(e) => handleChange("lead_source", e.target.value)} placeholder="Property Finder" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Buyer Nationality</label>
                            <input className={fieldCls} value={formData.buyer_nationality} onChange={(e) => handleChange("buyer_nationality", e.target.value)} placeholder="UAE" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Transfer Fee</label>
                            <input className={fieldCls} type="number" value={formData.transfer_fee} onChange={(e) => handleChange("transfer_fee", e.target.value)} placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SELLER TAB */}
                  {activeTab === "seller" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Seller Information</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Seller Name</label>
                            <input className={fieldCls} value={formData.seller} onChange={(e) => handleChange("seller", e.target.value)} placeholder="Seller" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Seller Nationality</label>
                            <input className={fieldCls} value={formData.seller_nationality} onChange={(e) => handleChange("seller_nationality", e.target.value)} placeholder="UAE" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADMIN TAB */}
                  {activeTab === "admin" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Admin Zone</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Conveyancing Fee</label>
                            <input className={fieldCls} type="number" value={formData.conveyancing_fee} onChange={(e) => handleChange("conveyancing_fee", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Partial Payment</label>
                            <input className={fieldCls} type="number" value={formData.partial_payment} onChange={(e) => handleChange("partial_payment", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Full Payment</label>
                            <input className={fieldCls} type="number" value={formData.full_payment} onChange={(e) => handleChange("full_payment", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AML TAB */}
                  {activeTab === "aml" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>AML & KYC</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <label className="flex items-center gap-2 text-[12px]">
                            <input type="checkbox" checked={formData.kyc_completed} onChange={(e) => handleChange("kyc_completed", e.target.checked)} />
                            KYC Completed
                          </label>
                          <label className="flex items-center gap-2 text-[12px]">
                            <input type="checkbox" checked={formData.documentation_check_approved} onChange={(e) => handleChange("documentation_check_approved", e.target.checked)} />
                            Docs Approved
                          </label>
                          <label className="flex items-center gap-2 text-[12px]">
                            <input type="checkbox" checked={formData.contact_details_verified} onChange={(e) => handleChange("contact_details_verified", e.target.checked)} />
                            Contact Verified
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMMISSION TAB */}
                  {activeTab === "commission" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Commission</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Total Commission</label>
                            <input className={fieldCls} type="number" value={formData.commission} onChange={(e) => handleChange("commission", e.target.value)} placeholder="75000" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Closing Broker</label>
                            <input className={fieldCls} value={formData.closing_broker} onChange={(e) => handleChange("closing_broker", e.target.value)} placeholder="Broker name" />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Split Amount</label>
                            <input className={fieldCls} type="number" value={formData.split_amount} onChange={(e) => handleChange("split_amount", e.target.value)} placeholder="50000" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLOSING TAB */}
                  {activeTab === "closing" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Closing Checklist</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {CHECKLIST_ITEMS.map((item) => (
                            <label key={item.key} className="flex items-center gap-2 text-[12px]">
                              <input type="checkbox" checked={checklist[item.key]} onChange={(e) => handleChecklistChange(item.key, e.target.checked)} />
                              {item.label}
                            </label>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Deposit Date</label>
                            <input className={fieldCls} type="date" value={formData.deposit_date} onChange={(e) => handleChange("deposit_date", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Agreement Date</label>
                            <input className={fieldCls} type="date" value={formData.agreement_date} onChange={(e) => handleChange("agreement_date", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <button onClick={resetForm} className="px-3 py-1 border border-gray-300 bg-white text-gray-700 text-[12px] rounded flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                      <button onClick={() => fastNavigate("/admin/deals")} className="px-3 py-1 border border-gray-300 bg-white text-gray-700 text-[12px] rounded flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> Cancel
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isSlugTooLong && (
                        <span className="text-[11px] text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Slug too long!
                        </span>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={saving || isSlugTooLong}
                        className="px-4 py-1 bg-green-600 text-white text-[12px] rounded flex items-center gap-1 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {saving ? "Saving..." : "Save Deal"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}