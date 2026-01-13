"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ImageOff,
  Calendar,
  Clock,
  X,
  ArrowUpRight,
  BookOpen,
  User,
  Tag,
  TrendingUp,
  Loader2,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "popular", label: "Most Popular" },
  { value: "a-z", label: "Title: A to Z" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
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

  buildImageUrl: (blog) => {
    const imagePath = blog.image || blog.featured_image || blog.thumbnail;
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.replace(/^\/+/, "");
    if (cleanPath.startsWith("uploads/")) return `${API_URL}/${cleanPath}`;
    if (cleanPath.startsWith("blogs/")) return `${API_URL}/uploads/${cleanPath}`;
    return `${API_URL}/uploads/blogs/${cleanPath}`;
  },

  formatDate: (dateString) => {
    if (!dateString) return "Unknown Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  formatDateShort: (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  },

  calculateReadTime: (content) => {
    if (!content) return "5 min read";
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  },

  transformBlog: (blog) => ({
    id: blog.id,
    title: blog.title?.trim() || "Untitled Blog",
    slug: blog.slug || utils.generateSlug(blog.title),
    description: blog.description || blog.meta_description || blog.excerpt || "",
    content: blog.content || "",
    image: blog.image || blog.featured_image || blog.thumbnail,
    category: blog.category || "General",
    tags: blog.tags || [],
    date: blog.published_date || blog.created_at || new Date().toISOString(),
    readTime: utils.calculateReadTime(blog.content),
    author: blog.author || "Admin",
    authorImage: blog.author_image || null,
    featured: Boolean(blog.featured),
    views: blog.views || 0,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
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
      const { data } = await axios.get(`${API_URL}/api/v1/blogs`, {
        params: { status: "published", limit: 100 },
        withCredentials: true,
        timeout: 10000,
      });

      if (!data.success && !data.blogs && !data.data) {
        throw new Error("Invalid API response");
      }

      const blogsData = data.blogs || data.data || [];
      const blogs = blogsData.map(utils.transformBlog);
      setState({ blogs, loading: false, error: null });
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

const useFilters = (blogs) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(blogs.map((blog) => blog.category))];
    return ["All", ...uniqueCategories.sort()];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    let list = [...blogs];

    // Category filter
    if (selectedCategory !== "All") {
      list = list.filter((blog) => blog.category === selectedCategory);
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      list = list.filter(
        (blog) =>
          blog.title.toLowerCase().includes(search) ||
          blog.description.toLowerCase().includes(search) ||
          blog.category.toLowerCase().includes(search) ||
          blog.author.toLowerCase().includes(search)
      );
    }

    // Sort
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "popular":
        list.sort((a, b) => b.views - a.views);
        break;
      case "a-z":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return list;
  }, [blogs, searchTerm, selectedCategory, sortBy]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSortBy("newest");
  }, []);

  const hasActiveFilters = searchTerm || selectedCategory !== "All";

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    categories,
    filteredBlogs,
    clearFilters,
    hasActiveFilters,
  };
};

