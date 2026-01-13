"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Loader2,
  Upload,
  Trash2,
  Copy,
  RotateCcw,
  Save,
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Video,
  Target,
  Image as ImageIcon,
  FileText,
  Check,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Globe,
  Home,
  Layers,
  Users,
  X,
  Plus,
  Eye,
  Settings,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Info,
  Heart,
  Palette,
  Flag,
  Type,
  Hash,
  AlignLeft,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../../utils/auth";

const SimpleTextEditor = dynamic(
  () => import("../../../components/common/SimpleTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />
    ),
  }
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "details", label: "Details", icon: FileText, description: "Basic info" },
  { id: "media", label: "Media", icon: ImageIcon, description: "Images" },
  { id: "seo", label: "SEO", icon: Target, description: "Optimization" },
];

const INITIAL_FORM = {
  name: "",
  title: "",
  country_id: "",
  developer_id: "",
  subtitle: "",
  description: "",
  status: 0,
  featured: 0,
  seo_title: "",
  seo_slug: "",
  seo_description: "",
  seo_focus_keyword: "",
};

// Mock data for dropdowns - replace with actual API data
const COUNTRIES = [
  { value: "", label: "Select Country" },
  { value: "1", label: "United Arab Emirates" },
  { value: "2", label: "Saudi Arabia" },
  { value: "3", label: "Qatar" },
  { value: "4", label: "Bahrain" },
  { value: "5", label: "Kuwait" },
  { value: "6", label: "Oman" },
];

const DEVELOPERS = [
  { value: "", label: "Select Developer" },
  { value: "1", label: "Emaar Properties" },
  { value: "2", label: "DAMAC Properties" },
  { value: "3", label: "Nakheel" },
  { value: "4", label: "Meraas" },
  { value: "5", label: "Dubai Properties" },
  { value: "6", label: "Sobha Realty" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const validateImageFile = (file) => {
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPG, PNG, GIF, WebP allowed");
  if (file.size > MAX_SIZE) throw new Error("Max 5MB per image");
  return true;
};

const getImageUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) return URL.createObjectURL(image);
  return image;
};

