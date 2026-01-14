"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ImageOff,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Heart,
  Loader2,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VISIBLE_CARDS = 3;
const SKELETON_COUNT = 3;

// ═══════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════

const utils = {
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

  // ✅ Correct image URL builder (same as your original)
  buildImageUrl: (blog) => {
    const imagePath = blog.imageurl || blog.image || blog.featured_image || blog.thumbnail;
    
    if (!imagePath) return null;

    // If already absolute URL, return as is
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    // If data URL, return as is
    if (imagePath.startsWith("data:")) {
      return imagePath;
    }

    // Clean the path
    let cleanPath = imagePath.replace(/^\/+/, "");

    // ✅ Check if already has extension
    const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanPath);

    // ✅ If no extension, add .webp (your API uses webp)
    if (!hasExtension) {
      cleanPath = `${cleanPath}.webp`;
    }

    // Build full URL
    if (cleanPath.startsWith("uploads/blogs/")) {
      return `${API_URL}/${cleanPath}`;
    } else if (cleanPath.startsWith("uploads/")) {
      return `${API_URL}/${cleanPath}`;
    } else if (cleanPath.startsWith("blogs/")) {
      return `${API_URL}/uploads/${cleanPath}`;
    } else {
      // Default: just filename, add path
      return `${API_URL}/uploads/blogs/${cleanPath}`;
    }
  },

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

  truncateText: (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  },

  stripHtml: (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  },

  transformBlog: (blog) => ({
    id: blog.id || blog._id,
    title: blog.title?.trim() || "Untitled Blog",
    slug: blog.slug || blog.seo_slug || utils.generateSlug(blog.title),
    description: utils.stripHtml(
      blog.descriptions || blog.description || blog.seo_description || ""
    ),
    // ✅ Keep original imageurl for building URL
    imageurl: blog.imageurl,
    image: blog.image,
    author: blog.writer || blog.author || "",
    category: blog.category || "",
    createdAt: blog.publish_date || blog.created_at || blog.createdAt,
    status: blog.status,
  }),
};

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

const useBlogs = () => {
  const [state, setState] = useState({
    blogs: [],
    loading: true,
    error: null,
  });

  const fetchBlogs = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${API_URL}/api/v1/blogs/all`, {
        params: {
          status: 1,
          limit: 20,
        },
        timeout: 10000,
      });

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

      // Filter published blogs
      const publishedBlogs = blogsData.filter(
        (blog) => blog.status === 1 || blog.status === "published"
      );

      const blogs = publishedBlogs.map(utils.transformBlog);

      setState({ blogs, loading: false, error: null });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load blogs";

      setState((prev) => ({ ...prev, loading: false, error: message }));
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return { ...state, refetch: fetchBlogs };
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

const useImageLoader = () => {
  const [errors, setErrors] = useState(new Set());

  const handleError = useCallback((blogId) => {
    setErrors((prev) => new Set(prev).add(blogId));
  }, []);

  const hasError = useCallback((id) => errors.has(id), [errors]);

  return { handleError, hasError };
};

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

    setTimeout(() => setSavingId(null), 300);
  }, []);

  const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

  return { favorites, savingId, toggleFavorite, isFavorite };
};

// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS (Properties/Projects style)
// ═══════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="h-56 bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
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

const EmptyState = () => (
  <div className="text-center py-16">
    <BookOpen size={40} className="mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-normal text-gray-700 mb-2">
      No Blogs Available
    </h3>
    <p className="text-gray-500 mb-4">Check back soon for new articles</p>
  </div>
);

const SectionHeader = ({ showNav, canPrev, canNext, onPrev, onNext }) => (
  <div className="flex items-center justify-between mb-8">
    <h2
      id="blogs-section-title"
      className="text-xs md:text-sm font-normal tracking-[0.4em] text-[#111827] uppercase"
    >
      Blogs
    </h2>

    {showNav && (
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous blogs"
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
          aria-label="Next blogs"
          className={`w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-sm
            ${
              !canNext
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-gray-500 hover:text-gray-700"
            }`}
        >
          <ChevronRight size={18} className="text-gray-700" />
        </button>
      </div>
    )}
  </div>
);

const BlogImage = ({ blog, imageUrl, hasError, onError }) => {
  const [loaded, setLoaded] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
          <BookOpen size={30} className="text-gray-500" />
        </div>
        <span className="text-gray-500 text-sm font-normal">Blog Image</span>
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
        src={imageUrl}
        alt={blog.title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => onError(blog.id)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

const BlogCard = ({
  blog,
  imageUrl,
  hasError,
  isLiked,
  isSaving,
  onImageError,
  onFavoriteClick,
  onClick,
}) => {
  const formattedCategory = blog.category
    ? blog.category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : null;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteClick(blog.id);
  };

  return (
    <article
      onClick={() => onClick(blog)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 
        cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(blog)}
    >
      {/* Image */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {/* Category badge */}
        {formattedCategory && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-normal shadow-sm bg-white/90 text-gray-800 border border-gray-200">
            {formattedCategory}
          </div>
        )}

        <BlogImage
          blog={blog}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
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

        {/* Date badge bottom left */}
        {blog.createdAt && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200">
            <span className="text-[11px] font-normal text-gray-800">
              {utils.formatDate(blog.createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div className="pr-2">
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900 line-clamp-2">
            {blog.title}
          </h3>
          {blog.description && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {utils.truncateText(blog.description, 120)}
            </p>
          )}
        </div>

        {/* Author + Heart */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {blog.author ? (
              <>
                By <span className="font-normal text-gray-900">{blog.author}</span>
              </>
            ) : (
              <span className="font-normal text-gray-900">Read More</span>
            )}
          </p>

          <button
            onClick={handleFavoriteClick}
            disabled={isSaving}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
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
      All Blogs
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function BlogsSection() {
  const router = useRouter();

  const { blogs, loading, error } = useBlogs();
  const carousel = useCarousel(blogs.length);
  const { handleError: handleImageError, hasError: imageHasError } =
    useImageLoader();
  const { savingId, toggleFavorite, isFavorite } = useFavorites();

  const visibleBlogs = useMemo(
    () =>
      blogs.slice(
        carousel.currentIndex,
        carousel.currentIndex + VISIBLE_CARDS
      ),
    [blogs, carousel.currentIndex]
  );

  const handleBlogClick = useCallback(
    (blog) => {
      router.push(`/blogs/${blog.slug || blog.id}`);
    },
    [router]
  );

  const handleViewAll = useCallback(() => {
    router.push("/blogs");
  }, [router]);

  if (error && blogs.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-[#F7F7F7] py-12 px-4 md:px-10"
      aria-labelledby="blogs-section-title"
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          showNav={carousel.showNavigation}
          canPrev={carousel.canGoPrev}
          canNext={carousel.canGoNext}
          onPrev={carousel.goToPrev}
          onNext={carousel.goToNext}
        />

        {loading ? (
          <LoadingState />
        ) : blogs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Blog articles"
            >
              {visibleBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  imageUrl={utils.buildImageUrl(blog)}
                  hasError={imageHasError(blog.id)}
                  isLiked={isFavorite(blog.id)}
                  isSaving={savingId === blog.id}
                  onImageError={handleImageError}
                  onFavoriteClick={toggleFavorite}
                  onClick={handleBlogClick}
                />
              ))}
            </div>

            {blogs.length > VISIBLE_CARDS && (
              <ViewAllButton onClick={handleViewAll} />
            )}
          </>
        )}
      </div>
    </section>
  );
}