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

// Fallback/Placeholder images for when project image fails to load
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80", // Modern apartment building
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80", // Glass skyscraper
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80", // Luxury apartments
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80", // Modern villa
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80", // Luxury home
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80", // Modern house
];

// Default fallback if all else fails
const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80";

const API_CONFIG = {
  params: { status: 1, limit: 20 },
  withCredentials: true,
  timeout: 10000,
};

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

  buildImageUrl: (project) => {
    const imagePath = project.image || utils.parseImages(project.images)[0];
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/uploads/projects/${cleanPath}`;
  },

  // Get a consistent fallback image based on project ID
  getFallbackImage: (projectId) => {
    if (!projectId) return DEFAULT_FALLBACK;
    const index = projectId % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
  },

  formatBedrooms: (from, to) => {
    if (!from && !to) return null;
    const fromText = from === 0 ? "Studio" : from;
    const toText = to > from ? ` - ${to}` : "";
    return `${fromText}${toText}`;
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

  transformProject: (project) => ({
    id: project.id,
    title: project.ProjectName?.trim() || "Untitled Project",
    slug: project.id.toString(),
    location: project.location || project.community || project.city || "",
    latitude: Number(project.latitude) || null,
    longitude: Number(project.longitude) || null,
    price: Number(project.price) || 0,
    image: project.featured_image || project.image,
    images: project.images,
    bedroomsFrom: Number(project.bedrooms_from) || 0,
    bedroomsTo: Number(project.bedrooms_to) || 0,
    handoverDate: project.handover_date || "",
    featured: project.featured_project === 1,
    developerName: project.developer_name?.trim() || "",
    distance: null,
    status: project.status || 1,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useProjects = () => {
  const [state, setState] = useState({
    projects: [],
    loading: true,
    error: null,
  });

  const fetchProjects = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("🔍 Fetching projects from:", `${API_URL}/api/v1/projects`);
      const { data } = await axios.get(`${API_URL}/api/v1/projects`, API_CONFIG);
      console.log("✅ API Response received:", {
        success: data.success,
        count: data.count,
        listingsLength: data.listings?.length,
        hasDataArray: Array.isArray(data.data),
        keys: Object.keys(data)
      });

      if (!data.success || !Array.isArray(data.listings)) {
        console.error("❌ Invalid API response structure:", data);
        throw new Error("Invalid API response structure");
      }

      const activeListings = data.listings.filter(p => p.status === 1);
      console.log(`📊 Filtered ${activeListings.length} active projects from ${data.listings.length} total`);

      const projects = activeListings.map(utils.transformProject);
      
      console.log(`📋 Transformed ${projects.length} projects`);
      setState({ projects, loading: false, error: null });
    } catch (err) {
      console.error("❌ Projects fetch error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load projects";

      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { ...state, refetch: fetchProjects };
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
  const [usingFallback, setUsingFallback] = useState(new Set());

  const handleError = useCallback((projectId) => {
    setErrors((prev) => new Set(prev).add(projectId));
  }, []);

  const hasError = useCallback((id) => errors.has(id), [errors]);

  const markUsingFallback = useCallback((projectId) => {
    setUsingFallback((prev) => new Set(prev).add(projectId));
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
    <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-xl font-medium text-gray-700 mb-2">
      {hasNearby ? "No Nearby Projects Found" : "No Projects Available"}
    </h3>
    <p className="text-gray-500 mb-4">
      {hasNearby
        ? "Try increasing the search radius or clear the filter"
        : "Check back soon for new developments"}
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
    {isLoading ? (
      <Loader2 size={16} />
    ) : (
      <Navigation size={16} />
    )}
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
        Featured Projects
      </h2>
      <p className="text-gray-600 mt-2">Discover our premium developments</p>
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
    aria-label={direction === "prev" ? "Previous projects" : "Next projects"}
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

const FeaturedBadge = ({ hasDistance }) => (
  <div
    className={`absolute ${hasDistance ? "top-12" : "top-4"} left-4 z-10 
      flex items-center gap-1.5 bg-black text-white 
      px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}
  >
    <Sparkles size={12} />
    Featured
  </div>
);

