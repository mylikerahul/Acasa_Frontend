"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  X,
  Check,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  FileText,
  Upload,
  File,
  Plus,
  Paperclip,
  Trash2,
  User,
  Briefcase,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const fileInputRef = useRef(null);

  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState([]);

  const [formData, setFormData] = useState({
    contact_type: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    company_name: "",
    role_title: "",
    country: "United Arab Emirates",
    city: "",
    address_line1: "",
    address_line2: "",
    contact_source: "",
    lead_source: "",
    tags: "",
    notes: "",
  });

  // Auth Check
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setIsAuthenticated(true);
    setAdmin({ name: "Admin User" });
    setAuthLoading(false);
  }, [router]);

  // API Helper
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();
    if (!token) {
      router.push("/admin/login");
      throw new Error("Please login to continue");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      router.push("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [router]);

  // Fetch Contact Details
  const fetchContact = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await apiRequest(`/api/v1/contact/${id}`);

      if (data.success) {
        const contact = data.data || data.contact || data;
        
        setFormData({
          contact_type: contact.contact_type || "",
          first_name: contact.first_name || contact.name?.split(' ')[0] || "",
          last_name: contact.last_name || contact.name?.split(' ').slice(1).join(' ') || "",
          email: contact.email || "",
          phone: contact.phone || contact.phone_number || "",
          whatsapp: contact.whatsapp || contact.whatsapp_number || "",
          company_name: contact.company_name || contact.company || "",
          role_title: contact.role_title || contact.title || contact.designation || "",
          country: contact.country || "United Arab Emirates",
          city: contact.city || "",
          address_line1: contact.address_line1 || contact.address || "",
          address_line2: contact.address_line2 || "",
          contact_source: contact.contact_source || contact.source || "",
          lead_source: contact.lead_source || "",
          tags: Array.isArray(contact.tags) 
            ? contact.tags.join(", ") 
            : typeof contact.tags === 'string' 
              ? contact.tags 
              : "",
          notes: contact.notes || "",
        });

        // Fetch documents for this contact
        await fetchDocuments();
      } else {
        throw new Error(data.message || "Contact not found");
      }
    } catch (err) {
      console.error("Error fetching contact:", err);
      toast.error(err.message || "Failed to load contact");
      router.push("/admin/contacts");
    } finally {
      setLoading(false);
    }
  }, [id, apiRequest, router]);

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/v1/contact/${id}/documents`);
      if (data.success) {
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      // Don't show error toast for documents - it's optional
    }
  }, [id, apiRequest]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchContact();
    }
  }, [isAuthenticated, id, fetchContact]);

  // Handlers
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    setLogoutLoading(true);
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  // Handle Document Upload
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, Excel, Word, or text files.");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 10MB.");
      return;
    }

    const loadingToast = toast.loading("Uploading document...");
    setUploading(true);

    try {
      const token = getAdminToken();
      const formData = new FormData();
      formData.append("document", file);
      formData.append("contact_id", id);
      formData.append("description", `Document uploaded for contact ${id}`);

      const response = await fetch(`${API_BASE_URL}/api/v1/contact/${id}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload document");
      }

      toast.success("Document uploaded successfully", { id: loadingToast });
      await fetchDocuments(); // Refresh documents list
    } catch (err) {
      toast.error(err.message || "Failed to upload document", {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Document Delete
  const handleDeleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await apiRequest(`/api/v1/contact/${id}/documents/${docId}`, {
        method: "DELETE",
      });
      
      toast.success("Document deleted successfully");
      setDocuments(documents.filter(doc => doc._id !== docId));
    } catch (err) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.phone) {
      toast.error("First name and phone are required");
      return;
    }

    let tagsArray = [];
    if (formData.tags && typeof formData.tags === 'string') {
      tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
    } else if (Array.isArray(formData.tags)) {
      tagsArray = formData.tags;
    }

    const contactData = {
      contact_type: formData.contact_type,
      first_name: formData.first_name,
      last_name: formData.last_name || "",
      email: formData.email || "",
      phone: formData.phone,
      whatsapp: formData.whatsapp || "",
      company_name: formData.company_name || "",
      role_title: formData.role_title || "",
      country: formData.country,
      city: formData.city || "",
      address_line1: formData.address_line1 || "",
      address_line2: formData.address_line2 || "",
      contact_source: formData.contact_source || "",
      lead_source: formData.lead_source || "",
      tags: tagsArray,
      notes: formData.notes || "",
    };

    const loadingToast = toast.loading("Updating contact...");
    setSaving(true);

    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/contact/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to update contact: ${response.status}`);
      }

      if (data.success) {
        toast.success("Contact updated successfully", { id: loadingToast });
        setTimeout(() => {
          router.push("/admin/contacts");
        }, 1000);
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error details:", err);
      toast.error(err.message || "Failed to update contact", {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const steps = [
    { number: 1, title: "Basic Info", icon: <User className="w-4 h-4" /> },
    { number: 2, title: "Company & Address", icon: <Briefcase className="w-4 h-4" /> },
    { number: 3, title: "Source & Notes", icon: <Tag className="w-4 h-4" /> },
  ];

  // File type icon mapping
  const getFileIcon = (fileName) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <File className="w-5 h-5 text-red-500" />;
    } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
      return <File className="w-5 h-5 text-green-500" />;
    } else if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
      return <File className="w-5 h-5 text-blue-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (loading) {
    return (
      <>
        <AdminNavbar
          admin={admin}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="text-sm text-gray-500">Loading contact details...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => router.push("/admin/contacts")}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Contacts</span>
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Contact</h1>
              <p className="text-sm text-gray-500 mt-1">
                Update contact details and information
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Inquiry Button */}
              <button
                onClick={() => router.push("/admin/inquiries/add")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Inquiry
              </button>

              {/* Document Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                  disabled={uploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Stepper */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                {steps.map((s, index) => (
                  <div key={s.number} className="flex items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          step === s.number
                            ? "bg-green-600 text-white shadow-md"
                            : step > s.number
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {step > s.number ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          s.icon || s.number
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-xs font-medium text-gray-400">STEP {s.number}</div>
                        <span
                          className={`text-sm font-medium ${
                            step >= s.number ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {s.title}
                        </span>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 sm:w-24 h-[2px] mx-4 ${
                          step > s.number ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                {/* Step 1 - Basic Info */}
                {step === 1 && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Enter the contact's primary details
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.contact_type}
                            onChange={(e) => handleFormChange("contact_type", e.target.value)}
                            required
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select type</option>
                            <option value="B2C">B2C - Direct Client</option>
                            <option value="B2B">B2B - Third party agency</option>
                            <option value="AGENCY">AGENCY</option>
                            <option value="DEVELOPER">DEVELOPER</option>
                            <option value="VENDOR">VENDOR</option>
                            <option value="INBOUND">INBOUND</option>
                            <option value="OUTBOUND">OUTBOUND</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => handleFormChange("first_name", e.target.value)}
                            required
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter first name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => handleFormChange("last_name", e.target.value)}
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter last name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleFormChange("email", e.target.value)}
                              className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={formData.phone}
                              onChange={(e) => handleFormChange("phone", e.target.value)}
                              required
                              className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="+971 50 000 0000"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number
                          </label>
                          <input
                            type="text"
                            value={formData.whatsapp}
                            onChange={(e) => handleFormChange("whatsapp", e.target.value)}
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="+971 50 000 0000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 - Company & Address */}
                {step === 2 && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Company & Address</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Add organization and location details
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={formData.company_name}
                              onChange={(e) => handleFormChange("company_name", e.target.value)}
                              className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Enter company name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role / Title
                          </label>
                          <input
                            type="text"
                            value={formData.role_title}
                            onChange={(e) => handleFormChange("role_title", e.target.value)}
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., Manager, CEO"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={formData.country}
                              onChange={(e) => handleFormChange("country", e.target.value)}
                              className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={formData.city}
                              onChange={(e) => handleFormChange("city", e.target.value)}
                              className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                            >
                              <option value="">Select city</option>
                              <option value="Dubai">Dubai</option>
                              <option value="Abu Dhabi">Abu Dhabi</option>
                              <option value="Sharjah">Sharjah</option>
                              <option value="Ajman">Ajman</option>
                              <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                              <option value="Fujairah">Fujairah</option>
                              <option value="Umm Al Quwain">Umm Al Quwain</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          value={formData.address_line1}
                          onChange={(e) => handleFormChange("address_line1", e.target.value)}
                          className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Street address, building name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={formData.address_line2}
                          onChange={(e) => handleFormChange("address_line2", e.target.value)}
                          className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Area, district (optional)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 - Source & Notes */}
                {step === 3 && (
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Source & Notes</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Add lead source information and internal notes
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Source
                          </label>
                          <select
                            value={formData.contact_source}
                            onChange={(e) => handleFormChange("contact_source", e.target.value)}
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select source</option>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Event">Event</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Cold Call">Cold Call</option>
                            <option value="Email">Email</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lead Source
                          </label>
                          <input
                            type="text"
                            value={formData.lead_source}
                            onChange={(e) => handleFormChange("lead_source", e.target.value)}
                            className="w-full h-11 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter lead source"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tags
                        </label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => handleFormChange("tags", e.target.value)}
                            className="w-full h-11 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter tags separated by commas"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Separate multiple tags with commas (e.g., investor, cash buyer, vip)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            value={formData.notes}
                            onChange={(e) => handleFormChange("notes", e.target.value)}
                            rows={4}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder="Add any additional notes about this contact..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 1}
                    className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      step === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    Back
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/contacts")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Contact
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Documents Section - Now placed at the bottom */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded files and documents for this contact
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {documents.length} file{documents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No documents uploaded yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload PDF, Excel, Word or text files
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(doc.file_name || doc.filename)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.file_name || doc.filename || "Document"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size || 0)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.file_url || doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <div className="mt-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">Drag & drop files here or</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                      disabled={uploading}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Browse Files
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      Supports: PDF, Excel, Word, Text • Max 10MB
                    </p>
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