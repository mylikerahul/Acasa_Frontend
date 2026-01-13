"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  MapPin,
  Heart,
  Share2,
  Bed,
  Bath,
  Maximize,
  Car,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  Calendar,
  Home,
  Building2,
  Sparkles,
  MessageCircle,
  DollarSign,
  ArrowUpRight,
  X,
  Play,
  Trash2,
  Edit3,
  Plus,
  Search,
  ChevronDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Toast Helpers
const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: '#10B981',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: '#EF4444',
      color: '#fff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

const showLoading = (message) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

// ==================== UTILITY FUNCTIONS ====================
const utils = {
  formatPrice: (value) =>
    value
      ? Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "Price on Request",

  getImageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\/+/, "");
    return `${API_URL}/uploads/properties/${cleanPath}`;
  },

  parseJSON: (data, fallback = []) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return fallback;
      }
    }
    return fallback;
  },

  parseCommaSeparated: (str) => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  },

  getYoutubeEmbed: (url) => {
    if (!url) return null;
    return url
      .replace("watch?v=", "embed/")
      .replace("youtu.be/", "youtube.com/embed/");
  },

  buildLocation: (...parts) =>
    parts.filter(Boolean).join(", ") || "Location TBA",

  isNumericId: (value) => /^\d+$/.test(value),

  formatDate: (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  },
};

// ==================== NORMALIZE PROPERTY DATA ====================
const normalizeProperty = (raw) => {
  if (!raw) return null;

  const amenitiesFromFlags = buildAmenitiesFromFlags(raw);
  const parsedAmenities = utils.parseJSON(raw.amenities) || [];
  const allAmenities = [...new Set([...parsedAmenities, ...amenitiesFromFlags])];

  return {
    id: raw.id,
    slug: raw.slug || raw.property_slug || raw.seo_slug,

    title: raw.title || raw.property_title || raw.PropertyName || raw.name || "Untitled Property",
    description: raw.description || raw.Description || raw.details || "",

    type: raw.type || raw.property_type || raw.PropertyType || "",
    purpose: raw.purpose || raw.listing_type || raw.Purpose || "",

    location: raw.location || raw.LocationName || raw.address || "",
    city: raw.city || raw.CityName || raw.city_name || "",
    community: raw.community || raw.CommunityName || "",
    area_name: raw.area_name || raw.AreaName || "",
    building_name: raw.building_name || raw.BuildingName || "",

    price: parseFloat(raw.price) || 0,
    price_to: parseFloat(raw.price_to) || parseFloat(raw.max_price) || parseFloat(raw.price_end) || 0,
    currency: raw.currency || raw.currency_code || "AED",

    bedrooms: parseInt(raw.bedrooms) || parseInt(raw.bedroom) || parseInt(raw.Bedrooms) || 0,
    bathrooms: parseInt(raw.bathrooms) || parseInt(raw.bathroom) || parseInt(raw.Bathrooms) || 0,
    area: parseFloat(raw.area) || parseFloat(raw.size) || parseFloat(raw.Area) || 0,
    area_unit: raw.area_unit || raw.size_unit || raw.AreaUnit || "Sq.Ft.",
    parking: parseInt(raw.parking) || parseInt(raw.parking_spaces) || parseInt(raw.Parking) || 0,

    featured: raw.featured === 1 || raw.featured === "1" || raw.is_featured === true || raw.IsFeatured === 1,
    verified: raw.verified === 1 || raw.verified === "1",
    status: raw.status,

    image: raw.image || raw.featured_image || raw.FeaturedImage || raw.main_image,
    images: utils.parseJSON(raw.images) || utils.parseCommaSeparated(raw.gallery_images) || utils.parseCommaSeparated(raw.gallery_media_ids) || [],
    video_link: raw.video_link || raw.video_url || raw.VideoUrl || "",

    views: parseInt(raw.views) || 0,

    amenities: allAmenities,

    agent_id: raw.agent_id || raw.listing_agent_id,
    owner_id: raw.owner_id || raw.user_id,

    created_at: raw.created_at,
    updated_at: raw.updated_at,

    seo_title: raw.seo_title || "",
    meta_description: raw.meta_description || "",

    _raw: raw,
  };
};

