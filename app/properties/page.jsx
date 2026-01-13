"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Heart,
  ImageOff,
  MapPin,
  Loader2,
  Building2,
  ArrowUpRight,
  Sparkles,
  X,
  Grid3X3,
  LayoutList,
  Bed,
  Bath,
  Maximize,
  Car,
  DollarSign,
  RotateCcw,
  ArrowDownUp,
  Home,
  Tag,
  Check,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 12;
const SKELETON_COUNT = 6;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

const BEDROOM_OPTIONS = [
  { value: "", label: "Any Bedrooms" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5+ Bedrooms" },
];

const BATHROOM_OPTIONS = [
  { value: "", label: "Any Bathrooms" },
  { value: "1", label: "1 Bathroom" },
  { value: "2", label: "2 Bathrooms" },
  { value: "3", label: "3 Bathrooms" },
  { value: "4", label: "4 Bathrooms" },
  { value: "5", label: "5+ Bathrooms" },
];

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-500000", label: "Under 500K" },
  { value: "500000-1000000", label: "500K - 1M" },
  { value: "1000000-2000000", label: "1M - 2M" },
  { value: "2000000-5000000", label: "2M - 5M" },
  { value: "5000000-10000000", label: "5M - 10M" },
  { value: "10000000-", label: "Above 10M" },
];

