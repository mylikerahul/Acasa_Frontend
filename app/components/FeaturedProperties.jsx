"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FEATURED PROPERTIES COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @description    Displays featured real estate properties with carousel navigation,
 *                 location-based filtering, and favorites functionality.
 * @version        2.0.0
 * @author         Your Company Name
 * @license        CodeCanyon Regular/Extended License
 *
 * @features
 * - Responsive carousel with smooth navigation
 * - Geolocation-based nearby properties filter
 * - Favorites management with optimistic updates
 * - Lazy loading images with fallback
 * - SSR compatible (Next.js App Router)
 * - Accessible (WCAG 2.1 AA compliant)
 *
 * @dependencies
 * - react ^18.0.0
 * - next ^14.0.0
 * - axios ^1.6.0
 * - react-hot-toast ^2.4.0
 * - lucide-react ^0.300.0
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Loader2,
  Home,
  Calendar,
  Sparkles,
  Navigation,
  X,
  RotateCcw,
  Eye,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Application Configuration
 * @constant
 */
const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_TIMEOUT: 8000,
  API_RETRY_ATTEMPTS: 2,
};

/**
 * UI Configuration
 * @constant
 */
const UI_CONFIG = {
  VISIBLE_CARDS: 3,
  SKELETON_COUNT: 3,
  NEARBY_RADIUS_KM: 20,
  IMAGE_LAZY_LOAD_MARGIN: "50px",
  ANIMATION_DURATION: 300,
};

/**
 * Fallback image for properties without images
 * @constant
 */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80&auto=format";

/**
 * Axios request configuration
 * @constant
 */
const API_REQUEST_CONFIG = {
  params: { status: 1, limit: 20, featured_only: true },
  withCredentials: true,
  timeout: CONFIG.API_TIMEOUT,
};

/**
 * Geolocation options
 * @constant
 */
const GEOLOCATION_OPTIONS = {
  timeout: 10000,
  enableHighAccuracy: false,
  maximumAge: 300000, // 5 minutes cache
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Utility functions for data transformation and formatting
 * @namespace Utils
 */
const Utils = {
  /**
   * Formats price value to readable string
   * @param {number} value - Price value
   * @returns {string} Formatted price or "Price on Request"
   */
  formatPrice: (value) => {
    if (!value || value <= 0) return "Price on Request";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  },

  /**
   * Generates URL-friendly slug from title
   * @param {string} title - Property title
   * @returns {string} URL slug
   */
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

  /**
   * Parses images from various formats (string, array, JSON)
   * @param {string|array} images - Images data
   * @returns {array} Array of image paths
   */
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

  /**
   * Builds complete image URL from property data
   * @param {object} property - Property object
   * @returns {string|null} Complete image URL or null
   */
  buildImageUrl: (property) => {
    const imagePath =
      property.thumbnail ||
      property.featured_image ||
      property.images?.[0] ||
      Utils.parseImages(property.property_images)?.[0];

    if (!imagePath) return null;

    // Return as-is if already a complete URL
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // Build API URL
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${CONFIG.API_URL}/${cleanPath}`;
  },

  /**
   * Formats location from property data
   * @param {object} property - Property object
   * @returns {string} Formatted location string
   */
  formatLocation: (property) => {
    const parts = [property.community, property.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location TBA";
  },

  /**
   * Calculates distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number|null} Distance in kilometers or null
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Earth's radius in km
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

  /**
   * Formats distance for display
   * @param {number} km - Distance in kilometers
   * @returns {string|null} Formatted distance string
   */
  formatDistance: (km) => {
    if (km === null || km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    if (km < 10) return `${km.toFixed(1)}km`;
    return `${Math.round(km)}km`;
  },

  /**
   * Formats date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDate: (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return dateString;
    }
  },

  /**
   * Transforms API response to normalized property object
   * @param {object} property - Raw API property data
   * @returns {object} Normalized property object
   */
  transformProperty: (property) => ({
    id: property.id,
    title: property.property_name?.trim() || "Untitled Property",
    slug:
      property.slug ||
      property.property_slug ||
      Utils.generateSlug(property.property_name),
    location: property.location || Utils.formatLocation(property),
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
    featured: property.featured_property === "1",
    ask_to_price: property.askprice === "1",
    developer_name: property.developer_name || "",
    completion_date: property.completion_date || "",
    created_at: property.created_at,
    distance: null,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for SSR-safe mounting detection
 * @returns {boolean} Whether component is mounted on client
 */
const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};

/**
 * Hook for fetching and managing properties data
 * @returns {object} Properties state and methods
 */
const useProperties = () => {
  const [state, setState] = useState({
    properties: [],
    loading: true,
    error: null,
  });

  const fetchedRef = useRef(false);
  const abortControllerRef = useRef(null);

  const fetchProperties = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchedRef.current) return;

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${CONFIG.API_URL}/api/v1/properties`, {
        ...API_REQUEST_CONFIG,
        signal: abortControllerRef.current.signal,
      });

      if (!data.success || !Array.isArray(data.listings)) {
        throw new Error("Invalid API response format");
      }

      const properties = data.listings.map(Utils.transformProperty);
      setState({ properties, loading: false, error: null });
      fetchedRef.current = true;
    } catch (err) {
      // Ignore abort errors
      if (axios.isCancel(err)) return;

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load properties";

      console.error("Properties fetch error:", err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchProperties();

    // Cleanup: abort pending request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProperties]);

  return { ...state, refetch };
};

/**
 * Hook for carousel navigation
 * @param {number} totalItems - Total number of items
 * @param {number} visibleCount - Number of visible items
 * @returns {object} Carousel state and methods
 */
const useCarousel = (totalItems, visibleCount = UI_CONFIG.VISIBLE_CARDS) => {
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

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  // Reset index if it exceeds max
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

/**
 * Hook for managing favorites with optimistic updates
 * @returns {object} Favorites state and methods
 */
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

    // Reset saving state after animation
    setTimeout(() => setSavingId(null), UI_CONFIG.ANIMATION_DURATION);
  }, []);

  const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

  return { favorites, savingId, toggleFavorite, isFavorite };
};

