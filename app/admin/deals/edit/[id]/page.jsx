"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Users,
  DollarSign,
  Shield,
  FileText,
  Briefcase,
  ClipboardCheck,
  Settings,
  AlertCircle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth"; // Path adjust kar lena apne folder structure ke hisab se
import AdminNavbar from "../../../dashboard/header/DashboardNavbar"; // Path adjust kar lena

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== STYLES & CONFIG ====================
const MAX_SLUG_LENGTH = 50;

const labelCls = "text-[12px] text-gray-700";
const labelRequiredCls = "text-[12px] text-gray-700 after:content-['*'] after:text-red-500 after:ml-0.5";
const fieldCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500 rounded";
const fieldErrorCls = "h-8 w-full border border-red-400 bg-red-50 px-2 text-[12px] outline-none focus:border-red-500 rounded";
const selectCls = "h-8 w-full border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-gray-500 rounded";
const boxCls = "border border-gray-300 bg-white rounded";
const boxHeaderCls = "px-3 py-2 border-b border-gray-300 text-[13px] font-semibold text-gray-800";
const boxBodyCls = "p-3";

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

const CHECKLIST_ITEMS = [
  { key: "mou_signed", label: "MOU Signed" },
  { key: "deposit_received", label: "Deposit Received" },
  { key: "noc_obtained", label: "NOC Obtained" },
  { key: "title_deed_ready", label: "Title Deed Ready" },
  { key: "transfer_scheduled", label: "Transfer Scheduled" },
  { key: "keys_handed_over", label: "Keys Handed Over" },
];

// ==================== API HELPER ====================
const createApiRequest = () => async (endpoint, options = {}) => {
  const token = getAdminToken();
  if (!token || !isAdminTokenValid()) throw new Error("Session expired");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
  return data;
};

// ==================== SLUG GENERATOR ====================
const createSafeSlug = (name) => {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") + "-" + Math.random().toString(36).substring(2, 6);
};

