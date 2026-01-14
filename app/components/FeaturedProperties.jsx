"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageOff,
  MapPin,
  Loader2,
  Building2,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Bed,
  Bath,
  Ruler,
  Home,
  Navigation,
  X,
  RotateCcw,
  Eye,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VISIBLE_CARDS = 3;
const SKELETON_COUNT = 3;
const NEARBY_RADIUS_KM = 20;

const DEBUG_MODE = process.env.NODE_ENV === "development";

// Fallback/Placeholder images for when property image fails to load
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80", // Luxury apartment interior
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80", // Modern villa exterior
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80", // Luxury home pool
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80", // Modern house front
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80", // Beautiful home exterior
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80", // Luxury property
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80", // Modern interior
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop&q=80", // Contemporary home
];

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80";

const API_CONFIG = {
  params: { status: 1, limit: 3, featured_only: true },
  withCredentials: true,
  timeout: 10000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  debug: (...args) => {
    if (DEBUG_MODE) {
      console.log("🏠 [FeaturedProperties]:", ...args);
    }
  },

  formatPrice: (value) => {
    if (!value || value <= 0) return "Price on Request";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  },

  generateSlug: (title) => {
    if (!title?.trim()) return "";
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  parseImages: (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean);
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return images.trim() ? [images] : [];
      }
    }
    return [];
  },

  buildImageUrl: (property) => {
    const imagePath =
      property.thumbnail ||
      property.featured_image ||
      (property.images && property.images[0]) ||
      (property.property_images &&
        utils.parseImages(property.property_images)[0]);

    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/${cleanPath}`;
  },

  getFallbackImage: (propertyId) => {
    if (!propertyId) return DEFAULT_FALLBACK;
    const index =
      typeof propertyId === "number"
        ? propertyId % FALLBACK_IMAGES.length
        : String(propertyId).length % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
  },

  formatBedrooms: (count) => {
    if (count === undefined || count === null) return null;
    if (count === 0) return "Studio";
    return `${count} Bed${count > 1 ? "s" : ""}`;
  },

  formatBathrooms: (count) => {
    if (!count && count !== 0) return null;
    return `${count} Bath${count > 1 ? "s" : ""}`;
  },

  formatArea: (area, unit) => {
    if (!area) return null;
    return `${area.toLocaleString()} ${unit || "Sq.Ft."}`;
  },

  formatLocation: (property) => {
    const parts = [property.community, property.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location TBA";
  },

  calculateDistance: (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  formatDistance: (km) => {
    if (km === null || km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    if (km < 10) return `${km.toFixed(1)}km`;
    return `${Math.round(km)}km`;
  },

  transformProperty: (property) => {
    utils.debug("Raw property for transformation:", property);
    const transformed = {
      id: property.id,
      title: property.property_name?.trim() || "Untitled Property",
      slug:
        property.slug ||
        property.property_slug ||
        utils.generateSlug(property.property_name),
      location: property.location || utils.formatLocation(property),
      latitude: Number(property.map_latitude) || null,
      longitude: Number(property.map_longitude) || null,
      price: Number(property.price) || 0,
      currency: property.currency || "AED",
      featured_image: property.featured_image,
      thumbnail: property.thumbnail,
      images: property.gallery?.map((img) => img.Url) || [],
      bedrooms: Number(property.bedroom) || 0,
      bathrooms: Number(property.bathrooms) || 0,
      area: Number(property.area) || 0,
      area_unit: property.area_size || "Sq.Ft.",
      listing_type: property.listing_type || "sale",
      property_type: property.property_type || "Apartment",
      community: property.community || "",
      city: property.city || "",
      area_name: property.area || "",
      featured: property.featured_property === "1",
      ask_to_price: property.askprice === "1",
      developer_name: property.developer_name || "",
      completion_date: property.completion_date || "",
      created_at: property.created_at,
      distance: null,
    };
    utils.debug("Transformed property:", transformed);
    return transformed;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useProperties = () => {
  const [state, setState] = useState({
    properties: [],
    loading: true,
    error: null,
  });

  const fetchProperties = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    utils.debug(
      "Fetching properties from:",
      `${API_URL}/api/v1/properties`,
      "with config:",
      API_CONFIG
    );

    try {
      const response = await axios.get(
        `${API_URL}/api/v1/properties`,
        API_CONFIG
      );
      const data = response.data;
      utils.debug("API Response received:", data);

      if (!data.success || !Array.isArray(data.listings)) {
        throw new Error(
          "Invalid API response structure: 'listings' array missing or not successful."
        );
      }

      const properties = data.listings.map(utils.transformProperty);
      setState({ properties, loading: false, error: null });
      utils.debug(`Fetched and transformed ${properties.length} properties.`);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load properties";

      console.error("Properties fetch error:", {
        message: err.message,
        response_data: axios.isAxiosError(err) ? err.response?.data : null,
        response_status: axios.isAxiosError(err)
          ? err.response?.status
          : null,
        error_object: err,
      });
      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { ...state, refetch: fetchProperties };
};

const useCarousel = (totalItems, visibleCount = VISIBLE_CARDS) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = useMemo(
    () => Math.max(0, totalItems - visibleCount),
    [totalItems, visibleCount]
  );

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const showNavigation = totalItems > visibleCount;

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(
    () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1)),
    [maxIndex]
  );

  const reset = useCallback(() => setCurrentIndex(0), []);

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(0);
  }, [maxIndex, currentIndex]);

  return {
    currentIndex,
    canGoPrev,
    canGoNext,
    showNavigation,
    goToPrev,
    goToNext,
    reset,
  };
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const toggleFavorite = useCallback((propertyId) => {
    setSavingId(propertyId);

    setFavorites((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(propertyId);

      if (isAdding) {
        next.add(propertyId);
        toast.success("Added to favorites!");
      } else {
        next.delete(propertyId);
        toast.success("Removed from favorites");
      }

      return next;
    });

    setTimeout(() => setSavingId(null), 300);
  }, []);

  const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

  return { favorites, savingId, toggleFavorite, isFavorite };
};

const useImageLoader = () => {
  const [errors, setErrors] = useState(new Set());
  const [usingFallback, setUsingFallback] = useState(new Set());

  const handleError = useCallback((propertyId, imageUrl) => {
    utils.debug(`Image failed to load:`, { propertyId, imageUrl });
    setErrors((prev) => new Set(prev).add(propertyId));
  }, []);

  const hasError = useCallback((id) => errors.has(id), [errors]);

  const markUsingFallback = useCallback((propertyId) => {
    setUsingFallback((prev) => new Set(prev).add(propertyId));
  }, []);

  const isUsingFallback = useCallback(
    (id) => usingFallback.has(id),
    [usingFallback]
  );

  return { handleError, hasError, markUsingFallback, isUsingFallback };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (UI)
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="h-52 bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const EmptyState = ({ hasNearby, onClearNearby }) => (
  <div className="text-center py-16">
    <Home size={40} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-normal text-gray-700 mb-2">
      {hasNearby ? "No Nearby Properties Found" : "No Properties Available"}
    </h3>
    <p className="text-gray-500 mb-4">
      {hasNearby
        ? "Try increasing the search radius or clear the filter"
        : "Check back soon for new listings"}
    </p>
    {hasNearby && (
      <button
        onClick={onClearNearby}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-normal
          text-gray-800 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
      >
        <X size={16} />
        Clear Nearby Filter
      </button>
    )}
  </div>
);

// Near Me button component रखा है लेकिन UI में use नहीं कर रहे
const NearMeButton = ({ isActive, isLoading, onClick }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center
      text-gray-500
      ${
        isActive
          ? "bg-black text-white border-black"
          : "hover:border-gray-500 hover:text-gray-700"
      }
      ${isLoading ? "opacity-60 cursor-wait" : ""}`}
    aria-label="Show properties near me"
  >
    {isLoading ? (
      <Loader2 size={16} className="animate-spin" />
    ) : (
      <Navigation size={16} />
    )}
  </button>
);

