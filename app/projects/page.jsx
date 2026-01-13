"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
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
  Navigation,
  X,
  Grid3X3,
  LayoutList,
  Bed,
  Home,
  DollarSign,
  Filter,
  RotateCcw,
  ArrowDownUp,
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

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-500000", label: "Under 500K" },
  { value: "500000-1000000", label: "500K - 1M" },
  { value: "1000000-2000000", label: "1M - 2M" },
  { value: "2000000-5000000", label: "2M - 5M" },
  { value: "5000000-10000000", label: "5M - 10M" },
  { value: "10000000-", label: "Above 10M" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "off_plan", label: "Off Plan" },
  { value: "ready", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
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

  buildImageUrl: (project) => {
    const imagePath = project.image || project.featured_image || utils.parseImages(project.images)[0];
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/uploads/projects/${cleanPath}`;
  },

  formatBedrooms: (from, to) => {
    if (!from && !to) return null;
    const fromText = from === 0 ? "Studio" : from;
    const toText = to > from ? ` - ${to}` : "";
    return `${fromText}${toText}`;
  },

  transformProject: (project) => ({
    id: project.id,
    title: project.ProjectName?.trim() || project.title?.trim() || "Untitled Project",
    slug: project.seo_slug || project.slug || project.id.toString(),
    location: project.location || project.LocationName || project.community || project.city || "",
    city: project.city || project.CityName || "",
    community: project.community || "",
    latitude: Number(project.latitude) || null,
    longitude: Number(project.longitude) || null,
    price: Number(project.price) || 0,
    priceTo: Number(project.price_end) || Number(project.price_to) || 0,
    image: project.featured_image || project.image,
    images: project.images,
    bedroomsFrom: Number(project.bedrooms_from) || Number(project.bedroomsFrom) || 0,
    bedroomsTo: Number(project.bedrooms_to) || Number(project.bedroomsTo) || 0,
    handoverDate: project.handover_date || project.handoverDate || project.completion_date || "",
    featured: project.featured_project === 1 || project.featured === true,
    developerName: project.developer_name?.trim() || project.developerName?.trim() || "",
    developerId: project.developer_id,
    status: project.status || 1,
    listingType: project.listing_type || "",
    occupancy: project.occupancy || "",
    description: project.Description || project.description || "",
    createdAt: project.created_at,
  }),

  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useProjects = (filters) => {
  const [state, setState] = useState({
    projects: [],
    loading: true,
    error: null,
    totalCount: 0,
    totalPages: 1,
  });

  const fetchProjects = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = {
        status: 1,
        limit: ITEMS_PER_PAGE,
        page: filters.page || 1,
      };

      // Add search
      if (filters.search) {
        params.search = filters.search;
      }

      // Add bedroom filter
      if (filters.bedrooms) {
        params.bedrooms = filters.bedrooms;
      }

      // Add price range
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split("-");
        if (min) params.price_min = min;
        if (max) params.price_max = max;
      }

      // Add location filter
      if (filters.location) {
        params.location = filters.location;
      }

      // Add developer filter
      if (filters.developer) {
        params.developer_id = filters.developer;
      }

      // Add sorting
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
            params.sort = "ProjectName";
            params.order = "asc";
            break;
          case "name_desc":
            params.sort = "ProjectName";
            params.order = "desc";
            break;
        }
      }

      console.log("🔍 Fetching projects with params:", params);

      const { data } = await axios.get(`${API_URL}/api/v1/projects`, {
        params,
        timeout: 15000,
      });

      console.log("📦 API Response:", data);

      // Handle different response structures
      let projectsList = [];
      let totalCount = 0;

      if (data.listings && Array.isArray(data.listings)) {
        projectsList = data.listings;
        totalCount = data.count || data.total || projectsList.length;
      } else if (data.data && Array.isArray(data.data)) {
        projectsList = data.data;
        totalCount = data.total || data.count || projectsList.length;
      } else if (data.projects && Array.isArray(data.projects)) {
        projectsList = data.projects;
        totalCount = data.total || data.count || projectsList.length;
      }

      // Filter active projects
      const activeProjects = projectsList.filter((p) => p.status === 1);
      const transformedProjects = activeProjects.map(utils.transformProject);

      // Client-side sorting if API doesn't support it
      if (filters.sort) {
        transformedProjects.sort((a, b) => {
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

      // Client-side filtering if needed
      let filteredProjects = [...transformedProjects];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.location.toLowerCase().includes(searchLower) ||
            p.developerName.toLowerCase().includes(searchLower)
        );
      }

      if (filters.bedrooms) {
        const bed = parseInt(filters.bedrooms);
        filteredProjects = filteredProjects.filter((p) => {
          if (bed === 5) return p.bedroomsFrom >= 5 || p.bedroomsTo >= 5;
          return p.bedroomsFrom <= bed && p.bedroomsTo >= bed;
        });
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split("-").map(Number);
        filteredProjects = filteredProjects.filter((p) => {
          if (min && p.price < min) return false;
          if (max && p.price > max) return false;
          return true;
        });
      }

      const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

      setState({
        projects: filteredProjects,
        loading: false,
        error: null,
        totalCount: filteredProjects.length,
        totalPages,
      });
    } catch (err) {
      console.error("❌ Projects fetch error:", err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load projects";

      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { ...state, refetch: fetchProjects };
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const toggleFavorite = useCallback((projectId) => {
    setSavingId(projectId);

    setFavorites((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(projectId);

      if (isAdding) {
        next.add(projectId);
        toast.success("Added to favorites!");
      } else {
        next.delete(projectId);
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

  const handleError = useCallback((projectId) => {
    setErrors((prev) => new Set(prev).add(projectId));
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
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
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

const EmptyState = ({ onReset }) => (
  <div className="text-center py-20">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Building2 size={40} className="text-gray-400" />
    </div>
    <h3 className="text-2xl font-semibold text-gray-800 mb-3">No Projects Found</h3>
    <p className="text-gray-500 mb-8 max-w-md mx-auto">
      We couldn't find any projects matching your criteria. Try adjusting your filters or search terms.
    </p>
    <button
      onClick={onReset}
      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
    >
      <RotateCcw size={18} />
      Reset Filters
    </button>
  </div>
);

const PageHeader = ({ totalCount, loading }) => (
  <div className="mb-8">
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <a href="/" className="hover:text-black transition-colors">Home</a>
      <ChevronRight size={14} />
      <span className="text-black font-medium">Projects</span>
    </nav>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
          All Projects
        </h1>
        <p className="text-gray-600">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Loading projects...
            </span>
          ) : (
            `${totalCount} projects available`
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
      placeholder="Search projects, locations..."
      className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm
        focus:border-black focus:outline-none transition-colors"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
      >
        <X size={16} className="text-gray-400" />
      </button>
    )}
  </div>
);

const FilterSelect = ({ icon: Icon, value, onChange, options, placeholder }) => (
  <div className="relative">
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
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <ArrowDownUp size={16} className="text-gray-400" />
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm
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
      className={`p-3 ${view === "grid" ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
    >
      <Grid3X3 size={18} />
    </button>
    <button
      onClick={() => onChange("list")}
      className={`p-3 ${view === "list" ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
    >
      <LayoutList size={18} />
    </button>
  </div>
);

const ActiveFilters = ({ filters, onRemove, onClear }) => {
  const activeFilters = [];

  if (filters.search) {
    activeFilters.push({ key: "search", label: `Search: "${filters.search}"` });
  }
  if (filters.bedrooms) {
    const opt = BEDROOM_OPTIONS.find((o) => o.value === filters.bedrooms);
    activeFilters.push({ key: "bedrooms", label: opt?.label || filters.bedrooms });
  }
  if (filters.priceRange) {
    const opt = PRICE_RANGES.find((o) => o.value === filters.priceRange);
    activeFilters.push({ key: "priceRange", label: opt?.label || filters.priceRange });
  }
  if (filters.location) {
    activeFilters.push({ key: "location", label: `Location: ${filters.location}` });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-gray-500 mr-2">Active filters:</span>
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 
            rounded-full text-sm hover:bg-gray-200 transition-colors"
        >
          {filter.label}
          <X size={14} />
        </button>
      ))}
      <button
        onClick={onClear}
        className="text-sm text-black underline hover:no-underline ml-2"
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
    <div className="hidden lg:flex items-center gap-4">
      <SearchBar
        value={filters.search}
        onChange={onSearchChange}
        onClear={() => onSearchChange("")}
      />
      <FilterSelect
        icon={Bed}
        value={filters.bedrooms}
        onChange={(v) => onFilterChange("bedrooms", v)}
        options={BEDROOM_OPTIONS}
        placeholder="Bedrooms"
      />
      <FilterSelect
        icon={DollarSign}
        value={filters.priceRange}
        onChange={(v) => onFilterChange("priceRange", v)}
        options={PRICE_RANGES}
        placeholder="Price"
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
          className={`p-3 border-2 rounded-xl transition-colors ${
            showMobileFilters ? "border-black bg-black text-white" : "border-gray-200"
          }`}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {showMobileFilters && (
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <FilterSelect
            icon={Bed}
            value={filters.bedrooms}
            onChange={(v) => onFilterChange("bedrooms", v)}
            options={BEDROOM_OPTIONS}
            placeholder="Bedrooms"
          />
          <FilterSelect
            icon={DollarSign}
            value={filters.priceRange}
            onChange={(v) => onFilterChange("priceRange", v)}
            options={PRICE_RANGES}
            placeholder="Price"
          />
          <SortSelect value={filters.sort} onChange={onSortChange} />
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 
              rounded-xl text-sm text-gray-600 hover:border-black transition-colors"
          >
            <RotateCcw size={16} />
            Reset
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

const FeaturedBadge = () => (
  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black text-white 
    px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
    <Sparkles size={12} />
    Featured
  </div>
);

const HandoverBadge = ({ date }) => (
  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 
    bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-gray-100">
    <Calendar size={14} className="text-gray-600" />
    <span className="text-sm font-medium text-black">{date}</span>
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
      ${isLiked ? "bg-black" : "bg-white/95 backdrop-blur-sm hover:bg-white"}
      ${isSaving ? "cursor-wait" : ""}`}
  >
    {isSaving ? (
      <Loader2 size={18} className="animate-spin text-gray-500" />
    ) : (
      <Heart
        size={18}
        className={isLiked ? "fill-white text-white" : "text-black"}
      />
    )}
  </button>
);

const ProjectImage = ({ project, imageUrl, hasError, onError }) => {
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
      alt={project.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => onError(project.id)}
      loading="lazy"
      decoding="async"
    />
  );
};

const ProjectCard = ({
  project,
  imageUrl,
  hasError,
  isLiked,
  isSaving,
  onImageError,
  onFavoriteClick,
  onClick,
}) => {
  const bedroomText = utils.formatBedrooms(project.bedroomsFrom, project.bedroomsTo);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(project.id);
  };

  return (
    <article
      onClick={() => onClick(project)}
      className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 
        cursor-pointer hover:shadow-xl transition-all duration-300"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(project)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {project.featured && <FeaturedBadge />}

        <ProjectImage
          project={project}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
        />

        {project.handoverDate && <HandoverBadge date={project.handoverDate} />}

        <FavoriteButton
          isLiked={isLiked}
          isSaving={isSaving}
          onClick={handleFavoriteClick}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Developer */}
        {project.developerName && (
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 size={12} />
            {project.developerName}
          </p>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-black mb-2 truncate group-hover:text-gray-700 transition-colors">
          {project.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin size={14} className="mr-1.5 flex-shrink-0 text-gray-400" />
          <span className="text-sm truncate">
            {project.location || "Location TBA"}
          </span>
        </div>

        {/* Bedrooms */}
        {bedroomText && (
          <div className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
            <span className="font-semibold text-black">{bedroomText}</span>{" "}
            Bedrooms
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              Starting From
            </p>
            <p className="text-xl font-bold text-black">
              AED {utils.formatPrice(project.price)}
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
            group-hover:bg-black transition-colors duration-300">
            <ArrowUpRight
              size={18}
              className="text-black group-hover:text-white transition-colors"
            />
          </div>
        </div>
      </div>
    </article>
  );
};

const ProjectListCard = ({
  project,
  imageUrl,
  hasError,
  isLiked,
  isSaving,
  onImageError,
  onFavoriteClick,
  onClick,
}) => {
  const bedroomText = utils.formatBedrooms(project.bedroomsFrom, project.bedroomsTo);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(project.id);
  };

  return (
    <article
      onClick={() => onClick(project)}
      className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 
        cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row"
    >
      {/* Image Section */}
      <div className="relative w-full md:w-80 aspect-[4/3] md:aspect-auto bg-gray-100 flex-shrink-0 overflow-hidden">
        {project.featured && <FeaturedBadge />}

        <ProjectImage
          project={project}
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
          {project.developerName && (
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 size={12} />
              {project.developerName}
            </p>
          )}

          <h3 className="text-xl font-semibold text-black mb-2 group-hover:text-gray-700 transition-colors">
            {project.title}
          </h3>

          <div className="flex items-center text-gray-600 mb-3">
            <MapPin size={14} className="mr-1.5 flex-shrink-0 text-gray-400" />
            <span className="text-sm">{project.location || "Location TBA"}</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            {bedroomText && (
              <div className="flex items-center gap-1.5">
                <Bed size={16} className="text-gray-400" />
                <span>{bedroomText} Bedrooms</span>
              </div>
            )}
            {project.handoverDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-gray-400" />
                <span>{project.handoverDate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Starting From</p>
            <p className="text-2xl font-bold text-black">
              AED {utils.formatPrice(project.price)}
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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-3 border-2 border-gray-200 rounded-xl
          ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:border-black"}`}
      >
        <ChevronLeft size={18} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 text-sm font-medium hover:border-black"
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-xl border-2 text-sm font-medium transition-colors
            ${page === currentPage
              ? "border-black bg-black text-white"
              : "border-gray-200 hover:border-black"
            }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 text-sm font-medium hover:border-black"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-3 border-2 border-gray-200 rounded-xl
          ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:border-black"}`}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [view, setView] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    priceRange: searchParams.get("price") || "",
    location: searchParams.get("location") || "",
    developer: searchParams.get("developer") || "",
    sort: searchParams.get("sort") || "newest",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);

  // Fetch projects with current filters
  const { projects, loading, error, totalCount, totalPages, refetch } = useProjects(filters);

  // Favorites & Image loading
  const { savingId, toggleFavorite, isFavorite } = useFavorites();
  const { handleError: handleImageError, hasError: imageHasError } = useImageLoader();

  // Paginated projects
  const paginatedProjects = useMemo(() => {
    const start = (filters.page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return projects.slice(start, end);
  }, [projects, filters.page]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.priceRange) params.set("price", filters.priceRange);
    if (filters.location) params.set("location", filters.location);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", filters.page.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [filters]);

  // Handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
  }, []);

  const handleSortChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, sort: value }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setFilters({
      search: "",
      bedrooms: "",
      priceRange: "",
      location: "",
      developer: "",
      sort: "newest",
      page: 1,
    });
  }, []);

  const handleProjectClick = useCallback(
    (project) => {
      router.push(`/projects/${project.slug || project.id}`);
    },
    [router]
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black text-white py-16 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Premium Projects
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Explore our curated collection of off-plan developments, luxury residences, 
            and investment opportunities across prime locations.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          <PageHeader totalCount={totalCount} loading={loading} />

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
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingGrid />}

          {/* Empty State */}
          {!loading && paginatedProjects.length === 0 && (
            <EmptyState onReset={handleReset} />
          )}

          {/* Projects Grid */}
          {!loading && paginatedProjects.length > 0 && (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      imageUrl={utils.buildImageUrl(project)}
                      hasError={imageHasError(project.id)}
                      isLiked={isFavorite(project.id)}
                      isSaving={savingId === project.id}
                      onImageError={handleImageError}
                      onFavoriteClick={toggleFavorite}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {paginatedProjects.map((project) => (
                    <ProjectListCard
                      key={project.id}
                      project={project}
                      imageUrl={utils.buildImageUrl(project)}
                      hasError={imageHasError(project.id)}
                      isLiked={isFavorite(project.id)}
                      isSaving={savingId === project.id}
                      onImageError={handleImageError}
                      onFavoriteClick={toggleFavorite}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              <Pagination
                currentPage={filters.page}
                totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}