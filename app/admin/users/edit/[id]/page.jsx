"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Edit3,
  Calendar,
  Shield,
  Trash2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Page State
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    mobile_phone: "",
    nationality: "",
    job_title: "",
    department: "",
    company: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    status: 1,
    usertype: "user",
  });

  // Password State (separate for optional update)
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirm_password: "",
  });
  const [changePassword, setChangePassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [existingAvatar, setExistingAvatar] = useState(null);
  const [removeExistingAvatar, setRemoveExistingAvatar] = useState(false);

  // Original Data for comparison
  const [originalData, setOriginalData] = useState(null);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==================== AUTHENTICATION ====================
  const verifyToken = async (token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/admin/verify-token`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Token verification failed:", error);
      throw error;
    }
  };

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
        toast.error("Please login as admin to access this page");
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        toast.error("Please login to access this page");
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        toast.error("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        if (verifyError.response?.status === 401) {
          toast.error("Invalid or expired token. Please login again.");
          handleAuthFailure();
          return;
        }
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.userType !== "admin") {
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
          avatar: null,
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        console.error("Token decode error:", e);
        toast.error("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      toast.error("Authentication failed. Please login again.");
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    const logoutToast = toast.loading("Logging out...");

    try {
      const token = getAdminToken();

      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      toast.dismiss(logoutToast);
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      toast.dismiss(logoutToast);
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      window.location.href = "/admin/login";
      setLogoutLoading(false);
    }
  }, []);

  // ==================== FETCH USER DATA ====================
  const fetchUser = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const token = getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/admin/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();

      if (data.success && data.user) {
        const user = data.user;

        const userData = {
          full_name: user.full_name || user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          mobile_phone: user.mobile_phone || "",
          nationality: user.nationality || "",
          job_title: user.job_title || user.designation || "",
          department: user.department || "",
          company: user.company || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          postal_code: user.postal_code || "",
          status: user.status ?? 1,
          usertype: user.usertype || "user",
        };

        setFormData(userData);
        setOriginalData({ ...userData, created_at: user.created_at, updated_at: user.updated_at });

        // Handle existing avatar
        if (user.image || user.avatar) {
          const avatarUrl = user.image || user.avatar;
          setExistingAvatar(
            avatarUrl.startsWith("http")
              ? avatarUrl
              : `${API_BASE_URL}${avatarUrl}`
          );
        }
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchUser();
    }
  }, [isAuthenticated, userId, fetchUser]);

  // ==================== FORM HANDLERS ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setAvatar(file);
      setRemoveExistingAvatar(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    if (existingAvatar) {
      setRemoveExistingAvatar(true);
    }
  };

  const restoreAvatar = () => {
    setRemoveExistingAvatar(false);
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
      newErrors.email = "Please enter a valid email address";
    }

    // Phone (optional but validate format if provided)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Password validation (only if changing password)
    if (changePassword) {
      if (!passwordData.password) {
        newErrors.password = "Password is required";
      } else if (passwordData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (!passwordData.confirm_password) {
        newErrors.confirm_password = "Please confirm password";
      } else if (passwordData.password !== passwordData.confirm_password) {
        newErrors.confirm_password = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== SUBMIT HANDLER ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Updating user...");

    try {
      const token = getAdminToken();

      // Create FormData for file upload
      const submitData = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "" && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // Append password if changing
      if (changePassword && passwordData.password) {
        submitData.append("password", passwordData.password);
      }

      // Append avatar if exists
      if (avatar) {
        submitData.append("image", avatar);
      }

      // Handle avatar removal
      if (removeExistingAvatar && !avatar) {
        submitData.append("remove_image", "true");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/admin/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        }
      );

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        toast.success("User updated successfully!");
        setTimeout(() => {
          router.push("/admin/users");
        }, 1500);
      } else {
        throw new Error(data.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.dismiss(loadingToast);
      toast.error(err.message || "Error updating user");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== DELETE HANDLER ====================
  const handleDelete = async () => {
    setDeleteLoading(true);
    const deleteToast = toast.loading("Deleting user...");

    try {
      const token = getAdminToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/admin/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      toast.dismiss(deleteToast);

      if (response.ok && data.success) {
        toast.success("User deleted successfully!");
        setTimeout(() => {
          router.push("/admin/users");
        }, 1500);
      } else {
        throw new Error(data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.dismiss(deleteToast);
      toast.error(err.message || "Error deleting user");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  // ==================== LOADING USER DATA ====================
  if (loading) {
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
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-gray-600">Loading user data...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ==================== NOT FOUND ====================
  if (notFound) {
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
            <div className="bg-white border border-gray-300 rounded p-8">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  User Not Found
                </h2>
                <p className="text-gray-600 mb-6">
                  The user you are looking for does not exist or has been deleted.
                </p>
                <button
                  onClick={() => router.push("/admin/users")}
                  style={{ backgroundColor: "rgb(39,113,183)" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded hover:opacity-90"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Users
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10B981",
            },
          },
          error: {
            duration: 4000,
            style: {
              background: "#EF4444",
            },
          },
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Delete User
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {formData.full_name}
                  </p>
                  <p className="text-sm text-gray-500">{formData.email}</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? This action cannot be
                undone and all associated data will be permanently removed.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between">
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
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-800">
                      Edit User
                    </h1>
                    <p className="text-sm text-gray-500">
                      ID: {userId} • Update user information
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => router.push("/admin/users")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ backgroundColor: "rgb(39,113,183)" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div
            className="border border-gray-300 border-t-0 rounded-b"
            style={{ backgroundColor: "rgb(236,237,238)" }}
          >
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Avatar & Meta */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Avatar Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Profile Photo
                    </h3>

                    <div className="flex flex-col items-center">
                      {avatarPreview ? (
                        <div className="relative">
                          <img
                            src={avatarPreview}
                            alt="Avatar Preview"
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : existingAvatar && !removeExistingAvatar ? (
                        <div className="relative">
                          <img
                            src={existingAvatar}
                            alt="Current Avatar"
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : removeExistingAvatar ? (
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-dashed border-gray-300">
                            <User className="w-16 h-16 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={restoreAvatar}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                          >
                            Restore original
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                          {getInitials(formData.full_name)}
                        </div>
                      )}

                      <label className="mt-4 cursor-pointer">
                        <div
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded hover:opacity-90 transition-colors"
                          style={{ backgroundColor: "rgb(39,113,183)" }}
                        >
                          <Upload className="w-4 h-4" />
                          {existingAvatar ? "Change Photo" : "Upload Photo"}
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-2 text-xs text-gray-500 text-center">
                        JPG, PNG or WebP. Max 5MB.
                      </p>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Account Status
                    </h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value={1}
                          checked={formData.status === 1 || formData.status === "1"}
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
                          name="status"
                          value={0}
                          checked={formData.status === 0 || formData.status === "0"}
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
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      User Type
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Role Assignment</span>
                    </div>
                    <select
                      name="usertype"
                      value={formData.usertype}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Meta Info Card */}
                  {originalData && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Account Info
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-700">
                            {formatDate(originalData.created_at)}
                          </span>
                        </div>
                        {originalData.updated_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Updated:</span>
                            <span className="text-gray-700">
                              {formatDate(originalData.updated_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Form Fields */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {/* Basic Information */}
                    <h3 className="text-lg font-medium text-gray-800 mb-6 pb-2 border-b border-gray-200">
                      Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email address"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

                      {/* Mobile Phone */}
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
                            placeholder="Enter mobile phone"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Section */}
                    <h3 className="text-lg font-medium text-gray-800 mt-8 mb-4 pb-2 border-b border-gray-200">
                      Security
                    </h3>

                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={changePassword}
                          onChange={(e) => {
                            setChangePassword(e.target.checked);
                            if (!e.target.checked) {
                              setPasswordData({ password: "", confirm_password: "" });
                              setErrors((prev) => ({
                                ...prev,
                                password: "",
                                confirm_password: "",
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Change password
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Check this box to set a new password for this user
                      </p>
                    </div>

                    {changePassword && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={passwordData.password}
                              onChange={handlePasswordChange}
                              placeholder="Enter new password"
                              className={`w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                            Confirm Password{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirm_password"
                              value={passwordData.confirm_password}
                              onChange={handlePasswordChange}
                              placeholder="Confirm new password"
                              className={`w-full pl-10 pr-12 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    )}

                    {/* Work Information */}
                    <h3 className="text-lg font-medium text-gray-800 mt-8 mb-6 pb-2 border-b border-gray-200">
                      Work Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="job_title"
                            value={formData.job_title}
                            onChange={handleChange}
                            placeholder="Enter job title"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          placeholder="Enter department"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Company */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <h3 className="text-lg font-medium text-gray-800 mt-8 mb-6 pb-2 border-b border-gray-200">
                      Address Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter address"
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State / Province
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Enter state/province"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Enter country"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Postal Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleChange}
                          placeholder="Enter postal code"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons (Mobile) */}
                  <div className="mt-6 flex items-center justify-between lg:hidden">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push("/admin/users")}
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{ backgroundColor: "rgb(39,113,183)" }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {submitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
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