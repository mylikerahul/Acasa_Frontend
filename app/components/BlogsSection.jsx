"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ImageOff, BookOpen, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VISIBLE_CARDS = 3;
const SKELETON_COUNT = 3;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════════

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

  // ✅ FIXED: Correct image URL builder
  buildImageUrl: (blog) => {
    // Get image path from imageurl field (your API field name)
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
    description: utils.stripHtml(blog.descriptions || blog.description || blog.seo_description || ""),
    // ✅ Keep original imageurl for building URL
    imageurl: blog.imageurl,
    image: blog.image,
    author: blog.writer || blog.author || "",
    category: blog.category || "",
    createdAt: blog.publish_date || blog.created_at || blog.createdAt,
    status: blog.status,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

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
          limit: 20 
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

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

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

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
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
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <BookOpen size={32} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-700 mb-2">No Blogs Available</h3>
    <p className="text-sm text-gray-500">Check back soon for new articles</p>
  </div>
);

const SectionHeader = () => (
  <div className="mb-8">
    <h2
      id="blogs-section-title"
      className="text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-black"
    >
      Blogs
    </h2>
  </div>
);

const CornerNav = ({ showNav, canPrev, canNext, onPrev, onNext }) => {
  if (!showNav) return null;

  return (
    <div className="absolute top-6 right-6 md:top-10 md:right-14 flex items-center gap-2 z-10">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={`w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm transition-all
          ${!canPrev ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"}`}
      >
        <ChevronLeft size={18} className="text-black" />
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className={`w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm transition-all
          ${!canNext ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"}`}
      >
        <ChevronRight size={18} className="text-black" />
      </button>
    </div>
  );
};

const BlogImage = ({ blog, imageUrl, hasError, onError }) => {
  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <ImageOff size={36} className="text-gray-300 mb-2" />
        <span className="text-gray-400 text-xs">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={blog.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => onError(blog.id)}
      loading="lazy"
    />
  );
};

const BlogCard = ({ blog, imageUrl, hasError, onImageError, onClick }) => {
  // Format category for display
  const formattedCategory = blog.category
    ? blog.category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : null;

  return (
    <article
      onClick={() => onClick(blog)}
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(blog)}
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden mb-4 shadow-sm group-hover:shadow-lg transition-all">
        <BlogImage
          blog={blog}
          imageUrl={imageUrl}
          hasError={hasError}
          onError={onImageError}
        />
      </div>

      {/* Category & Date */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        {formattedCategory && (
          <span className="px-2.5 py-1 bg-black text-white rounded-full font-medium">
            {formattedCategory}
          </span>
        )}
        {blog.createdAt && (
          <span>{utils.formatDate(blog.createdAt)}</span>
        )}
      </div>

      {/* Title + Arrow */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base md:text-lg font-semibold text-black leading-snug line-clamp-2 group-hover:text-gray-700 transition-colors">
          {blog.title}
        </h3>
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-black transition-colors">
          <ArrowUpRight 
            size={16} 
            className="text-gray-600 group-hover:text-white transition-colors" 
          />
        </div>
      </div>

      {/* Description */}
      {blog.description && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
          {utils.truncateText(blog.description, 120)}
        </p>
      )}
    </article>
  );
};

const ViewAllButton = ({ onClick }) => (
  <div className="mt-12 text-center">
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium
        text-black bg-white border-2 border-gray-200 rounded-full
        hover:border-black hover:bg-black hover:text-white transition-all duration-300"
    >
      View All Blogs
      <ArrowUpRight size={16} />
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function BlogsSection() {
  const router = useRouter();

  const { blogs, loading, error } = useBlogs();
  const carousel = useCarousel(blogs.length);
  const { handleError: handleImageError, hasError: imageHasError } = useImageLoader();

  const visibleBlogs = useMemo(
    () => blogs.slice(carousel.currentIndex, carousel.currentIndex + VISIBLE_CARDS),
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
      className="relative bg-gradient-to-r from-white via-white to-[#ffe9c4] py-12 md:py-16 px-6 md:px-14"
      aria-labelledby="blogs-section-title"
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
        ) : blogs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="list"
              aria-label="Blog articles"
            >
              {visibleBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  imageUrl={utils.buildImageUrl(blog)}
                  hasError={imageHasError(blog.id)}
                  onImageError={handleImageError}
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