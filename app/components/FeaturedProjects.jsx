"use client";

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

// Optimized fallback - single high-quality image instead of array
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80&auto=format";

const API_CONFIG = {
  params: { status: 1, limit: 20 },
  withCredentials: true,
  timeout: 8000, // Reduced timeout
};

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED UTILS
// ═══════════════════════════════════════════════════════════════════

const utils = {
  formatPrice: (value) => {
    if (!value || value <= 0) return "Price on Request";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  },

  generateSlug: (title) => {
    if (!title?.trim()) return "";
    return title.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  // Optimized image parsing
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

  // Smart image URL builder - returns null if no valid image
  buildImageUrl: (project) => {
    const imagePath = project.image || utils.parseImages(project.images)[0];
    if (!imagePath) return null;
    
    // If already full URL, return as is
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    
    // Build API URL
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/uploads/projects/${cleanPath}`;
  },

  formatBedrooms: (from, to) => {
    if (!from && !to) return null;
    const fromText = from === 0 ? "Studio" : from;
    const toText = to > from ? ` - ${to}` : "";
    return `${fromText}${toText}`;
  },

  // Optimized distance calculation with memoization
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

  // Optimized transform with minimal processing
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
// OPTIMIZED HOOKS
// ═══════════════════════════════════════════════════════════════════

const useProjects = () => {
  const [state, setState] = useState({
    projects: [],
    loading: true,
    error: null,
  });
  const fetchedRef = useRef(false);

  const fetchProjects = useCallback(async () => {
    if (fetchedRef.current) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${API_URL}/api/v1/projects`, API_CONFIG);

      if (!data.success || !Array.isArray(data.listings)) {
        throw new Error("Invalid API response");
      }

      const activeListings = data.listings.filter((p) => p.status === 1);
      const projects = activeListings.map(utils.transformProject);
      
      setState({ projects, loading: false, error: null });
      fetchedRef.current = true;
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

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED IMAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════

const ProjectImage = ({ project, imageUrl }) => {
  const [imgSrc, setImgSrc] = useState(imageUrl || FALLBACK_IMAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setImgSrc(imageUrl || FALLBACK_IMAGE);
    setIsLoading(true);
    setHasError(false);
  }, [imageUrl]);

  const handleError = useCallback(() => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
      setIsLoading(true);
      setHasError(true);
    }
  }, [imgSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            const img = imgRef.current;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="text-gray-400 animate-spin" />
        </div>
      )}

      <img
        ref={imgRef}
        data-src={imgSrc}
        alt={project.title}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: isLoading ? 0 : 1 }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />

      {hasError && !isLoading && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md">
          Default Image
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS (Optimized)
// ═══════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="h-56 bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
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
      transition-colors
      ${isActive ? "bg-black text-white border-black" : "text-gray-500 hover:border-gray-500"}
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
  if (!distance) return null;
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-full shadow-sm border border-gray-200">
      <Navigation size={11} className="text-gray-700" />
      <span className="text-[10px] font-medium text-gray-800">
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
        <p className="text-sm font-medium text-gray-900">
          {count} projects within {radius}km
        </p>
        <p className="text-xs text-gray-500">Sorted by distance</p>
      </div>
    </div>
    <button
      onClick={onClear}
      className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
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
    <h2 className="text-xs md:text-sm font-normal tracking-[0.4em] text-gray-900 uppercase">
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
            className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm transition-all
              ${!canPrev ? "opacity-40 cursor-not-allowed" : "hover:border-gray-500"}`}
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm transition-all
              ${!canNext ? "opacity-40 cursor-not-allowed" : "hover:border-gray-500"}`}
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </>
      )}
    </div>
  </div>
);

