// app/developers/[slug]/page.jsx
// OR pages/developers/[slug].jsx (if using Pages Router)

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation"; // For App Router
// import { useRouter } from "next/router"; // For Pages Router
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  MapPin,
  Building2,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Eye, // For total_project if needed
  Code, // For total_project_withus if needed
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// All possible image extensions (from previous components)
const IMAGE_EXTENSIONS = [".jpg", ".png", ".webp", ".jpeg", ".gif", ".svg"];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (Reused from DevelopersSection and previous fixes)
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  // ✅ Get base image path (without extension)
  getBaseImagePath: (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.replace(/^\/+/, "");
    const pathWithoutExt = cleanPath.replace(
      /\.(jpg|jpeg|png|gif|webp|svg)$/i,
      ""
    );
    // Assuming developer images are in /uploads/developers/
    return `${API_BASE_URL}/uploads/developers/${pathWithoutExt}`;
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

  formatDate: (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  },

  // Strip HTML for word count or plain text display if needed
  stripHtml: (html) =>
    typeof html === "string"
      ? html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
      : "",

  // Build a clean location string
  buildLocation: (...parts) =>
    parts.filter(Boolean).join(", ") || "Location TBA",
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST HELPERS (Reused from previous components)
// ═══════════════════════════════════════════════════════════════════════════════

const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#10B981",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#10B981",
    },
  });
};

const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: "#EF4444",
      color: "#fff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#EF4444",
    },
  });
};

const showLoadingToast = (message) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART IMAGE DISPLAY COMPONENT (Reused and slightly adapted)
// ═══════════════════════════════════════════════════════════════════════════════