/**
 * Hook for geolocation with SSR safety
 * @returns {object} Geolocation state and methods
 */
const useGeolocation = () => {
  const [state, setState] = useState({
    location: null,
    loading: false,
    error: null,
    isActive: false,
  });

  const isMounted = useMounted();

  /**
   * Check if geolocation is supported
   */
  const isSupported = useMemo(() => {
    if (!isMounted) return false;
    return typeof navigator !== "undefined" && !!navigator?.geolocation;
  }, [isMounted]);

  /**
   * Request user's location
   */
  const requestLocation = useCallback(() => {
    // SSR safety check
    if (typeof window === "undefined" || !navigator?.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setState({
          location: { lat: latitude, lng: longitude },
          loading: false,
          error: null,
          isActive: true,
        });
        toast.success("Showing nearby properties!");
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        toast.error("Location access denied");
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  /**
   * Clear location filter
   */
  const clearLocation = useCallback(() => {
    setState({
      location: null,
      loading: false,
      error: null,
      isActive: false,
    });
    toast.success("Filter cleared");
  }, []);

  /**
   * Toggle location filter
   */
  const toggleLocation = useCallback(() => {
    if (state.isActive) {
      clearLocation();
    } else {
      requestLocation();
    }
  }, [state.isActive, clearLocation, requestLocation]);

  return {
    ...state,
    isSupported,
    requestLocation,
    clearLocation,
    toggleLocation,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Optimized Image Component with Lazy Loading
 * @component
 */
const PropertyImage = ({ property, imageUrl }) => {
  const [imgSrc, setImgSrc] = useState(imageUrl || FALLBACK_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Reset state when imageUrl changes
  useEffect(() => {
    setImgSrc(imageUrl || FALLBACK_IMAGE);
    setIsLoading(true);
    setHasError(false);
  }, [imageUrl]);

  // Handle image load error
  const handleError = useCallback(() => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
      setIsLoading(true);
      setHasError(true);
    }
  }, [imgSrc]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Intersection Observer for lazy loading (SSR safe)
  useEffect(() => {
    // SSR safety check
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: load image immediately
      if (imgRef.current?.dataset.src) {
        imgRef.current.src = imgRef.current.dataset.src;
      }
      return;
    }

    const imgElement = imgRef.current;
    if (!imgElement) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.dataset.src) {
            entry.target.src = entry.target.dataset.src;
            entry.target.removeAttribute("data-src");
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: UI_CONFIG.IMAGE_LAZY_LOAD_MARGIN }
    );

    observerRef.current.observe(imgElement);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Loading Spinner */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Loader2 size={24} className="text-gray-400 animate-spin" />
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        data-src={imgSrc}
        alt={property.title || "Property"}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: isLoading ? 0 : 1 }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />

      {/* Error Badge */}
      {hasError && !isLoading && (
        <div
          className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md"
          aria-label="Using default image"
        >
          Default Image
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton Loading Card
 * @component
 */
const SkeletonCard = () => (
  <div
    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
    role="status"
    aria-label="Loading property"
  >
    <div className="h-56 bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
    <span className="sr-only">Loading...</span>
  </div>
);

/**
 * Loading State Component
 * @component
 */
const LoadingState = () => (
  <div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    role="status"
    aria-label="Loading properties"
  >
    {Array.from({ length: UI_CONFIG.SKELETON_COUNT }, (_, i) => (
      <SkeletonCard key={`skeleton-${i}`} />
    ))}
  </div>
);

/**
 * Empty State Component
 * @component
 */
const EmptyState = ({ hasNearby, onClearNearby }) => (
  <div className="text-center py-16" role="status">
    <Home
      size={40}
      className="mx-auto text-gray-400 mb-4"
      aria-hidden="true"
    />
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
          text-gray-800 bg-white border border-gray-300 rounded-full 
          hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 
          focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Clear nearby filter"
      >
        <X size={16} aria-hidden="true" />
        Clear Nearby Filter
      </button>
    )}
  </div>
);

/**
 * Error State Component
 * @component
 */
const ErrorState = ({ message, onRetry }) => (
  <div
    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
    role="alert"
  >
    <p className="font-medium mb-1">Error: {message}</p>
    <button
      onClick={onRetry}
      className="mt-2 px-4 py-1.5 text-xs bg-red-100 rounded 
        hover:bg-red-200 transition-colors focus:outline-none 
        focus:ring-2 focus:ring-red-400"
    >
      Retry
    </button>
  </div>
);

/**
 * Distance Badge Component
 * @component
 */
const DistanceBadge = ({ distance }) => {
  if (!distance) return null;

  const formattedDistance = Utils.formatDistance(distance);
  if (!formattedDistance) return null;

  return (
    <div
      className="absolute top-3 left-3 z-10 flex items-center gap-1 
        bg-white/95 px-2 py-1 rounded-full shadow-sm border border-gray-200"
      aria-label={`Distance: ${formattedDistance}`}
    >
      <Navigation size={11} className="text-gray-700" aria-hidden="true" />
      <span className="text-[10px] font-medium text-gray-800">
        {formattedDistance}
      </span>
    </div>
  );
};

/**
 * Nearby Properties Banner
 * @component
 */
const NearbyBanner = ({ count, radius, onClear }) => (
  <div
    className="mb-6 p-4 bg-white border border-gray-200 rounded-xl 
      flex items-center justify-between"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center"
        aria-hidden="true"
      >
        <MapPin size={18} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">
          {count} properties within {radius}km
        </p>
        <p className="text-xs text-gray-500">Sorted by distance</p>
      </div>
    </div>
    <button
      onClick={onClear}
      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 
        hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors
        focus:outline-none focus:ring-2 focus:ring-gray-400"
      aria-label="Clear location filter"
    >
      <X size={13} aria-hidden="true" />
      Clear
    </button>
  </div>
);

/**
 * Navigation Button Component
 * @component
 */
const NavButton = ({ direction, onClick, disabled }) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Previous properties" : "Next properties";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-9 h-9 rounded-full border border-gray-300 bg-white 
        flex items-center justify-center shadow-sm transition-all
        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-gray-500"}
      `}
      aria-label={label}
    >
      <Icon size={18} className="text-gray-700" aria-hidden="true" />
    </button>
  );
};

/**
 * Section Header Component
 * @component
 */
const SectionHeader = ({ showNav, canPrev, canNext, onPrev, onNext }) => (
  <div className="flex items-center justify-between mb-8">
    <h2
      id="featured-properties-heading"
      className="text-xs md:text-sm font-normal tracking-[0.4em] text-gray-900 uppercase"
    >
      Featured Properties
    </h2>

    {showNav && (
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Carousel navigation"
      >
        <NavButton direction="prev" onClick={onPrev} disabled={!canPrev} />
        <NavButton direction="next" onClick={onNext} disabled={!canNext} />
      </div>
    )}
  </div>
);

/**
 * Card Action Button Component
 * @component
 */
const CardActionButton = ({ icon: Icon, onClick, label, size = 15 }) => (
  <button
    className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center 
      shadow-sm border border-gray-200 hover:bg-white transition-colors
      focus:outline-none focus:ring-2 focus:ring-gray-400"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    aria-label={label}
  >
    <Icon size={size} className="text-gray-700" aria-hidden="true" />
  </button>
);

/**
 * Image Navigation Button Component
 * @component
 */
const ImageNavButton = ({ direction, onClick }) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const position = direction === "prev" ? "left-3" : "right-3";
  const label = direction === "prev" ? "Previous image" : "Next image";

  return (
    <button
      className={`absolute ${position} top-1/2 -translate-y-1/2 w-7 h-7 rounded-full 
        bg-white/95 flex items-center justify-center shadow-sm border border-gray-200 
        opacity-0 group-hover:opacity-100 transition-opacity
        focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-gray-400`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
    >
      <Icon size={14} className="text-gray-700" aria-hidden="true" />
    </button>
  );
};

/**
 * Listing Type Badge Component
 * @component
 */
const ListingTypeBadge = ({ type, hasDistance }) => (
  <span
    className={`absolute ${hasDistance ? "top-10" : "top-3"} left-3 z-10 
      px-2.5 py-1 rounded-full text-[10px] shadow-sm bg-white/95 
      text-gray-800 border border-gray-200`}
  >
    {type === "rent" ? "For Rent" : "For Sale"}
  </span>
);

/**
 * Featured Badge Component
 * @component
 */
const FeaturedBadge = ({ hasDistance }) => (
  <div
    className={`absolute ${hasDistance ? "top-16" : "top-9"} left-3 z-10 
      flex items-center gap-1.5 bg-black text-white px-2.5 py-1 
      rounded-full text-[10px] shadow-sm`}
  >
    <Sparkles size={11} aria-hidden="true" />
    <span>Featured</span>
  </div>
);

/**
 * Completion Date Badge Component
 * @component
 */
const CompletionDateBadge = ({ date }) => {
  if (!date) return null;

  return (
    <div
      className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 
        bg-white/95 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200"
    >
      <Calendar size={12} className="text-gray-600" aria-hidden="true" />
      <span className="text-[11px] font-normal text-gray-800">
        {Utils.formatDate(date)}
      </span>
    </div>
  );
};

/**
 * Favorite Button Component
 * @component
 */
const FavoriteButton = ({ isLiked, isSaving, onClick }) => (
  <button
    onClick={onClick}
    disabled={isSaving}
    className={`transition-transform hover:scale-110 focus:outline-none 
      focus:ring-2 focus:ring-gray-400 rounded-full p-1
      ${isSaving ? "cursor-wait opacity-60" : ""}`}
    aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
    aria-pressed={isLiked}
  >
    {isSaving ? (
      <Loader2
        size={20}
        className="text-gray-400 animate-spin"
        aria-hidden="true"
      />
    ) : (
      <Heart
        size={22}
        className={
          isLiked
            ? "text-gray-900 fill-gray-900"
            : "text-gray-800 hover:fill-gray-800 transition-all"
        }
        aria-hidden="true"
      />
    )}
  </button>
);

/**
 * Property Card Component
 * @component
 */
const PropertyCard = ({
  property,
  imageUrl,
  isLiked,
  isSaving,
  onFavoriteClick,
  onClick,
  showDistance = false,
}) => {
  const hasDistance = showDistance && property.distance !== null;
  
  const priceText = property.ask_to_price
    ? "Price on Request"
    : `${property.currency} ${Utils.formatPrice(property.price)}`;

  // Event handlers
  const handleCardClick = useCallback(() => {
    onClick(property);
  }, [onClick, property]);

  const handleFavoriteClick = useCallback(
    (e) => {
      e.stopPropagation();
      onFavoriteClick(property.id);
    },
    [onFavoriteClick, property.id]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick]
  );

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 
        cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col
        focus-within:ring-2 focus-within:ring-gray-400"
      role="button"
      tabIndex={0}
      aria-label={`View ${property.title}`}
    >
      {/* Image Section */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {/* Distance Badge */}
        {hasDistance && <DistanceBadge distance={property.distance} />}

        {/* Listing Type Badge */}
        <ListingTypeBadge type={property.listing_type} hasDistance={hasDistance} />

        {/* Featured Badge */}
        {property.featured && <FeaturedBadge hasDistance={hasDistance} />}

        {/* Property Image */}
        <PropertyImage property={property} imageUrl={imageUrl} />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <CardActionButton icon={Eye} label="Quick view" />
          <CardActionButton icon={RotateCcw} label="Compare" />
        </div>

        {/* Image Navigation */}
        <ImageNavButton direction="prev" />
        <ImageNavButton direction="next" />

        {/* Completion Date */}
        <CompletionDateBadge date={property.completion_date} />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div>
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900 line-clamp-2">
            {property.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" />
            <span>{property.location}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Start Price –{" "}
            <span className="font-medium text-gray-900">{priceText}</span>
          </p>

          <FavoriteButton
            isLiked={isLiked}
            isSaving={isSaving}
            onClick={handleFavoriteClick}
          />
        </div>
      </div>
    </article>
  );
};

/**
 * View All Button Component
 * @component
 */
const ViewAllButton = ({ onClick }) => (
  <div className="mt-10 text-center">
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center px-10 py-3 
        text-sm font-normal bg-transparent text-black border 
        border-transparent hover:border-black rounded-full 
        transition-colors focus:outline-none focus:ring-2 
        focus:ring-gray-400 focus:ring-offset-2"
    >
      All Properties
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Featured Properties Section Component
 *
 * Displays a carousel of featured real estate properties with:
 * - Location-based filtering
 * - Favorites functionality
 * - Responsive design
 * - Accessibility support
 *
 * @component
 * @example
 * return <FeaturedProperties />
 */
export default function FeaturedProperties() {
  // ─────────────────────────────────────────────────────────────────────────────
  // Hooks
  // ─────────────────────────────────────────────────────────────────────────────

  const router = useRouter();
  const isMounted = useMounted();

  // Data fetching
  const { properties, loading, error, refetch } = useProperties();

  // Favorites management
  const { savingId, toggleFavorite, isFavorite } = useFavorites();

  // Geolocation
  const {
    location: userLocation,
    loading: nearbyLoading,
    isActive: nearbyActive,
    toggleLocation,
    clearLocation,
  } = useGeolocation();

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Data
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Properties with distance calculation and sorting
   */
  const propertiesWithDistance = useMemo(() => {
    if (!nearbyActive || !userLocation) {
      // Sort by featured status when no location filter
      return [...properties].sort(
        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      );
    }

    // Calculate distance and filter by radius
    return properties
      .map((property) => ({
        ...property,
        distance: Utils.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          property.latitude,
          property.longitude
        ),
      }))
      .filter(
        (p) => p.distance !== null && p.distance <= UI_CONFIG.NEARBY_RADIUS_KM
      )
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [properties, nearbyActive, userLocation]);

  // Carousel navigation
  const carousel = useCarousel(propertiesWithDistance.length);

  /**
   * Currently visible properties based on carousel index
   */
  const visibleProperties = useMemo(
    () =>
      propertiesWithDistance.slice(
        carousel.currentIndex,
        carousel.currentIndex + UI_CONFIG.VISIBLE_CARDS
      ),
    [propertiesWithDistance, carousel.currentIndex]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────────

  // Reset carousel when nearby filter changes
  useEffect(() => {
    carousel.reset();
  }, [nearbyActive, carousel.reset]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to property detail page
   */
  const handlePropertyClick = useCallback(
    (property) => {
      router.push(`/properties/${property.slug || property.id}`);
    },
    [router]
  );

  /**
   * Navigate to all properties page
   */
  const handleViewAll = useCallback(() => {
    if (nearbyActive && userLocation) {
      router.push(
        `/properties?nearby=true&lat=${userLocation.lat}&lng=${userLocation.lng}`
      );
    } else {
      router.push("/properties");
    }
  }, [router, nearbyActive, userLocation]);

  /**
   * Handle retry on error (SSR safe)
   */
  const handleRetry = useCallback(() => {
    if (typeof window !== "undefined") {
      refetch();
    }
  }, [refetch]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section
      className="bg-gray-50 py-12 px-4 md:px-10"
      aria-labelledby="featured-properties-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <SectionHeader
          showNav={carousel.showNavigation}
          canPrev={carousel.canGoPrev}
          canNext={carousel.canGoNext}
          onPrev={carousel.goToPrev}
          onNext={carousel.goToNext}
        />

        {/* Error State */}
        {error && <ErrorState message={error} onRetry={handleRetry} />}

        {/* Nearby Banner */}
        {nearbyActive && propertiesWithDistance.length > 0 && (
          <NearbyBanner
            count={propertiesWithDistance.length}
            radius={UI_CONFIG.NEARBY_RADIUS_KM}
            onClear={clearLocation}
          />
        )}

        {/* Content States */}
        {loading ? (
          <LoadingState />
        ) : propertiesWithDistance.length === 0 ? (
          <EmptyState hasNearby={nearbyActive} onClearNearby={clearLocation} />
        ) : (
          <>
            {/* Properties Grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Featured properties"
            >
              {visibleProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  imageUrl={Utils.buildImageUrl(property)}
                  isLiked={isFavorite(property.id)}
                  isSaving={savingId === property.id}
                  onFavoriteClick={toggleFavorite}
                  onClick={handlePropertyClick}
                  showDistance={nearbyActive}
                />
              ))}
            </div>

            {/* View All Button */}
            <ViewAllButton onClick={handleViewAll} />
          </>
        )}
      </div>
    </section>
  );
}