const DistanceBadge = ({ distance }) => {
  if (distance === null || distance === undefined) return null;

  return (
    <div
      className="absolute top-3 left-3 z-10 flex items-center gap-1 
      bg-white/90 px-2 py-0.5 rounded-full shadow-sm border border-gray-200"
    >
      <Navigation size={11} className="text-gray-700" />
      <span className="text-[10px] font-normal text-gray-800">
        {utils.formatDistance(distance)}
      </span>
    </div>
  );
};

const NearbyBanner = ({ count, radius, onClear }) => (
  <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
        <MapPin size={18} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-normal text-gray-900">
          Showing {count} nearby properties within {radius}km
        </p>
        <p className="text-xs text-gray-500">Sorted by nearest first</p>
      </div>
    </div>
    <button
      onClick={onClear}
      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
    >
      <X size={13} />
      Clear
    </button>
  </div>
);

const SectionHeader = ({ showNav, canPrev, canNext, onPrev, onNext }) => (
  <div className="flex items-center justify-between mb-8">
    <h2
      id="featured-properties-title"
      className="text-xs md:text-sm font-normal tracking-[0.4em] text-[#111827] uppercase"
    >
      Featured Properties
    </h2>

    <div className="flex items-center gap-2">
      {showNav && (
        <>
          <NavButton direction="prev" disabled={!canPrev} onClick={onPrev} />
          <NavButton direction="next" disabled={!canNext} onClick={onNext} />
        </>
      )}
    </div>
  </div>
);

