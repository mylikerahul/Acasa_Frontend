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

// Default fallback if all else fails
const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80";

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
      (property.property_images && utils.parseImages(property.property_images)[0]);

    if (!imagePath) return null;

    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/${cleanPath}`;
  },

  // Get a consistent fallback image based on property ID
  getFallbackImage: (propertyId) => {
    if (!propertyId) return DEFAULT_FALLBACK;
    const index = typeof propertyId === 'number' 
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
      slug: property.slug || property.property_slug || utils.generateSlug(property.property_name),
      location: property.location || utils.formatLocation(property),
      latitude: Number(property.map_latitude) || null,
      longitude: Number(property.map_longitude) || null,
      price: Number(property.price) || 0,
      currency: property.currency || "AED",
      featured_image: property.featured_image,
      thumbnail: property.thumbnail,
      images: property.gallery?.map(img => img.Url) || [],
      bedrooms: Number(property.bedroom) || 0,
      bathrooms: Number(property.bathrooms) || 0,
      area: Number(property.area) || 0,
      area_unit: property.area_size || "Sq.Ft.",
      listing_type: property.listing_type || "sale",
      property_type: property.property_type || "Apartment",
      community: property.community || "",
      city: property.city || "",
      area_name: property.area || "",
      featured: property.featured_property === '1',
      ask_to_price: property.askprice === '1',
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
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useProperties = () => {
  const [state, setState] = useState({
    properties: [],
    loading: true,
    error: null,
  });

  const fetchProperties = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    utils.debug("Fetching properties from:", `${API_URL}/api/v1/properties`, "with config:", API_CONFIG);

    try {
      const response = await axios.get(`${API_URL}/api/v1/properties`, API_CONFIG);
      const data = response.data;
      utils.debug("API Response received:", data);

      if (!data.success || !Array.isArray(data.listings)) {
        throw new Error("Invalid API response structure: 'listings' array missing or not successful.");
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
        response_status: axios.isAxiosError(err) ? err.response?.status : null,
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

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  const reset = useCallback(() => setCurrentIndex(0), []);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(0);
    }
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

  const isUsingFallback = useCallback((id) => usingFallback.has(id), [usingFallback]);

  return { handleError, hasError, markUsingFallback, isUsingFallback };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (BLACK & WHITE - NO ANIMATIONS)
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
    <div className="aspect-[4/3] bg-gray-100" />
    <div className="p-6 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="pt-2">
        <div className="h-6 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const EmptyState = ({ hasNearby, onClearNearby }) => (
  <div className="text-center py-16">
    <Home size={48} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-xl font-medium text-gray-700 mb-2">
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
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium
          text-white bg-black rounded-full"
      >
        <X size={16} />
        Clear Nearby Filter
      </button>
    )}
  </div>
);

const NearMeButton = ({ isActive, isLoading, onClick }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl text-sm font-medium
      ${
        isActive
          ? "border-black bg-black text-white"
          : "border-gray-300 bg-white text-gray-800 hover:border-black"
      }
      ${isLoading ? "opacity-60 cursor-wait" : ""}`}
  >
    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
    {isLoading ? "Detecting..." : isActive ? "Near Me ✓" : "Near Me"}
  </button>
);

const DistanceBadge = ({ distance }) => {
  if (distance === null || distance === undefined) return null;

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 
      bg-white px-2.5 py-1 rounded-full shadow-md border border-gray-200">
      <Navigation size={12} className="text-black" />
      <span className="text-xs font-semibold text-black">
        {utils.formatDistance(distance)}
      </span>
    </div>
  );
};

const NearbyBanner = ({ count, radius, onClear }) => (
  <div className="mb-8 p-4 bg-gray-100 border border-gray-300 rounded-xl flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
        <MapPin size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-black">
          Showing {count} nearby properties within {radius}km
        </p>
        <p className="text-xs text-gray-600">Sorted by nearest first</p>
      </div>
    </div>
    <button
      onClick={onClear}
      className="flex items-center gap-1 px-3 py-1.5 text-sm text-black hover:bg-gray-200 rounded-lg"
    >
      <X size={14} />
      Clear
    </button>
  </div>
);

