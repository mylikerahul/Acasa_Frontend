"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  ImageOff,
  BookOpen,
  Loader2,
  Tag,
  ChevronRight,
  Share2,
  ArrowUpRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  formatDate: (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  },

  calculateReadTime: (content) => {
    if (!content) return "5 min read";
    const text = content.replace(/<[^>]*>/g, "");
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  },

  // ✅ FIXED: Correct image URL builder for your API
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;

    // Already absolute URL
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Data URL
    if (imagePath.startsWith("data:")) {
      return imagePath;
    }

    // Clean the path
    let cleanPath = imagePath.replace(/^\/+/, "");

    // ✅ Check if it already has extension
    const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanPath);

    // If no extension, add .webp (your API seems to use webp)
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
      return `${API_URL}/uploads/blogs/${cleanPath}`;
    }
  },

  stripHtml: (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  },

  truncateText: (text, maxLength = 150) => {
    if (!text) return "";
    const stripped = utils.stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength).trim() + "...";
  },

  isNumericId: (value) => /^\d+$/.test(value),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOK
// ═══════════════════════════════════════════════════════════════════════════════

const useBlog = (slugOrId) => {
  const [state, setState] = useState({
    blog: null,
    recentBlogs: [],
    loading: true,
    error: null,
  });

  const fetchBlog = useCallback(async () => {
    if (!slugOrId) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      let apiUrl;

      if (utils.isNumericId(slugOrId)) {
        apiUrl = `${API_URL}/api/v1/blogs/${slugOrId}`;
      } else {
        apiUrl = `${API_URL}/api/v1/blogs/slug/${slugOrId}`;
      }

      const response = await axios.get(apiUrl, { timeout: 15000 });

      let blogData = null;
      if (response.data?.data) {
        blogData = response.data.data;
      } else if (response.data?.blog) {
        blogData = response.data.blog;
      } else if (response.data && response.data.id) {
        blogData = response.data;
      }

      if (!blogData) {
        throw new Error("Blog not found");
      }

      setState((s) => ({ ...s, blog: blogData, loading: false }));

      // Fetch recent blogs
      try {
        const recentResponse = await axios.get(`${API_URL}/api/v1/blogs/all`, {
          params: { limit: 6 },
          timeout: 10000,
        });

        let recentBlogs = [];
        if (recentResponse.data?.data) {
          recentBlogs = recentResponse.data.data;
        } else if (recentResponse.data?.blogs) {
          recentBlogs = recentResponse.data.blogs;
        } else if (Array.isArray(recentResponse.data)) {
          recentBlogs = recentResponse.data;
        }

        recentBlogs = recentBlogs.filter((b) => b.id !== blogData.id);
        setState((s) => ({ ...s, recentBlogs }));
      } catch {
        // Silent fail for recent blogs
      }
    } catch (err) {
      const message = err.response?.status === 404 ? "Blog not found" : err.message;
      setState((s) => ({ ...s, loading: false, error: message }));
      toast.error("Failed to load blog");
    }
  }, [slugOrId]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  return { ...state, refetch: fetchBlog };
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
        <BookOpen className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-4 text-gray-600">Loading article...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onBack }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
    <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-lg border border-gray-100">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-black mb-3">Article Not Found</h2>
      <p className="text-gray-600 mb-8">{error || "This article doesn't exist or has been removed."}</p>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Blog
      </button>
    </div>
  </div>
);

const Breadcrumb = ({ blog, onBack }) => (
  <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
    <button
      onClick={onBack}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
    <ChevronRight size={14} className="text-gray-300" />
    <a href="/blogs" className="hover:text-black transition-colors">Blog</a>
    <ChevronRight size={14} className="text-gray-300" />
    <span className="text-gray-700 truncate max-w-[250px] font-medium">{blog?.title}</span>
  </nav>
);

const ShareButton = ({ icon: Icon, onClick, label, className = "" }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center 
      bg-white hover:bg-gray-50 hover:border-gray-300 transition-all ${className}`}
  >
    <Icon size={18} className="text-gray-600" />
  </button>
);

const BlogImage = ({ blog, imageUrl }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <ImageOff size={64} className="text-gray-300 mb-3" />
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={blog?.title || "Blog image"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
      />
    </>
  );
};

const AuthorCard = ({ blog }) => (
  <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
    <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white font-bold text-lg">
      {blog.writer?.[0]?.toUpperCase() || "A"}
    </div>
    <div>
      <p className="text-sm text-gray-500">Written by</p>
      <p className="font-semibold text-black">{blog.writer || "Admin"}</p>
    </div>
  </div>
);

const TableOfContents = ({ content }) => {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!content) return;
    
    // Extract h2 headings from content
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    const matches = [...content.matchAll(h2Regex)];
    const extractedHeadings = matches.map((match, index) => ({
      id: `heading-${index}`,
      text: match[1].replace(/<[^>]*>/g, ""),
    }));
    
    setHeadings(extractedHeadings);
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
      <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-4">
        In This Article
      </h3>
      <ul className="space-y-2">
        {headings.map((heading, index) => (
          <li key={index}>
            <a
              href={`#${heading.id}`}
              className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const RecentBlogCard = ({ blog, onClick }) => {
  const imageUrl = utils.getImageUrl(blog.imageurl || blog.image);

  return (
    <article
      onClick={() => onClick(blog)}
      className="group flex gap-4 p-4 bg-white rounded-xl border border-gray-100 
        hover:border-gray-200 hover:shadow-md cursor-pointer transition-all"
    >
      <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={24} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-black transition-colors">
          {blog.title}
        </h4>
        {blog.publish_date && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Calendar size={12} />
            {utils.formatDate(blog.publish_date)}
          </p>
        )}
      </div>
      <ArrowUpRight 
        size={16} 
        className="text-gray-300 group-hover:text-black transition-colors flex-shrink-0" 
      />
    </article>
  );
};

