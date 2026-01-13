"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiMapPin,
} from "react-icons/fi";
import { Loader2, Search, Info, Image as ImageIcon, Video } from "lucide-react";
import { getAdminToken } from "../../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { id: "details", label: "Details", icon: Info },
  { id: "seo", label: "SEO", icon: Search },
];

const SLIDER_TYPES = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
];

export default function EditCommunityPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params?.id;

  const [form, setForm] = useState({
    country: "",
    name: "",
    city: "",
    longitude: "",
    latitude: "",
    slider_type: "image",
    description: "",
    status: "active",
    seo_title: "",
    seo_description: "",
    focus_keyword: "",
  });

  const [locationImage, setLocationImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Dynamic data
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [communityNotFound, setCommunityNotFound] = useState(false);

  // API Helper
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
      throw new Error("Please login to continue");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      router.push("/admin/login");
      throw new Error("Session expired. Please login again.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }, [router]);

  // Fetch community by ID
  const fetchCommunity = useCallback(async () => {
    if (!communityId) {
      toast.error("Community ID is missing");
      router.push("/admin/communities");
      return;
    }

    try {
      setLoading(true);
      setCommunityNotFound(false);

      const data = await apiRequest(`/api/v1/communities/${communityId}`);

      if (data.success && data.data) {
        const community = data.data;

        setForm({
          country: community.country || "",
          name: community.name || community.community_name || "",
          city: community.city || "",
          longitude: community.longitude?.toString() || "",
          latitude: community.latitude?.toString() || "",
          slider_type: community.slider_type || "image",
          description: community.description || "",
          status: community.status || "active",
          seo_title: community.seo_title || "",
          seo_description: community.seo_description || "",
          focus_keyword: community.focus_keyword || "",
        });

        // Handle existing image
        if (community.image) {
          const imageUrl = community.image.startsWith("http")
            ? community.image
            : `${API_BASE_URL}${community.image.startsWith("/") ? "" : "/"}${community.image}`;
          setImagePreview(imageUrl);
          setExistingImage(community.image);
        }

        // Fetch cities for the country
        if (community.country) {
          fetchCities(community.country);
        }
      } else {
        setCommunityNotFound(true);
      }
    } catch (err) {
      console.error("Error fetching community:", err);
      if (err.message.includes("not found") || err.message.includes("404")) {
        setCommunityNotFound(true);
      } else {
        toast.error(err.message || "Failed to load community");
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, apiRequest, router]);

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    try {
      setLoadingCountries(true);
      const data = await apiRequest("/api/v1/communities/countries");

      if (data.success) {
        const countryList = data.data || data.countries || [];
        const transformed = countryList.map((country) => {
          if (typeof country === "string") return { value: country, label: country };
          if (country && typeof country === "object") {
            return {
              value: country.id || country.country || country.name || "",
              label: country.country || country.name || "",
            };
          }
          return null;
        }).filter((c) => c && c.value && c.label);
        setCountries(transformed);
      }
    } catch (err) {
      console.error("Error fetching countries:", err);
      // Fallback countries
      setCountries([
        { value: "United Arab Emirates", label: "United Arab Emirates" },
        { value: "Saudi Arabia", label: "Saudi Arabia" },
        { value: "Qatar", label: "Qatar" },
      ]);
    } finally {
      setLoadingCountries(false);
    }
  }, [apiRequest]);

  // Fetch cities by country
  const fetchCities = useCallback(async (country) => {
    if (!country) {
      setCities([]);
      return;
    }

    try {
      setLoadingCities(true);
      const data = await apiRequest(`/api/v1/communities/cities?country=${encodeURIComponent(country)}`);

      if (data.success) {
        const cityList = data.data || data.cities || [];
        const transformed = cityList.map((city) => {
          if (typeof city === "string") return { value: city, label: city };
          if (city && typeof city === "object") {
            return {
              value: city.id || city.city || city.name || "",
              label: city.city || city.name || "",
            };
          }
          return null;
        }).filter((c) => c && c.value && c.label);
        setCities(transformed);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, [apiRequest]);

  // Initial data fetch
  useEffect(() => {
    fetchCommunity();
    fetchCountries();
  }, [fetchCommunity, fetchCountries]);

  // Fetch cities when country changes
  useEffect(() => {
    if (form.country && !loading) {
      fetchCities(form.country);
    }
  }, [form.country, loading]);

  // Handle form change
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // Reset city when country changes
    if (field === "country") {
      setForm((prev) => ({ ...prev, city: "" }));
      setCities([]);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setLocationImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    toast.success("Image uploaded");
  };

  // Remove image
  const removeImage = () => {
    setLocationImage(null);
    setImagePreview(null);
    setExistingImage(null);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.country) newErrors.country = "Country is required";
    if (!form.name.trim()) newErrors.name = "Community name is required";
    if (!form.city) newErrors.city = "City is required";

    // Validate coordinates if provided
    if (form.longitude && isNaN(parseFloat(form.longitude))) {
      newErrors.longitude = "Invalid longitude format";
    }
    if (form.latitude && isNaN(parseFloat(form.latitude))) {
      newErrors.latitude = "Invalid latitude format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      setActiveTab("details");
      return;
    }

    if (!communityId) {
      toast.error("Community ID is missing");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating community...");

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Append all form fields
      formData.append("name", form.name.trim());
      formData.append("country", form.country);
      formData.append("city", form.city);
      formData.append("status", form.status);
      formData.append("slider_type", form.slider_type);

      if (form.longitude) formData.append("longitude", form.longitude);
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.description) formData.append("description", form.description);

      // SEO fields
      if (form.seo_title) formData.append("seo_title", form.seo_title);
      if (form.seo_description) formData.append("seo_description", form.seo_description);
      if (form.focus_keyword) formData.append("focus_keyword", form.focus_keyword);

      // Append new image if uploaded
      if (locationImage) {
        formData.append("image", locationImage);
      }

      // If image was removed, send flag to backend
      if (!imagePreview && existingImage) {
        formData.append("remove_image", "true");
      }

      const response = await apiRequest(`/api/v1/communities/${communityId}`, {
        method: "PUT",
        body: formData,
      });

      if (response.success) {
        toast.success("Community updated successfully!", { id: loadingToast });
        router.push("/admin/communities");
      } else {
        throw new Error(response.message || "Failed to update community");
      }
    } catch (err) {
      console.error("Update Error:", err);
      toast.error(err.message || "Failed to update community", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SEO Checklist
  const seoChecks = [
    {
      label: "Add Focus Keyword to the SEO title",
      passed: form.focus_keyword && form.seo_title.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Add Focus Keyword to your SEO Meta Description",
      passed: form.focus_keyword && form.seo_description.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Use Focus Keyword in the content",
      passed: form.focus_keyword && form.description.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: `Content is ${form.description.split(/\s+/).filter(Boolean).length} words long. Consider using at least 600 words.`,
      passed: form.description.split(/\s+/).filter(Boolean).length >= 600,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading community...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (communityNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900 mb-2">Community not found</p>
          <p className="text-sm text-gray-500 mb-4">
            The community you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push("/admin/communities")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go back to communities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/communities")}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Communities
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Community</h1>
              <p className="text-sm text-gray-500 mt-1">
                Update community information • ID: {communityId}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              Update Community
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Country & City */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Select Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                        disabled={loadingCountries}
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.country ? "border-red-300" : "border-gray-200"
                        } ${loadingCountries ? "bg-gray-100" : ""}`}
                      >
                        <option value="">
                          {loadingCountries ? "Loading..." : "Select Country"}
                        </option>
                        {countries.map((country, idx) => (
                          <option key={`${country.value}-${idx}`} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-xs text-red-600 mt-1">{errors.country}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Select City <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        disabled={!form.country || loadingCities}
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.city ? "border-red-300" : "border-gray-200"
                        } ${(!form.country || loadingCities) ? "bg-gray-100" : ""}`}
                      >
                        <option value="">
                          {loadingCities ? "Loading..." : !form.country ? "Select country first" : "Select City"}
                        </option>
                        {cities.map((city, idx) => (
                          <option key={`${city.value}-${idx}`} value={city.value}>
                            {city.label}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>

                  {/* Community Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Community Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                        errors.name ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="e.g. Downtown Dubai"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Longitude & Latitude */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <FiMapPin className="w-3.5 h-3.5 inline mr-1" />
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={form.longitude}
                        onChange={(e) => handleChange("longitude", e.target.value)}
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.longitude ? "border-red-300" : "border-gray-200"
                        }`}
                        placeholder="e.g. 55.2708"
                      />
                      {errors.longitude && (
                        <p className="text-xs text-red-600 mt-1">{errors.longitude}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <FiMapPin className="w-3.5 h-3.5 inline mr-1" />
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={form.latitude}
                        onChange={(e) => handleChange("latitude", e.target.value)}
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.latitude ? "border-red-300" : "border-gray-200"
                        }`}
                        placeholder="e.g. 25.2048"
                      />
                      {errors.latitude && (
                        <p className="text-xs text-red-600 mt-1">{errors.latitude}</p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex gap-3">
                      {[
                        { id: "active", label: "Active", color: "green" },
                        { id: "inactive", label: "Inactive", color: "gray" },
                      ].map((status) => (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() => handleChange("status", status.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                            form.status === status.id
                              ? status.id === "active"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-500 bg-gray-50 text-gray-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              status.id === "active" ? "bg-green-500" : "bg-gray-500"
                            }`}
                          ></span>
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slider Type
                    </label>
                    <div className="flex gap-3">
                      {SLIDER_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleChange("slider_type", type.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                              form.slider_type === type.id
                                ? "border-gray-900 bg-gray-50 text-gray-900"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Community Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Community Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                      placeholder="Write about the community..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.description.split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>
                </div>

                {/* Sidebar - Location Image */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Location Image</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Max File Size: 5MB<br />
                      Filetypes: JPG, PNG, WebP
                    </p>

                    {imagePreview ? (
                      <div className="relative">
                        <div className="w-full h-40 bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Location Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder-image.jpg";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                        {existingImage && !locationImage && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                            Current Image
                          </span>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <FiUpload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Upload Image</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG or WebP</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {imagePreview && (
                      <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <FiUpload className="w-3 h-3" />
                        Change Image
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* SEO Title */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">SEO Title</label>
                      <span className="text-xs text-gray-500">{form.seo_title.length} / 60</span>
                    </div>
                    <input
                      type="text"
                      value={form.seo_title}
                      onChange={(e) => handleChange("seo_title", e.target.value)}
                      maxLength={60}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="SEO title..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is what will appear in the first line when this shows up in the search results.
                    </p>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">SEO Description</label>
                      <span className="text-xs text-gray-500">{form.seo_description.length} / 160</span>
                    </div>
                    <textarea
                      value={form.seo_description}
                      onChange={(e) => handleChange("seo_description", e.target.value)}
                      maxLength={160}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                      placeholder="SEO description..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is what will appear as the description when this shows up in the search results.
                    </p>
                  </div>

                  {/* Focus Keyword */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">SEO Focus Keyword</label>
                      <span className="text-xs text-gray-500">{form.focus_keyword.length} / 100</span>
                    </div>
                    <input
                      type="text"
                      value={form.focus_keyword}
                      onChange={(e) => handleChange("focus_keyword", e.target.value)}
                      maxLength={100}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="e.g. dubai community"
                    />
                  </div>
                </div>

                {/* SEO Checklist */}
                <div className="bg-gray-50 rounded-lg p-4 h-fit">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">SEO Checklist</h3>
                  <div className="space-y-3">
                    {seoChecks.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {item.passed ? (
                          <FiCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${item.passed ? "text-green-700" : "text-yellow-700"}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <button
              onClick={() => router.push("/admin/communities")}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}