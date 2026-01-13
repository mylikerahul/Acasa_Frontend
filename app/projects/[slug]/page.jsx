"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  MapPin,
  Heart,
  Share2,
  Calendar,
  Building2,
  Bed,
  Maximize,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Play,
  X,
  Eye,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  CreditCard,
  ShieldCheck,
  DollarSign,
  Home,
  Plus,
  Search,
  ChevronDown,
  Trash2,
  Edit3,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    return `${API_URL}/uploads/projects/${cleanPath}`;
  },

  getMediaUrl: (mediaId) => {
    if (!mediaId) return null;
    return `${API_URL}/api/v1/media/${mediaId}`;
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

  parseBedrooms: (bedroomStr) => {
    if (!bedroomStr) return { from: null, to: null };
    const parts = bedroomStr.split(",").map((s) => s.trim());
    const numbers = parts.map((p) => {
      const match = p.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter((n) => !isNaN(n));
    
    if (numbers.length === 0) return { from: null, to: null };
    return {
      from: Math.min(...numbers),
      to: Math.max(...numbers),
    };
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

  // Get initials for avatar
  getInitials: (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },
};

// Success Toast Helper
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

// Error Toast Helper
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

// Loading Toast Helper
const showLoading = (message) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

// ==================== NORMALIZE PROJECT DATA ====================
const normalizeProject = (raw) => {
  if (!raw) return null;

  const bedrooms = utils.parseBedrooms(raw.bedroom);

  return {
    id: raw.id,
    slug: raw.slug || raw.project_slug,
    
    title: raw.ProjectName || raw.title || raw.BuildingName || "Untitled Project",
    description: raw.Description || raw.description || "",
    
    developer_id: raw.developer_id,
    developer_name: raw.developerName || raw.developer_name || "",
    
    location: raw.LocationName || raw.location || raw.CityName || "",
    city: raw.CityName || raw.city || "",
    state: raw.StateName || raw.state || "",
    building_name: raw.BuildingName || "",
    
    price: parseFloat(raw.price) || 0,
    price_to: parseFloat(raw.price_end) || parseFloat(raw.askprice) || 0,
    currency: raw.currency_id === 2 ? "AED" : "USD",
    
    bedrooms_from: bedrooms.from ?? raw.bedroomsFrom ?? 0,
    bedrooms_to: bedrooms.to ?? raw.bedroomsTo ?? 0,
    bedroom_string: raw.bedroom || "",
    
    area_from: parseFloat(raw.area) || 0,
    area_to: parseFloat(raw.area_end) || 0,
    area_unit: raw.area_size === "2" ? "Sq.Ft." : "Sq.M.",
    
    handover_date: raw.handoverDate || raw.completion_date || "",
    completion_date: raw.completion_date || "",
    qc: raw.qc || "",
    
    listing_type: raw.listing_type || "Off plan",
    occupancy: raw.occupancy || "",
    exclusive_status: raw.exclusive_status || "",
    featured_project: raw.featured_project === "1" || raw.featured === true,
    verified: raw.verified === 1,
    status: raw.status,
    
    featured_image: raw.featured_image,
    gallery_media_ids: utils.parseCommaSeparated(raw.gallery_media_ids),
    images: raw.images || [],
    video_url: raw.video_url || raw.Url || "",
    
    views: parseInt(raw.views) || 0,
    
    seo_title: raw.seo_title || "",
    meta_description: raw.meta_description || "",
    keyword: raw.keyword || "",
    
    amenities: utils.parseJSON(raw.amenities) || [],
    amenityFeatures: buildAmenitiesFromFlags(raw),
    
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
  };

  const amenities = [];
  for (const [key, label] of Object.entries(amenityMap)) {
    if (raw[key] && raw[key] !== "0" && raw[key] !== null) {
      amenities.push(label);
    }
  }
  return amenities;
};

// ==================== CUSTOM HOOKS ====================

const useProject = (slugOrId) => {
  const [state, setState] = useState({
    project: null,
    related: [],
    loading: true,
    error: null,
  });

  const fetchProject = useCallback(async () => {
    if (!slugOrId) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      let apiUrl;
      if (utils.isNumericId(slugOrId)) {
        apiUrl = `${API_URL}/api/v1/projects/${slugOrId}`;
      } else {
        apiUrl = `${API_URL}/api/v1/projects/slug/${slugOrId}`;
      }

      const response = await axios.get(apiUrl);

      let rawProject = null;
      if (response.data?.data) {
        rawProject = response.data.data;
      } else if (response.data?.project) {
        rawProject = response.data.project;
      } else if (response.data && response.data.id) {
        rawProject = response.data;
      }

      if (!rawProject) {
        throw new Error("Project not found");
      }

      const normalizedProject = normalizeProject(rawProject);
      setState((s) => ({ ...s, project: normalizedProject, loading: false }));

      if (normalizedProject.id) {
        try {
          const relResponse = await axios.get(`${API_URL}/api/v1/projects?limit=4`);
          const allProjects = relResponse.data?.data || relResponse.data?.projects || [];
          const relatedProjects = allProjects
            .filter((p) => p.id !== normalizedProject.id)
            .slice(0, 3)
            .map(normalizeProject);

          setState((s) => ({ ...s, related: relatedProjects }));
        } catch (relError) {
          console.log("Related projects error:", relError.message);
        }
      }
    } catch (err) {
      console.error("Project fetch error:", err);
      const message = err.response?.status === 404 ? "Project not found" : err.message;
      setState((s) => ({ ...s, loading: false, error: message }));
      showError("Failed to load project");
    }
  }, [slugOrId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return state;
};

const useGallery = (project) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [loadedImages, setLoadedImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!project) return;

      let imageUrls = [];

      if (project.gallery_media_ids && project.gallery_media_ids.length > 0) {
        imageUrls = project.gallery_media_ids.map(
          (id) => `${API_URL}/uploads/media/${id}.jpg`
        );
      }

      if (project.featured_image) {
        imageUrls.unshift(utils.getImageUrl(project.featured_image));
      }

      if (project.images && project.images.length > 0) {
        imageUrls = [...imageUrls, ...project.images.map(utils.getImageUrl)];
      }

      imageUrls = [...new Set(imageUrls.filter(Boolean))];
      setLoadedImages(imageUrls);
    };

    fetchImages();
  }, [project]);

  const handlers = useMemo(
    () => ({
      prev: () => setCurrentIndex((i) => (i === 0 ? loadedImages.length - 1 : i - 1)),
      next: () => setCurrentIndex((i) => (i === loadedImages.length - 1 ? 0 : i + 1)),
      select: (idx) => setCurrentIndex(idx),
      onError: (idx) => setErrors((e) => ({ ...e, [idx]: true })),
    }),
    [loadedImages.length]
  );

  return { images: loadedImages, currentIndex, errors, ...handlers };
};