const CategoryBadge = ({ category }) => {
  if (!category) return null;
  
  const formattedCategory = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-full">
      <Tag size={12} />
      {formattedCategory}
    </span>
  );
};

const ShareSection = ({ onShare, copied }) => (
  <div className="flex items-center gap-4">
    <span className="text-sm text-gray-500 font-medium">Share:</span>
    <div className="flex items-center gap-2">
      <ShareButton icon={Facebook} onClick={() => onShare("facebook")} label="Share on Facebook" />
      <ShareButton icon={Twitter} onClick={() => onShare("twitter")} label="Share on Twitter" />
      <ShareButton icon={Linkedin} onClick={() => onShare("linkedin")} label="Share on LinkedIn" />
      <ShareButton 
        icon={Link2} 
        onClick={() => onShare("copy")} 
        label="Copy link"
        className={copied ? "border-green-500 bg-green-50" : ""}
      />
    </div>
    {copied && (
      <span className="text-xs text-green-600 font-medium animate-pulse">Link copied!</span>
    )}
  </div>
);

const NewsletterBox = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Subscribed successfully!");
      setEmail("");
    } catch {
      toast.error("Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-white">
      <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
      <p className="text-gray-400 text-sm mb-6">
        Get the latest insights and news delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white 
            placeholder:text-gray-400 outline-none focus:border-white/40 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-black font-semibold rounded-xl 
            hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Subscribing...
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function BlogDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const { blog, recentBlogs, loading, error } = useBlog(slug);
  const [copied, setCopied] = useState(false);

  // ✅ Get image URL using imageurl field
  const imageUrl = blog ? utils.getImageUrl(blog.imageurl) : null;

  const handleShare = useCallback(
    async (platform) => {
      if (!blog) return;

      const url = window.location.href;
      const title = blog.title || "Check out this article";

      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      };

      if (platform === "copy") {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success("Link copied!");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Failed to copy link");
        }
      } else if (shareUrls[platform]) {
        window.open(shareUrls[platform], "_blank", "width=600,height=400");
      }
    },
    [blog]
  );

  const handleBlogClick = useCallback(
    (blogItem) => {
      router.push(`/blogs/${blogItem.slug || blogItem.id}`);
    },
    [router]
  );

  // Loading
  if (loading) return <LoadingState />;

  // Error
  if (error || !blog) {
    return <ErrorState error={error} onBack={() => router.push("/blogs")} />;
  }

  const date = utils.formatDate(blog.publish_date || blog.created_at);
  const readTime = utils.calculateReadTime(blog.descriptions || blog.content || "");

  // Process content to add IDs to h2 tags
  const processedContent = blog.descriptions?.replace(
    /<h2([^>]*)>/gi,
    (match, attrs, index) => `<h2${attrs} id="heading-${index}">`
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          <Breadcrumb blog={blog} onBack={() => router.back()} />

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Content */}
            <div>
              {/* Category */}
              <div className="mb-4">
                <CategoryBadge category={blog.category} />
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 leading-tight">
                {blog.title}
              </h1>

              {/* Subtitle */}
              {blog.sub_title && (
                <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed">
                  {blog.sub_title}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                {blog.writer && blog.writer !== "Choose" && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <User size={14} className="text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{blog.writer}</span>
                  </div>
                )}
                {date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{date}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-gray-400" />
                  <span>{readTime}</span>
                </div>
              </div>

              {/* Share */}
              <ShareSection onShare={handleShare} copied={copied} />
            </div>

            {/* Right: Featured Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-100 relative">
                <BlogImage blog={blog} imageUrl={imageUrl} />
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* SEO Description */}
            {blog.seo_description && (
              <div className="bg-gray-50 border-l-4 border-black p-6 rounded-r-xl mb-8">
                <p className="text-gray-700 italic leading-relaxed">
                  {blog.seo_description}
                </p>
              </div>
            )}

            {/* Article Content */}
            {processedContent ? (
              <div
                className="prose prose-lg max-w-none 
                  prose-headings:text-black prose-headings:font-bold prose-headings:mt-10 prose-headings:mb-4
                  prose-h2:text-2xl prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-black
                  prose-ul:my-6 prose-li:text-gray-700
                  prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-gray-50 
                  prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            ) : (
              <div className="text-gray-600 text-center py-12">
                <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                <p>No content available for this article.</p>
              </div>
            )}

            {/* Keywords/Tags */}
            {blog.seo_keywork && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                  Related Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blog.seo_keywork.split(",").map((keyword, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Card */}
            {blog.writer && blog.writer !== "Choose" && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <AuthorCard blog={blog} />
              </div>
            )}

            {/* Share Section Bottom */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-gray-600">Found this article helpful? Share it with others.</p>
                <ShareSection onShare={handleShare} copied={copied} />
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Table of Contents */}
              <TableOfContents content={blog.descriptions} />

              {/* Newsletter */}
              <NewsletterBox />

              {/* Recent Blogs */}
              {recentBlogs.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
                    <BookOpen size={20} />
                    More Articles
                  </h3>
                  <div className="space-y-4">
                    {recentBlogs.slice(0, 4).map((b) => (
                      <RecentBlogCard
                        key={b.id}
                        blog={b}
                        onClick={handleBlogClick}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => router.push("/blogs")}
                    className="w-full mt-6 py-3 text-sm font-semibold text-black border-2 border-gray-200 
                      rounded-xl hover:border-black hover:bg-black hover:text-white transition-all"
                  >
                    View All Articles
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}