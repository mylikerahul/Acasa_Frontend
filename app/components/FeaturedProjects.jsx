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
  Sparkles,
  Navigation,
  X,
  Eye,
  RotateCcw,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VISIBLE_CARDS = 3;
const SKELETON_COUNT = 3;
const NEARBY_RADIUS_KM = 20;

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80",
];

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80";

const API_CONFIG = {
  params: { status: 1, limit: 20 },
  withCredentials: true,
  timeout: 10000,
};

// ═══════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════

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

  getFallbackImage: (projectId) => {
    if (!projectId && projectId !== 0) return DEFAULT_FALLBACK;
    const index = projectId % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index] || DEFAULT_FALLBACK;
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
    slug: project.id?.toString() || utils.generateSlug(project.ProjectName),
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

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

const useProjects = () => {
  const [state, setState] = useState({
    projects: [],
    loading: true,
    error: null,
  });

  const fetchProjects = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(
        `${API_URL}/api/v1/projects`,
        API_CONFIG
      );

      if (!data.success || !Array.isArray(data.listings)) {
        throw new Error("Invalid API response structure");
      }

      const activeListings = data.listings.filter((p) => p.status === 1);
      const projects = activeListings.map(utils.transformProject);
      setState({ projects, loading: false, error: null });
    } catch (err) {
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

  const goToPrev = useCallback(
    () => setCurrentIndex((prev) => Math.max(0, prev - 1)),
    []
  );

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

  const isUsingFallback = useCallback(
    (id) => usingFallback.has(id),
    [usingFallback]
  );

  return { handleError, hasError, markUsingFallback, isUsingFallback };
};

// ═══════════════════════════════════════════════════════════════════
// UI SUB‑COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="h-56 bg-gray-100" />
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
    <Building2 size={40} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-normal text-gray-700 mb-2">
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
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-normal
          text-gray-800 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
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
    className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center
      text-gray-500
      ${
        isActive
          ? "bg-black text-white border-black"
          : "hover:border-gray-500 hover:text-gray-700"
      }
      ${isLoading ? "opacity-60 cursor-wait" : ""}`}
    aria-label="Show projects near me"
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
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-full shadow-sm border border-gray-200">
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
          Showing {count} nearby projects within {radius}km
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
  <div className="flex items-center justify-between mb-8">
    <h2
      id="featured-projects-title"
      className="text-xs md:text-sm font-normal tracking-[0.4em] text-[#111827] uppercase"
    >
      Featured Projects
    </h2>

    <div className="flex items-center gap-3">
      <NearMeButton
        isActive={nearbyActive}
        isLoading={nearbyLoading}
        onClick={onNearbyClick}
      />
      {showNav && (
        <>
          <button
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Previous projects"
            className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm
              ${
                !canPrev
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:border-gray-500 hover:text-gray-700"
              }`}
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            aria-label="Next projects"
            className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm
              ${
                !canNext
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:border-gray-500 hover:text-gray-700"
              }`}
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </>
      )}
    </div>
  </div>
);

const FeaturedBadge = ({ hasDistance }) => (
  <div
    className={`absolute ${
      hasDistance ? "top-9" : "top-3"
    } left-3 z-10 flex items-center gap-1.5 
      bg-black text-white px-2.5 py-1 rounded-full text-[10px] font-normal shadow-sm`}
  >
    <Sparkles size={11} />
    Featured
  </div>
);

const HandoverBadge = ({ date }) => {
  if (!date) return null;
  return (
    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200">
      <Calendar size={12} className="text-gray-600" />
      <span className="text-[11px] font-normal text-gray-800">{date}</span>
    </div>
  );
};

const ProjectImage = ({ project, imageUrl, onError, onFallbackLoad }) => {
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  useEffect(() => {
    setCurrentSrc(imageUrl);
    setIsUsingFallback(false);
    setLoaded(false);
    setFallbackError(false);
  }, [imageUrl]);

  const handleImageError = () => {
    if (!isUsingFallback) {
      const fallbackUrl = utils.getFallbackImage(project.id);
      setCurrentSrc(fallbackUrl);
      setIsUsingFallback(true);
      setLoaded(false);
      onError(project.id);
      if (onFallbackLoad) onFallbackLoad(project.id);
    } else {
      setFallbackError(true);
    }
  };

  if (fallbackError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
          <Building2 size={30} className="text-gray-500" />
        </div>
        <span className="text-gray-500 text-sm font-normal">
          Project Image
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
        src={currentSrc || utils.getFallbackImage(project.id)}
        alt={project.title}
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

const ProjectCard = ({
  project,
  imageUrl,
  isLiked,
  isSaving,
  onFavoriteClick,
  onClick,
  showDistance = false,
  onImageError,
  onFallbackLoad,
}) => {
  const hasDistanceBadge = showDistance && project.distance !== null;
  const bedroomText = utils.formatBedrooms(
    project.bedroomsFrom,
    project.bedroomsTo
  );

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(project.id);
  };

  return (
    <article
      onClick={() => onClick(project)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 
        cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(project)}
    >
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {hasDistanceBadge && <DistanceBadge distance={project.distance} />}
        {project.featured && <FeaturedBadge hasDistance={hasDistanceBadge} />}

        <ProjectImage
          project={project}
          imageUrl={imageUrl}
          onError={onImageError}
          onFallbackLoad={onFallbackLoad}
        />

        {/* Top-right buttons */}
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

        {project.handoverDate && <HandoverBadge date={project.handoverDate} />}
      </div>

      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div className="pr-2">
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900 line-clamp-2">
            {project.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} />
            {project.location || "Location TBA"}
          </p>
          {bedroomText && (
            <p className="mt-2 text-xs text-gray-600">
              {bedroomText} Bedrooms
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Start Price -{" "}
            <span className="font-normal text-gray-900">
              AED {utils.formatPrice(project.price)}
            </span>
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
      All Projects
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function FeaturedProjects() {
  const router = useRouter();

  const { projects, loading, error } = useProjects();
  const { savingId, toggleFavorite, isFavorite } = useFavorites();
  const { handleError: handleImageError, markUsingFallback } = useImageLoader();

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
      return [...projects].sort(
        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      );
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
  }, [nearbyActive, carousel]);

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

  return (
    <section
      className="bg-[#F7F7F7] py-12 px-4 md:px-10"
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <p className="font-normal mb-1">Error loading projects:</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
          <EmptyState
            hasNearby={nearbyActive}
            onClearNearby={handleClearNearby}
          />
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Featured projects"
            >
              {visibleProjects.map((project) => {
                const imageUrl = utils.buildImageUrl(project);
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    imageUrl={imageUrl}
                    isLiked={isFavorite(project.id)}
                    isSaving={savingId === project.id}
                    onFavoriteClick={toggleFavorite}
                    onClick={handleProjectClick}
                    showDistance={nearbyActive}
                    onImageError={handleImageError}
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