const SectionHeader = ({
  showNav,
  canPrev,
  canNext,
  onPrev,
  onNext,
  nearbyActive,
  nearbyLoading,
  onNearbyClick,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
    <div>
      <h2 className="text-3xl md:text-4xl font-light text-black uppercase tracking-wide">
        Featured Properties
      </h2>
      <p className="text-gray-600 mt-2">Discover premium real estate opportunities</p>
      <div className="mt-4 h-0.5 w-20 bg-black" />
    </div>

    <div className="flex items-center gap-3">
      <NearMeButton
        isActive={nearbyActive}
        isLoading={nearbyLoading}
        onClick={onNearbyClick}
      />

      {showNav && (
        <div className="flex items-center gap-2">
          <NavButton direction="prev" disabled={!canPrev} onClick={onPrev} />
          <NavButton direction="next" disabled={!canNext} onClick={onNext} />
        </div>
      )}
    </div>
  </div>
);

const NavButton = ({ direction, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === "prev" ? "Previous properties" : "Next properties"}
    className={`p-3 border-2 border-gray-300 rounded-xl bg-white
      ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-black"}`}
  >
    {direction === "prev" ? (
      <ChevronLeft size={20} className="text-black" />
    ) : (
      <ChevronRight size={20} className="text-black" />
    )}
  </button>
);

const ListingTypeBadge = ({ type, hasDistance }) => (
  <span
    className={`absolute ${
      hasDistance ? "top-12" : "top-4"
    } left-4 z-10 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm
      bg-white text-black border-2 border-black`}
  >
    {type === "rent" ? "For Rent" : "For Sale"}
  </span>
);

const FeaturedBadge = ({ hasDistance }) => (
  <div
    className={`absolute ${
      hasDistance ? "top-20" : "top-12"
    } left-4 z-10 flex items-center gap-1.5 
      bg-black text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}
  >
    <Sparkles size={12} />
    Featured
  </div>
);

const CompletionBadge = ({ date }) => {
  if (!date) return null;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 
      bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-200">
      <Calendar size={14} className="text-gray-600" />
      <span className="text-sm font-medium text-black">{formattedDate}</span>
    </div>
  );
};

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

// Updated PropertyImage component with fallback support
const PropertyImage = ({ property, imageUrl, hasError, onError, onFallbackLoad }) => {
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setCurrentSrc(imageUrl);
      setIsUsingFallback(false);
      setFallbackError(false);
      setLoaded(false);
    } else {
      // No image URL provided, use fallback immediately
      const fallbackUrl = utils.getFallbackImage(property.id);
      setCurrentSrc(fallbackUrl);
      setIsUsingFallback(true);
      setLoaded(false);
    }
  }, [imageUrl, property.id]);

  const handleImageError = () => {
    if (!isUsingFallback) {
      // First error - switch to fallback
      const fallbackUrl = utils.getFallbackImage(property.id);
      utils.debug(`Image failed for property ${property.id}, using fallback:`, fallbackUrl);
      setCurrentSrc(fallbackUrl);
      setIsUsingFallback(true);
      setLoaded(false);
      onError(property.id, imageUrl);
      if (onFallbackLoad) onFallbackLoad(property.id);
    } else {
      // Fallback also failed
      utils.debug(`Fallback image also failed for property ${property.id}`);
      setFallbackError(true);
    }
  };

  // Show placeholder if both original and fallback failed
  if (fallbackError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-3">
          <Home size={36} className="text-gray-500" />
        </div>
        <span className="text-gray-500 text-sm font-medium">Property Image</span>
        <span className="text-gray-400 text-xs mt-1">Coming Soon</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading spinner */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 size={30} className="text-gray-400 animate-spin" />
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
      
      {/* Optional: Show a subtle indicator that this is a placeholder image */}
      {isUsingFallback && loaded && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
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
  const bedroomText = utils.formatBedrooms(property.bedrooms);
  const bathroomText = utils.formatBathrooms(property.bathrooms);
  const areaText = utils.formatArea(property.area, property.area_unit);
  const hasDistanceBadge = showDistance && property.distance !== null;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(property.id);
  };

  return (
    <article
      onClick={() => onClick(property)}
      className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 
        cursor-pointer hover:shadow-xl transition-shadow duration-300"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(property)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {hasDistanceBadge && <DistanceBadge distance={property.distance} />}
        <ListingTypeBadge type={property.listing_type} hasDistance={hasDistanceBadge} />
        {property.featured && <FeaturedBadge hasDistance={hasDistanceBadge} />}

        <PropertyImage
          property={property}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
          onFallbackLoad={onFallbackLoad}
        />

        {property.completion_date && <CompletionBadge date={property.completion_date} />}

        <FavoriteButton
          isLiked={isLiked}
          isSaving={isSaving}
          onClick={handleFavoriteClick}
        />
      </div>

      {/* Content Section */}
      <div className="p-5">
        {property.developer_name && (
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 size={12} />
            {property.developer_name}
          </p>
        )}

        <h3 className="text-lg font-semibold text-black mb-2 truncate">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-4">
          <MapPin size={14} className="mr-1.5 flex-shrink-0" />
          <span className="text-sm truncate">{property.location || "Location TBA"}</span>
          {showDistance && property.distance !== null && (
            <span className="ml-2 text-xs text-black font-medium">
              ({utils.formatDistance(property.distance)})
            </span>
          )}
        </div>

        {/* Property Specs */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
          {bedroomText && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Bed size={16} className="text-gray-500" />
              <span className="font-medium text-black">{bedroomText}</span>
            </div>
          )}

          {bathroomText && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Bath size={16} className="text-gray-500" />
              <span className="font-medium text-black">{bathroomText}</span>
            </div>
          )}

          {areaText && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Ruler size={16} className="text-gray-500" />
              <span className="font-medium text-black">{areaText}</span>
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              {property.ask_to_price ? "Price" : "Starting From"}
            </p>
            <p className="text-xl font-bold text-black">
              {property.ask_to_price
                ? "Price on Request"
                : `${property.currency} ${utils.formatPrice(property.price)}`}
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
              group-hover:bg-black transition-colors duration-300"
            aria-hidden="true"
          >
            <ArrowUpRight
              size={18}
              className="text-black group-hover:text-white transition-colors duration-300"
            />
          </div>
        </div>
      </div>
    </article>
  );
};

const ViewAllButton = ({ onClick, nearbyActive }) => (
  <div className="mt-14 text-center">
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold
        text-white bg-black border-2 border-black rounded-full
        hover:bg-white hover:text-black transition-all duration-300"
    >
      {nearbyActive ? "View All Nearby Properties" : "View All Properties"}
      <ArrowUpRight size={16} />
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
  const { handleError: handleImageError, hasError: imageHasError, markUsingFallback } = useImageLoader();

  const [userLocation, setUserLocation] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

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
      utils.debug("Not nearby active or no user location. Sorting by featured status.");
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
        const keep = property.distance !== null && property.distance <= NEARBY_RADIUS_KM;
        if (!keep) utils.debug(`Property ${property.id} (${property.title}) excluded: distance ${property.distance} > ${NEARBY_RADIUS_KM}km or lat/lng missing.`);
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
      className="bg-white py-20 px-6 md:px-14"
      aria-labelledby="featured-properties-title"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          showNav={carousel.showNavigation}
          canPrev={carousel.canGoPrev}
          canNext={carousel.canGoNext}
          onPrev={carousel.goToPrev}
          onNext={carousel.goToNext}
          nearbyActive={nearbyActive}
          nearbyLoading={nearbyLoading}
          onNearbyClick={handleNearbyClick}
        />

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">Error loading properties:</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
          <EmptyState hasNearby={nearbyActive} onClearNearby={handleClearNearby} />
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
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

            <ViewAllButton onClick={handleViewAll} nearbyActive={nearbyActive} />
          </>
        )}
      </div>
    </section>
  );
}