const useInquiryForm = (projectTitle) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    message: `I'm interested in ${projectTitle || "this project"}`,
  });

  useEffect(() => {
    if (projectTitle)
      setData((d) => ({ ...d, message: `I'm interested in ${projectTitle}` }));
  }, [projectTitle]);

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
      await axios.post(`${API_URL}/api/v1/projects/contact`, {
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
        Loading project details...
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
      <h2 className="text-xl font-bold text-gray-800 mb-2">Project Not Found</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
          className="px-6 py-3 rounded hover:opacity-90 font-medium"
        >
          Browse Projects
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

const HeaderSection = ({ project, onBack }) => (
  <div className="bg-white border border-gray-300 rounded-t p-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Projects</span>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-800 truncate max-w-[200px]">
            {project?.title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
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

const ImageGallery = ({ project, gallery, onShare, onWishlist, isLiked, likeLoading, onVideoClick }) => {
  const currentImage = gallery.images[gallery.currentIndex];

  return (
    <div className="bg-white border border-gray-300 border-t-0 p-4">
      <div className="relative aspect-[16/9] bg-gray-100 rounded overflow-hidden">
        {currentImage && !gallery.errors[gallery.currentIndex] ? (
          <img
            src={currentImage}
            alt={`${project.title} - Image ${gallery.currentIndex + 1}`}
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
          {project.video_url && (
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

        {project.featured_project && (
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
                src={img}
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

const ProjectInfo = ({ project }) => {
  const allAmenities = [...(project.amenities || []), ...(project.amenityFeatures || [])];
  const uniqueAmenities = [...new Set(allAmenities)];

  const stats = useMemo(() => {
    const items = [];

    if (project.bedrooms_from !== null || project.bedroom_string) {
      let bedroomValue = "";
      if (project.bedroom_string) {
        bedroomValue = project.bedroom_string;
      } else {
        const from = project.bedrooms_from === 0 ? "Studio" : project.bedrooms_from;
        const to = project.bedrooms_to > project.bedrooms_from ? ` - ${project.bedrooms_to}` : "";
        bedroomValue = `${from}${to}`;
      }
      items.push({
        icon: Bed,
        label: "Bedrooms",
        value: bedroomValue,
        color: "blue",
      });
    }

    if (project.area_from > 0) {
      const from = utils.formatPrice(project.area_from);
      const to = project.area_to > project.area_from ? ` - ${utils.formatPrice(project.area_to)}` : "";
      items.push({
        icon: Maximize,
        label: "Area",
        value: `${from}${to} ${project.area_unit}`,
        color: "purple",
      });
    }

    if (project.handover_date) {
      items.push({
        icon: Calendar,
        label: "Handover",
        value: `${project.qc || ""} ${project.handover_date}`.trim(),
        color: "amber",
      });
    }

    if (project.listing_type) {
      items.push({
        icon: Home,
        label: "Type",
        value: project.listing_type,
        color: "green",
      });
    }

    if (project.occupancy) {
      items.push({
        icon: Building2,
        label: "Status",
        value: project.occupancy,
        color: "gray",
      });
    }

    return items;
  }, [project]);

  return (
    <div className="bg-white border border-gray-300 rounded mb-4">
      {/* Main Header */}
      <div className="border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            {project.developer_name && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-600 uppercase mb-2">
                <Building2 size={12} />
                {project.developer_name}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-800">{project.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {project.exclusive_status === "Exclusive" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                <Sparkles size={10} />
                Exclusive
              </span>
            )}
            {project.views > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs text-gray-600">
                <Eye size={12} />
                {project.views} views
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mt-2 text-gray-600">
          <MapPin size={16} className="text-gray-400" />
          <span>
            {utils.buildLocation(project.location, project.building_name, project.city)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
        )}

        {/* Price Section */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Starting From</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.currency} {utils.formatPrice(project.price)}
              </p>
              {project.price_to > project.price && (
                <p className="text-sm text-gray-600 mt-1">
                  Up to {project.currency} {utils.formatPrice(project.price_to)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">About This Project</h3>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
              {project.description}
            </div>
          </div>
        )}

        {/* Amenities */}
        {uniqueAmenities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Amenities & Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {uniqueAmenities.map((amenity, idx) => (
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

const ContactForm = ({ project, form, onBuyNow }) => {
  const bookingAmount = useMemo(() => {
    return Math.round((project.price || 0) * 0.1);
  }, [project.price]);

  return (
    <div className="bg-white border border-gray-300 rounded p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact & Payment</h3>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => onBuyNow("full")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 border border-gray-900"
        >
          <div className="flex items-center gap-3">
            <DollarSign size={20} />
            <div className="text-left">
              <p className="text-sm font-semibold">Full Payment</p>
              <p className="text-xs text-gray-300">
                {project.currency} {utils.formatPrice(project.price)}
              </p>
            </div>
          </div>
          <ArrowUpRight size={18} />
        </button>

        <button
          onClick={() => onBuyNow("booking")}
          className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 border border-green-700"
        >
          <div className="flex items-center gap-3">
            <CreditCard size={20} />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Book Now</p>
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">10%</span>
              </div>
              <p className="text-xs text-green-100">
                {project.currency} {utils.formatPrice(bookingAmount)}
              </p>
            </div>
          </div>
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* Secure Payment */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-300">
        <ShieldCheck size={16} className="text-green-600" />
        <span>Secure Payment with Stripe</span>
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

const RelatedProjectCard = ({ project, onClick }) => (
  <div
    onClick={() => onClick(project)}
    className="bg-white border border-gray-300 rounded overflow-hidden hover:shadow-md cursor-pointer"
  >
    <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
      {project.featured_image ? (
        <img
          src={utils.getImageUrl(project.featured_image)}
          alt={project.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Building2 size={32} className="text-gray-300" />
        </div>
      )}
    </div>

    <div className="p-3">
      <h3 className="font-semibold text-gray-800 mb-1 truncate">{project.title}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-2">
        <MapPin size={14} className="mr-1" />
        <span className="truncate">{project.location || project.city || "Location"}</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-400">Starting From</p>
          <p className="font-bold text-gray-900">
            {project.currency} {utils.formatPrice(project.price)}
          </p>
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200">
          <ArrowUpRight size={16} className="text-gray-600" />
        </div>
      </div>
    </div>
  </div>
);

const RelatedProjects = ({ projects, onSelect }) => {
  if (!projects.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Similar Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => (
          <RelatedProjectCard key={proj.id} project={proj} onClick={onSelect} />
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
export default function ProjectDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const { project, related, loading, error } = useProject(slug);
  const gallery = useGallery(project);
  const form = useInquiryForm(project?.title);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: project?.title, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      showSuccess("Link copied!");
    }
  }, [project?.title]);

  const handleWishlist = useCallback(() => {
    setLikeLoading(true);
    setTimeout(() => {
      setIsLiked((prev) => !prev);
      showSuccess(isLiked ? "Removed from wishlist" : "Added to wishlist!");
      setLikeLoading(false);
    }, 300);
  }, [isLiked]);

  const handleRelatedClick = useCallback(
    (proj) => {
      router.push(`/projects/${proj.slug || proj.id}`);
    },
    [router]
  );

  const handleBuyNow = useCallback(
    async (paymentType = "booking") => {
      const loadingToast = showLoading("Checking authentication...");

      try {
        const response = await axios.get(`${API_URL}/api/v1/users/me`, {
          withCredentials: true,
        });

        toast.dismiss(loadingToast);

        if (response.data.success) {
          router.push(`/payment/${project.id}?type=${paymentType}`);
        } else {
          throw new Error("Not authenticated");
        }
      } catch {
        toast.dismiss(loadingToast);
        showError("Please login to purchase");

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "redirectAfterLogin",
            `/payment/${project.id}?type=${paymentType}`
          );
        }

        router.push("/login");
      }
    },
    [router, project]
  );

  if (loading) return <LoadingState />;

  if (error || !project) {
    return <ErrorState error={error} onBack={() => router.push("/projects")} slugOrId={slug} />;
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
          <HeaderSection project={project} onBack={() => router.back()} />

          {/* Image Gallery */}
          <div className="mb-4">
            <ImageGallery
              project={project}
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
              <ProjectInfo project={project} />
            </div>
            <div>
              <ContactForm project={project} form={form} onBuyNow={handleBuyNow} />
            </div>
          </div>

          {/* Related Projects */}
          <RelatedProjects projects={related} onSelect={handleRelatedClick} />
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && project.video_url && (
        <VideoModal url={project.video_url} onClose={() => setShowVideo(false)} />
      )}
    </>
  );
}