const NavButton = ({ direction, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === "prev" ? "Previous properties" : "Next properties"}
    className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm
      ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:border-gray-500 hover:text-gray-700"
      }`}
  >
    {direction === "prev" ? (
      <ChevronLeft size={18} className="text-gray-700" />
    ) : (
      <ChevronRight size={18} className="text-gray-700" />
    )}
  </button>
);

const ListingTypeBadge = ({ type, hasDistance }) => (
  <span
    className={`absolute ${
      hasDistance ? "top-10" : "top-3"
    } left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-normal shadow-sm
      bg-white/90 text-gray-800 border border-gray-200`}
  >
    {type === "rent" ? "For Rent" : "For Sale"}
  </span>
);

const FeaturedBadge = ({ hasDistance }) => (
  <div
    className={`absolute ${
      hasDistance ? "top-16" : "top-9"
    } left-3 z-10 flex items-center gap-1.5 
      bg-black text-white px-2.5 py-1 rounded-full text-[10px] font-normal shadow-sm`}
  >
    <Sparkles size={11} />
    Featured
  </div>
);

const CompletionBadge = ({ date }) => {
  if (!date) return null;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  return (
    <div
      className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 
      bg-white/90 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200"
    >
      <Calendar size={12} className="text-gray-600" />
      <span className="text-[11px] font-normal text-gray-800">
        {formattedDate}
      </span>
    </div>
  );
};

// Logic‑friendly favorite button (not used directly now)
const FavoriteButton = ({ isLiked, isSaving, onClick }) => (
  <button
    onClick={onClick}
    disabled={isSaving}
    aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
    className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full 
      flex items-center justify-center shadow-lg border border-gray-200
      ${isLiked ? "bg-black" : "bg-white"}
      ${isSaving ? "cursor-wait" : ""}`}
  >
    {isSaving ? (
      <Loader2 size={18} className="text-gray-500 animate-spin" />
    ) : (
      <Heart
        size={18}
        className={isLiked ? "fill-white text-white" : "text-black"}
      />
    )}
  </button>
);

const PropertyImage = ({
  property,
  imageUrl,
  hasError,
  onError,
  onFallbackLoad,
}) => {
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setCurrentSrc(imageUrl);
      setIsUsingFallback(false);
      setFallbackError(false);
      setLoaded(false);
    } else {
      const fallbackUrl = utils.getFallbackImage(property.id);
      setCurrentSrc(fallbackUrl);
      setIsUsingFallback(true);
      setLoaded(false);
    }
  }, [imageUrl, property.id]);

  const handleImageError = () => {
    if (!isUsingFallback) {
      const fallbackUrl = utils.getFallbackImage(property.id);
      utils.debug(
        `Image failed for property ${property.id}, using fallback:`,
        fallbackUrl
      );
      setCurrentSrc(fallbackUrl);
      setIsUsingFallback(true);
      setLoaded(false);
      onError(property.id, imageUrl);
      if (onFallbackLoad) onFallbackLoad(property.id);
    } else {
      utils.debug(`Fallback image also failed for property ${property.id}`);
      setFallbackError(true);
    }
  };

  if (fallbackError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
          <Home size={30} className="text-gray-500" />
        </div>
        <span className="text-gray-500 text-sm font-normal">
          Property Image
        </span>
        <span className="text-gray-400 text-xs mt-1">Coming Soon</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 size={26} className="text-gray-400 animate-spin" />
        </div>
      )}

      <img
        src={currentSrc || utils.getFallbackImage(property.id)}
        alt={property.title || "Property Image"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={handleImageError}
        loading="lazy"
        decoding="async"
      />

      {isUsingFallback && loaded && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          <ImageOff size={10} />
          <span>Sample</span>
        </div>
      )}
    </div>
  );
};

