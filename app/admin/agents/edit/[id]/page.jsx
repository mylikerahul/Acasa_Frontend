"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation"; // useParams to get ID
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth"; // Adjust path as needed
import AdminNavbar from "../../../dashboard/header/DashboardNavbar"; // Adjust path as needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams(); // Get ID from URL
  const agentId = params?.id;

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Form State
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading state for initial fetch
  
  // Image State
  const [avatar, setAvatar] = useState(null); // New file to upload
  const [avatarPreview, setAvatarPreview] = useState(null); // URL for preview
  const [existingImage, setExistingImage] = useState(null); // Filename from DB

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

  // ==================== HELPERS ====================
  const showSuccess = (msg) => toast.success(msg);
  const showError = (msg) => toast.error(msg);

  // ==================== AUTH CHECK ====================
  const checkAuth = useCallback(async () => {
    const token = getAdminToken();
    if (!token || !isAdminTokenValid()) {
      router.push("/admin/login");
      return;
    }
    // Simple decode for UI
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAdmin({ name: payload.name, role: payload.role });
      setIsAuthenticated(true);
    } catch (e) {
      router.push("/admin/login");
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== FETCH AGENT DATA ====================
  const fetchAgentDetails = useCallback(async () => {
    if (!agentId || !isAuthenticated) return;

    try {
      const token = getAdminToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch agent details");

      const data = await response.json();
      if (data.success && data.agent) {
        const ag = data.agent;
        
        // Populate Form
        setForm({
          title: ag.title || "",
          slug: ag.slug || "",
          sub_title: ag.sub_title || "",
          name: ag.name || "",
          first_name: ag.first_name || "",
          last_name: ag.last_name || "",
          nationality: ag.nationality || "",
          orn_number: ag.orn_number || "",
          orn: ag.orn || "",
          brn: ag.brn || "",
          mobile: ag.mobile || "",
          designation: ag.designation || "",
          languages: ag.languages || "",
          aos: ag.aos || "",
          company: ag.company || "",
          email: ag.email || "",
          descriptions: ag.descriptions || "",
          seo_title: ag.seo_title || "",
          seo_keywork: ag.seo_keywork || "",
          seo_description: ag.seo_description || "",
          status: ag.status !== undefined ? ag.status : 1,
        });

        // Handle Image
        if (ag.image) {
          setExistingImage(ag.image);
          // Assuming backend serves images at /uploads/agents/
          setAvatarPreview(`${API_BASE_URL}/uploads/agents/${ag.image}`);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      showError("Could not load agent data");
      router.push("/admin/agents");
    } finally {
      setFetching(false);
    }
  }, [agentId, isAuthenticated, router]);

  useEffect(() => {
    fetchAgentDetails();
  }, [fetchAgentDetails]);

  // ==================== HANDLERS ====================
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image must be less than 5MB");
      return;
    }

    setAvatar(file); // Set new file
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result); // Update preview
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.name.trim() && !form.first_name.trim()) newErrors.first_name = "Name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("🚀 Update initiated"); 

    if (!validateForm()) {
      showError("Please fix validation errors");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating agent...");

    try {
      const token = getAdminToken();
      const formData = new FormData();

      // Determine Name
      const effectiveName = form.name.trim() || `${form.first_name} ${form.last_name}`.trim();
      formData.append("name", effectiveName);

      // Append Fields
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'name') return; // Already handled
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Append Image ONLY if a new one is selected
      if (avatar) {
        formData.append("image", avatar);
        console.log("📸 New image attached");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/agents/${agentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok) throw new Error(resData.message || "Update failed");

      toast.dismiss(toastId);
      showSuccess("Agent updated successfully!");
      router.push("/admin/agents");

    } catch (error) {
      console.error("Update Error:", error);
      toast.dismiss(toastId);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================
  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={() => { logoutAll(); router.push("/admin/login"); }}
      />

      <div className="min-h-screen bg-gray-100 pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Edit Agent</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/agents")}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Agent"}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Image Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 border">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 m-auto mt-8" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                      <Upload className="w-4 h-4" /> Change Picture
                    </span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Basic Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded ${errors.first_name ? "border-red-300" : "border-gray-300"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded ${errors.email ? "border-red-300" : "border-gray-300"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                <input
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <input
                  value={form.designation}
                  onChange={(e) => handleChange("designation", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                <input
                  value={form.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ORN Number</label>
                <input
                  value={form.orn_number}
                  onChange={(e) => handleChange("orn_number", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BRN</label>
                <input
                  value={form.brn}
                  onChange={(e) => handleChange("brn", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

               {/* Status */}
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              {/* Text Areas */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Area of Specialization</label>
                <textarea
                  rows="3"
                  value={form.aos}
                  onChange={(e) => handleChange("aos", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows="5"
                  value={form.descriptions}
                  onChange={(e) => handleChange("descriptions", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}