const HandoverBadge = ({ date }) => (
  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 
    bg-white px-3 py-1.5 rounded-lg shadow-md border border-gray-200">
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
      flex items-center justify-center shadow-lg border border-gray-200
      ${isLiked ? "bg-black" : "bg-white"}
      ${isSaving ? "cursor-wait" : ""}`}
  >
    {isSaving ? (
      <Loader2 size={18} className="text-gray-500" />
    ) : (
      <Heart
        size={18}
        className={isLiked ? "fill-white text-white" : "text-black"}
      />
    )}
  </button>
);

// Updated ProjectImage component with fallback support
const ProjectImage = ({ project, imageUrl, hasError, onError, onFallbackLoad }) => {
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Reset state when imageUrl changes
  useEffect(() => {
    setCurrentSrc(imageUrl);
    setIsUsingFallback(false);
    setFallbackError(false);
  }, [imageUrl]);

  const handleImageError = () => {
    if (!isUsingFallback) {
      // First error - switch to fallback
      const fallbackUrl = utils.getFallbackImage(project.id);
      console.log(`🖼️ Image failed for project ${project.id}, using fallback:`, fallbackUrl);
      setCurrentSrc(fallbackUrl);
      setIsUsingFallback(true);
      onError(project.id);
      if (onFallbackLoad) onFallbackLoad(project.id);
    } else {
      // Fallback also failed
      console.log(`❌ Fallback image also failed for project ${project.id}`);
      setFallbackError(true);
    }
  };

  // Show placeholder if no image URL or both original and fallback failed
  if ((!imageUrl && !isUsingFallback) || fallbackError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-3">
          <Building2 size={36} className="text-gray-500" />
        </div>
        <span className="text-gray-500 text-sm font-medium">Property Image</span>
        <span className="text-gray-400 text-xs mt-1">Coming Soon</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={currentSrc || utils.getFallbackImage(project.id)}
        alt={project.title}
        className="w-full h-full object-cover"
        onError={handleImageError}
        loading="lazy"
        decoding="async"
      />
      {/* Optional: Show a subtle indicator that this is a placeholder image */}
      {isUsingFallback && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          <ImageOff size={10} className="inline mr-1" />
          Sample Image
        </div>
      )}
    </div>
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
  showDistance = false,
  onFallbackLoad,
}) => {
  const bedroomText = utils.formatBedrooms(project.bedroomsFrom, project.bedroomsTo);
  const hasDistanceBadge = showDistance && project.distance !== null;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(project.id);
  };

  return (
    <article
      onClick={() => onClick(project)}
      className="group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 
        cursor-pointer hover:shadow-xl"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(project)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {hasDistanceBadge && <DistanceBadge distance={project.distance} />}
        {project.featured && <FeaturedBadge hasDistance={hasDistanceBadge} />}

        <ProjectImage
          project={project}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
          onFallbackLoad={onFallbackLoad}
        />

        {project.handoverDate && <HandoverBadge date={project.handoverDate} />}

        <FavoriteButton
          isLiked={isLiked}
          isSaving={isSaving}
          onClick={handleFavoriteClick}
        />
      </div>

      {/* Content Section */}
      <div className="p-5">
        {project.developerName && (
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 size={12} />
            {project.developerName}
          </p>
        )}

        <h3 className="text-lg font-semibold text-black mb-2 truncate">
          {project.title}
        </h3>

        <div className="flex items-center text-gray-600 mb-4">
          <MapPin size={14} className="mr-1.5 flex-shrink-0" />
          <span className="text-sm truncate">
            {project.location || "Location TBA"}
          </span>
          {showDistance && project.distance !== null && (
            <span className="ml-2 text-xs text-black font-medium">
              ({utils.formatDistance(project.distance)})
            </span>
          )}
        </div>

        {bedroomText && (
          <div className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
            <span className="font-semibold text-black">{bedroomText}</span>{" "}
            Bedrooms
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              Starting From
            </p>
            <p className="text-xl font-bold text-black">
              AED {utils.formatPrice(project.price)}
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
              group-hover:bg-black"
            aria-hidden="true"
          >
            <ArrowUpRight
              size={18}
              className="text-black group-hover:text-white"
            />
          </div>
        </div>
      </div>
    </article>
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
          Showing {count} nearby projects within {radius}km
        </p>
        <p className="text-xs text-gray-600">Sorted by nearest first</p>
      </div>
    </div>
    <button
      onClick={onClear}
      className="flex items-center gap-1 px-3 py-1.5 text-sm text-black 
        hover:bg-gray-200 rounded-lg"
    >
      <X size={14} />
      Clear
    </button>
  </div>
);

const ViewAllButton = ({ onClick, nearbyActive }) => (
  <div className="mt-14 text-center">
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold
        text-white bg-black border-2 border-black rounded-full
        hover:bg-white hover:text-black"
    >
      {nearbyActive ? "View All Nearby Projects" : "View All Projects"}
      <ArrowUpRight size={16} />
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function FeaturedProjects() {
  const router = useRouter();

  const { projects, loading, error } = useProjects();
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
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setNearbyLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setNearbyActive(true);
        setNearbyLoading(false);
        toast.success("Showing nearby projects!");
      },
      (err) => {
        console.error("Location Error:", err);
        setNearbyLoading(false);

        if (err.code === 1) {
          toast.error("Location permission denied.");
        } else if (err.code === 2) {
          toast.error("Location unavailable.");
        } else {
          toast.error("Unable to get your location.");
        }
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
  }, []);

  const projectsWithDistance = useMemo(() => {
    if (!nearbyActive || !userLocation) {
      return [...projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return projects
      .map((project) => {
        const distance = utils.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          project.latitude,
          project.longitude
        );
        return { ...project, distance };
      })
      .filter((project) => {
        if (project.distance === null) return false;
        return project.distance <= NEARBY_RADIUS_KM;
      })
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [projects, nearbyActive, userLocation]);

  const carousel = useCarousel(projectsWithDistance.length);

  useEffect(() => {
    carousel.reset();
  }, [nearbyActive]);

  const visibleProjects = useMemo(
    () =>
      projectsWithDistance.slice(
        carousel.currentIndex,
        carousel.currentIndex + VISIBLE_CARDS
      ),
    [projectsWithDistance, carousel.currentIndex]
  );

  const handleProjectClick = useCallback(
    (project) => {
      const path = `/projects/${project.slug || project.id}`;
      router.push(path);
    },
    [router]
  );

  const handleViewAll = useCallback(() => {
    if (nearbyActive && userLocation) {
      router.push(
        `/projects?nearby=true&lat=${userLocation.lat}&lng=${userLocation.lng}`
      );
    } else {
      router.push("/projects");
    }
  }, [router, nearbyActive, userLocation]);

  console.log("🎯 Main component state:", {
    loading,
    error,
    projectsCount: projects.length,
    projectsWithDistanceCount: projectsWithDistance.length,
    visibleProjectsCount: visibleProjects.length,
    currentIndex: carousel.currentIndex,
    nearbyActive
  });

  return (
    <section
      className="bg-white py-20 px-6 md:px-14"
      aria-labelledby="featured-projects-title"
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
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded"
            >
              Retry
            </button>
          </div>
        )}

        {nearbyActive && projectsWithDistance.length > 0 && (
          <NearbyBanner
            count={projectsWithDistance.length}
            radius={NEARBY_RADIUS_KM}
            onClear={handleClearNearby}
          />
        )}

        {loading ? (
          <LoadingState />
        ) : projectsWithDistance.length === 0 ? (
          <EmptyState hasNearby={nearbyActive} onClearNearby={handleClearNearby} />
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
              role="list"
              aria-label="Featured projects"
            >
              {visibleProjects.map((project) => (
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
                  showDistance={nearbyActive}
                  onFallbackLoad={markUsingFallback}
                />
              ))}
            </div>

            <ViewAllButton onClick={handleViewAll} nearbyActive={nearbyActive} />
          </>
        )}
      </div>
    </section>
  );
}