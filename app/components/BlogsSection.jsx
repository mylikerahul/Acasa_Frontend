"use client";

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

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VISIBLE_CARDS = 3;
const SKELETON_COUNT = 3;

// Single high-quality fallback for blogs
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop&q=80&auto=format";

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED UTILS
// ═══════════════════════════════════════════════════════════════════

const utils = {
  generateSlug: (title) => {
    if (!title?.trim()) return "";
    return title.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  },

  // Smart image URL builder - returns null if no valid image
  buildImageUrl: (blog) => {
    const imagePath = blog.imageurl || blog.image || blog.featured_image || blog.thumbnail;
    
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
      return `${API_URL}/${cleanPath}`;
    } else if (cleanPath.startsWith("uploads/")) {
      return `${API_URL}/${cleanPath}`;
    } else if (cleanPath.startsWith("blogs/")) {
      return `${API_URL}/uploads/${cleanPath}`;
    } else {
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
    imageurl: blog.imageurl,
    image: blog.image,
    author: blog.writer || blog.author || "",
    category: blog.category || "",
    createdAt: blog.publish_date || blog.created_at || blog.createdAt,
    status: blog.status,
  }),
};

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED HOOKS
// ═══════════════════════════════════════════════════════════════════

const useBlogs = () => {
  const [state, setState] = useState({
    blogs: [],
    loading: true,
    error: null,
  });
  const fetchedRef = useRef(false);

  const fetchBlogs = useCallback(async () => {
    if (fetchedRef.current) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await axios.get(`${API_URL}/api/v1/blogs/all`, {
        params: { status: 1, limit: 20 },
        timeout: 8000,
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
      fetchedRef.current = true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to load blogs";

      console.error("Blogs fetch error:", err);
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
// OPTIMIZED IMAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════

const BlogImage = ({ blog, imageUrl }) => {
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
        alt={blog.title}
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
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="h-56 bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
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
    <h2 className="text-xs md:text-sm font-normal tracking-[0.4em] text-gray-900 uppercase">
      Blogs
    </h2>

    {showNav && (
      <div className="flex items-center gap-2">
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
      </div>
    )}
  </div>
);

const BlogCard = ({
  blog,
  imageUrl,
  isLiked,
  isSaving,
  onFavoriteClick,
  onClick,
}) => {
  const formattedCategory = blog.category
    ? blog.category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : null;

  return (
    <article
      onClick={() => onClick(blog)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 
        cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col"
    >
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {formattedCategory && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] shadow-sm bg-white/95 text-gray-800 border border-gray-200">
            {formattedCategory}
          </div>
        )}

        <BlogImage blog={blog} imageUrl={imageUrl} />

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

        {blog.createdAt && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200">
            <span className="text-[11px] font-normal text-gray-800">
              {utils.formatDate(blog.createdAt)}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-4">
        <div>
          <h3 className="text-sm md:text-[15px] font-medium text-gray-900 line-clamp-2">
            {blog.title}
          </h3>
          {blog.description && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {utils.truncateText(blog.description, 120)}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {blog.author ? (
              <>
                By <span className="font-medium text-gray-900">{blog.author}</span>
              </>
            ) : (
              <span className="font-medium text-gray-900">Read More</span>
            )}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteClick(blog.id);
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

export default function BlogsSection() {
  const router = useRouter();

  const { blogs, loading, error } = useBlogs();
  const carousel = useCarousel(blogs.length);
  const { savingId, toggleFavorite, isFavorite } = useFavorites();

  const visibleBlogs = useMemo(
    () => blogs.slice(carousel.currentIndex, carousel.currentIndex + VISIBLE_CARDS),
    [blogs, carousel.currentIndex]
  );

  const handleBlogClick = useCallback(
    (blog) => router.push(`/blogs/${blog.slug || blog.id}`),
    [router]
  );

  const handleViewAll = useCallback(() => {
    router.push("/blogs");
  }, [router]);

  if (error && blogs.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-12 px-4 md:px-10">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  imageUrl={utils.buildImageUrl(blog)}
                  isLiked={isFavorite(blog.id)}
                  isSaving={savingId === blog.id}
                  onFavoriteClick={toggleFavorite}
                  onClick={handleBlogClick}
                />
              ))}
            </div>

            {blogs.length > VISIBLE_CARDS && (
              <div className="mt-10 text-center">
                <button
                  onClick={handleViewAll}
                  className="inline-flex items-center justify-center px-10 py-3 text-sm font-normal
                    bg-transparent text-black border border-transparent hover:border-black rounded-full transition-colors"
                >
                  All Blogs
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}