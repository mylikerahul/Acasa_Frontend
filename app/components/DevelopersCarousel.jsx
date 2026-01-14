"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Building, Loader2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_VISIBLE_CARDS = 4;
const AUTO_SLIDE_INTERVAL = 4000;

// Single high-quality fallback for developers
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop&q=80&auto=format";

const API_CONFIG = {
  params: { status: 1, limit: 20 },
  withCredentials: true,
  timeout: 8000,
};

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED UTILS
// ═══════════════════════════════════════════════════════════════════

const utils = {
  generateSlug: (name) => {
    if (!name?.trim()) return "";
    return name.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  // Smart image URL builder - returns null if no valid image
  buildImageUrl: (developer) => {
    const imagePath = developer.logo || developer.image;

    if (!imagePath) return null;

    // If already absolute URL
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // Clean the path
    const cleanPath = imagePath.replace(/^\/+/, "");
    
    // Check if has extension
    const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanPath);
    
    // Build URL with or without extension
    if (hasExtension) {
      return `${API_URL}/uploads/developers/${cleanPath}`;
    } else {
      // Try with .webp first (most common)
      return `${API_URL}/uploads/developers/${cleanPath}.webp`;
    }
  },

  getInitials: (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  transformDeveloper: (developer) => ({
    id: developer.id,
    name: developer.name?.trim() || "Unknown Developer",
    slug: developer.seo_slug || utils.generateSlug(developer.name),
    logo: developer.logo,
    image: developer.image,
    description: developer.informations || "",
    projectsCount: Number(developer.total_project) || 0,
    featured: Boolean(developer.featured),
  }),
};

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED HOOKS
// ═══════════════════════════════════════════════════════════════════

const useDevelopers = () => {
  const [state, setState] = useState({
    developers: [],
    loading: true,
    error: null,
  });
  const fetchedRef = useRef(false);

  const fetchDevelopers = useCallback(async () => {
    if (fetchedRef.current) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${API_URL}/api/v1/developers`, API_CONFIG);

      if (!data.success || !data.data || !Array.isArray(data.data.developers)) {
        throw new Error("Invalid API response");
      }

      const developers = data.data.developers.map(utils.transformDeveloper);
      setState({ developers, loading: false, error: null });
      fetchedRef.current = true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load developers";

      console.error("Developers fetch error:", err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    fetchDevelopers();
  }, [fetchDevelopers]);

  return { ...state, refetch: fetchDevelopers };
};

const useCarousel = (
  totalItems,
  responsiveVisibleCount,
  autoSlide = false,
  intervalTime = 3000,
  isPaused = false
) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = useMemo(
    () => Math.max(0, totalItems - responsiveVisibleCount),
    [totalItems, responsiveVisibleCount]
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [totalItems, responsiveVisibleCount]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const showNavigation = totalItems > responsiveVisibleCount;

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  const reset = useCallback(() => setCurrentIndex(0), []);

  // Auto-slide logic
  useEffect(() => {
    if (!autoSlide || !showNavigation || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < maxIndex) {
          return prev + 1;
        } else {
          return 0;
        }
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [autoSlide, intervalTime, showNavigation, maxIndex, isPaused]);

  return {
    currentIndex,
    canGoPrev,
    canGoNext,
    showNavigation,
    goToPrev,
    goToNext,
    reset,
    visibleCount: responsiveVisibleCount,
  };
};

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED IMAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════

const DeveloperImage = ({ imageUrl, name }) => {
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
    } else {
      // Even fallback failed, show initials
      setIsLoading(false);
      setHasError(true);
    }
  }, [imgSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Intersection Observer for lazy loading
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

  // Show initials if no image or fallback also failed
  if (!imageUrl || (hasError && imgSrc === FALLBACK_IMAGE)) {
    return (
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <span className="text-xl font-semibold text-gray-500">
          {utils.getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 mb-3">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={20} className="text-gray-400 animate-spin" />
        </div>
      )}

      <img
        ref={imgRef}
        data-src={imgSrc}
        alt={name}
        className="max-h-20 w-auto object-contain transition-opacity duration-300"
        style={{ opacity: isLoading ? 0 : 1 }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-40 px-4">
    <div className="w-20 h-20 bg-gray-200 rounded-full mb-3 animate-pulse" />
    <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse" />
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: DEFAULT_VISIBLE_CARDS }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <Building size={40} className="mx-auto text-gray-400 mb-3" />
    <h3 className="text-base font-medium text-gray-700 mb-1">No Developers Available</h3>
    <p className="text-xs text-gray-500">Check back soon for new partners</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="text-center py-12">
    <div className="text-red-500 text-3xl mb-3">⚠️</div>
    <h3 className="text-base font-medium text-gray-700 mb-1">Error Loading Developers</h3>
    <p className="text-xs text-gray-500 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
    >
      Try Again
    </button>
  </div>
);

const SectionHeader = () => (
  <div className="mb-6">
    <h2 className="text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-black">
      Developers
    </h2>
  </div>
);

const CornerNav = ({ showNav, canPrev, canNext, onPrev, onNext }) => {
  if (!showNav) return null;

  return (
    <div className="absolute top-4 right-4 md:top-4 md:right-10 flex items-center gap-2 z-10">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={`w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm transition-all duration-200
          ${!canPrev ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:shadow-md active:scale-95"}`}
      >
        <ChevronLeft size={16} className="text-black" />
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className={`w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm transition-all duration-200
          ${!canNext ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:shadow-md active:scale-95"}`}
      >
        <ChevronRight size={16} className="text-black" />
      </button>
    </div>
  );
};

const DeveloperCard = ({ developer, imageUrl, onClick }) => {
  return (
    <article
      onClick={() => onClick(developer)}
      className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-40 px-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
    >
      <DeveloperImage imageUrl={imageUrl} name={developer.name} />

      <div className="w-full px-2 text-sm text-gray-700 text-center truncate font-medium">
        {developer.name}
      </div>
    </article>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function DevelopersSection() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Responsive visible cards logic
  const getResponsiveVisibleCards = useCallback(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE_CARDS;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 768) return 3;
    if (window.innerWidth >= 640) return 2;
    return 2;
  }, []);

  const [responsiveVisibleCards, setResponsiveVisibleCards] = useState(
    getResponsiveVisibleCards()
  );

  useEffect(() => {
    const handleResize = () => {
      setResponsiveVisibleCards(getResponsiveVisibleCards());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getResponsiveVisibleCards]);

  const { developers, loading, error, refetch } = useDevelopers();

  const carousel = useCarousel(
    developers.length,
    responsiveVisibleCards,
    true,
    AUTO_SLIDE_INTERVAL,
    isHovered
  );

  const handleDeveloperClick = useCallback(
    (developer) => {
      router.push(`/developers/${developer.slug || developer.id}`);
    },
    [router]
  );

  return (
    <section className="relative bg-gray-50 py-10 px-6 md:px-14">
      <CornerNav
        showNav={carousel.showNavigation}
        canPrev={carousel.canGoPrev}
        canNext={carousel.canGoNext}
        onPrev={carousel.goToPrev}
        onNext={carousel.goToNext}
      />

      <div className="max-w-7xl mx-auto">
        <SectionHeader />

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : developers.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="relative overflow-hidden w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${
                  (carousel.currentIndex / carousel.visibleCount) * 100
                }%)`,
              }}
            >
              {developers.map((developer) => (
                <div
                  key={developer.id}
                  style={{
                    flexBasis: `${100 / carousel.visibleCount}%`,
                    minWidth: `${100 / carousel.visibleCount}%`,
                  }}
                  className="flex-none px-2"
                >
                  <DeveloperCard
                    developer={developer}
                    imageUrl={utils.buildImageUrl(developer)}
                    onClick={handleDeveloperClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}