"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { getAdminToken } from "@/utils/auth";
import { Country, City } from "country-state-city";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { id: "details", label: "Details", icon: Info },
  { id: "seo", label: "SEO", icon: Search },
];

const SLIDER_TYPES = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
];

const STATUS_OPTIONS = [
  { id: "active", label: "Active", color: "green" },
  { id: "inactive", label: "Inactive", color: "gray" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIAL FORM STATE
// ═══════════════════════════════════════════════════════════════════════════════

const INITIAL_FORM_STATE = {
  country: "",
  name: "",
  slug: "",
  city: "",
  longitude: "",
  latitude: "",
  slider_type: "image",
  description: "",
  status: "active",
  seo_title: "",
  seo_description: "",
  focus_keyword: "",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function AddCommunityPage() {
  const router = useRouter();

  // Form State
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [locationImage, setLocationImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location Data
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Load countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    const formattedCountries = allCountries.map((country) => ({
      value: country.name,
      label: country.name,
      code: country.isoCode,
      flag: country.flag,
    }));
    setCountries(formattedCountries);
  }, []);

  // Load cities when country changes
  useEffect(() => {
    if (selectedCountryCode) {
      const allCities = City.getCitiesOfCountry(selectedCountryCode);
      const formattedCities = allCities
        ? allCities.map((city) => ({
            value: city.name,
            label: city.name,
            latitude: city.latitude,
            longitude: city.longitude,
          }))
        : [];
      setCities(formattedCities);
    } else {
      setCities([]);
    }
  }, [selectedCountryCode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // API HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  const apiRequest = async (endpoint, options = {}) => {
    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
      throw new Error("Please login to continue");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

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
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // Auto-generate slug when name changes
    if (field === "name") {
      const autoSlug = generateSlug(value);
      setForm((prev) => ({ ...prev, slug: autoSlug }));
    }

    // When country changes, update country code and reset city
    if (field === "country") {
      const country = countries.find((c) => c.value === value);
      setSelectedCountryCode(country?.code || "");
      setForm((prev) => ({ ...prev, city: "", latitude: "", longitude: "" }));
    }

    // When city changes, auto-fill coordinates
    if (field === "city") {
      const city = cities.find((c) => c.value === value);
      if (city?.latitude && city?.longitude) {
        setForm((prev) => ({
          ...prev,
          latitude: city.latitude,
          longitude: city.longitude,
        }));
      }
    }
  };

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
    reader.onload = (event) => setImagePreview(event.target?.result);
    reader.readAsDataURL(file);
    toast.success("Image uploaded");
  };

  const removeImage = () => {
    setLocationImage(null);
    setImagePreview(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  const validateForm = () => {
    const newErrors = {};

    if (!form.country) newErrors.country = "Country is required";
    if (!form.name.trim()) newErrors.name = "Community name is required";
    if (!form.slug.trim()) newErrors.slug = "Slug is required";
    if (!form.city) newErrors.city = "City is required";

    if (form.longitude && isNaN(parseFloat(form.longitude))) {
      newErrors.longitude = "Invalid longitude format";
    }
    if (form.latitude && isNaN(parseFloat(form.latitude))) {
      newErrors.latitude = "Invalid latitude format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      setActiveTab("details");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating community...");

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("slug", form.slug.trim());
      formData.append("country", form.country);
      formData.append("city", form.city);
      formData.append("status", form.status);
      formData.append("slider_type", form.slider_type);

      if (form.longitude) formData.append("longitude", form.longitude);
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.description) formData.append("description", form.description);

      if (form.seo_title) formData.append("seo_title", form.seo_title);
      if (form.seo_description) formData.append("seo_description", form.seo_description);
      if (form.focus_keyword) formData.append("focus_keyword", form.focus_keyword);

      if (locationImage) {
        formData.append("image", locationImage);
      }

      const response = await apiRequest("/api/v1/communities", {
        method: "POST",
        body: formData,
      });

      if (response.success) {
        toast.success("Community created successfully!", { id: loadingToast });
        router.push("/admin/communities");
      } else {
        throw new Error(response.message || "Failed to create community");
      }
    } catch (err) {
      console.error("Create Error:", err);
      toast.error(err.message || "Failed to create community", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SEO CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════

  const wordCount = form.description.split(/\s+/).filter(Boolean).length;

  const seoChecks = [
    {
      label: "Add Focus Keyword to the SEO title",
      passed:
        form.focus_keyword &&
        form.seo_title.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Add Focus Keyword to your SEO Meta Description",
      passed:
        form.focus_keyword &&
        form.seo_description.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: "Use Focus Keyword in the content",
      passed:
        form.focus_keyword &&
        form.description.toLowerCase().includes(form.focus_keyword.toLowerCase()),
    },
    {
      label: `Content is ${wordCount} words long. Consider using at least 600 words.`,
      passed: wordCount >= 600,
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

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
              <h1 className="text-2xl font-semibold text-gray-900">Add New Community</h1>
              <p className="text-sm text-gray-500 mt-1">Create a new community location</p>
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
              Save Community
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
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
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.country ? "border-red-300" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country.code} value={country.value}>
                            {country.flag} {country.label}
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
                        disabled={!form.country}
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.city ? "border-red-300" : "border-gray-200"
                        } ${!form.country ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      >
                        <option value="">
                          {!form.country ? "Select country first" : "Select City"}
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
                      {form.country && cities.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {cities.length} cities available
                        </p>
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

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                        errors.slug ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="e.g. downtown-dubai"
                    />
                    {errors.slug && (
                      <p className="text-xs text-red-600 mt-1">{errors.slug}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      URL-friendly version of the name. Auto-generated from community name.
                    </p>
                  </div>

                  {/* Coordinates */}
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
                      {STATUS_OPTIONS.map((status) => (
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
                          />
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
                        const TypeIcon = type.icon;
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
                            <TypeIcon className="w-4 h-4" />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
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
                    <p className="text-xs text-gray-500 mt-1">{wordCount} words</p>
                  </div>
                </div>

                {/* Sidebar - Image Upload */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Location Image</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Max File Size: 5MB
                      <br />
                      Filetypes: JPG, PNG, WebP
                    </p>

                    {imagePreview ? (
                      <div className="relative">
                        <div className="w-full h-40 bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Location Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
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
                      This is what will appear in the first line when this shows up in the search
                      results.
                    </p>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">SEO Description</label>
                      <span className="text-xs text-gray-500">
                        {form.seo_description.length} / 160
                      </span>
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
                      This is what will appear as the description when this shows up in the search
                      results.
                    </p>
                  </div>

                  {/* Focus Keyword */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        SEO Focus Keyword
                      </label>
                      <span className="text-xs text-gray-500">
                        {form.focus_keyword.length} / 100
                      </span>
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
                        <span
                          className={`text-xs ${
                            item.passed ? "text-green-700" : "text-yellow-700"
                          }`}
                        >
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
              Save Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default AddCommunityPage;