const buildAmenitiesFromFlags = (raw) => {
  const amenityMap = {
    SwimmingPool: "Swimming Pool",
    Gym: "Gym & Fitness",
    Parking: "Parking",
    Security: "24/7 Security",
    CCTV: "CCTV Surveillance",
    Lift: "Elevator/Lift",
    Club: "Club House",
    PlayArea: "Children's Play Area",
    Garden: "Garden",
    Lawn: "Lawn",
    Terrace: "Terrace",
    Balcony: "Balcony",
    Intercom: "Intercom",
    InternetConnection: "Internet Connection",
    GasConnection: "Gas Connection",
    PowerBackup: "Power Backup",
    RainWaterHaresting: "Rain Water Harvesting",
    ServantQuarters: "Servant Quarters",
    ReservedPark: "Reserved Parking",
    CentralAC: "Central AC",
    Furnished: "Furnished",
    SemiF: "Semi-Furnished",
  };

  const amenities = [];
  for (const [key, label] of Object.entries(amenityMap)) {
    if (raw[key] && raw[key] !== "0" && raw[key] !== null && raw[key] !== false) {
      amenities.push(label);
    }
  }
  return amenities;
};

// ==================== CUSTOM HOOKS ====================

const useProperty = (slugOrId) => {
  const [state, setState] = useState({
    property: null,
    related: [],
    loading: true,
    error: null,
  });

  const fetchProperty = useCallback(async () => {
    if (!slugOrId) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      let apiUrl;

      if (utils.isNumericId(slugOrId)) {
        apiUrl = `${API_URL}/api/v1/properties/${slugOrId}`;
      } else {
        apiUrl = `${API_URL}/api/v1/properties/slug/${slugOrId}`;
      }

      const response = await axios.get(apiUrl);

      let rawProperty = null;
      if (response.data?.data) {
        rawProperty = response.data.data;
      } else if (response.data?.property) {
        rawProperty = response.data.property;
      } else if (response.data && response.data.id) {
        rawProperty = response.data;
      }

      if (!rawProperty) {
        throw new Error("Property not found");
      }

      const normalizedProperty = normalizeProperty(rawProperty);
      setState((s) => ({ ...s, property: normalizedProperty, loading: false }));

      if (normalizedProperty.id) {
        try {
          const relResponse = await axios.get(
            `${API_URL}/api/v1/properties/${normalizedProperty.id}/similar?limit=3`
          );
          const similarProperties = (relResponse.data?.data || [])
            .map(normalizeProperty)
            .filter(Boolean);

          setState((s) => ({ ...s, related: similarProperties }));
        } catch (relError) {
          console.log("Similar properties error:", relError.message);

          try {
            const fallbackResponse = await axios.get(
              `${API_URL}/api/v1/properties?limit=4`
            );
            const allProperties = (fallbackResponse.data?.data || fallbackResponse.data?.properties || [])
              .filter((p) => p.id !== normalizedProperty.id)
              .slice(0, 3)
              .map(normalizeProperty);

            setState((s) => ({ ...s, related: allProperties }));
          } catch {
            console.log("Fallback properties also failed");
          }
        }
      }
    } catch (err) {
      console.error("Property fetch error:", err);
      const message =
        err.response?.status === 404 ? "Property not found" : err.message;
      setState((s) => ({ ...s, loading: false, error: message }));
      showError("Failed to load property");
    }
  }, [slugOrId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return state;
};

const useGallery = (property) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState({});

  const images = useMemo(() => {
    if (!property) return [];
    const all = [property.image, ...property.images].filter(Boolean);
    return [...new Set(all)];
  }, [property]);

  const handlers = useMemo(
    () => ({
      prev: () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1)),
      next: () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1)),
      select: (idx) => setCurrentIndex(idx),
      onError: (idx) => setErrors((e) => ({ ...e, [idx]: true })),
    }),
    [images.length]
  );

  return { images, currentIndex, errors, ...handlers };
};

const useInquiryForm = (propertyTitle, propertyId) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    message: `I'm interested in ${propertyTitle || "this property"}`,
  });

  useEffect(() => {
    if (propertyTitle) {
      setData((d) => ({ ...d, message: `I'm interested in ${propertyTitle}` }));
    }
  }, [propertyTitle]);

  const handleChange = (e) =>
    setData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.name || !data.email || !data.phone) {
      showError("Please fill all required fields");
      return;
    }

    setLoading(true);
    const loadingToast = showLoading("Submitting inquiry...");
    try {
      await axios.post(`${API_URL}/api/v1/properties/contact`, {
        property_id: propertyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      });
      toast.dismiss(loadingToast);
      showSuccess("Inquiry submitted! We'll contact you soon.");
      setData((d) => ({ ...d, name: "", email: "", phone: "" }));
    } catch (err) {
      console.error("Inquiry submit error:", err);
      toast.dismiss(loadingToast);
      showError("Failed to submit inquiry");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, handleChange, handleSubmit };
};