const countWords = (text) => {
  if (!text) return 0;
  // Strip HTML tags for word count
  const strippedText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!strippedText) return 0;
  return strippedText.split(/\s+/).length;
};

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SectionCard = ({ icon: Icon, title, subtitle, children, badge }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-md">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {badge && (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const FormInput = ({ label, required, icon: Icon, hint, error, className = "", ...props }) => (
  <div className={className}>
    <label className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {hint && (
        <span className="text-xs text-gray-400">{hint}</span>
      )}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <input
        className={`w-full h-12 ${Icon ? "pl-12" : "pl-4"} pr-4 border rounded-xl text-sm 
          outline-none transition-all duration-200 placeholder:text-gray-400
          ${error 
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
            : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          }`}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const FormSelect = ({ label, required, options, icon: Icon, hint, error, className = "", ...props }) => (
  <div className={className}>
    <label className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {hint && (
        <span className="text-xs text-gray-400">{hint}</span>
      )}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <select
        className={`w-full h-12 ${Icon ? "pl-12" : "pl-4"} pr-10 border rounded-xl text-sm 
          outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 
          transition-all duration-200 appearance-none bg-white cursor-pointer
          ${error 
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
            : "border-gray-200"
          }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.flag ? `${opt.flag} ${opt.label}` : opt.label || opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const FormTextarea = ({ label, maxLength, value, hint, className = "", ...props }) => (
  <div className={className}>
    <label className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
    <textarea
      value={value}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm 
        outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 
        transition-all duration-200 placeholder:text-gray-400 resize-none"
      {...props}
    />
    {maxLength && (
      <div className="mt-2 flex items-center justify-between">
        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden mr-3">
          <div
            className={`h-full rounded-full transition-all ${
              (value?.length || 0) > maxLength * 0.9
                ? "bg-red-500"
                : (value?.length || 0) > maxLength * 0.7
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(((value?.length || 0) / maxLength) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          (value?.length || 0) > maxLength ? "text-red-500" : "text-gray-400"
        }`}>
          {value?.length || 0}/{maxLength}
        </span>
      </div>
    )}
  </div>
);

const ImageUploadCard = ({ image, onUpload, onRemove, label, recommended }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    {image ? (
      <div className="relative group">
        <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
          <img
            src={getImageUrl(image)}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRemove}
            className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <label className="p-3 bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shadow-lg">
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <Upload className="w-5 h-5" />
          </label>
        </div>
      </div>
    ) : (
      <label className="block cursor-pointer">
        <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        <div className="aspect-video border-2 border-dashed border-gray-200 rounded-xl 
          hover:border-gray-400 hover:bg-gray-50 transition-all duration-200
          flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
            <Upload className="w-7 h-7 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Click to upload</p>
            <p className="text-xs text-gray-500 mt-1">{recommended}</p>
          </div>
        </div>
      </label>
    )}
  </div>
);

const SEOChecklistItem = ({ checked, label }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
    checked ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
  }`}>
    {checked ? (
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
    )}
    <span className={`text-sm ${checked ? "text-green-700" : "text-red-700"}`}>
      {label}
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AddLifestylePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [errors, setErrors] = useState({});

  // SEO Analysis
  const seoAnalysis = useMemo(() => {
    const focusKeyword = form.seo_focus_keyword?.toLowerCase().trim() || "";
    const seoTitle = form.seo_title?.toLowerCase() || "";
    const seoDescription = form.seo_description?.toLowerCase() || "";
    const seoSlug = form.seo_slug?.toLowerCase() || "";
    const description = form.description?.toLowerCase() || "";
    const wordCount = countWords(form.description);

    return {
      keywordInTitle: focusKeyword && seoTitle.includes(focusKeyword),
      keywordInDescription: focusKeyword && seoDescription.includes(focusKeyword),
      keywordInUrl: focusKeyword && seoSlug.includes(focusKeyword.replace(/\s+/g, '-')),
      keywordInContent: focusKeyword && description.includes(focusKeyword),
      contentLength: wordCount,
      isContentLongEnough: wordCount >= 600,
    };
  }, [form.seo_focus_keyword, form.seo_title, form.seo_description, form.seo_slug, form.description]);

  // Handlers
  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !prev.seo_slug) {
        updated.seo_slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
      }
      return updated;
    });
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleMainImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      validateImageFile(file);
      setMainImage(file);
      toast.success("Main image selected!");
    } catch (err) {
      toast.error(err.message);
    }
    e.target.value = "";
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      try {
        validateImageFile(file);
        return true;
      } catch {
        return false;
      }
    });

    if (galleryImages.length + validFiles.length > 10) {
      toast.error("Maximum 10 gallery images");
      return;
    }

    setGalleryImages((prev) => [...prev, ...validFiles]);
    toast.success(`${validFiles.length} image(s) added!`);
    e.target.value = "";
  };

  const removeMainImage = () => {
    setMainImage(null);
    toast.success("Image removed");
  };

  const removeGalleryImage = (index) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const generateSeoUrl = () => {
    if (!form.name.trim()) {
      toast.error("Enter name first");
      return;
    }
    const slug = form.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, seo_slug: slug }));
    toast.success("SEO URL generated!");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = "Name is required";
    if (!form.title?.trim()) newErrors.title = "Title is required";
    if (!form.country_id) newErrors.country_id = "Country is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const token = getAdminToken();

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value) || typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      if (mainImage) formData.append("main_image", mainImage);
      galleryImages.forEach((img) => formData.append("images", img));

      const response = await fetch(`${API_BASE_URL}/api/v1/lifestyles`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to create lifestyle");

      if (result.success) {
        toast.success("Lifestyle created successfully!");
        setTimeout(() => router.push("/admin/lifestyles"), 1500);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    if (confirm("Reset all form data?")) {
      setForm(INITIAL_FORM);
      setMainImage(null);
      setGalleryImages([]);
      setActiveTab("details");
      setErrors({});
      toast.success("Form reset");
    }
  };

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const progress = Math.round(((currentTabIndex + 1) / TABS.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden pb-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-gray-200/30 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-14 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-medium">Back to Lifestyles</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1
                  className="text-2xl lg:text-3xl font-bold text-gray-800"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  Add New <span className="italic text-pink-600">Lifestyle</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Create a new lifestyle entry</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">Step {currentTabIndex + 1} of {TABS.length}</p>
                <p className="text-xs text-gray-500">{TABS[currentTabIndex]?.label}</p>
              </div>
              <div className="w-20 h-20 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#ec4899"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${progress * 2.26} 226`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-800">{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-2 mb-6 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPast = idx < currentTabIndex;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg"
                      : isPast
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isActive
                        ? "bg-white/20"
                        : isPast
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {isPast && !isActive ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Icon size={14} className={isActive ? "text-white" : "text-gray-500"} />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{tab.label}</p>
                    <p className={`text-[10px] ${isActive ? "text-white/70" : "text-gray-400"}`}>
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Details Tab */}
              {activeTab === "details" && (
                <SectionCard
                  icon={Palette}
                  title="Lifestyle Details"
                  subtitle="Basic information about the lifestyle"
                  badge="Required"
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormInput
                        label="Name of the Lifestyle"
                        required
                        icon={Heart}
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Enter lifestyle name"
                        error={errors.name}
                      />

                      <FormInput
                        label="Title (H1)"
                        required
                        icon={Type}
                        value={form.title}
                        onChange={handleChange("title")}
                        placeholder="Enter main title"
                        error={errors.title}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormSelect
                        label="Country"
                        required
                        icon={Flag}
                        value={form.country_id}
                        onChange={handleChange("country_id")}
                        options={COUNTRIES}
                        error={errors.country_id}
                        hint="Max 250"
                      />

                      <FormSelect
                        label="Developer"
                        icon={Building2}
                        value={form.developer_id}
                        onChange={handleChange("developer_id")}
                        options={DEVELOPERS}
                        hint="Max 30"
                      />
                    </div>

                    <FormInput
                      label="Subtitle"
                      icon={AlignLeft}
                      value={form.subtitle}
                      onChange={handleChange("subtitle")}
                      placeholder="Enter a catchy subtitle"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      {typeof window !== "undefined" && (
                        <SimpleTextEditor
                          value={form.description}
                          onChange={(value) =>
                            setForm((prev) => ({ ...prev, description: value }))
                          }
                          placeholder="Write a detailed description about this lifestyle..."
                          rows={8}
                        />
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          Write compelling content that describes the lifestyle
                        </p>
                        <span className={`text-xs font-medium ${
                          seoAnalysis.isContentLongEnough ? "text-green-600" : "text-amber-600"
                        }`}>
                          {seoAnalysis.contentLength} words
                        </span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <SectionCard
                  icon={ImageIcon}
                  title="Lifestyle Images"
                  subtitle="Upload main and gallery images"
                >
                  {/* Main Image */}
                  <div className="mb-8">
                    <ImageUploadCard
                      image={mainImage}
                      onUpload={handleMainImageUpload}
                      onRemove={removeMainImage}
                      label="Main Image (Featured)"
                      recommended="1200×800px recommended, Max 5MB"
                    />
                  </div>

                  {/* Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Gallery Images
                      </label>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {galleryImages.length}/10 images
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {galleryImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full">
                            {index + 1}
                          </div>
                        </div>
                      ))}

                      {galleryImages.length < 10 && (
                        <label className="aspect-square cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryUpload}
                            className="hidden"
                          />
                          <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 flex flex-col items-center justify-center transition-all">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-500">Add Image</span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Upload Tips */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Image Tips</p>
                          <ul className="text-xs space-y-1 text-blue-600">
                            <li>• Use high-quality images (1200x800px minimum)</li>
                            <li>• Max file size: 5MB per image</li>
                            <li>• Supported formats: JPG, PNG, WebP</li>
                            <li>• First image will be used as the featured image</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* SEO Tab */}
              {activeTab === "seo" && (
                <>
                  <SectionCard
                    icon={Target}
                    title="SEO Preview"
                    subtitle="Optimize for search engines"
                  >
                    <div className="space-y-6">
                      {/* SEO Title */}
                      <div>
                        <FormInput
                          label="Title"
                          value={form.seo_title}
                          onChange={handleChange("seo_title")}
                          placeholder="Optimized title for search engines"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            This is what will appear in the first line when this shows up in the search results.
                          </p>
                          <span className={`text-xs font-medium ${
                            (form.seo_title?.length || 0) > 60 ? "text-red-500" : "text-gray-400"
                          }`}>
                            {form.seo_title?.length || 0} / 60
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (form.seo_title?.length || 0) > 60
                                ? "bg-red-500"
                                : (form.seo_title?.length || 0) > 50
                                ? "bg-green-500"
                                : "bg-amber-500"
                            }`}
                            style={{
                              width: `${Math.min(((form.seo_title?.length || 0) / 60) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* SEO Description */}
                      <div>
                        <FormTextarea
                          label="Description"
                          value={form.seo_description}
                          onChange={handleChange("seo_description")}
                          placeholder="Compelling description for search results"
                          rows={3}
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          This is what will appear as the description when this shows up in the search results.
                        </p>
                      </div>

                      {/* URL Slug */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL Slug
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              /lifestyles/
                            </span>
                            <input
                              type="text"
                              value={form.seo_slug}
                              onChange={handleChange("seo_slug")}
                              placeholder="lifestyle-url-slug"
                              className="w-full h-12 pl-28 pr-4 border border-gray-200 rounded-xl text-sm font-mono
                                outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={generateSeoUrl}
                            className="px-5 h-12 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl 
                              text-sm font-medium transition-all hover:shadow-lg flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate
                          </button>
                        </div>
                      </div>

                      {/* Focus Keyword */}
                      <div>
                        <FormInput
                          label="Focus Keyword"
                          icon={Search}
                          value={form.seo_focus_keyword}
                          onChange={handleChange("seo_focus_keyword")}
                          placeholder="Enter your primary keyword"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            Primary keyword to target for SEO optimization
                          </p>
                          <span className={`text-xs font-medium ${
                            (form.seo_focus_keyword?.length || 0) > 100 ? "text-red-500" : "text-gray-400"
                          }`}>
                            {form.seo_focus_keyword?.length || 0} / 100
                          </span>
                        </div>
                      </div>

                      {/* SEO Preview */}
                      <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Search Preview</span>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                          <p className="text-lg text-blue-600 font-medium hover:underline cursor-pointer truncate">
                            {form.seo_title || form.title || "Lifestyle Title - Your Website"}
                          </p>
                          <p className="text-sm text-green-700 truncate mt-1">
                            {typeof window !== "undefined" &&
                              `${window.location.origin}/lifestyles/${form.seo_slug || "your-lifestyle-slug"}`}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {form.seo_description ||
                              "Your lifestyle description will appear here in search results..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* SEO Checklist */}
                  <SectionCard
                    icon={CheckCircle}
                    title="SEO Checklist"
                    subtitle="Follow these recommendations for better rankings"
                  >
                    <div className="space-y-3">
                      <SEOChecklistItem
                        checked={seoAnalysis.keywordInTitle}
                        label="Add Focus Keyword to the SEO title."
                      />
                      <SEOChecklistItem
                        checked={seoAnalysis.keywordInDescription}
                        label="Add Focus Keyword to your SEO Meta Description."
                      />
                      <SEOChecklistItem
                        checked={seoAnalysis.keywordInUrl}
                        label="Use Focus Keyword in the URL."
                      />
                      <SEOChecklistItem
                        checked={seoAnalysis.keywordInContent}
                        label="Use Focus Keyword in the content."
                      />
                      <SEOChecklistItem
                        checked={seoAnalysis.isContentLongEnough}
                        label={`Content is ${seoAnalysis.contentLength} words long. Consider using at least 600 words.`}
                      />
                    </div>

                    {/* SEO Score */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">SEO Score</span>
                        <span className={`text-lg font-bold ${
                          Object.values(seoAnalysis).filter(Boolean).length >= 4 
                            ? "text-green-600" 
                            : Object.values(seoAnalysis).filter(Boolean).length >= 2
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}>
                          {Object.values(seoAnalysis).filter(Boolean).length} / 5
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            Object.values(seoAnalysis).filter(Boolean).length >= 4 
                              ? "bg-green-500" 
                              : Object.values(seoAnalysis).filter(Boolean).length >= 2
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${(Object.values(seoAnalysis).filter(Boolean).length / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {Object.values(seoAnalysis).filter(Boolean).length >= 4 
                          ? "Great! Your SEO is well optimized." 
                          : Object.values(seoAnalysis).filter(Boolean).length >= 2
                          ? "Good start! Keep improving your SEO."
                          : "Needs improvement. Follow the checklist above."}
                      </p>
                    </div>
                  </SectionCard>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = currentTabIndex - 1;
                    if (prevIdx >= 0) setActiveTab(TABS[prevIdx].id);
                  }}
                  disabled={currentTabIndex === 0}
                  className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl 
                    text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                {currentTabIndex < TABS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = currentTabIndex + 1;
                      if (nextIdx < TABS.length) setActiveTab(TABS[nextIdx].id);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl 
                      text-sm font-semibold hover:from-pink-600 hover:to-rose-700 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Next Step
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl 
                      text-sm font-semibold hover:from-pink-600 hover:to-rose-700 transition-all hover:-translate-y-0.5 
                      hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Create Lifestyle
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Publish Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                      Publish Settings
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <FormSelect
                      label="Status"
                      value={form.status}
                      onChange={handleChange("status")}
                      options={[
                        { value: 0, label: "📝 Draft" },
                        { value: 1, label: "✅ Published" },
                        { value: 2, label: "📦 Archived" },
                      ]}
                    />

                    <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl cursor-pointer border border-pink-100 hover:border-pink-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.featured === 1}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            featured: e.target.checked ? 1 : 0,
                          }))
                        }
                        className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                        <div>
                          <span className="text-sm font-semibold text-pink-800">Featured</span>
                          <p className="text-[10px] text-pink-600">Show on homepage</p>
                        </div>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 
                        bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-sm font-semibold 
                        hover:from-pink-600 hover:to-rose-700 transition-all hover:-translate-y-0.5 hover:shadow-lg
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Lifestyle...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Create Lifestyle
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                      Form Progress
                    </h4>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2">
                      {TABS.map((tab, idx) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isPast = idx < currentTabIndex;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                              isActive ? "bg-pink-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isPast
                                  ? "bg-green-100"
                                  : isActive
                                  ? "bg-gradient-to-r from-pink-500 to-rose-600"
                                  : "bg-gray-100 group-hover:bg-gray-200"
                              }`}
                            >
                              {isPast ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Icon
                                  className={`w-4 h-4 ${
                                    isActive ? "text-white" : "text-gray-400"
                                  }`}
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <span
                                className={`text-sm ${
                                  isActive ? "font-semibold text-gray-800" : "text-gray-600"
                                }`}
                              >
                                {tab.label}
                              </span>
                              {isPast && (
                                <span className="ml-2 text-[10px] text-green-600 font-medium">
                                  ✓ Complete
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Overall Progress</span>
                        <span className="font-bold text-gray-800">{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                      Quick Actions
                    </h4>
                  </div>
                  <div className="p-3 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, status: 0 }));
                        toast.success("Saved as draft");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 
                        hover:bg-gray-50 rounded-xl transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                        <Save size={16} className="text-gray-500" />
                      </div>
                      <span>Save as Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(form, null, 2));
                        toast.success("Data copied!");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 
                        hover:bg-gray-50 rounded-xl transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                        <Copy size={16} className="text-gray-500" />
                      </div>
                      <span>Copy Form Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 
                        hover:bg-red-50 rounded-xl transition-colors group"
                    >
                      <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                        <RotateCcw size={16} className="text-red-500" />
                      </div>
                      <span>Reset Form</span>
                    </button>
                  </div>
                </div>

                {/* Help Card */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-pink-800 mb-1">Need Help?</h4>
                      <p className="text-xs text-pink-600 mb-3">
                        Check our documentation or contact support for assistance.
                      </p>
                      <Link
                        href="/admin/help"
                        className="inline-flex items-center gap-1 text-xs font-medium text-pink-700 hover:text-pink-800"
                      >
                        View Documentation
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}