const SmartImageDisplay = ({ imagePath, name, className = "h-40" }) => {
  const [currentExtIndex, setCurrentExtIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const basePath = utils.getBaseImagePath(imagePath);

  // Use a unique key for the img to force remount on basePath or index change
  const imgKey = `${basePath}-${currentExtIndex}`;

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

  if (!basePath || failed) {
    return (
      <div
        className={`w-full ${className} bg-gray-100 border border-gray-200 flex items-center justify-center rounded-lg`}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
            {utils.getInitials(name)}
          </div>
          <p className="text-xs text-gray-500">No Logo</p>
        </div>
      </div>
    );
  }

  const currentUrl = `${basePath}${IMAGE_EXTENSIONS[currentExtIndex]}`;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="w-full h-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center rounded-lg">
        {!loaded && !failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        <img
          key={imgKey}
          src={currentUrl}
          alt={name || "Developer Logo"}
          className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useDeveloper = (slug) => {
  const [state, setState] = useState({
    developer: null,
    loading: true,
    error: null,
  });

  const fetchDeveloper = useCallback(async () => {
    if (!slug) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // ✅ This is the API endpoint we're assuming exists in your backend
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/developers/public/slug/${slug}`
      );

      if (response.data.success && response.data.data) {
        // Assume API returns a direct developer object, transform if needed
        const rawDeveloper = response.data.data;
        const transformedDeveloper = {
          id: rawDeveloper.id,
          name: rawDeveloper.name?.trim() || "Unknown Developer",
          slug: rawDeveloper.seo_slug || utils.generateSlug(rawDeveloper.name), // assuming generateSlug is in utils
          image: rawDeveloper.image || rawDeveloper.logo, // 'image' or 'logo' field from API
          ceo_name: rawDeveloper.ceo_name || "",
          website: rawDeveloper.website || "",
          email: rawDeveloper.email || "",
          mobile: rawDeveloper.mobile || rawDeveloper.phone || "",
          address: rawDeveloper.address || "",
          country: rawDeveloper.country || "",
          year_established: rawDeveloper.year_established || "",
          informations: rawDeveloper.informations || "", // Use 'informations' for description
          facebook: rawDeveloper.facebook || "",
          twitter: rawDeveloper.twitter || "",
          linkedin: rawDeveloper.linkedin || "",
          instagram: rawDeveloper.instagram || "",
          total_project: rawDeveloper.total_project || 0,
          total_project_withus: rawDeveloper.total_project_withus || 0,
          total_url: rawDeveloper.total_url || "", // Other URL if any
          seo_title: rawDeveloper.seo_title || rawDeveloper.name,
          seo_description: rawDeveloper.seo_description || "",
          seo_keyword: rawDeveloper.seo_keywork || "", // Note: API might have 'seo_keywork'
        };
        setState((s) => ({ ...s, developer: transformedDeveloper, loading: false }));

        // Optional: Update document title for SEO
        if (typeof document !== 'undefined' && transformedDeveloper.seo_title) {
            document.title = transformedDeveloper.seo_title;
        }

      } else {
        throw new Error("Developer not found");
      }
    } catch (err) {
      console.error("Developer fetch error:", err);
      const message =
        err.response?.status === 404
          ? "Developer not found"
          : err.response?.data?.message || "Failed to load developer";
      setState((s) => ({ ...s, loading: false, error: message }));
      showError(message);
    }
  }, [slug]);

  useEffect(() => {
    fetchDeveloper();
  }, [fetchDeveloper]);

  return state;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto text-blue-600" />
      <p className="mt-4 text-lg text-gray-700 font-medium">
        Loading developer details...
      </p>
    </div>
  </div>
);

const ErrorState = ({ error, onBack }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
    <h1 className="text-3xl font-bold text-gray-800 mb-2">
      Developer Not Found
    </h1>
    <p className="text-lg text-gray-600 mb-4">{error}</p>
    <div className="flex gap-3 justify-center">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Developers
      </button>
    </div>
  </div>
);

const HeaderSection = ({ developerName, onBack }) => (
  <div className="bg-white border border-gray-300 rounded-t p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Developers
        </button>
        <span className="text-gray-500">Developers</span>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-800 truncate max-w-[200px]">
          {developerName}
        </span>
      </div>
      {/* Add any other header actions here, e.g., print, share */}
    </div>
  </div>
);

const DeveloperSummaryCard = ({ developer }) => (
  <div className="bg-white border border-gray-300 rounded p-4 mb-4">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Info</h3>
    <div className="space-y-3">
      {developer.website && (
        <a
          href={developer.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 group"
        >
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-100">
            <Globe size={16} className="text-gray-600 group-hover:text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Website</p>
            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
              {developer.website.replace(/(^\w+:|^)\/\//, '')}
            </p>
          </div>
        </a>
      )}
      {developer.email && (
        <a
          href={`mailto:${developer.email}`}
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 group"
        >
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-100">
            <Mail size={16} className="text-gray-600 group-hover:text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
              {developer.email}
            </p>
          </div>
        </a>
      )}
      {developer.mobile && (
        <a
          href={`tel:${developer.mobile}`}
          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 group"
        >
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-100">
            <Phone size={16} className="text-gray-600 group-hover:text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
              {developer.mobile}
            </p>
          </div>
        </a>
      )}
    </div>

    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
      <div className="flex items-center gap-3">
        <MapPin size={16} className="text-gray-500" />
        <p className="text-sm text-gray-700">
          {utils.buildLocation(developer.address, developer.city, developer.country)}
        </p>
      </div>
      {developer.year_established && (
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-gray-500" />
          <p className="text-sm text-gray-700">
            Established: {developer.year_established}
          </p>
        </div>
      )}
    </div>
  </div>
);

const DeveloperStatsCard = ({ developer }) => (
  <div className="bg-white border border-gray-300 rounded p-4 mb-4">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Figures</h3>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
          <Building2 size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Projects</p>
          <p className="text-sm font-medium text-gray-800">
            {developer.total_project || 0}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
          <Code size={16} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Projects with Us</p>
          <p className="text-sm font-medium text-gray-800">
            {developer.total_project_withus || 0}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const DeveloperSocials = ({ developer }) => {
  const socialLinks = [
    { icon: Facebook, href: developer.facebook, color: "text-blue-700" },
    { icon: Twitter, href: developer.twitter, color: "text-blue-400" },
    { icon: Linkedin, href: developer.linkedin, color: "text-blue-700" },
    { icon: Instagram, href: developer.instagram, color: "text-pink-600" },
  ];

  const activeSocials = socialLinks.filter((s) => s.href);

  if (activeSocials.length === 0) return null;

  return (
    <div className="bg-white border border-gray-300 rounded p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Follow {developer.name}
      </h3>
      <div className="flex space-x-4">
        {activeSocials.map((social, idx) => (
          <a
            key={idx}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors hover:scale-110 ${social.color}`}
            aria-label={social.icon.name}
          >
            <social.icon size={28} />
          </a>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: DEVELOPER DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DeveloperDetailPage() {
  const router = useRouter();
  const params = useParams(); // For App Router
  // const { slug } = useRouter().query; // For Pages Router
  const slug = params?.slug; // Get slug from URL parameters

  const { developer, loading, error } = useDeveloper(slug);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER LOADING, ERROR STATES
  // ═══════════════════════════════════════════════════════════════════════════════

  if (loading) {
    return <LoadingState />;
  }

  if (error || !developer) {
    // If error is set, or developer is null (e.g., after a 404)
    return <ErrorState error={error || "Developer not found."} onBack={() => router.push("/developers")} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER DEVELOPER DETAILS
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <>
      <Toaster /> {/* Ensure Toaster is available for global toasts */}

      {/* Dynamic SEO (for client components in App Router, or use next/head in Pages Router) */}
      {/* For better SEO with App Router, use the `generateMetadata` function in a separate `layout.jsx` or `page.jsx` */}
      {developer.seo_title && (
        <title>{developer.seo_title}</title>
      )}
      {developer.seo_description && (
        <meta name="description" content={developer.seo_description} />
      )}
      {developer.seo_keyword && (
        <meta name="keywords" content={developer.seo_keyword} />
      )}

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-3">
          {/* Header Section */}
          <HeaderSection developerName={developer.name} onBack={() => router.back()} />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            {/* Left Column: Image, Description, CEO */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-300 rounded p-4 mb-4">
                <div className="md:flex md:items-start md:space-x-6">
                  {/* Developer Logo */}
                  <div className="flex-shrink-0 mb-6 md:mb-0 md:w-56">
                    <SmartImageDisplay
                      imagePath={developer.image || developer.logo}
                      name={developer.name}
                      className="h-48"
                    />
                  </div>

                  {/* Developer Basic Info */}
                  <div className="flex-grow">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {developer.name}
                    </h1>
                    {developer.ceo_name && (
                      <p className="text-md text-gray-600 mb-4">
                        CEO: {developer.ceo_name}
                      </p>
                    )}
                    {developer.year_established && (
                        <p className="flex items-center text-md text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" /> Established: {developer.year_established}
                        </p>
                    )}
                  </div>
                </div>

                {/* Description / About Section */}
                {developer.informations && (
                  <div className="mt-8 border-t border-gray-200 pt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      About {developer.name}
                    </h2>
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                      {/* Assuming 'informations' contains HTML content */}
                      <div dangerouslySetInnerHTML={{ __html: developer.informations }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Contact, Stats, Socials */}
            <div>
              <DeveloperSummaryCard developer={developer} />
              <DeveloperStatsCard developer={developer} />
              <DeveloperSocials developer={developer} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}