const PropertyCard = ({
  property,
  imageUrl,
  hasError,
  isLiked,
  isSaving,
  onImageError,
  onFavoriteClick,
  onClick,
  showDistance = false,
  onFallbackLoad,
}) => {
  const hasDistanceBadge = showDistance && property.distance !== null;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(property.id);
  };

  const priceText = property.ask_to_price
    ? "Price on Request"
    : `${property.currency} ${utils.formatPrice(property.price)}`;

  return (
    <article
      onClick={() => onClick(property)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 
        cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(property)}
    >
      {/* Image ( थोड़ा छोटा ) */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {hasDistanceBadge && <DistanceBadge distance={property.distance} />}

        <ListingTypeBadge
          type={property.listing_type}
          hasDistance={hasDistanceBadge}
        />
        {property.featured && <FeaturedBadge hasDistance={hasDistanceBadge} />}

        <PropertyImage
          property={property}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
          onFallbackLoad={onFallbackLoad}
        />

        {/* Small overlay buttons top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <button
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            aria-label="View details"
          >
            <Eye size={15} className="text-gray-700" />
          </button>
          <button
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <RotateCcw size={15} className="text-gray-700" />
          </button>
        </div>

        {/* Fake image arrows */}
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm border border-gray-200"
          onClick={(e) => e.stopPropagation()}
          aria-label="Previous image"
        >
          <ChevronLeft size={14} className="text-gray-700" />
        </button>
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm border border-gray-200"
          onClick={(e) => e.stopPropagation()}
          aria-label="Next image"
        >
          <ChevronRight size={14} className="text-gray-700" />
        </button>

        {property.completion_date && (
          <CompletionBadge date={property.completion_date} />
        )}
      </div>

      {/* Content – heart नीचे */}
      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div className="pr-2">
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900">
            {property.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {property.location || "Location TBA"}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Start Price -{" "}
            <span className="font-normal text-gray-900">{priceText}</span>
          </p>

          <button
            onClick={handleFavoriteClick}
            disabled={isSaving}
            aria-label={
              isLiked ? "Remove from favorites" : "Add to favorites"
            }
            className={`flex items-center justify-center
              ${isSaving ? "cursor-wait opacity-60" : ""}`}
          >
            {isSaving ? (
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            ) : (
              <Heart
                size={22}
                className={
                  isLiked
                    ? "text-gray-900 fill-gray-900"
                    : "text-gray-800 hover:fill-gray-800 hover:text-gray-800"
                }
              />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

const ViewAllButton = ({ onClick }) => (
  <div className="mt-10 text-center">
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center px-10 py-3 text-sm font-normal
        bg-transparent text-black border border-transparent hover:border-black rounded-full"
    >
      All Properties
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function FeaturedProperties() {
  const router = useRouter();

  const { properties, loading, error } = useProperties();
  const { savingId, toggleFavorite, isFavorite } = useFavorites();
  const {
    handleError: handleImageError,
    hasError: imageHasError,
    markUsingFallback,
  } = useImageLoader();

  const [userLocation, setUserLocation] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

  // Near Me logic अभी भी रखा है (future use), UI में button नहीं दिखा रहे
  const handleNearbyClick = useCallback(() => {
    if (nearbyActive) {
      setNearbyActive(false);
      setUserLocation(null);
      toast.success("Nearby filter cleared");
      utils.debug("Nearby filter cleared.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      utils.debug("Geolocation not supported.");
      return;
    }

    setNearbyLoading(true);
    utils.debug("Attempting to get user location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setNearbyActive(true);
        setNearbyLoading(false);
        toast.success("Showing nearby properties!");
        utils.debug("User location obtained:", { latitude, longitude });
      },
      (err) => {
        console.error("Location Error:", err);
        setNearbyLoading(false);

        let errorMessage = "Unable to get your location.";
        if (err.code === 1) {
          errorMessage = "Location permission denied.";
        } else if (err.code === 2) {
          errorMessage = "Location unavailable.";
        }
        toast.error(errorMessage);
        utils.debug("Error getting user location:", errorMessage);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, [nearbyActive]);

  const handleClearNearby = useCallback(() => {
    setNearbyActive(false);
    setUserLocation(null);
    toast.success("Nearby filter cleared");
    utils.debug("Manually cleared nearby filter.");
  }, []);

  const propertiesWithDistance = useMemo(() => {
    utils.debug("Recalculating propertiesWithDistance...");
    if (!nearbyActive || !userLocation) {
      utils.debug(
        "Not nearby active or no user location. Sorting by featured status."
      );
      return [...properties].sort(
        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      );
    }

    utils.debug("Calculating distances for nearby properties...");
    return properties
      .map((property) => {
        const distance = utils.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          property.latitude,
          property.longitude
        );
        return { ...property, distance };
      })
      .filter((property) => {
        const keep =
          property.distance !== null && property.distance <= NEARBY_RADIUS_KM;
        if (!keep)
          utils.debug(
            `Property ${property.id} (${property.title}) excluded: distance ${property.distance} > ${NEARBY_RADIUS_KM}km or lat/lng missing.`
          );
        return keep;
      })
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [properties, nearbyActive, userLocation]);

  const carousel = useCarousel(propertiesWithDistance.length);

  useEffect(() => {
    carousel.reset();
  }, [nearbyActive, carousel]);

  const visibleProperties = useMemo(
    () =>
      propertiesWithDistance.slice(
        carousel.currentIndex,
        carousel.currentIndex + VISIBLE_CARDS
      ),
    [propertiesWithDistance, carousel.currentIndex]
  );

  const handlePropertyClick = useCallback(
    (property) => {
      const path = `/properties/${property.slug || property.id}`;
      utils.debug("Navigating to property:", path);
      router.push(path);
    },
    [router]
  );

  const handleViewAll = useCallback(() => {
    let path = "/properties";
    if (nearbyActive && userLocation) {
      path = `/properties?nearby=true&lat=${userLocation.lat}&lng=${userLocation.lng}`;
    }
    utils.debug("Navigating to view all properties:", path);
    router.push(path);
  }, [router, nearbyActive, userLocation]);

  utils.debug("Main component state:", {
    loading,
    error,
    propertiesCount: properties.length,
    propertiesWithDistanceCount: propertiesWithDistance.length,
    visiblePropertiesCount: visibleProperties.length,
    currentIndex: carousel.currentIndex,
    nearbyActive,
  });

  return (
    <section
      className="bg-[#F7F7F7] py-12 px-4 md:px-10"
      aria-labelledby="featured-properties-title"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          showNav={carousel.showNavigation}
          canPrev={carousel.canGoPrev}
          canNext={carousel.canGoNext}
          onPrev={carousel.goToPrev}
          onNext={carousel.goToNext}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <p className="font-normal mb-1">Error loading properties:</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {nearbyActive && propertiesWithDistance.length > 0 && (
          <NearbyBanner
            count={propertiesWithDistance.length}
            radius={NEARBY_RADIUS_KM}
            onClear={handleClearNearby}
          />
        )}

        {loading ? (
          <LoadingState />
        ) : propertiesWithDistance.length === 0 ? (
          <EmptyState
            hasNearby={nearbyActive}
            onClearNearby={handleClearNearby}
          />
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Featured properties"
            >
              {visibleProperties.map((property) => {
                const imageUrl = utils.buildImageUrl(property);
                return (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    imageUrl={imageUrl}
                    hasError={imageHasError(property.id)}
                    isLiked={isFavorite(property.id)}
                    isSaving={savingId === property.id}
                    onImageError={handleImageError}
                    onFavoriteClick={toggleFavorite}
                    onClick={handlePropertyClick}
                    showDistance={nearbyActive}
                    onFallbackLoad={markUsingFallback}
                  />
                );
              })}
            </div>

            <ViewAllButton onClick={handleViewAll} />
          </>
        )}
      </div>
    </section>
  );
}