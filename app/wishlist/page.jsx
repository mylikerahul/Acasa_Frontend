"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Heart,
  Trash2,
  ArrowUpRight,
  LogOut,
  LayoutDashboard,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ImageOff,
  RefreshCw,
  Loader2,
  Building2,
  Home,
  ChevronRight,
  User,
  Settings,
  ArrowLeft,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist", active: true },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  formatPrice: (value) => {
    if (!value) return "Price on Request";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  },

  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_URL}/uploads/${cleanPath}`;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useWishlist = () => {
  const [items, setItems] = useState([]);
  const [itemDetails, setItemDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchItemDetails = useCallback(async (itemId, itemType) => {
    try {
      const endpoint = itemType === "project"
        ? `${API_URL}/api/v1/projects/${itemId}`
        : `${API_URL}/api/v1/properties/${itemId}`;

      const { data } = await axios.get(endpoint, { withCredentials: true });
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/v1/cart`, {
        withCredentials: true,
      });

      if (data.success) {
        const cartData = data.data || [];
        setItems(cartData);

        const details = {};
        for (const item of cartData) {
          const key = `${item.item_type}-${item.item_id}`;
          const itemData = await fetchItemDetails(item.item_id, item.item_type);
          if (itemData) details[key] = itemData;
        }
        setItemDetails(details);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please login to view your wishlist");
      } else {
        toast.error("Failed to load wishlist");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchItemDetails]);

  const removeItem = useCallback(async (itemId, itemType) => {
    setRemovingId(itemId);
    try {
      const { data } = await axios.delete(`${API_URL}/api/v1/cart/remove`, {
        data: { itemType, itemId },
        withCredentials: true,
      });

      if (data.success) {
        setItems((prev) => prev.filter(
          (item) => !(item.item_id === itemId && item.item_type === itemType)
        ));

        setItemDetails((prev) => {
          const next = { ...prev };
          delete next[`${itemType}-${itemId}`];
          return next;
        });

        window.dispatchEvent(new CustomEvent("cartUpdated"));
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const stats = useMemo(() => ({
    total: items.length,
    projects: items.filter((i) => i.item_type === "project").length,
    properties: items.filter((i) => i.item_type === "property").length,
  }), [items]);

  return {
    items,
    itemDetails,
    loading,
    removingId,
    stats,
    refetch: fetchWishlist,
    removeItem,
  };
};

const useImageLoader = () => {
  const [errors, setErrors] = useState(new Set());

  const handleError = useCallback((key) => {
    setErrors((prev) => new Set(prev).add(key));
  }, []);

  const hasError = useCallback((key) => errors.has(key), [errors]);

  return { handleError, hasError };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const Sidebar = ({ stats, onLogout, onRefresh, refreshing, router }) => (
  <aside className="space-y-6">
    {/* Navigation */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Account Menu
      </p>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200 ${
                  item.active
                    ? "bg-gray-800 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                ${item.active ? "bg-white/20" : "bg-gray-100"}`}>
                <Icon size={18} />
              </div>
              <span>{item.label}</span>
              {item.active && stats.total > 0 && (
                <span className="ml-auto bg-white/30 px-2 py-0.5 rounded-full text-xs">
                  {stats.total}
                </span>
              )}
              {!item.active && <ChevronRight size={16} className="ml-auto text-gray-300" />}
            </button>
          );
        })}

        <div className="h-px bg-gray-100 my-3" />

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
            text-red-500 hover:bg-red-50 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut size={18} />
          </div>
          <span>Log Out</span>
        </button>
      </nav>
    </div>

    {/* Stats */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Quick Stats
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <Building2 size={24} className="mx-auto text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.projects}</p>
          <p className="text-xs text-gray-500">Projects</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <Home size={24} className="mx-auto text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.properties}</p>
          <p className="text-xs text-gray-500">Properties</p>
        </div>
      </div>
    </div>

    {/* Refresh Button */}
    <button
      onClick={onRefresh}
      disabled={refreshing}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 
        bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600
        hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
    >
      <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
      {refreshing ? "Refreshing..." : "Refresh List"}
    </button>
  </aside>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="flex justify-between pt-3">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-10 w-10 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
  </div>
);

const EmptyState = ({ onBrowse }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
      <Heart size={40} className="text-gray-300" />
    </div>
    <h2 className="text-2xl font-light text-gray-800 uppercase tracking-wide mb-3">
      Your Wishlist is Empty
    </h2>
    <div className="h-0.5 w-12 bg-gray-300 mx-auto mb-4" />
    <p className="text-gray-500 mb-8 max-w-md mx-auto">
      Start exploring properties and projects, then tap the heart icon to save them here.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={() => onBrowse("/projects")}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 
          bg-gray-800 text-white rounded-full text-sm font-semibold
          hover:bg-gray-900 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <Building2 size={18} />
        Browse Projects
      </button>
      <button
        onClick={() => onBrowse("/properties")}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 
          bg-white text-gray-800 border-2 border-gray-200 rounded-full text-sm font-semibold
          hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        <Home size={18} />
        Browse Properties
      </button>
    </div>
  </div>
);

const WishlistImage = ({ imageUrl, title, hasError, onError }) => {
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
      alt={title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={onError}
      loading="lazy"
    />
  );
};

const WishlistCard = ({
  item,
  details,
  imageUrl,
  hasImageError,
  onImageError,
  isRemoving,
  onRemove,
  onClick,
}) => {
  const isProject = item.item_type === "project";
  const title = details?.title || details?.name || "Untitled";
  const location = details?.location || details?.address || details?.community || "";
  const price = details?.starting_price || details?.price || null;
  const beds = details?.bedrooms || details?.bedroomCount || null;
  const baths = details?.bathrooms || details?.bathroomCount || null;
  const area = details?.area || details?.size || details?.sqft || null;

  return (
    <article
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100
        hover:shadow-xl transition-all duration-300 hover:-translate-y-2
        ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Image */}
      <div
        onClick={() => onClick(item)}
        className="relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer"
      >
        <div className={`absolute top-4 left-4 z-10 flex items-center gap-1.5 
          px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg
          ${isProject 
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          }`}>
          {isProject ? <Building2 size={12} /> : <Home size={12} />}
          {isProject ? "Project" : "Property"}
        </div>

        <WishlistImage
          imageUrl={imageUrl}
          title={title}
          hasError={hasImageError}
          onError={onImageError}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.item_id, item.item_type);
          }}
          disabled={isRemoving}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg
            flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white
            transition-all duration-200 hover:scale-110"
        >
          {isRemoving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0
          group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full 
            text-sm font-medium text-gray-800 shadow-lg">
            View Details
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3
          onClick={() => onClick(item)}
          className="text-lg font-semibold text-gray-800 mb-2 truncate cursor-pointer
            hover:text-blue-600 transition-colors"
        >
          {title}
        </h3>

        {location && (
          <div className="flex items-center text-gray-500 mb-4">
            <MapPin size={14} className="mr-1.5 flex-shrink-0 text-amber-500" />
            <span className="text-sm truncate">{location}</span>
          </div>
        )}

        {(beds || baths || area) && (
          <div className="flex items-center gap-4 py-3 border-y border-gray-100 mb-4">
            {beds && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Bed size={14} className="text-gray-400" />
                {beds} Beds
              </div>
            )}
            {baths && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Bath size={14} className="text-gray-400" />
                {baths} Baths
              </div>
            )}
            {area && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Maximize2 size={14} className="text-gray-400" />
                {area} sqft
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              {isProject ? "Starting From" : "Price"}
            </p>
            <p className="text-xl font-bold text-gray-800">
              {price ? `AED ${utils.formatPrice(price)}` : "On Request"}
            </p>
          </div>

          <div
            onClick={() => onClick(item)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
              cursor-pointer group-hover:bg-gray-800 transition-colors duration-300"
          >
            <ArrowUpRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </article>
  );
};

const PageTitle = ({ count }) => (
  <div className="mb-8">
    <h1 className="text-3xl md:text-4xl font-light text-gray-800 uppercase tracking-wide">
      My Wishlist
    </h1>
    <p className="text-gray-500 mt-2">
      {count} saved {count === 1 ? "item" : "items"}
    </p>
    <div className="mt-4 h-0.5 w-20 bg-gradient-to-r from-gray-800 to-transparent" />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WishlistPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const wishlist = useWishlist();
  const { handleError: handleImageError, hasError: imageHasError } = useImageLoader();

  const handleRefresh = async () => {
    setRefreshing(true);
    await wishlist.refetch();
    setRefreshing(false);
    toast.success("Wishlist refreshed", { icon: "🔄" });
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/logout`, {}, { withCredentials: true });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const handleItemClick = useCallback((item) => {
    const route = item.item_type === "project"
      ? `/projects/${item.item_id}`
      : `/properties/${item.item_id}`;
    router.push(route);
  }, [router]);

  const handleBrowse = useCallback((path) => {
    router.push(path);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="py-10 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 
              text-sm transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar */}
            <Sidebar
              stats={wishlist.stats}
              onLogout={handleLogout}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              router={router}
            />

            {/* Main Content */}
            <main>
              {/* Page Title */}
              <PageTitle count={wishlist.stats.total} />

              {wishlist.loading ? (
                <LoadingState />
              ) : wishlist.items.length === 0 ? (
                <EmptyState onBrowse={handleBrowse} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wishlist.items.map((item) => {
                    const key = `${item.item_type}-${item.item_id}`;
                    const details = wishlist.itemDetails[key];

                    const imagePath =
                      details?.mainImage ||
                      details?.main_image ||
                      details?.cover_image ||
                      details?.image ||
                      details?.images?.[0]?.url ||
                      details?.gallery?.[0] ||
                      null;

                    return (
                      <WishlistCard
                        key={key}
                        item={item}
                        details={details}
                        imageUrl={imageHasError(key) ? null : utils.getImageUrl(imagePath)}
                        hasImageError={imageHasError(key)}
                        onImageError={() => handleImageError(key)}
                        isRemoving={wishlist.removingId === item.item_id}
                        onRemove={wishlist.removeItem}
                        onClick={handleItemClick}
                      />
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}