// ==================== MAIN COMPONENT ====================
export default function EditDealPage() {
  const params = useParams();
  const router = useRouter();
  const apiRequest = useMemo(() => createApiRequest(), []);
  const dealId = params.id;

  // States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Data States
  const [formData, setFormData] = useState({});
  const [checklist, setChecklist] = useState({});
  const [errors, setErrors] = useState({});

  // Auth Check & Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const token = getAdminToken();
        if (!token || !isAdminTokenValid()) {
          logoutAll();
          window.location.href = "/admin/login";
          return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        setAdmin(payload);
        setIsAuthenticated(true);

        // Fetch Deal Data
        await fetchDealData();
      } catch (error) {
        console.error("Init Error:", error);
        toast.error("Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [dealId]);

  // Fetch Deal Function
  const fetchDealData = async () => {
    try {
      const res = await apiRequest(`/api/v1/deals/id/${dealId}`);
      if (res.success && res.data) {
        const data = res.data;
        
        // Checklist Parse
        let parsedChecklist = {};
        try {
          parsedChecklist = data.closing_checklist ? JSON.parse(data.closing_checklist) : {};
        } catch (e) { console.error("Checklist parse error", e); }
        setChecklist(parsedChecklist);

        // Map DB Keys (PascalCase/Mixed) to Form Keys (snake_case)
        setFormData({
          transaction_category: data.transaction_category || "Sales", // Adjust default
          closing_ids: data.Closing_IDs || data.closing_ids || "",
          closing_name: data.closing_name || "",
          slug: data.slug || "",
          listing: data.Listing || data.listing || "",
          buyers: data.Buyers || data.buyers || "",
          sellers: data.Sellers || data.sellers || "",
          sales_price: data.Sales_Price || data.sales_price || "",
          target_closing: formatDate(data.Target_Closing || data.target_closing),
          closing_status: data.Closing_Status || "Open",
          
          // Basic Info
          listing_type: data.listing_type || "",
          transaction_type: data.transaction_type || "",
          listing_city: data.listing_city || "",
          listing_community: data.listing_community || "",
          developer: data.Developer || data.developer || "",
          title_deed: data.title_dead || data.title_deed || "", // Note: DB likely has 'title_dead' typo based on model
          
          // Buyer
          lead_source: data.lead_source || "",
          buyer_nationality: data.buyer_nationality || "",
          transfer_fee: data.transfer_fee || "",
          
          // Seller
          seller: data.seller || "",
          seller_nationality: data.seller_nationality || "",
          
          // Admin
          conveyancing_fee: data.conveyancing_fee || "",
          partial_payment: data.partial_payment || "",
          full_payment: data.full_payment || "",
          
          // AML
          kyc_completed: data.KYC_Completed === "true" || data.KYC_Completed === "1" || data.kyc_completed === "true",
          documentation_check_approved: data.Documentation_Check_Approved === "true" || data.Documentation_Check_Approved === "1",
          contact_details_verified: data.Contact_Details_Verified === "true" || data.Contact_Details_Verified === "1",
          
          // Commission
          commission: data.commission || "",
          closing_broker: data.Closing_Broker || data.closing_broker || "",
          split_amount: data.split_amount || "",
          
          // Dates
          deposit_date: formatDate(data.Deposit_Date || data.deposit_date),
          agreement_date: formatDate(data.Agreement_Date || data.agreement_date),
        });
      }
    } catch (error) {
      toast.error("Could not fetch deal details");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleChecklistChange = (key, checked) => {
    setChecklist(prev => ({ ...prev, [key]: checked }));
  };

  const generateSlug = () => {
    const source = formData.closing_name || formData.closing_ids;
    if (!source) return toast.error("Enter closing name or ID");
    const newSlug = createSafeSlug(source);
    setFormData(prev => ({ ...prev, slug: newSlug }));
  };

  // ==================== UPDATE HANDLER ====================
  const handleUpdate = async () => {
    if (!formData.closing_ids) return toast.error("Closing ID is required");
    
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        closing_checklist: JSON.stringify(checklist),
        // Boolean conversion for DB
        KYC_Completed: formData.kyc_completed ? "true" : "false",
        Documentation_Check_Approved: formData.documentation_check_approved ? "true" : "false",
        Contact_Details_Verified: formData.contact_details_verified ? "true" : "false",
      };

      const res = await apiRequest(`/api/v1/deals/update/${dealId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("✅ Deal updated successfully!");
        // Optional: Refresh data or redirect
        // router.push("/admin/deals"); 
      }
    } catch (error) {
      toast.error(error.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} />

      <div className="min-h-screen bg-[#f6f6f6]">
        <div className="max-w-[1250px] mx-auto px-4 py-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-700" />
              <div className="text-[18px] font-semibold text-gray-800">Edit Deal <span className="text-gray-400 text-sm">#{dealId}</span></div>
            </div>
            <div className="text-[12px] text-gray-500">
                Last Updated: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Back Button */}
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => router.back()} className="w-10 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 rounded">
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <span className="text-[12px] text-gray-500">Back to Deals</span>
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
                
                {/* LEFT COLUMN (Always Visible) */}
                <div className="col-span-12 md:col-span-4 space-y-3">
                  
                  {/* Status */}
                  <div className={boxCls}>
                    <div className={boxBodyCls}>
                      <label className={`${labelCls} block mb-1`}>Current Status</label>
                      <select
                        className={`${selectCls} font-semibold ${formData.closing_status === 'Closed' ? 'text-green-600' : 'text-blue-600'}`}
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
                    <div className={boxHeaderCls}>Core Details</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Closing ID</label>
                          <input className={fieldCls} value={formData.closing_ids || ""} onChange={(e) => handleChange("closing_ids", e.target.value)} />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-1`}>Closing Name</label>
                          <input className={fieldCls} value={formData.closing_name || ""} onChange={(e) => handleChange("closing_name", e.target.value)} />
                        </div>
                        
                        {/* Slug */}
                        <div>
                          <label className={`${labelCls} block mb-1`}>Slug</label>
                          <div className="flex gap-1">
                            <input className={`${fieldCls} flex-1 text-[10px]`} value={formData.slug || ""} readOnly />
                            <button onClick={generateSlug} className="h-8 px-2 border border-gray-300 bg-white rounded hover:bg-gray-50">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`${labelRequiredCls} block mb-1`}>Sales Price</label>
                          <input className={fieldCls} type="number" value={formData.sales_price || ""} onChange={(e) => handleChange("sales_price", e.target.value)} />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-1`}>Target Closing</label>
                          <input className={fieldCls} type="date" value={formData.target_closing || ""} onChange={(e) => handleChange("target_closing", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parties Summary */}
                  <div className={boxCls}>
                    <div className={boxHeaderCls}>Parties Summary</div>
                    <div className={boxBodyCls}>
                      <div className="space-y-2">
                        <div>
                          <label className={`${labelCls} block mb-1`}>Buyer Name</label>
                          <input className={fieldCls} value={formData.buyers || ""} onChange={(e) => handleChange("buyers", e.target.value)} />
                        </div>
                        <div>
                          <label className={`${labelCls} block mb-1`}>Seller Name</label>
                          <input className={fieldCls} value={formData.sellers || ""} onChange={(e) => handleChange("sellers", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (Tabs) */}
                <div className="col-span-12 md:col-span-8 space-y-3">
                  
                  {/* BASIC TAB */}
                  {activeTab === "basic" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Property Details</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Listing Type</label>
                            <select className={selectCls} value={formData.listing_type || ""} onChange={(e) => handleChange("listing_type", e.target.value)}>
                              {LISTING_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Transaction Type</label>
                            <select className={selectCls} value={formData.transaction_type || ""} onChange={(e) => handleChange("transaction_type", e.target.value)}>
                              {TRANSACTION_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>City</label>
                            <input className={fieldCls} value={formData.listing_city || ""} onChange={(e) => handleChange("listing_city", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Community</label>
                            <input className={fieldCls} value={formData.listing_community || ""} onChange={(e) => handleChange("listing_community", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Developer</label>
                            <input className={fieldCls} value={formData.developer || ""} onChange={(e) => handleChange("developer", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Title Deed No.</label>
                            <input className={fieldCls} value={formData.title_deed || ""} onChange={(e) => handleChange("title_deed", e.target.value)} />
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
                            <input className={fieldCls} value={formData.lead_source || ""} onChange={(e) => handleChange("lead_source", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Buyer Nationality</label>
                            <input className={fieldCls} value={formData.buyer_nationality || ""} onChange={(e) => handleChange("buyer_nationality", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Transfer Fee</label>
                            <input className={fieldCls} type="number" value={formData.transfer_fee || ""} onChange={(e) => handleChange("transfer_fee", e.target.value)} />
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
                            <label className={`${labelCls} block mb-1`}>Seller Name (Full)</label>
                            <input className={fieldCls} value={formData.seller || ""} onChange={(e) => handleChange("seller", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Seller Nationality</label>
                            <input className={fieldCls} value={formData.seller_nationality || ""} onChange={(e) => handleChange("seller_nationality", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADMIN TAB */}
                  {activeTab === "admin" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Admin & Accounts</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Conveyancing Fee</label>
                            <input className={fieldCls} type="number" value={formData.conveyancing_fee || ""} onChange={(e) => handleChange("conveyancing_fee", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Partial Payment</label>
                            <input className={fieldCls} type="number" value={formData.partial_payment || ""} onChange={(e) => handleChange("partial_payment", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Full Payment</label>
                            <input className={fieldCls} type="number" value={formData.full_payment || ""} onChange={(e) => handleChange("full_payment", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AML TAB */}
                  {activeTab === "aml" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>AML & Compliance</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <label className="flex items-center gap-2 text-[12px] cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200">
                            <input type="checkbox" checked={formData.kyc_completed || false} onChange={(e) => handleChange("kyc_completed", e.target.checked)} />
                            KYC Completed
                          </label>
                          <label className="flex items-center gap-2 text-[12px] cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200">
                            <input type="checkbox" checked={formData.documentation_check_approved || false} onChange={(e) => handleChange("documentation_check_approved", e.target.checked)} />
                            Docs Approved
                          </label>
                          <label className="flex items-center gap-2 text-[12px] cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200">
                            <input type="checkbox" checked={formData.contact_details_verified || false} onChange={(e) => handleChange("contact_details_verified", e.target.checked)} />
                            Contact Verified
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMMISSION TAB */}
                  {activeTab === "commission" && (
                    <div className={boxCls}>
                      <div className={boxHeaderCls}>Commission Details</div>
                      <div className={boxBodyCls}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Total Commission</label>
                            <input className={fieldCls} type="number" value={formData.commission || ""} onChange={(e) => handleChange("commission", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Closing Broker</label>
                            <input className={fieldCls} value={formData.closing_broker || ""} onChange={(e) => handleChange("closing_broker", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Split Amount</label>
                            <input className={fieldCls} type="number" value={formData.split_amount || ""} onChange={(e) => handleChange("split_amount", e.target.value)} />
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
                              <input type="checkbox" checked={checklist[item.key] || false} onChange={(e) => handleChecklistChange(item.key, e.target.checked)} />
                              {item.label}
                            </label>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`${labelCls} block mb-1`}>Deposit Date</label>
                            <input className={fieldCls} type="date" value={formData.deposit_date || ""} onChange={(e) => handleChange("deposit_date", e.target.value)} />
                          </div>
                          <div>
                            <label className={`${labelCls} block mb-1`}>Agreement Date</label>
                            <input className={fieldCls} type="date" value={formData.agreement_date || ""} onChange={(e) => handleChange("agreement_date", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end pt-3 border-t gap-2">
                     <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-[12px] rounded hover:bg-gray-50">
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white text-[12px] rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Updating..." : "Update Deal"}
                      </button>
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