const PURPOSE_OPTIONS = [
  { value: "", label: "All Purpose" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
];

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "studio", label: "Studio" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
  { value: "land", label: "Land" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  formatPrice: (value) => {
    if (!value || value <= 0) return "Price on Request";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  },

  formatPriceShort: (value) => {
    if (!value || value <= 0) return "POA";
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  },

  parseJSON: (data, fallback = []) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : fallback;
      } catch {
        return data.trim() ? [data] : fallback;
      }
    }
    return fallback;
  },

  parseCommaSeparated: (str) => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  },

  buildImageUrl: (property) => {
    const imagePath = property.image || property.featured_image || property.main_image;
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/uploads/properties/${cleanPath}`;
  },

  isNumericId: (value) => /^\d+$/.test(value),

  // Transform API response to normalized property object
  transformProperty: (raw) => ({
    id: raw.id,
    title: raw.title || raw.property_title || raw.PropertyName || raw.name || "Untitled Property",
    slug: raw.slug || raw.property_slug || raw.seo_slug || raw.id.toString(),
    description: raw.description || raw.Description || "",
    
    // Type & Purpose
    type: raw.type || raw.property_type || raw.PropertyType || "",
    purpose: raw.purpose || raw.listing_type || raw.Purpose || "",
    
    // Location
    location: raw.location || raw.LocationName || raw.address || "",
    city: raw.city || raw.CityName || raw.city_name || "",
    community: raw.community || raw.CommunityName || "",
    building: raw.building_name || raw.BuildingName || "",
    
    // Pricing
    price: Number(raw.price) || 0,
    priceTo: Number(raw.price_to) || Number(raw.max_price) || 0,
    currency: raw.currency || "AED",
    
    // Details
    bedrooms: Number(raw.bedrooms) || Number(raw.bedroom) || Number(raw.Bedrooms) || 0,
    bathrooms: Number(raw.bathrooms) || Number(raw.bathroom) || Number(raw.Bathrooms) || 0,
    area: Number(raw.area) || Number(raw.size) || Number(raw.Area) || 0,
    areaUnit: raw.area_unit || raw.size_unit || "Sq.Ft.",
    parking: Number(raw.parking) || Number(raw.parking_spaces) || 0,
    
    // Status
    featured: raw.featured === 1 || raw.featured === "1" || raw.is_featured === true,
    verified: raw.verified === 1 || raw.verified === "1",
    status: raw.status || 1,
    
    // Media
    image: raw.image || raw.featured_image || raw.main_image,
    images: utils.parseJSON(raw.images) || utils.parseCommaSeparated(raw.gallery_images) || [],
    
    // Agent/Developer
    agentName: raw.agent_name || "",
    agentId: raw.agent_id,
    developerId: raw.developer_id,
    
    // Amenities
    amenities: utils.parseJSON(raw.amenities) || [],
    
    // Dates
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useInfiniteProperties = (filters) => {
  const [state, setState] = useState({
    properties: [],
    loading: true,
    loadingMore: false,
    error: null,
    hasMore: true,
    page: 1,
    totalCount: 0,
  });

  const fetchProperties = useCallback(async (pageNum = 1, append = false) => {
    if (append) {
      setState((prev) => ({ ...prev, loadingMore: true }));
    } else {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const params = {
        status: 1,
        limit: ITEMS_PER_PAGE,
        page: pageNum,
      };

      // Add filters
      if (filters.search) params.search = filters.search;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      if (filters.bathrooms) params.bathrooms = filters.bathrooms;
      if (filters.type) params.type = filters.type;
      if (filters.purpose) params.purpose = filters.purpose;
      if (filters.location) params.location = filters.location;

      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split("-");
        if (min) params.price_min = min;
        if (max) params.price_max = max;
      }

      // Sorting
      if (filters.sort) {
        switch (filters.sort) {
          case "newest":
            params.sort = "created_at";
            params.order = "desc";
            break;
          case "oldest":
            params.sort = "created_at";
            params.order = "asc";
            break;
          case "price_low":
            params.sort = "price";
            params.order = "asc";
            break;
          case "price_high":
            params.sort = "price";
            params.order = "desc";
            break;
          case "name_asc":
            params.sort = "title";
            params.order = "asc";
            break;
          case "name_desc":
            params.sort = "title";
            params.order = "desc";
            break;
        }
      }

      console.log("🔍 Fetching properties:", params);

      const { data } = await axios.get(`${API_URL}/api/v1/properties`, {
        params,
        timeout: 15000,
      });

      console.log("📦 Properties API Response:", data);

      // Handle different response structures
      let propertiesList = [];
      let totalCount = 0;

      if (data.data && Array.isArray(data.data)) {
        propertiesList = data.data;
        totalCount = data.total || data.count || propertiesList.length;
      } else if (data.properties && Array.isArray(data.properties)) {
        propertiesList = data.properties;
        totalCount = data.total || data.count || propertiesList.length;
      } else if (data.listings && Array.isArray(data.listings)) {
        propertiesList = data.listings;
        totalCount = data.count || data.total || propertiesList.length;
      } else if (Array.isArray(data)) {
        propertiesList = data;
        totalCount = data.length;
      }

      // Filter & transform
      const activeProperties = propertiesList.filter((p) => p.status === 1 || p.status === "1");
      let transformedProperties = activeProperties.map(utils.transformProperty);

      // Client-side filtering
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        transformedProperties = transformedProperties.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.location.toLowerCase().includes(searchLower) ||
            p.city.toLowerCase().includes(searchLower) ||
            p.type.toLowerCase().includes(searchLower)
        );
      }

      if (filters.bedrooms) {
        const bed = parseInt(filters.bedrooms);
        transformedProperties = transformedProperties.filter((p) => {
          if (bed === 5) return p.bedrooms >= 5;
          if (bed === 0) return p.bedrooms === 0;
          return p.bedrooms === bed;
        });
      }

      if (filters.bathrooms) {
        const bath = parseInt(filters.bathrooms);
        transformedProperties = transformedProperties.filter((p) => {
          if (bath === 5) return p.bathrooms >= 5;
          return p.bathrooms === bath;
        });
      }

      if (filters.type) {
        transformedProperties = transformedProperties.filter(
          (p) => p.type.toLowerCase() === filters.type.toLowerCase()
        );
      }

      if (filters.purpose) {
        transformedProperties = transformedProperties.filter(
          (p) => p.purpose.toLowerCase().includes(filters.purpose.toLowerCase())
        );
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split("-").map(Number);
        transformedProperties = transformedProperties.filter((p) => {
          if (min && p.price < min) return false;
          if (max && p.price > max) return false;
          return true;
        });
      }

      // Client-side sorting
      if (filters.sort) {
        transformedProperties.sort((a, b) => {
          switch (filters.sort) {
            case "newest":
              return new Date(b.createdAt) - new Date(a.createdAt);
            case "oldest":
              return new Date(a.createdAt) - new Date(b.createdAt);
            case "price_low":
              return a.price - b.price;
            case "price_high":
              return b.price - a.price;
            case "name_asc":
              return a.title.localeCompare(b.title);
            case "name_desc":
              return b.title.localeCompare(a.title);
            default:
              return 0;
          }
        });
      }

      const hasMore = transformedProperties.length >= ITEMS_PER_PAGE;

      setState((prev) => ({
        properties: append
          ? [...prev.properties, ...transformedProperties]
          : transformedProperties,
        loading: false,
        loadingMore: false,
        error: null,
        hasMore,
        page: pageNum,
        totalCount: append ? prev.totalCount : transformedProperties.length,
      }));
    } catch (err) {
      console.error("❌ Properties fetch error:", err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load properties";

      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: message,
      }));
      toast.error(message);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    setState((prev) => ({ ...prev, properties: [], page: 1, hasMore: true }));
    fetchProperties(1, false);
  }, [filters.search, filters.bedrooms, filters.bathrooms, filters.type, filters.purpose, filters.priceRange, filters.sort, filters.location]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!state.loadingMore && state.hasMore) {
      fetchProperties(state.page + 1, true);
    }
  }, [state.loadingMore, state.hasMore, state.page, fetchProperties]);

  return {
    ...state,
    loadMore,
    refetch: () => fetchProperties(1, false),
  };
};

// Intersection Observer Hook for Infinite Scroll
const useIntersectionObserver = (callback, options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, {
      threshold: 0.1,
      rootMargin: "100px",
      ...options,
    });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [callback, options]);

  return ref;
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("property_favorites");
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error("Error loading favorites:", e);
    }
  }, []);

  const toggleFavorite = useCallback(async (propertyId) => {
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

      // Save to localStorage
      try {
        localStorage.setItem("property_favorites", JSON.stringify([...next]));
      } catch (e) {
        console.error("Error saving favorites:", e);
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

  const handleError = useCallback((propertyId) => {
    setErrors((prev) => new Set(prev).add(propertyId));
  }, []);

  const hasError = useCallback((id) => errors.has(id), [errors]);

  return { handleError, hasError };
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="flex gap-4 pt-2">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
      <div className="pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  </div>
);

const LoadingGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: SKELETON_COUNT }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const LoadingMore = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
      <Loader2 size={20} className="animate-spin text-black" />
      <span className="text-gray-600 font-medium">Loading more properties...</span>
    </div>
  </div>
);

const EmptyState = ({ onReset, hasFilters }) => (
  <div className="text-center py-20">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Home size={48} className="text-gray-400" />
    </div>
    <h3 className="text-2xl font-semibold text-gray-800 mb-3">No Properties Found</h3>
    <p className="text-gray-500 mb-8 max-w-md mx-auto">
      {hasFilters
        ? "We couldn't find any properties matching your criteria. Try adjusting your filters."
        : "There are no properties available at the moment. Please check back later."}
    </p>
    {hasFilters && (
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
      >
        <RotateCcw size={18} />
        Reset All Filters
      </button>
    )}
  </div>
);

const PageHeader = ({ totalCount, loading }) => (
  <div className="mb-8">
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <a href="/" className="hover:text-black transition-colors">Home</a>
      <ChevronRight size={14} />
      <span className="text-black font-medium">Properties</span>
    </nav>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
          All Properties
        </h1>
        <p className="text-gray-600">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Loading properties...
            </span>
          ) : (
            `${totalCount} properties found`
          )}
        </p>
      </div>
      <div className="h-0.5 w-20 bg-black hidden md:block" />
    </div>
  </div>
);

const SearchBar = ({ value, onChange, onClear }) => (
  <div className="relative flex-1 max-w-md">
    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search properties, locations..."
      className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm
        focus:border-black focus:outline-none transition-colors"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={16} className="text-gray-400" />
      </button>
    )}
  </div>
);

const FilterSelect = ({ icon: Icon, value, onChange, options }) => (
  <div className="relative min-w-[140px]">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <Icon size={16} className="text-gray-400" />
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm
        bg-white focus:border-black focus:outline-none transition-colors cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

const SortSelect = ({ value, onChange }) => (
  <div className="relative min-w-[160px]">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <ArrowDownUp size={16} className="text-gray-400" />
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm
        bg-white focus:border-black focus:outline-none transition-colors cursor-pointer"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

const ViewToggle = ({ view, onChange }) => (
  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
    <button
      onClick={() => onChange("grid")}
      className={`p-3 transition-colors ${view === "grid" ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
      aria-label="Grid view"
    >
      <Grid3X3 size={18} />
    </button>
    <button
      onClick={() => onChange("list")}
      className={`p-3 transition-colors ${view === "list" ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
      aria-label="List view"
    >
      <LayoutList size={18} />
    </button>
  </div>
);

const ActiveFilters = ({ filters, onRemove, onClear }) => {
  const activeFilters = [];

  if (filters.search) {
    activeFilters.push({ key: "search", label: `"${filters.search}"` });
  }
  if (filters.bedrooms) {
    const opt = BEDROOM_OPTIONS.find((o) => o.value === filters.bedrooms);
    activeFilters.push({ key: "bedrooms", label: opt?.label || `${filters.bedrooms} Bed` });
  }
  if (filters.bathrooms) {
    const opt = BATHROOM_OPTIONS.find((o) => o.value === filters.bathrooms);
    activeFilters.push({ key: "bathrooms", label: opt?.label || `${filters.bathrooms} Bath` });
  }
  if (filters.priceRange) {
    const opt = PRICE_RANGES.find((o) => o.value === filters.priceRange);
    activeFilters.push({ key: "priceRange", label: opt?.label || filters.priceRange });
  }
  if (filters.type) {
    const opt = PROPERTY_TYPES.find((o) => o.value === filters.type);
    activeFilters.push({ key: "type", label: opt?.label || filters.type });
  }
  if (filters.purpose) {
    const opt = PURPOSE_OPTIONS.find((o) => o.value === filters.purpose);
    activeFilters.push({ key: "purpose", label: opt?.label || filters.purpose });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-gray-500 mr-2">Active filters:</span>
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white 
            rounded-full text-sm hover:bg-gray-800 transition-colors"
        >
          {filter.label}
          <X size={14} />
        </button>
      ))}
      <button
        onClick={onClear}
        className="text-sm text-gray-600 underline hover:text-black hover:no-underline ml-2 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
};

const FiltersBar = ({
  filters,
  onFilterChange,
  onSearchChange,
  onSortChange,
  onViewChange,
  onReset,
  view,
  showMobileFilters,
  onToggleMobileFilters,
}) => (
  <div className="space-y-4 mb-8">
    {/* Desktop Filters */}
    <div className="hidden lg:flex items-center gap-3 flex-wrap">
      <SearchBar
        value={filters.search}
        onChange={onSearchChange}
        onClear={() => onSearchChange("")}
      />
      <FilterSelect
        icon={Home}
        value={filters.type}
        onChange={(v) => onFilterChange("type", v)}
        options={PROPERTY_TYPES}
      />
      <FilterSelect
        icon={Tag}
        value={filters.purpose}
        onChange={(v) => onFilterChange("purpose", v)}
        options={PURPOSE_OPTIONS}
      />
      <FilterSelect
        icon={Bed}
        value={filters.bedrooms}
        onChange={(v) => onFilterChange("bedrooms", v)}
        options={BEDROOM_OPTIONS}
      />
      <FilterSelect
        icon={DollarSign}
        value={filters.priceRange}
        onChange={(v) => onFilterChange("priceRange", v)}
        options={PRICE_RANGES}
      />
      <SortSelect value={filters.sort} onChange={onSortChange} />
      <ViewToggle view={view} onChange={onViewChange} />
    </div>

    {/* Mobile Filters */}
    <div className="lg:hidden space-y-4">
      <div className="flex items-center gap-3">
        <SearchBar
          value={filters.search}
          onChange={onSearchChange}
          onClear={() => onSearchChange("")}
        />
        <button
          onClick={onToggleMobileFilters}
          className={`p-3 border-2 rounded-xl transition-colors flex-shrink-0 ${
            showMobileFilters ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal size={20} />
        </button>
        <ViewToggle view={view} onChange={onViewChange} />
      </div>

      {showMobileFilters && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <FilterSelect
            icon={Home}
            value={filters.type}
            onChange={(v) => onFilterChange("type", v)}
            options={PROPERTY_TYPES}
          />
          <FilterSelect
            icon={Tag}
            value={filters.purpose}
            onChange={(v) => onFilterChange("purpose", v)}
            options={PURPOSE_OPTIONS}
          />
          <FilterSelect
            icon={Bed}
            value={filters.bedrooms}
            onChange={(v) => onFilterChange("bedrooms", v)}
            options={BEDROOM_OPTIONS}
          />
          <FilterSelect
            icon={Bath}
            value={filters.bathrooms}
            onChange={(v) => onFilterChange("bathrooms", v)}
            options={BATHROOM_OPTIONS}
          />
          <FilterSelect
            icon={DollarSign}
            value={filters.priceRange}
            onChange={(v) => onFilterChange("priceRange", v)}
            options={PRICE_RANGES}
          />
          <SortSelect value={filters.sort} onChange={onSortChange} />
          <button
            onClick={onReset}
            className="col-span-2 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 
              rounded-xl text-sm text-gray-700 hover:border-black hover:text-black transition-colors"
          >
            <RotateCcw size={16} />
            Reset All Filters
          </button>
        </div>
      )}
    </div>

    {/* Active Filters Tags */}
    <ActiveFilters
      filters={filters}
      onRemove={(key) => onFilterChange(key, "")}
      onClear={onReset}
    />
  </div>
);

const PurposeBadge = ({ purpose }) => {
  if (!purpose) return null;

  const isRent = purpose.toLowerCase().includes("rent");
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      isRent 
        ? "bg-blue-100 text-blue-700" 
        : "bg-green-100 text-green-700"
    }`}>
      For {isRent ? "Rent" : "Sale"}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  if (!type) return null;
  
  return (
    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold capitalize">
      {type}
    </span>
  );
};

const FeaturedBadge = () => (
  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black text-white 
    px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
    <Sparkles size={12} />
    Featured
  </div>
);

const VerifiedBadge = () => (
  <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-blue-600 text-white 
    px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
    <Check size={12} />
    Verified
  </div>
);

const FavoriteButton = ({ isLiked, isSaving, onClick }) => (
  <button
    onClick={onClick}
    disabled={isSaving}
    aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
    className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full 
      flex items-center justify-center shadow-lg border border-gray-100
      transition-all duration-200
      ${isLiked ? "bg-red-500" : "bg-white/95 backdrop-blur-sm hover:bg-white"}
      ${isSaving ? "cursor-wait" : ""}`}
  >
    {isSaving ? (
      <Loader2 size={18} className="animate-spin text-gray-500" />
    ) : (
      <Heart
        size={18}
        className={isLiked ? "fill-white text-white" : "text-gray-700"}
      />
    )}
  </button>
);

