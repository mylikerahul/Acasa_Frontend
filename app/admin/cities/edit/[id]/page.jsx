"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  X,
  Save,
  MapPin,
  Globe,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { Country, City } from "country-state-city";
import AdminNavbar from "../../../dashboard/header/DashboardNavbar";
import TextEditor from "../../../../components/common/SimpleTextEditor";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const COUNTRIES = [
  { id: 1, name: "United Arab Emirates", code: "AE" },
  { id: 2, name: "Saudi Arabia", code: "SA" },
  { id: 3, name: "Qatar", code: "QA" },
  { id: 4, name: "Bahrain", code: "BH" },
  { id: 5, name: "Kuwait", code: "KW" },
  { id: 6, name: "Oman", code: "OM" },
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const INITIAL_FORM_STATE = {
  country_id: 1,
  state_id: "",
  city_data_id: "",
  name: "",
  longitude: "",
  latitude: "",
  seo_title: "",
  seo_description: "",
  seo_keyword: "",
  description: "",
  status: "active",
};

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: { background: "#10B981", color: "#fff", fontWeight: "500" },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: { background: "#EF4444", color: "#fff", fontWeight: "500" },
  });
};

const showLoading = (message) => {
  return toast.loading(message, { position: "top-right" });
};

const showConfirm = (message, onConfirm) => {
  toast.custom(
    (t) => (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-md">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Confirm Action</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: "top-center",
    }
  );
};

// ==================== UTILITY FUNCTIONS ====================
const fastNavigate = (url) => {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

const validateFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const extensions = ALLOWED_IMAGE_TYPES.map((t) => t.split("/")[1]).join(", ");
    return { valid: false, error: `Invalid image type. Allowed: ${extensions}` };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    return { valid: false, error: `Image size must be less than ${sizeMB}MB` };
  }
  return { valid: true, error: null };
};

