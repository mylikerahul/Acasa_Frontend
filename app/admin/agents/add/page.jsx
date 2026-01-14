"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";
import AdminNavbar from "../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddAgentPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    slug: "",
    sub_title: "",
    name: "",
    first_name: "",
    last_name: "",
    nationality: "",
    orn_number: "",
    orn: "",
    brn: "",
    mobile: "",
    designation: "",
    languages: "",
    aos: "",
    company: "",
    email: "",
    descriptions: "",
    seo_title: "",
    seo_keywork: "",
    seo_description: "",
    status: 1,
  });

  const showSuccess = (message) => {
    toast.success(message, { duration: 3000, position: "top-right" });
  };

  const showError = (message) => {
    toast.error(message, { duration: 4000, position: "top-right" });
  };

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();
      if (!token) {
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        handleAuthFailure();
        return;
      }

      try {
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
      } catch (e) {
        handleAuthFailure();
      }
    } catch (error) {
      handleAuthFailure();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    router.push("/admin/login");
  }, [router]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToastId = toast.loading("Logging out...");
    
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      
      toast.dismiss(logoutToastId);
      showSuccess("Logged out successfully");
    } catch (err) {
      toast.dismiss(logoutToastId);
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      router.push("/admin/login");
      setLogoutLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📸 Selected File:", file); // DEBUG

    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image must be less than 5MB");
      return;
    }

    setAvatar(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    showSuccess("Image selected");
  };

  const removeAvatar = () => {
    console.log("🗑️ Avatar Removed"); // DEBUG
    setAvatar(null);
    setAvatarPreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    const effectiveName = form.name.trim() || `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
    if (!effectiveName) {
        newErrors.first_name = "First name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("🚀 handleSubmit initiated"); // DEBUG

    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
      return;
    }

    if (!validateForm()) {
      console.warn("⚠️ Validation Failed", errors); // DEBUG
      showError("Please fill all required fields correctly.");
      return;
    }

    setLoading(true);
    const submitToastId = toast.loading("Creating agent...");

    try {
      const formData = new FormData();
      
      const effectiveName = form.name.trim() || `${form.first_name.trim()} ${form.last_name.trim()}`.trim();
      formData.append("name", effectiveName);

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'name') return;
        if ((key === 'first_name' || key === 'last_name') && form.name.trim()) return;

        if (value !== null && value !== undefined && String(value).trim() !== '') {
          formData.append(key, String(value).trim());
        }
      });
      
      if (avatar) {
        formData.append("image", avatar);
        console.log("🖼️ Avatar attached to FormData"); // DEBUG
      } else {
        console.log("⚠️ No Avatar attached"); // DEBUG
      }

      // --- DEBUGGING FORM DATA ---
      console.log("📋 FormData Entries to be sent:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]); 
      }
      // ---------------------------

      console.log(`📡 Sending request to: ${API_BASE_URL}/api/v1/agents`); // DEBUG

      const response = await fetch(
        `${API_BASE_URL}/api/v1/agents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // NOTE: Content-Type header must NOT be set manually for FormData
          },
          body: formData,
        }
      );

      console.log("📩 Response Status:", response.status); // DEBUG

      if (response.status === 401) {
        logoutAll();
        router.push("/admin/login");
        throw new Error("Session expired");
      }

      const responseData = await response.json();
      console.log("📦 Response Data:", responseData); // DEBUG

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
      }

      if (responseData.success) {
        toast.dismiss(submitToastId);
        showSuccess("Agent created successfully");
        router.push("/admin/agents");
      } else {
        throw new Error(responseData.message || "Failed to create agent.");
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error); // DEBUG
      toast.dismiss(submitToastId);
      showError(error.message || "Failed to create agent.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  return (
    <>
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Add Agent</h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/agents")}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                      <Upload className="w-4 h-4" />
                      {avatarPreview ? "Change Picture" : "Upload Picture"}
                    </span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or WEBP. Max size 5MB.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="agent@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mr. / Mrs. / Ms."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Title
                </label>
                <input
                  type="text"
                  value={form.sub_title}
                  onChange={(e) => handleChange("sub_title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expert Real Estate Agent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => handleChange("designation", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior Agent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="XYZ Real Estate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter nationality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <input
                  type="text"
                  value={form.languages}
                  onChange={(e) => handleChange("languages", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="English, Arabic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ORN Number
                </label>
                <input
                  type="text"
                  value={form.orn_number}
                  onChange={(e) => handleChange("orn_number", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ORN123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BRN
                </label>
                <input
                  type="text"
                  value={form.brn}
                  onChange={(e) => handleChange("brn", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="BRN789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Specialization (AOS)
                </label>
                <textarea
                  value={form.aos}
                  onChange={(e) => handleChange("aos", e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Residential sales, Commercial leasing..."
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descriptions
                </label>
                <textarea
                  value={form.descriptions}
                  onChange={(e) => handleChange("descriptions", e.target.value)}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the agent"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  SEO Information
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={form.seo_title}
                    onChange={(e) => handleChange("seo_title", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO title"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords
                  </label>
                  <input
                    type="text"
                    value={form.seo_keywork}
                    onChange={(e) => handleChange("seo_keywork", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Comma separated keywords"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={form.seo_description}
                    onChange={(e) => handleChange("seo_description", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO description"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}