const usePagination = (totalItems, itemsPerPage = ITEMS_PER_PAGE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedItems = useCallback(
    (items) => {
      const start = (currentPage - 1) * itemsPerPage;
      return items.slice(start, start + itemsPerPage);
    },
    [currentPage, itemsPerPage]
  );

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    pageNumbers,
    goToPage: setCurrentPage,
    goToPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goToNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    canGoPrev: currentPage > 1,
    canGoNext: currentPage < totalPages,
    paginatedItems,
    reset: () => setCurrentPage(1),
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
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const PageHeader = () => (
  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
    <div className="max-w-7xl mx-auto px-6 md:px-14 py-16 md:py-24">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 text-amber-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          <BookOpen size={14} />
          Our Blog
        </span>
        <h1 className="text-4xl md:text-5xl font-light uppercase tracking-wide mb-4">
          Insights & News
        </h1>
        <div className="h-0.5 w-20 bg-gradient-to-r from-amber-400 to-transparent mb-6" />
        <p className="text-gray-300 text-lg leading-relaxed">
          Stay informed with the latest real estate trends, market insights, 
          investment tips, and lifestyle guides from our expert team.
        </p>
      </div>
    </div>
  </div>
);

const SearchBar = ({ value, onChange }) => (
  <div className="relative flex-1 max-w-xl">
    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search articles..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-10 py-3.5 border border-gray-200 rounded-xl text-sm outline-none
        focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white shadow-sm transition-all"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

const CategoryTabs = ({ categories, selected, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {categories.map((category) => (
      <button
        key={category}
        onClick={() => onChange(category)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
          ${selected === category
            ? "bg-gray-800 text-white shadow-md"
            : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
      >
        {category}
      </button>
    ))}
  </div>
);

const SortDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl 
          text-sm font-medium bg-white shadow-sm hover:border-gray-300 transition-all min-w-[160px]"
      >
        <TrendingUp size={16} className="text-gray-500" />
        <span>{selectedOption?.label}</span>
        <ChevronDown size={16} className={`ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${value === option.value 
                    ? "bg-gray-100 text-gray-900 font-medium" 
                    : "text-gray-600 hover:bg-gray-50"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FilterBar = ({ filters }) => (
  <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 md:px-14 py-5">
      <div className="flex flex-col gap-4">
        {/* Top Row: Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <SearchBar value={filters.searchTerm} onChange={filters.setSearchTerm} />
          
          <div className="flex items-center gap-3">
            {filters.hasActiveFilters && (
              <button
                onClick={filters.clearFilters}
                className="flex items-center gap-2 px-4 py-3 border border-red-200 text-red-500 
                  rounded-xl text-sm font-medium hover:bg-red-50 transition-all"
              >
                <X size={16} />
                Clear
              </button>
            )}
            <SortDropdown value={filters.sortBy} onChange={filters.setSortBy} />
          </div>
        </div>

        {/* Bottom Row: Categories */}
        <CategoryTabs
          categories={filters.categories}
          selected={filters.selectedCategory}
          onChange={filters.setSelectedCategory}
        />
      </div>
    </div>
  </div>
);

const ResultsHeader = ({ count, total }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h2 className="text-2xl md:text-3xl font-light text-gray-800 uppercase tracking-wide">
        All Articles
      </h2>
      <p className="text-gray-500 mt-1">
        Showing {count} of {total} articles
      </p>
      <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-gray-800 to-transparent" />
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
    <div className="aspect-[16/10] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="flex gap-3">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="flex justify-between pt-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
        <div className="h-10 w-10 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
    {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
  </div>
);

const EmptyState = ({ hasFilters, onClearFilters }) => (
  <div className="text-center py-20">
    <BookOpen size={64} className="mx-auto text-gray-300 mb-6" />
    <h3 className="text-2xl font-light text-gray-600 uppercase tracking-wide mb-3">
      {hasFilters ? "No Matching Articles" : "No Articles Available"}
    </h3>
    <p className="text-gray-400 mb-6 max-w-md mx-auto">
      {hasFilters
        ? "Try adjusting your search or filter criteria to find what you're looking for."
        : "Check back soon for new articles and insights from our team."}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold
          text-white bg-gray-800 rounded-full hover:bg-gray-900 transition-all
          hover:-translate-y-0.5 hover:shadow-lg"
      >
        Clear All Filters
      </button>
    )}
  </div>
);

const BlogImage = ({ blog, imageUrl, hasError, onError }) => {
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
      alt={blog.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={() => onError(blog.id)}
      loading="lazy"
    />
  );
};

const BlogCard = ({ blog, imageUrl, hasError, onImageError, onClick }) => (
  <article
    onClick={() => onClick(blog)}
    className="group bg-white rounded-2xl overflow-hidden shadow-md 
      hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2"
  >
    {/* Image */}
    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
      {/* Category Badge */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {blog.category}
        </span>
      </div>

      <BlogImage blog={blog} imageUrl={imageUrl} hasError={hasError} onError={onImageError} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Featured Badge */}
      {blog.featured && (
        <div className="absolute top-4 right-4 z-10 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
          Featured
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-5">
      {/* Meta */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Calendar size={12} />
          <span>{utils.formatDateShort(blog.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Clock size={12} />
          <span>{blog.readTime}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 
        group-hover:text-blue-600 transition-colors">
        {blog.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {blog.description || "Click to read more about this article."}
      </p>

      {/* Author & CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 
            flex items-center justify-center overflow-hidden">
            {blog.authorImage ? (
              <img src={blog.authorImage} alt={blog.author} className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-gray-500" />
            )}
          </div>
          <span className="text-sm text-gray-600 font-medium">{blog.author}</span>
        </div>

        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
          group-hover:bg-gray-800 transition-colors duration-300">
          <ArrowUpRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  </article>
);

const FeaturedBlog = ({ blog, imageUrl, hasError, onImageError, onClick }) => (
  <article
    onClick={() => onClick(blog)}
    className="group bg-white rounded-2xl overflow-hidden shadow-lg 
      hover:shadow-2xl transition-all duration-300 cursor-pointer mb-12"
  >
    <div className="grid md:grid-cols-2">
      {/* Image */}
      <div className="relative aspect-[4/3] md:aspect-auto bg-gray-100 overflow-hidden">
        <BlogImage blog={blog} imageUrl={imageUrl} hasError={hasError} onError={onImageError} />
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
          Featured Article
        </div>
      </div>

      {/* Content */}
      <div className="p-8 md:p-10 flex flex-col justify-center">
        <div className="flex items-center gap-4 mb-4">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
            {blog.category}
          </span>
          <span className="text-xs text-gray-400">{blog.readTime}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 
          group-hover:text-blue-600 transition-colors line-clamp-2">
          {blog.title}
        </h2>

        <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
          {blog.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 
              flex items-center justify-center overflow-hidden">
              {blog.authorImage ? (
                <img src={blog.authorImage} alt={blog.author} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{blog.author}</p>
              <p className="text-xs text-gray-400">{utils.formatDate(blog.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-800 font-medium group-hover:text-blue-600 transition-colors">
            <span>Read Article</span>
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  </article>
);

const Pagination = ({ pagination }) => {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={pagination.goToPrev}
        disabled={!pagination.canGoPrev}
        className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl 
          text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-40 
          disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} /> Previous
      </button>

      <div className="flex items-center gap-1 mx-2">
        {pagination.pageNumbers.map((page, idx) =>
          page === "..." ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => pagination.goToPage(page)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all
                ${pagination.currentPage === page
                  ? "bg-gray-800 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={pagination.goToNext}
        disabled={!pagination.canGoNext}
        className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl 
          text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-40 
          disabled:cursor-not-allowed transition-all"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
};

const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/v1/newsletter/subscribe`, { email }, { withCredentials: true });
      toast.success("Successfully subscribed!", { icon: "✉️" });
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-10 md:p-14 text-center mt-20">
      <BookOpen size={40} className="mx-auto text-amber-400 mb-4" />
      <h3 className="text-2xl md:text-3xl font-light text-white uppercase tracking-wide mb-4">
        Subscribe to Our Newsletter
      </h3>
      <p className="text-gray-400 mb-8 max-w-lg mx-auto">
        Get the latest articles, market insights, and exclusive content delivered straight to your inbox.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white 
            placeholder:text-gray-400 outline-none focus:border-amber-400 transition-all"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-4 bg-amber-400 text-gray-900 rounded-xl font-semibold
            hover:bg-amber-300 disabled:opacity-50 transition-all 
            flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Subscribe"}
        </button>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function BlogsPage() {
  const router = useRouter();

  // Hooks
  const { blogs, loading, error, refetch } = useBlogs();
  const filters = useFilters(blogs);
  const pagination = usePagination(filters.filteredBlogs.length);
  const { handleError: handleImageError, hasError: imageHasError } = useImageLoader();

  // Get featured blog (first featured or first blog)
  const featuredBlog = useMemo(() => {
    return filters.filteredBlogs.find((b) => b.featured) || filters.filteredBlogs[0];
  }, [filters.filteredBlogs]);

  // Get remaining blogs (excluding featured)
  const remainingBlogs = useMemo(() => {
    if (!featuredBlog) return filters.filteredBlogs;
    return filters.filteredBlogs.filter((b) => b.id !== featuredBlog.id);
  }, [filters.filteredBlogs, featuredBlog]);

  // Paginated blogs
  const displayedBlogs = useMemo(
    () => pagination.paginatedItems(remainingBlogs),
    [pagination, remainingBlogs]
  );

  // Reset pagination when filters change
  useEffect(() => {
    pagination.reset();
  }, [filters.searchTerm, filters.selectedCategory, filters.sortBy]);

  // Handlers
  const handleBlogClick = useCallback(
    (blog) => {
      router.push(`/blogs/${blog.slug || blog.id}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <PageHeader />

      {/* Filter Bar */}
      <FilterBar filters={filters} />

      {/* Main Content */}
      <section className="py-12 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <LoadingState />
          ) : filters.filteredBlogs.length === 0 ? (
            <EmptyState
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
            />
          ) : (
            <>
              {/* Featured Blog */}
              {featuredBlog && pagination.currentPage === 1 && !filters.hasActiveFilters && (
                <FeaturedBlog
                  blog={featuredBlog}
                  imageUrl={utils.buildImageUrl(featuredBlog)}
                  hasError={imageHasError(featuredBlog.id)}
                  onImageError={handleImageError}
                  onClick={handleBlogClick}
                />
              )}

              {/* Results Header */}
              <ResultsHeader
                count={filters.filteredBlogs.length}
                total={blogs.length}
              />

              {/* Blogs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {displayedBlogs.map((blog) => (
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

              {/* Pagination */}
              <Pagination pagination={pagination} />
            </>
          )}

          {/* Newsletter CTA */}
          <NewsletterCTA />
        </div>
      </section>
    </div>
  );
}