// ==================== MAIN COMPONENT ====================
export default function EditCityPage({ params }) {
  const { id } = params;
  
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Country-State-City
  const [countriesList, setCountriesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  // ==================== AUTH VERIFICATION ====================
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
          const payload = JSON.parse(atob(token.split(".")[1]));
          setAdmin({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role || "admin",
            userType: payload.userType,
          });
          setIsAuthenticated(true);
        } catch {
          logoutAll();
          fastNavigate("/admin/login");
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

  // Initialize countries
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountriesList(allCountries);
  }, []);

  // ==================== FETCH CITY DATA ====================
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const fetchCityData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}`, {
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            showError("City not found");
            fastNavigate("/admin/cities");
            return;
          }
          throw new Error("Failed to fetch city data");
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const city = data.data;
          setFormData({
            country_id: city.country_id || 1,
            state_id: city.state_id || "",
            city_data_id: city.city_data_id || "",
            name: city.name || "",
            longitude: city.longitude || "",
            latitude: city.latitude || "",
            seo_title: city.seo_title || "",
            seo_description: city.seo_description || "",
            seo_keyword: city.seo_keyword || "",
            description: city.description || "",
            status: city.status || "active",
          });

          if (city.media && city.media.length > 0) {
            setCurrentImage(city.media[0]);
          }
        } else {
          showError(data.message || "Failed to fetch city data");
          fastNavigate("/admin/cities");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        showError("Failed to load city data");
        fastNavigate("/admin/cities");
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [id, isAuthenticated]);

  // ==================== HANDLERS ====================
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      logoutAll();
      showSuccess("Logged out successfully");
      window.location.href = "/admin/login";
    } finally {
      setLogoutLoading(false);
    }
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCountryCodeChange = (code) => {
    setSelectedCountryCode(code);
    if (code) {
      const cities = City.getCitiesOfCountry(code);
      setCitiesList(cities || []);
    } else {
      setCitiesList([]);
    }
  };

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const clearImage = useCallback(() => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  const deleteCurrentImage = async () => {
    if (!currentImage) return;

    showConfirm("Are you sure you want to delete this image? This action cannot be undone.", async () => {
      setDeleteLoading(true);
      const deleteToast = showLoading("Deleting image...");

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}/media`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        });

        const data = await response.json();
        toast.dismiss(deleteToast);

        if (data.success) {
          showSuccess("Image deleted successfully");
          setCurrentImage(null);
        } else {
          showError(data.message || "Failed to delete image");
        }
      } catch (error) {
        toast.dismiss(deleteToast);
        console.error("Delete error:", error);
        showError("Failed to delete image");
      } finally {
        setDeleteLoading(false);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("City name is required");
      return;
    }

    if (!isAdminTokenValid()) {
      showError("Session expired. Please login again.");
      logoutAll();
      fastNavigate("/admin/login");
      return;
    }

    setSubmitLoading(true);
    const saveToast = showLoading("Updating city...");

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("country_id", formData.country_id.toString());
      formDataToSend.append("status", formData.status);

      if (formData.state_id) formDataToSend.append("state_id", formData.state_id);
      if (formData.city_data_id) formDataToSend.append("city_data_id", formData.city_data_id);
      if (formData.latitude) formDataToSend.append("latitude", formData.latitude);
      if (formData.longitude) formDataToSend.append("longitude", formData.longitude);
      if (formData.description) formDataToSend.append("description", formData.description);
      if (formData.seo_title) formDataToSend.append("seo_title", formData.seo_title);
      if (formData.seo_description) formDataToSend.append("seo_description", formData.seo_description);
      if (formData.seo_keyword) formDataToSend.append("seo_keyword", formData.seo_keyword);

      if (imageFile) {
        formDataToSend.append("img", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formDataToSend,
      });

      const data = await response.json();
      toast.dismiss(saveToast);

      if (data.success) {
        showSuccess("City updated successfully!");
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showError(data.message || "Failed to update city");
      }
    } catch (error) {
      toast.dismiss(saveToast);
      console.error("Update error:", error);
      showError("Failed to update city");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
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
        <div className="min-h-screen bg-gray-100 pt-4">
          <div className="p-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => fastNavigate("/admin/cities")}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit City</h1>
                <p className="text-sm text-gray-600">Loading city data...</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
        <div className="p-4 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fastNavigate("/admin/cities")}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit City</h1>
                <p className="text-sm text-gray-600">Update city information</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{id}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country_id}
                    onChange={(e) => handleFormChange("country_id", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Enter city name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Auto-fill from Library */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Or Select from City Library
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Country
                    </label>
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => handleCountryCodeChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Country</option>
                      {countriesList.map((country) => (
                        <option key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select City
                    </label>
                    <select
                      disabled={!selectedCountryCode}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleFormChange("name", e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select City</option>
                      {citiesList.map((city, index) => (
                        <option key={`${city.name}-${index}`} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => handleFormChange("latitude", e.target.value)}
                    placeholder="e.g., 25.2048"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => handleFormChange("longitude", e.target.value)}
                    placeholder="e.g., 55.2708"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Image
                </label>
                <div className="flex flex-col gap-4">
                  {currentImage && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentImage.url}
                          alt={currentImage.alt || formData.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Current Image</p>
                          <p className="text-xs text-gray-500">
                            {currentImage.file_name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={deleteCurrentImage}
                        disabled={deleteLoading}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {deleteLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Upload new image to replace the current one
                      </p>
                    </div>
                    {imagePreview && (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">SEO Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleFormChange("seo_title", e.target.value)}
                      maxLength={60}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.seo_title.length}/60</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.seo_description}
                      onChange={(e) => handleFormChange("seo_description", e.target.value)}
                      maxLength={160}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.seo_description.length}/160</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.seo_keyword}
                      onChange={(e) => handleFormChange("seo_keyword", e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <TextEditor
                  value={formData.description}
                  onChange={(value) => handleFormChange("description", value)}
                  placeholder="Write detailed description about the city..."
                  className="min-h-[200px] border border-gray-300 rounded-lg overflow-hidden"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => fastNavigate("/admin/cities")}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      showConfirm(
                        "Are you sure you want to delete this city? This action cannot be undone.",
                        async () => {
                          const deleteToast = showLoading("Deleting city...");
                          try {
                            const response = await fetch(`${API_BASE_URL}/api/v1/cities/${id}`, {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${getAdminToken()}`,
                              },
                            });

                            const data = await response.json();
                            toast.dismiss(deleteToast);

                            if (data.success) {
                              showSuccess("City deleted successfully");
                              setTimeout(() => {
                                fastNavigate("/admin/cities");
                              }, 1000);
                            } else {
                              showError(data.message || "Failed to delete city");
                            }
                          } catch (error) {
                            toast.dismiss(deleteToast);
                            console.error("Delete error:", error);
                            showError("Failed to delete city");
                          }
                        }
                      );
                    }}
                    className="px-5 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                    disabled={submitLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update City
                      </>
                    )}
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