"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Globe,
  Upload,
  X,
  UserPlus,
  MapPin,
  Calendar,
  Users as UsersIcon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddUserPage() {
  const router = useRouter();

  // ==================== AUTH STATE ====================
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile_phone: "",
    
    // Personal Information
    salutation: "",
    nationality: "",
    marital_status: "",
    gender: "",
    dob: "",
    languages: "",
    
    // Work Information
    department: "",
    treatment: "",
    length_of_service: "",
    
    // Contact Information
    contact_type: "",
    about: "",
    
    // Address Information
    city: "",
    country: "0",
    fax: "",
    
    // Social Media
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    website: "",
    
    // SEO
    category: "",
    seo_title: "",
    seo_keywork: "",
    seo_description: "",
    
    // Account Settings
    password: "",
    confirm_password: "",
    status: 1,
    usertype: "user",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // ==================== AUTHENTICATION ====================
  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();
      if (sessionType !== "admin") {
        toast.error("Please login as admin");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        toast.error("Session expired");
        handleAuthFailure();
        return;
      }

      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.userType !== "admin") {
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
    } catch (error) {
      console.error("Auth error:", error);
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    logoutAll();
    window.location.href = "/admin/login";
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== FORM HANDLERS ====================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Please upload JPEG, PNG, or WebP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Max 5MB allowed");
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  // ==================== VALIDATION ====================
  const validateForm = () => {
    const newErrors = {};

    // Full Name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password
    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm password";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    // Phone validation (optional but validate if provided)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    // Email validation for social links
    if (formData.facebook && !/^https?:\/\/.+/.test(formData.facebook)) {
      if (formData.facebook.trim()) {
        newErrors.facebook = "Enter valid URL (e.g., https://facebook.com/...)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== SUBMIT HANDLER ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix form errors");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Creating user...");

    try {
      const token = getAdminToken();

      // Use FormData
      const submitData = new FormData();

      // Required fields
      submitData.append("full_name", formData.full_name.trim());
      submitData.append("name", formData.full_name.trim());
      submitData.append("email", formData.email.trim().toLowerCase());
      submitData.append("password", formData.password);

      // Optional fields - only append if have value
      const optionalFields = [
        "first_name", "last_name", "phone", "mobile_phone", "salutation",
        "nationality", "marital_status", "gender", "dob", "languages",
        "department", "treatment", "length_of_service", "contact_type",
        "about", "city", "country", "fax", "facebook", "twitter",
        "linkedin", "instagram", "website", "category", "seo_title",
        "seo_keywork", "seo_description"
      ];

      for (const field of optionalFields) {
        const value = formData[field];
        if (value && value.trim && value.trim() !== "") {
          submitData.append(field, value.trim());
        } else if (value && !value.trim) {
          submitData.append(field, value);
        }
      }

      // Status and type
      submitData.append("status", formData.status.toString());
      submitData.append("usertype", formData.usertype);
      submitData.append("public_permision", "1");

      // Avatar
      if (avatar) {
        submitData.append("image", avatar);
      }

      // Debug
      console.log("FormData contents:");
      for (let [key, value] of submitData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        toast.success("User created successfully!");
        setTimeout(() => router.push("/admin/users"), 1500);
      } else {
        throw new Error(data.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.dismiss(loadingToast);
      toast.error(err.message || "Error creating user");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== LOADING ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Verifying...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  return (
    <>
      <Toaster position="top-right" />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-3">
          {/* Header */}
          <div className="bg-white border border-gray-300 rounded-t p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/admin/users")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgb(39,113,183)" }}
                  >
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                      Add New User
                    </h1>
                    <p className="text-sm text-gray-500">
                      Create a new user account
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => router.push("/admin/users")}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ backgroundColor: "rgb(39,113,183)" }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div
            className="border border-gray-300 border-t-0 rounded-b"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            <form onSubmit={handleSubmit} className="p-3 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                  {/* Avatar Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Profile Photo
                    </h3>
                    <div className="flex flex-col items-center">
                      {avatarPreview ? (
                        <div className="relative">
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                        </div>
                      )}
                      <label className="mt-4 cursor-pointer">
                        <div
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded hover:opacity-90 transition-colors"
                          style={{ backgroundColor: "rgb(39,113,183)" }}
                        >
                          <Upload className="w-4 h-4" /> Upload Photo
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        JPG, PNG, WebP. Max 5MB
                      </p>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Account Status
                    </h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.status === 1}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, status: 1 }))
                          }
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.status === 0}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, status: 0 }))
                          }
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  {/* User Type Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      User Type
                    </h3>
                    <select
                      name="usertype"
                      value={formData.usertype}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Select appropriate user role
                    </p>
                  </div>

                  {/* Quick Info Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UsersIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-1">
                          User Guidelines
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Required: Name, Email, Password</li>
                          <li>• Password min 6 characters</li>
                          <li>• All other fields optional</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Salutation */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salutation
                        </label>
                        <select
                          name="salutation"
                          value={formData.salutation}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                        </select>
                      </div>

                      {/* Full Name */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.full_name
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                        {errors.full_name && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.full_name}
                          </p>
                        )}
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="Enter first name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder="Enter last name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.email
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.phone
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* Mobile */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="mobile_phone"
                            value={formData.mobile_phone}
                            onChange={handleChange}
                            placeholder="Enter mobile"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Nationality */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nationality
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            placeholder="Enter nationality"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Marital Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marital Status
                        </label>
                        <select
                          name="marital_status"
                          value={formData.marital_status}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Languages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Languages
                        </label>
                        <input
                          type="text"
                          name="languages"
                          value={formData.languages}
                          onChange={handleChange}
                          placeholder="e.g., English, Spanish"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                      Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min 6 characters"
                            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.password
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.confirm_password
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirm_password && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.confirm_password}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Work Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            placeholder="Enter department"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Treatment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Treatment
                        </label>
                        <input
                          type="text"
                          name="treatment"
                          value={formData.treatment}
                          onChange={handleChange}
                          placeholder="Enter treatment"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Length of Service */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Length of Service
                        </label>
                        <input
                          type="text"
                          name="length_of_service"
                          value={formData.length_of_service}
                          onChange={handleChange}
                          placeholder="e.g., 5 years"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* City */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Country Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country Code
                        </label>
                        <input
                          type="number"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="e.g., 91 for India"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Fax */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fax
                        </label>
                        <input
                          type="text"
                          name="fax"
                          value={formData.fax}
                          onChange={handleChange}
                          placeholder="Enter fax number"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Contact Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Type
                        </label>
                        <select
                          name="contact_type"
                          value={formData.contact_type}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b">
                      About
                    </h3>
                    <textarea
                      name="about"
                      value={formData.about}
                      onChange={handleChange}
                      placeholder="Brief description about the user..."
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Social Media (Collapsible) */}
                  <details className="bg-white rounded-lg border border-gray-200">
                    <summary className="px-4 sm:px-6 py-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50">
                      Social Media Links (Optional)
                    </summary>
                    <div className="px-4 sm:px-6 pb-6 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Facebook
                          </label>
                          <input
                            type="url"
                            name="facebook"
                            value={formData.facebook}
                            onChange={handleChange}
                            placeholder="https://facebook.com/..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Twitter
                          </label>
                          <input
                            type="url"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleChange}
                            placeholder="https://twitter.com/..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instagram
                          </label>
                          <input
                            type="url"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            placeholder="https://instagram.com/..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* SEO (Collapsible) */}
                  <details className="bg-white rounded-lg border border-gray-200">
                    <summary className="px-4 sm:px-6 py-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50">
                      SEO Settings (Optional)
                    </summary>
                    <div className="px-4 sm:px-6 pb-6 pt-2">
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="User category"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SEO Title
                          </label>
                          <input
                            type="text"
                            name="seo_title"
                            value={formData.seo_title}
                            onChange={handleChange}
                            placeholder="SEO meta title"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SEO Keywords
                          </label>
                          <input
                            type="text"
                            name="seo_keywork"
                            value={formData.seo_keywork}
                            onChange={handleChange}
                            placeholder="keyword1, keyword2, keyword3"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SEO Description
                          </label>
                          <textarea
                            name="seo_description"
                            value={formData.seo_description}
                            onChange={handleChange}
                            placeholder="SEO meta description"
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Mobile Submit */}
                  <div className="flex justify-end gap-3 lg:hidden">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/users")}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ backgroundColor: "rgb(39,113,183)" }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {submitting ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}