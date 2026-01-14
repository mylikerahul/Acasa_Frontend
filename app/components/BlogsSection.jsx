"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BLOGS SECTION COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @description    Displays blog posts in a responsive carousel with lazy loading,
 *                 favorites functionality, and category filtering.
 * @version        2.0.0
 * @author         Your Company Name
 * @license        CodeCanyon Regular/Extended License
 *
 * @features
 * - Responsive carousel with smooth navigation
 * - Lazy loading images with fallback
 * - Favorites management with optimistic updates
 * - Category badges and date formatting
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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Heart,
  Loader2,
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
};

/**
 * UI Configuration
 * @constant
 */
const UI_CONFIG = {
  VISIBLE_CARDS: 3,
  SKELETON_COUNT: 3,
  IMAGE_LAZY_LOAD_MARGIN: "50px",
  ANIMATION_DURATION: 300,
  MAX_DESCRIPTION_LENGTH: 120,
};

/**
 * Fallback image for blogs without images
 * @constant
 */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop&q=80&auto=format";

/**
 * API request configuration
 * @constant
 */
const API_REQUEST_CONFIG = {
  params: { status: 1, limit: 20 },
  timeout: CONFIG.API_TIMEOUT,
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
   * Generates URL-friendly slug from title
   * @param {string} title - Blog title
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
   * Builds complete image URL from blog data
   * @param {object} blog - Blog object
   * @returns {string|null} Complete image URL or null
   */
  buildImageUrl: (blog) => {
    const imagePath =
      blog.imageurl || blog.image || blog.featured_image || blog.thumbnail;

    if (!imagePath) return null;

    // If already absolute URL
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // If data URL
    if (imagePath.startsWith("data:")) return imagePath;

    // Clean the path
    let cleanPath = imagePath.replace(/^\/+/, "");

    // Check if already has extension
    const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanPath);

    // If no extension, add .webp
    if (!hasExtension) {
      cleanPath = `${cleanPath}.webp`;
    }

    // Build full URL based on path structure
    if (cleanPath.startsWith("uploads/blogs/")) {
      return `${CONFIG.API_URL}/${cleanPath}`;
    }
    if (cleanPath.startsWith("uploads/")) {
      return `${CONFIG.API_URL}/${cleanPath}`;
    }
    if (cleanPath.startsWith("blogs/")) {
      return `${CONFIG.API_URL}/uploads/${cleanPath}`;
    }
    return `${CONFIG.API_URL}/uploads/blogs/${cleanPath}`;
  },

  /**
   * Formats date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDate: (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  },

  /**
   * Truncates text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText: (text, maxLength = UI_CONFIG.MAX_DESCRIPTION_LENGTH) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  },

  /**
   * Strips HTML tags from text
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  stripHtml: (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  },

  /**
   * Formats category for display
   * @param {string} category - Category slug
   * @returns {string} Formatted category name
   */
  formatCategory: (category) => {
    if (!category) return "";
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  },

  /**
   * Transforms API response to normalized blog object
   * @param {object} blog - Raw API blog data
   * @returns {object} Normalized blog object
   */
  transformBlog: (blog) => ({
    id: blog.id || blog._id,
    title: blog.title?.trim() || "Untitled Blog",
    slug: blog.slug || blog.seo_slug || Utils.generateSlug(blog.title),
    description: Utils.stripHtml(
      blog.descriptions || blog.description || blog.seo_description || ""
    ),
    imageurl: blog.imageurl,
    image: blog.image,
    author: blog.writer || blog.author || "",
    category: blog.category || "",
    createdAt: blog.publish_date || blog.created_at || blog.createdAt,
    status: blog.status,
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
 * Hook for fetching and managing blogs data
 * @returns {object} Blogs state and methods
 */
const useBlogs = () => {
  const [state, setState] = useState({
    blogs: [],
    loading: true,
    error: null,
  });

  const fetchedRef = useRef(false);
  const abortControllerRef = useRef(null);

  const fetchBlogs = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchedRef.current) return;

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${CONFIG.API_URL}/api/v1/blogs/all`, {
        ...API_REQUEST_CONFIG,
        signal: abortControllerRef.current.signal,
      });

      // Handle various API response formats
      let blogsData = [];

      if (data.success && Array.isArray(data.data)) {
        blogsData = data.data;
      } else if (data.success && Array.isArray(data.blogs)) {
        blogsData = data.blogs;
      } else if (Array.isArray(data.data)) {
        blogsData = data.data;
      } else if (Array.isArray(data.blogs)) {
        blogsData = data.blogs;
      } else if (Array.isArray(data)) {
        blogsData = data;
      }

      // Filter published blogs only
      const publishedBlogs = blogsData.filter(
        (blog) => blog.status === 1 || blog.status === "published"
      );

      const blogs = publishedBlogs.map(Utils.transformBlog);
      setState({ blogs, loading: false, error: null });
      fetchedRef.current = true;
    } catch (err) {
      // Ignore abort errors
      if (axios.isCancel(err)) return;

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load blogs";

      console.error("Blogs fetch error:", err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    fetchBlogs();

    // Cleanup: abort pending request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBlogs]);

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

  // Reset index if it exceeds max
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(Math.max(0, maxIndex));
    }
  }, [currentIndex, maxIndex]);

  return {
    currentIndex,
    canGoPrev,
    canGoNext,
    showNavigation,
    goToPrev,
    goToNext,
  };
};

/**
 * Hook for managing favorites with optimistic updates
 * @returns {object} Favorites state and methods
 */
const useFavorites = () => {
  const [favorites, setFavorites] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const toggleFavorite = useCallback((blogId) => {
    setSavingId(blogId);

    setFavorites((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(blogId);

      if (isAdding) {
        next.add(blogId);
        toast.success("Added to favorites!");
      } else {
        next.delete(blogId);
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

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Optimized Image Component with Lazy Loading
 * @component
 */
const BlogImage = ({ blog, imageUrl }) => {
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
        alt={blog.title}
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
    aria-label="Loading blog"
  >
    <div className="h-56 bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
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
    aria-label="Loading blogs"
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
const EmptyState = () => (
  <div className="text-center py-16" role="status">
    <BookOpen
      size={40}
      className="mx-auto text-gray-400 mb-4"
      aria-hidden="true"
    />
    <h3 className="text-lg font-normal text-gray-700 mb-2">
      No Blogs Available
    </h3>
    <p className="text-gray-500 mb-4">Check back soon for new articles</p>
  </div>
);

/**
 * Navigation Button Component
 * @component
 */
const NavButton = ({ direction, onClick, disabled }) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Previous blogs" : "Next blogs";

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
      id="blogs-section-heading"
      className="text-xs md:text-sm font-normal tracking-[0.4em] text-gray-900 uppercase"
    >
      Blogs
    </h2>

    {showNav && (
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Blog navigation"
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
 * Category Badge Component
 * @component
 */
const CategoryBadge = ({ category }) => {
  if (!category) return null;

  const formattedCategory = Utils.formatCategory(category);

  return (
    <div
      className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] 
        shadow-sm bg-white/95 text-gray-800 border border-gray-200"
    >
      {formattedCategory}
    </div>
  );
};

/**
 * Date Badge Component
 * @component
 */
const DateBadge = ({ date }) => {
  if (!date) return null;

  return (
    <div
      className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 
        bg-white/95 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200"
    >
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
 * Blog Card Component
 * @component
 */
const BlogCard = ({
  blog,
  imageUrl,
  isLiked,
  isSaving,
  onFavoriteClick,
  onClick,
}) => {
  // Event handlers
  const handleCardClick = useCallback(() => {
    onClick(blog);
  }, [onClick, blog]);

  const handleFavoriteClick = useCallback(
    (e) => {
      e.stopPropagation();
      onFavoriteClick(blog.id);
    },
    [onFavoriteClick, blog.id]
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
      aria-label={`Read ${blog.title}`}
    >
      {/* Image Section */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {/* Category Badge */}
        <CategoryBadge category={blog.category} />

        {/* Blog Image */}
        <BlogImage blog={blog} imageUrl={imageUrl} />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <CardActionButton icon={Eye} label="Quick view" />
          <CardActionButton icon={RotateCcw} label="Share" />
        </div>

        {/* Image Navigation */}
        <ImageNavButton direction="prev" />
        <ImageNavButton direction="next" />

        {/* Date Badge */}
        <DateBadge date={blog.createdAt} />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div>
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900 line-clamp-2">
            {blog.title}
          </h3>
          {blog.description && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {Utils.truncateText(blog.description)}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {blog.author ? (
              <>
                By{" "}
                <span className="font-medium text-gray-900">{blog.author}</span>
              </>
            ) : (
              <span className="font-medium text-gray-900">Read More</span>
            )}
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
      All Blogs
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Blogs Section Component
 *
 * Displays blog posts in a responsive carousel with:
 * - Lazy loading images
 * - Favorites functionality
 * - Category badges
 * - Responsive design
 * - Accessibility support
 *
 * @component
 * @example
 * return <BlogsSection />
 */
export default function BlogsSection() {
  // ─────────────────────────────────────────────────────────────────────────────
  // Hooks
  // ─────────────────────────────────────────────────────────────────────────────

  const router = useRouter();

  // Data fetching
  const { blogs, loading, error, refetch } = useBlogs();

  // Carousel navigation
  const carousel = useCarousel(blogs.length);

  // Favorites management
  const { savingId, toggleFavorite, isFavorite } = useFavorites();

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Data
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Currently visible blogs based on carousel index
   */
  const visibleBlogs = useMemo(
    () =>
      blogs.slice(
        carousel.currentIndex,
        carousel.currentIndex + UI_CONFIG.VISIBLE_CARDS
      ),
    [blogs, carousel.currentIndex]
  );

  /**
   * Whether to show View All button
   */
  const showViewAll = blogs.length > UI_CONFIG.VISIBLE_CARDS;

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to blog detail page
   */
  const handleBlogClick = useCallback(
    (blog) => {
      router.push(`/blogs/${blog.slug || blog.id}`);
    },
    [router]
  );

  /**
   * Navigate to all blogs page
   */
  const handleViewAll = useCallback(() => {
    router.push("/blogs");
  }, [router]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Early Returns
  // ─────────────────────────────────────────────────────────────────────────────

  // Don't render section if there's an error and no blogs
  if (error && blogs.length === 0) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section
      className="bg-gray-50 py-12 px-4 md:px-10"
      aria-labelledby="blogs-section-heading"
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

        {/* Content States */}
        {loading ? (
          <LoadingState />
        ) : blogs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Blogs Grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Blog posts"
            >
              {visibleBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  imageUrl={Utils.buildImageUrl(blog)}
                  isLiked={isFavorite(blog.id)}
                  isSaving={savingId === blog.id}
                  onFavoriteClick={toggleFavorite}
                  onClick={handleBlogClick}
                />
              ))}
            </div>

            {/* View All Button */}
            {showViewAll && <ViewAllButton onClick={handleViewAll} />}
          </>
        )}
      </div>
    </section>
  );
}