const ProjectCard = ({
  project,
  imageUrl,
  isLiked,
  isSaving,
  onFavoriteClick,
  onClick,
  showDistance = false,
}) => {
  const hasDistance = showDistance && project.distance !== null;
  const bedroomText = utils.formatBedrooms(project.bedroomsFrom, project.bedroomsTo);

  return (
    <article
      onClick={() => onClick(project)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 
        cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col"
    >
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {hasDistance && <DistanceBadge distance={project.distance} />}
        
        {project.featured && (
          <div className={`absolute ${hasDistance ? "top-9" : "top-3"} left-3 z-10 
            flex items-center gap-1.5 bg-black text-white px-2.5 py-1 rounded-full text-[10px] shadow-sm`}>
            <Sparkles size={11} />
            Featured
          </div>
        )}

        <ProjectImage project={project} imageUrl={imageUrl} />

        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <button
            className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-sm border border-gray-200 hover:bg-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={15} className="text-gray-700" />
          </button>
          <button
            className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-sm border border-gray-200 hover:bg-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <RotateCcw size={15} className="text-gray-700" />
          </button>
        </div>

        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronLeft size={14} className="text-gray-700" />
        </button>
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronRight size={14} className="text-gray-700" />
        </button>

        {project.handoverDate && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200">
            <Calendar size={12} className="text-gray-600" />
            <span className="text-[11px] font-normal text-gray-800">{project.handoverDate}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div>
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900 line-clamp-2">
            {project.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} />
            {project.location || "Location TBA"}
          </p>
          {bedroomText && (
            <p className="mt-2 text-xs text-gray-600">{bedroomText} Bedrooms</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Start Price -{" "}
            <span className="font-medium text-gray-900">
              AED {utils.formatPrice(project.price)}
            </span>
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteClick(project.id);
            }}
            disabled={isSaving}
            className={isSaving ? "cursor-wait opacity-60" : ""}
          >
            {isSaving ? (
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            ) : (
              <Heart
                size={22}
                className={isLiked ? "text-gray-900 fill-gray-900" : "text-gray-800 hover:fill-gray-800 transition-all"}
              />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function FeaturedProjects() {
  const router = useRouter();

  const { projects, loading, error } = useProjects();
  const { savingId, toggleFavorite, isFavorite } = useFavorites();

  const [userLocation, setUserLocation] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

  const handleNearbyClick = useCallback(() => {
    if (nearbyActive) {
      setNearbyActive(false);
      setUserLocation(null);
      toast.success("Filter cleared");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
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
      () => {
        setNearbyLoading(false);
        toast.error("Location access denied");
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }, [nearbyActive]);

  const handleClearNearby = useCallback(() => {
    setNearbyActive(false);
    setUserLocation(null);
    toast.success("Filter cleared");
  }, []);

  const projectsWithDistance = useMemo(() => {
    if (!nearbyActive || !userLocation) {
      return [...projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return projects
      .map((project) => ({
        ...project,
        distance: utils.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          project.latitude,
          project.longitude
        ),
      }))
      .filter((p) => p.distance !== null && p.distance <= NEARBY_RADIUS_KM)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [projects, nearbyActive, userLocation]);

  const carousel = useCarousel(projectsWithDistance.length);

  useEffect(() => {
    carousel.reset();
  }, [nearbyActive, carousel]);

  const visibleProjects = useMemo(
    () => projectsWithDistance.slice(carousel.currentIndex, carousel.currentIndex + VISIBLE_CARDS),
    [projectsWithDistance, carousel.currentIndex]
  );

  const handleProjectClick = useCallback(
    (project) => router.push(`/projects/${project.slug || project.id}`),
    [router]
  );

  const handleViewAll = useCallback(() => {
    if (nearbyActive && userLocation) {
      router.push(`/projects?nearby=true&lat=${userLocation.lat}&lng=${userLocation.lng}`);
    } else {
      router.push("/projects");
    }
  }, [router, nearbyActive, userLocation]);

  return (
    <section className="bg-gray-50 py-12 px-4 md:px-10">
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
            <p className="font-medium mb-1">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1.5 text-xs bg-red-100 rounded hover:bg-red-200"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  imageUrl={utils.buildImageUrl(project)}
                  isLiked={isFavorite(project.id)}
                  isSaving={savingId === project.id}
                  onFavoriteClick={toggleFavorite}
                  onClick={handleProjectClick}
                  showDistance={nearbyActive}
                />
              ))}
            </div>

            <div className="mt-10 text-center">
              <button
                onClick={handleViewAll}
                className="inline-flex items-center justify-center px-10 py-3 text-sm font-normal
                  bg-transparent text-black border border-transparent hover:border-black rounded-full transition-colors"
              >
                All Projects
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}