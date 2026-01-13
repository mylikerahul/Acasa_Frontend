"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Building } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL; // http://localhost:8080
const DEFAULT_VISIBLE_CARDS = 4; // Default for SSR or unknown screen sizes
const AUTO_SLIDE_INTERVAL = 4000; // ✅ Auto-slide every 4 seconds (4000ms)

// ✅ All possible image extensions
const IMAGE_EXTENSIONS = [".jpg", ".png", ".webp", ".jpeg", ".gif", ".svg"];

const API_CONFIG = {
  params: { status: 1, limit: 20 },
  withCredentials: true,
  timeout: 10000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  generateSlug: (name) => {
    if (!name?.trim()) return "";
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  getBaseImagePath: (developer) => {
    const imagePath = developer.logo || developer.image;

    if (!imagePath) return null;

    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const cleanPath = imagePath.replace(/^\/+/, "");
    const pathWithoutExt = cleanPath.replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "");

    return `${API_URL}/uploads/developers/${pathWithoutExt}`;
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

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useDevelopers = () => {
  const [state, setState] = useState({
    developers: [],
    loading: true,
    error: null,
  });

  const fetchDevelopers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${API_URL}/api/v1/developers`, API_CONFIG);

      if (!data.success || !data.data || !Array.isArray(data.data.developers)) {
        throw new Error("Invalid API response");
      }

      const developers = data.data.developers.map(utils.transformDeveloper);
      setState({ developers, loading: false, error: null });
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

// ✅ Updated useCarousel with autoSlide and isPaused (from hover)
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

  // Reset currentIndex if the number of visible cards changes,
  // or if totalItems changes (e.g., search results change)
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

  // ✅ Auto-slide logic
  useEffect(() => {
    if (!autoSlide || !showNavigation || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < maxIndex) {
          return prev + 1;
        } else {
          return 0; // Loop back to the start
        }
      });
    }, intervalTime);

    return () => clearInterval(interval); // Cleanup!
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

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-40 px-4 animate-pulse">
    <div className="w-20 h-20 bg-gray-200 rounded-full mb-3" />
    <div className="w-3/4 h-3 bg-gray-200 rounded" />
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
    <h2
      id="developers-section-title"
      className="text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-black"
    >
      Developers
    </h2>
  </div>
);

const CornerNav = ({ showNav, canPrev, canNext, onPrev, onNext }) => {
  if (!showNav) return null;

  return (
    <div className="absolute top-4 right-4 md:top-4 md:right-10 flex items-center gap-2 z-10">
      <NavButton direction="prev" disabled={!canPrev} onClick={onPrev} />
      <NavButton direction="next" disabled={!canNext} onClick={onNext} />
    </div>
  );
};

const NavButton = ({ direction, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === "prev" ? "Previous developers" : "Next developers"}
    className={`w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm transition-all duration-200
      ${disabled
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-gray-50 hover:shadow-md active:scale-95"
      }`}
  >
    {direction === "prev" ? (
      <ChevronLeft size={16} className="text-black" />
    ) : (
      <ChevronRight size={16} className="text-black" />
    )}
  </button>
);

const DeveloperImage = ({ basePath, name }) => {
  const [currentExtIndex, setCurrentExtIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Use a unique key for the img to force remount on basePath or index change
  // This helps when retrying different extensions
  const imgKey = `${basePath}-${currentExtIndex}`;

  // Reset state when basePath changes
  useEffect(() => {
    setCurrentExtIndex(0);
    setLoaded(false);
    setFailed(false);
  }, [basePath]);

  const handleError = () => {
    const nextIndex = currentExtIndex + 1;
    if (nextIndex < IMAGE_EXTENSIONS.length) {
      setCurrentExtIndex(nextIndex);
    } else {
      setFailed(true);
    }
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  // If no base path or all failed, show fallback
  if (!basePath || failed) {
    return (
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <span className="text-xl font-semibold text-gray-500">
          {utils.getInitials(name)}
        </span>
      </div>
    );
  }

  const currentUrl = `${basePath}${IMAGE_EXTENSIONS[currentExtIndex]}`;

  return (
    <img
      key={imgKey} // Force remount to retry loading if extension changes
      src={currentUrl}
      alt={name}
      className={`max-h-20 w-auto object-contain mb-3 transition-opacity duration-200 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      decoding="async"
    />
  );
};

const DeveloperCard = ({ developer, onClick }) => {
  const basePath = utils.getBaseImagePath(developer);

  return (
    <article
      onClick={() => onClick(developer)}
      className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-40 px-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(developer)}
    >
      <DeveloperImage basePath={basePath} name={developer.name} />

      <div className="w-full px-2 text-sm text-gray-700 text-center truncate font-medium">
        {developer.name}
      </div>
    </article>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DevelopersSection() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false); // ✅ New state for hover pause

  // Responsive visible cards logic
  const getResponsiveVisibleCards = useCallback(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE_CARDS;
    if (window.innerWidth >= 1024) return 4; // lg and up: 4 cards
    if (window.innerWidth >= 768) return 3; // md: 3 cards
    if (window.innerWidth >= 640) return 2; // sm: 2 cards
    return 2; // xs: 2 cards
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
  // End responsive visible cards logic

  const { developers, loading, error, refetch } = useDevelopers();

  // Pass responsiveVisibleCards, autoSlide, intervalTime, and isPaused to useCarousel
  const carousel = useCarousel(
    developers.length,
    responsiveVisibleCards,
    true, // ✅ Enable auto-slide
    AUTO_SLIDE_INTERVAL,
    isHovered // ✅ Pause auto-slide when hovered
  );

  const handleDeveloperClick = useCallback(
    (developer) => {
      const path = `/developers/${developer.slug || developer.id}`;
      router.push(path);
    },
    [router]
  );

  return (
    <section
      className="relative bg-[#f7f7f7] py-10 px-6 md:px-14"
      aria-labelledby="developers-section-title"
    >
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
            onMouseEnter={() => setIsHovered(true)} // ✅ Pause on hover
            onMouseLeave={() => setIsHovered(false)} // ✅ Resume on mouse leave
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
                    minWidth: `${100 / carousel.visibleCount}%`, // Ensure it takes full width
                  }}
                  className="flex-none px-2"
                >
                  <DeveloperCard
                    developer={developer}
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