const PropertyImage = ({ property, imageUrl, hasError, onError }) => {
  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <ImageOff size={40} className="text-gray-300" />
        <span className="text-gray-400 text-sm mt-2">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={property.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => onError(property.id)}
      loading="lazy"
      decoding="async"
    />
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
}) => {
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(property.id);
  };

  return (
    <article
      onClick={() => onClick(property)}
      className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 
        cursor-pointer hover:shadow-xl transition-all duration-300"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(property)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {property.featured && <FeaturedBadge />}
        {property.verified && !property.featured && <VerifiedBadge />}

        <PropertyImage
          property={property}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
        />

        <FavoriteButton
          isLiked={isLiked}
          isSaving={isSaving}
          onClick={handleFavoriteClick}
        />

        {/* Price Badge */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
          <p className="text-lg font-bold text-black">
            {property.currency} {utils.formatPrice(property.price)}
          </p>
          {property.purpose?.toLowerCase().includes("rent") && (
            <span className="text-xs text-gray-500">/month</span>
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <PurposeBadge purpose={property.purpose} />
          <TypeBadge type={property.type} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-black mb-2 truncate group-hover:text-gray-700 transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin size={14} className="mr-1.5 flex-shrink-0 text-gray-400" />
          <span className="text-sm truncate">
            {property.location || property.city || "Location TBA"}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pb-4 border-b border-gray-100">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed size={16} className="text-gray-400" />
              <span>{property.bedrooms === 0 ? "Studio" : property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={16} className="text-gray-400" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.area > 0 && (
            <div className="flex items-center gap-1">
              <Maximize size={16} className="text-gray-400" />
              <span>{utils.formatPrice(property.area)} {property.areaUnit}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-500">View Details</span>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
            group-hover:bg-black transition-colors duration-300">
            <ArrowUpRight
              size={18}
              className="text-gray-600 group-hover:text-white transition-colors"
            />
          </div>
        </div>
      </div>
    </article>
  );
};

const PropertyListCard = ({
  property,
  imageUrl,
  hasError,
  isLiked,
  isSaving,
  onImageError,
  onFavoriteClick,
  onClick,
}) => {
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(property.id);
  };

  return (
    <article
      onClick={() => onClick(property)}
      className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 
        cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row"
    >
      {/* Image Section */}
      <div className="relative w-full md:w-80 lg:w-96 aspect-[4/3] md:aspect-auto md:h-auto bg-gray-100 flex-shrink-0 overflow-hidden">
        {property.featured && <FeaturedBadge />}
        {property.verified && !property.featured && <VerifiedBadge />}

        <PropertyImage
          property={property}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
        />

        <FavoriteButton
          isLiked={isLiked}
          isSaving={isSaving}
          onClick={handleFavoriteClick}
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <PurposeBadge purpose={property.purpose} />
            <TypeBadge type={property.type} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-black mb-2 group-hover:text-gray-700 transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin size={14} className="mr-1.5 flex-shrink-0 text-gray-400" />
            <span className="text-sm">{property.location || property.city || "Location TBA"}</span>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            {property.bedrooms >= 0 && (
              <div className="flex items-center gap-1.5">
                <Bed size={18} className="text-gray-400" />
                <span>{property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Beds`}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath size={18} className="text-gray-400" />
                <span>{property.bathrooms} Baths</span>
              </div>
            )}
            {property.area > 0 && (
              <div className="flex items-center gap-1.5">
                <Maximize size={18} className="text-gray-400" />
                <span>{utils.formatPrice(property.area)} {property.areaUnit}</span>
              </div>
            )}
            {property.parking > 0 && (
              <div className="flex items-center gap-1.5">
                <Car size={18} className="text-gray-400" />
                <span>{property.parking} Parking</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {property.purpose?.toLowerCase().includes("rent") ? "Monthly Rent" : "Price"}
            </p>
            <p className="text-2xl font-bold text-black">
              {property.currency} {utils.formatPrice(property.price)}
            </p>
          </div>

          <button className="px-6 py-3 bg-black text-white rounded-full text-sm font-medium
            hover:bg-gray-800 transition-colors flex items-center gap-2">
            View Details
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};

const EndOfResults = ({ count }) => (
  <div className="text-center py-12 border-t border-gray-200 mt-8">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Check size={32} className="text-gray-400" />
    </div>
    <p className="text-gray-600 font-medium">You've seen all {count} properties</p>
    <p className="text-gray-400 text-sm mt-1">Try adjusting filters to see more results</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [view, setView] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    priceRange: searchParams.get("price") || "",
    type: searchParams.get("type") || "",
    purpose: searchParams.get("purpose") || "",
    location: searchParams.get("location") || "",
    sort: searchParams.get("sort") || "newest",
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);

  // Fetch properties with infinite scroll
  const {
    properties,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    refetch,
  } = useInfiniteProperties(filters);

  // Favorites & Image loading
  const { savingId, toggleFavorite, isFavorite } = useFavorites();
  const { handleError: handleImageError, hasError: imageHasError } = useImageLoader();

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(() => {
    if (!loading && !loadingMore && hasMore) {
      loadMore();
    }
  });

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((prev) => ({ ...prev, search: searchInput }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
    if (filters.priceRange) params.set("price", filters.priceRange);
    if (filters.type) params.set("type", filters.type);
    if (filters.purpose) params.set("purpose", filters.purpose);
    if (filters.location) params.set("location", filters.location);
    if (filters.sort !== "newest") params.set("sort", filters.sort);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
      filters.bedrooms ||
      filters.bathrooms ||
      filters.priceRange ||
      filters.type ||
      filters.purpose ||
      filters.location
    );
  }, [filters]);

  // Handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
  }, []);

  const handleSortChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setFilters({
      search: "",
      bedrooms: "",
      bathrooms: "",
      priceRange: "",
      type: "",
      purpose: "",
      location: "",
      sort: "newest",
    });
  }, []);

  const handlePropertyClick = useCallback(
    (property) => {
      router.push(`/properties/${property.slug || property.id}`);
    },
    [router]
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black text-white py-16 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Property
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Browse through our extensive collection of properties for sale and rent.
            From luxury villas to modern apartments, find your dream home today.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          <PageHeader totalCount={totalCount} loading={loading && properties.length === 0} />

          <FiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onViewChange={setView}
            onReset={handleReset}
            view={view}
            showMobileFilters={showMobileFilters}
            onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
          />

          {/* Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <p className="text-red-600">Error: {error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Initial Loading State */}
          {loading && properties.length === 0 && <LoadingGrid />}

          {/* Empty State */}
          {!loading && properties.length === 0 && (
            <EmptyState onReset={handleReset} hasFilters={hasActiveFilters} />
          )}

          {/* Properties Grid/List */}
          {properties.length > 0 && (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      imageUrl={utils.buildImageUrl(property)}
                      hasError={imageHasError(property.id)}
                      isLiked={isFavorite(property.id)}
                      isSaving={savingId === property.id}
                      onImageError={handleImageError}
                      onFavoriteClick={toggleFavorite}
                      onClick={handlePropertyClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {properties.map((property) => (
                    <PropertyListCard
                      key={property.id}
                      property={property}
                      imageUrl={utils.buildImageUrl(property)}
                      hasError={imageHasError(property.id)}
                      isLiked={isFavorite(property.id)}
                      isSaving={savingId === property.id}
                      onImageError={handleImageError}
                      onFavoriteClick={toggleFavorite}
                      onClick={handlePropertyClick}
                    />
                  ))}
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="py-4">
                  {loadingMore && <LoadingMore />}
                </div>
              )}

              {/* End of Results */}
              {!hasMore && properties.length > 0 && (
                <EndOfResults count={properties.length} />
              )}
            </>
          )}
        </div>
      </section>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </main>
  );
}

// Scroll to Top Button Component
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 w-12 h-12 bg-black text-white rounded-full shadow-lg 
        flex items-center justify-center hover:bg-gray-800 transition-all duration-300
        hover:scale-110 z-50"
      aria-label="Scroll to top"
    >
      <ChevronDown size={24} className="rotate-180" />
    </button>
  );
};