// ==================== UI COMPONENTS ====================

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Toaster 
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
          style: {
            background: '#10B981',
            fontWeight: '500',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
          style: {
            background: '#EF4444',
            fontWeight: '500',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#3B82F6',
            color: '#fff',
            fontWeight: '500',
          },
        },
      }}
    />
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
      </div>
      <p className="mt-4 text-gray-600 font-medium">
        Loading property details...
      </p>
    </div>
  </div>
);

const ErrorState = ({ error, onBack, slugOrId }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Toaster 
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
          style: {
            background: '#10B981',
            fontWeight: '500',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
          style: {
            background: '#EF4444',
            fontWeight: '500',
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#3B82F6',
            color: '#fff',
            fontWeight: '500',
          },
        },
      }}
    />
    <div className="bg-white rounded-lg border border-gray-300 p-8 max-w-md w-full text-center">
      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Property Not Found</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
          className="px-6 py-3 rounded hover:opacity-90 font-medium"
        >
          Browse Properties
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

const HeaderSection = ({ property, onBack }) => (
  <div className="bg-white border border-gray-300 rounded-t p-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Properties</span>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-800 truncate max-w-[200px]">
            {property?.title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search properties..."
            className="pl-3 pr-8 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <button
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  </div>
);

const GalleryButton = ({ onClick, disabled, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-10 h-10 bg-white border border-gray-300 rounded flex items-center justify-center 
      hover:bg-gray-50 transition-all disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const ImageGallery = ({ property, gallery, onShare, onWishlist, isLiked, likeLoading, onVideoClick }) => {
  const currentImage = gallery.images[gallery.currentIndex];

  return (
    <div className="bg-white border border-gray-300 border-t-0 p-4">
      <div className="relative aspect-[16/9] bg-gray-100 rounded overflow-hidden">
        {currentImage && !gallery.errors[gallery.currentIndex] ? (
          <img
            src={utils.getImageUrl(currentImage)}
            alt={`${property.title} - Image ${gallery.currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={() => gallery.onError(gallery.currentIndex)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
            <ImageOff size={48} className="text-gray-300 mb-2" />
            <span className="text-gray-400">No Image Available</span>
          </div>
        )}

        {gallery.images.length > 1 && (
          <>
            <GalleryButton onClick={gallery.prev} className="absolute left-4 top-1/2 -translate-y-1/2">
              <ChevronLeft size={20} />
            </GalleryButton>
            <GalleryButton onClick={gallery.next} className="absolute right-4 top-1/2 -translate-y-1/2">
              <ChevronRight size={20} />
            </GalleryButton>
          </>
        )}

        {gallery.images.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1.5 rounded text-sm font-medium border border-gray-300">
            {gallery.currentIndex + 1} / {gallery.images.length}
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2">
          {property.video_link && (
            <GalleryButton onClick={onVideoClick}>
              <Play size={18} className="text-red-500" />
            </GalleryButton>
          )}
          <GalleryButton onClick={onShare}>
            <Share2 size={18} className="text-gray-600" />
          </GalleryButton>
          <GalleryButton onClick={onWishlist} disabled={likeLoading}>
            <Heart size={18} fill={isLiked ? "#ef4444" : "none"} className={isLiked ? "text-red-500" : "text-gray-600"} />
          </GalleryButton>
        </div>

        {property.featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded text-sm font-medium border border-amber-600">
            <Sparkles size={14} />
            Featured
          </div>
        )}
      </div>

      {gallery.images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {gallery.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => gallery.select(idx)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all
                ${idx === gallery.currentIndex ? "border-blue-500" : "border-gray-200"}`}
            >
              <img
                src={utils.getImageUrl(img)}
                alt={`Thumb ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
};

const PropertyInfo = ({ property }) => {
  const stats = useMemo(() => {
    const items = [];

    if (property.bedrooms > 0) {
      items.push({
        icon: Bed,
        label: "Bedrooms",
        value: property.bedrooms === 0 ? "Studio" : property.bedrooms,
        color: "blue",
      });
    }

    if (property.bathrooms > 0) {
      items.push({
        icon: Bath,
        label: "Bathrooms",
        value: property.bathrooms,
        color: "green",
      });
    }

    if (property.area > 0) {
      items.push({
        icon: Maximize,
        label: "Area",
        value: `${utils.formatPrice(property.area)} ${property.area_unit}`,
        color: "purple",
      });
    }

    if (property.parking > 0) {
      items.push({
        icon: Car,
        label: "Parking",
        value: property.parking,
        color: "gray",
      });
    }

    return items;
  }, [property]);

  return (
    <div className="bg-white border border-gray-300 rounded mb-4">
      {/* Main Header */}
      <div className="border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {property.purpose && (
                <span className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700 uppercase">
                  For {property.purpose}
                </span>
              )}
              {property.type && (
                <span className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700">
                  {property.type}
                </span>
              )}
              {property.verified && (
                <span className="px-2 py-1 bg-blue-100 border border-blue-200 rounded text-xs text-blue-700 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Verified
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-800">{property.title}</h1>
          </div>
          
          {property.views > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs text-gray-600">
              <Eye size={12} />
              {property.views} views
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mt-2 text-gray-600">
          <MapPin size={16} className="text-gray-400" />
          <span>
            {utils.buildLocation(property.location, property.community, property.city)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
        )}

        {/* Price Section */}
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="text-xs text-gray-500 uppercase mb-1">Price</p>
          <p className="text-2xl font-bold text-gray-900">
            {property.currency} {utils.formatPrice(property.price)}
          </p>
          {property.price_to > property.price && (
            <p className="text-sm text-gray-600 mt-1">
              Up to {property.currency} {utils.formatPrice(property.price_to)}
            </p>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">About This Property</h3>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </div>
          </div>
        )}

        {/* Amenities */}
        {property.amenities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Amenities & Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {property.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded"
                >
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ContactForm = ({ property, form, onSaveProperty, isSaved, saveLoading }) => {
  return (
    <div className="bg-white border border-gray-300 rounded p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact & Actions</h3>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        <a
          href={`tel:+971000000000`}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 border border-gray-900"
        >
          <div className="flex items-center gap-3">
            <Phone size={20} />
            <div className="text-left">
              <p className="text-sm font-semibold">Call Now</p>
              <p className="text-xs text-gray-300">Get instant response</p>
            </div>
          </div>
          <ArrowUpRight size={18} />
        </a>

        <button
          onClick={onSaveProperty}
          disabled={saveLoading}
          className={`w-full flex items-center justify-between px-4 py-3 rounded border ${
            isSaved
              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {saveLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
            )}
            <div className="text-left">
              <p className="text-sm font-semibold">{isSaved ? "Saved" : "Save Property"}</p>
              <p className="text-xs">{isSaved ? "Click to remove" : "Add to favorites"}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Verified Badge */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-300">
        <CheckCircle size={16} className="text-green-600" />
        <span>Verified Property Listing</span>
      </div>

      {/* Inquiry Form */}
      <form onSubmit={form.handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          value={form.data.name}
          onChange={form.handleChange}
          placeholder="Your Name *"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="email"
          name="email"
          value={form.data.email}
          onChange={form.handleChange}
          placeholder="Email Address *"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="tel"
          name="phone"
          value={form.data.phone}
          onChange={form.handleChange}
          placeholder="Phone Number *"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <textarea
          name="message"
          value={form.data.message}
          onChange={form.handleChange}
          placeholder="Your Message"
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <button
          type="submit"
          disabled={form.loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50 border border-gray-300"
        >
          {form.loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Mail size={18} />
              Send Inquiry
            </>
          )}
        </button>
      </form>

      {/* Contact Options */}
      <div className="mt-6 pt-6 border-t border-gray-300 space-y-2">
        <a
          href="tel:+971000000000"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
        >
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <Phone size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Call Us</p>
            <p className="text-sm font-medium text-gray-800">+971 00 000 0000</p>
          </div>
        </a>

        <a
          href="mailto:info@example.com"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
        >
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <Mail size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Email Us</p>
            <p className="text-sm font-medium text-gray-800">info@example.com</p>
          </div>
        </a>
      </div>
    </div>
  );
};

const RelatedPropertyCard = ({ property, onClick }) => (
  <div
    onClick={() => onClick(property)}
    className="bg-white border border-gray-300 rounded overflow-hidden hover:shadow-md cursor-pointer"
  >
    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
      {property.image ? (
        <img
          src={utils.getImageUrl(property.image)}
          alt={property.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Building2 size={32} className="text-gray-300" />
        </div>
      )}
    </div>

    <div className="p-3">
      <h3 className="font-semibold text-gray-800 mb-1 truncate">{property.title}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-2">
        <MapPin size={14} className="mr-1" />
        <span className="truncate">{property.location || property.city}</span>
      </div>

      <div className="flex items-center gap-3 mb-2 text-gray-600 text-xs">
        {property.bedrooms > 0 && (
          <div className="flex items-center gap-1">
            <Bed size={14} />
            <span>{property.bedrooms}</span>
          </div>
        )}
        {property.bathrooms > 0 && (
          <div className="flex items-center gap-1">
            <Bath size={14} />
            <span>{property.bathrooms}</span>
          </div>
        )}
        {property.area > 0 && (
          <div className="flex items-center gap-1">
            <Maximize size={14} />
            <span>{utils.formatPrice(property.area)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-400">Price</p>
          <p className="font-bold text-gray-900">
            {property.currency} {utils.formatPrice(property.price)}
          </p>
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200">
          <ArrowUpRight size={16} className="text-gray-600" />
        </div>
      </div>
    </div>
  </div>
);

const RelatedProperties = ({ properties, onSelect }) => {
  if (!properties.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Similar Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((prop) => (
          <RelatedPropertyCard key={prop.id} property={prop} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
};

const VideoModal = ({ url, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
    <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 w-8 h-8 bg-white rounded flex items-center justify-center text-gray-800 hover:bg-gray-100"
      >
        <X size={20} />
      </button>
      <div className="aspect-video bg-black rounded overflow-hidden">
        <iframe
          src={utils.getYoutubeEmbed(url)}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
export default function PropertyDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const { property, related, loading, error } = useProperty(slug);
  const gallery = useGallery(property);
  const form = useInquiryForm(property?.title, property?.id);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: property?.title, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      showSuccess("Link copied!");
    }
  }, [property?.title]);

  const handleWishlist = useCallback(() => {
    setLikeLoading(true);
    setTimeout(() => {
      setIsLiked((prev) => !prev);
      showSuccess(isLiked ? "Removed from wishlist" : "Added to wishlist!");
      setLikeLoading(false);
    }, 300);
  }, [isLiked]);

  const handleSaveProperty = useCallback(async () => {
    setSaveLoading(true);
    const loadingToast = showLoading(isSaved ? "Removing from saved..." : "Saving property...");

    try {
      const authResponse = await axios.get(`${API_URL}/api/v1/users/me`, {
        withCredentials: true,
      });

      if (!authResponse.data.success) {
        throw new Error("Not authenticated");
      }

      if (isSaved) {
        await axios.delete(`${API_URL}/api/v1/properties/${property.id}/save`, {
          withCredentials: true,
        });
        setIsSaved(false);
        toast.dismiss(loadingToast);
        showSuccess("Property removed from saved!");
      } else {
        await axios.post(
          `${API_URL}/api/v1/properties/${property.id}/save`,
          {},
          { withCredentials: true }
        );
        setIsSaved(true);
        toast.dismiss(loadingToast);
        showSuccess("Property saved!");
      }
    } catch (err) {
      console.error("Save property error:", err);
      toast.dismiss(loadingToast);
      if (err.message === "Not authenticated" || err.response?.status === 401) {
        showError("Please login to save properties");
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
        router.push("/login");
      } else {
        showError("Failed to save property");
      }
    } finally {
      setSaveLoading(false);
    }
  }, [isSaved, property, router]);

  const handleRelatedClick = useCallback(
    (prop) => {
      router.push(`/properties/${prop.slug || prop.id}`);
    },
    [router]
  );

  if (loading) return <LoadingState />;

  if (error || !property) {
    return (
      <ErrorState
        error={error}
        onBack={() => router.push("/properties")}
        slugOrId={slug}
      />
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
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
            style: {
              background: '#10B981',
              fontWeight: '500',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              background: '#EF4444',
              fontWeight: '500',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: '#3B82F6',
              color: '#fff',
              fontWeight: '500',
            },
          },
        }}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-3">
          <HeaderSection property={property} onBack={() => router.back()} />

          {/* Image Gallery */}
          <div className="mb-4">
            <ImageGallery
              property={property}
              gallery={gallery}
              onShare={handleShare}
              onWishlist={handleWishlist}
              isLiked={isLiked}
              likeLoading={likeLoading}
              onVideoClick={() => setShowVideo(true)}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PropertyInfo property={property} />
            </div>
            <div>
              <ContactForm
                property={property}
                form={form}
                onSaveProperty={handleSaveProperty}
                isSaved={isSaved}
                saveLoading={saveLoading}
              />
            </div>
          </div>

          {/* Related Properties */}
          <RelatedProperties properties={related} onSelect={handleRelatedClick} />
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && property.video_link && (
        <VideoModal
          url={property.video_link}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
}