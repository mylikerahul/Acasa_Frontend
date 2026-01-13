"use client";

import { useState } from "react";
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

const TABS = [
  { id: "details", label: "Details", icon: Info },
  { id: "seo", label: "SEO", icon: Search },
];

const COUNTRIES = [
  { id: 1, name: "United Arab Emirates" },
  { id: 2, name: "Saudi Arabia" },
  { id: 3, name: "Qatar" },
];

const COMMUNITIES = [
  { id: 1, name: "Downtown Dubai" },
  { id: 2, name: "Dubai Marina" },
  { id: 3, name: "Palm Jumeirah" },
  { id: 4, name: "Business Bay" },
  { id: 5, name: "Jumeirah Lake Towers" },
];

const SLIDER_TYPES = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
];

export default function AddCommunityPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    country: "",
    community_name: "",
    longitude: "",
    latitude: "",
    slider_type: "image",
    description: "",
    // SEO
    seo_title: "",
    seo_description: "",
    focus_keyword: "",
  });

  const [locationImage, setLocationImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form change
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
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
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!form.country) newErrors.country = "Country is required";
    if (!form.community_name) newErrors.community_name = "Community name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success("Community created successfully");
      router.push("/admin/communities");
    }, 1000);
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
                  {/* Country & Community */}
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
                        <option value="">Select United Arab Emirates</option>
                        {COUNTRIES.map((country) => (
                          <option key={country.id} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-xs text-red-600 mt-1">{errors.country}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Community name <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.community_name}
                        onChange={(e) => handleChange("community_name", e.target.value)}
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                          errors.community_name ? "border-red-300" : "border-gray-200"
                        }`}
                      >
                        <option value="">Select</option>
                        {COMMUNITIES.map((community) => (
                          <option key={community.id} value={community.name}>
                            {community.name}
                          </option>
                        ))}
                      </select>
                      {errors.community_name && (
                        <p className="text-xs text-red-600 mt-1">{errors.community_name}</p>
                      )}
                    </div>
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
                        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="e.g. 55.2708"
                      />
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
                        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="e.g. 25.2048"
                      />
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
                      Filetypes: JPG, PNG
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
                        <span className="text-xs text-gray-400 mt-1">JPG or PNG</span>
                        <input
                          type="file"
                          accept="image/*"
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
                          accept="image/*"
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
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