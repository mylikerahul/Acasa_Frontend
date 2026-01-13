"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Loader2,
  Trash2,
  Edit3,
  Plus,
  X,
  Home,
  MapPin,
  BedDouble,
  Star,
  User,
  Download,
  RefreshCw,
  ExternalLink,
  ImageIcon,
  ArrowUp,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";
import AdminNavbar from "../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_LOAD = 50;
const CACHE_DURATION = 30000;

// ==================== CACHE MANAGER ====================
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

const apiCache = new CacheManager();

// ==================== CONSTANTS ====================
const ALL_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "picture", label: "Picture" },
  { id: "property_name", label: "Property Name" },
  { id: "status", label: "Status" },
  { id: "listing_type", label: "Listing Type" },
  { id: "price", label: "Price" },
  { id: "beds", label: "Beds" },
  { id: "location", label: "Location" },
  { id: "developer", label: "Developer" },
  { id: "agent", label: "Agent" },
  { id: "featured", label: "Featured" },
  { id: "created_at", label: "Created At" },
];

const STATUS_TABS = [
  { key: "all", label: "All Properties" },
  { key: "sale", label: "For Sale" },
  { key: "rent", label: "For Rent" },
  { key: "featured", label: "Featured" },
];

const STATUS_COLORS = {
  1: "bg-green-100 text-green-800",
  0: "bg-gray-100 text-gray-800",
};

const LISTING_TYPE_COLORS = {
  sale: "bg-blue-100 text-blue-800",
  rent: "bg-purple-100 text-purple-800",
  "off plan": "bg-amber-100 text-amber-800",
};

const DEFAULT_COLUMNS = new Set([
  "id", "picture", "property_name", "status", 
  "listing_type", "price", "beds", "location", "created_at"
]);

// ==================== UTILITY FUNCTIONS ====================
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (!isNaN(imagePath)) return `${API_BASE_URL}/api/v1/media/${imagePath}`;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("data:")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  if (cleanPath.startsWith("uploads/properties/")) return `${API_BASE_URL}/${cleanPath}`;
  if (cleanPath.startsWith("uploads/")) return `${API_BASE_URL}/uploads/properties/${cleanPath.replace("uploads/", "")}`;
  if (cleanPath.startsWith("properties/")) return `${API_BASE_URL}/uploads/${cleanPath}`;
  return `${API_BASE_URL}/uploads/properties/${cleanPath}`;
};

const formatPrice = (price) => {
  if (!price || price === 0) return "Price on request";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// ==================== TOAST HELPERS ====================
const showSuccess = (msg) => toast.success(msg, {
  duration: 3000,
  position: "top-right",
  style: { background: '#10B981', color: '#fff', fontWeight: '500' },
});

const showError = (msg) => toast.error(msg, {
  duration: 4000,
  position: "top-right",
  style: { background: '#EF4444', color: '#fff', fontWeight: '500' },
});

const showLoading = (msg) => toast.loading(msg, { position: "top-right" });

// ==================== MEMOIZED COMPONENTS ====================
const PropertyImage = memo(function PropertyImage({ src, galleryIds, alt }) {
  const [state, setState] = useState({ loaded: false, error: false, visible: false });
  const imgRef = useRef(null);

  const imageSource = useMemo(() => {
    if (src) return getImageUrl(src);
    if (galleryIds) {
      const ids = String(galleryIds).split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) return getImageUrl(ids[0]);
    }
    return null;
  }, [src, galleryIds]);

  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(s => ({ ...s, visible: true }));
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  if (!imageSource || state.error) {
    return (
      <div ref={imgRef} className="w-full h-full flex items-center justify-center bg-gray-100">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div ref={imgRef} className="relative w-full h-full">
      {!state.loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
        </div>
      )}
      {state.visible && (
        <img
          src={imageSource}
          alt={alt || "Property"}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-200 ${state.loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setState(s => ({ ...s, loaded: true }))}
          onError={() => setState(s => ({ ...s, error: true }))}
        />
      )}
    </div>
  );
});

const LoadingSkeleton = memo(function LoadingSkeleton({ columns }) {
  return (
    <tr className="animate-pulse border-b border-gray-200">
      <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
      {columns.has("id") && <td className="px-4 py-3"><div className="w-12 h-4 bg-gray-200 rounded" /></td>}
      {columns.has("picture") && <td className="px-4 py-3"><div className="w-12 h-10 bg-gray-200 rounded" /></td>}
      {columns.has("property_name") && (
        <td className="px-4 py-3">
          <div className="w-40 h-4 bg-gray-200 rounded mb-1" />
          <div className="w-28 h-3 bg-gray-100 rounded" />
        </td>
      )}
      {columns.has("status") && <td className="px-4 py-3"><div className="w-16 h-5 bg-gray-200 rounded-full" /></td>}
      {columns.has("listing_type") && <td className="px-4 py-3"><div className="w-14 h-5 bg-gray-200 rounded-full" /></td>}
      {columns.has("price") && <td className="px-4 py-3"><div className="w-24 h-4 bg-gray-200 rounded" /></td>}
      {columns.has("beds") && <td className="px-4 py-3"><div className="w-10 h-4 bg-gray-200 rounded" /></td>}
      {columns.has("location") && <td className="px-4 py-3"><div className="w-32 h-4 bg-gray-200 rounded" /></td>}
      {columns.has("developer") && <td className="px-4 py-3"><div className="w-24 h-4 bg-gray-200 rounded" /></td>}
      {columns.has("agent") && <td className="px-4 py-3"><div className="w-20 h-4 bg-gray-200 rounded" /></td>}
      {columns.has("featured") && <td className="px-4 py-3"><div className="w-5 h-5 bg-gray-200 rounded" /></td>}
      {columns.has("created_at") && <td className="px-4 py-3"><div className="w-20 h-4 bg-gray-200 rounded" /></td>}
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <div className="w-7 h-7 bg-gray-200 rounded" />
          <div className="w-7 h-7 bg-gray-200 rounded" />
          <div className="w-7 h-7 bg-gray-200 rounded" />
        </div>
      </td>
    </tr>
  );
});

const ScrollToTopButton = memo(function ScrollToTopButton({ show }) {
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all"
      title="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
});

const PropertyRow = memo(function PropertyRow({
  property,
  visibleColumns,
  isSelected,
  onToggleSelect,
  onEdit,
  onView,
  onDelete,
  deleteLoading,
}) {
  const isVisible = (col) => visibleColumns.has(col);
  
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(property.id)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </td>
      {isVisible("id") && (
        <td className="px-4 py-3">
          <button
            onClick={() => onEdit(property.id)}
            className="text-blue-600 hover:underline text-sm font-medium font-mono"
          >
            #{property.id}
          </button>
        </td>
      )}
      {isVisible("picture") && (
        <td className="px-4 py-3">
          <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-gray-100">
            <PropertyImage
              src={property.featured_image}
              galleryIds={property.gallery_media_ids}
              alt={property.property_name}
            />
          </div>
        </td>
      )}
      {isVisible("property_name") && (
        <td className="px-4 py-3">
          <button
            onClick={() => onEdit(property.id)}
            className="text-left text-sm text-gray-800 font-medium hover:text-blue-600 block max-w-[200px] truncate"
            title={property.property_name}
          >
            {property.property_name || "Untitled Property"}
          </button>
          {property.property_slug && (
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              {property.property_slug}
            </div>
          )}
        </td>
      )}
      {isVisible("status") && (
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[property.status] || STATUS_COLORS[0]}`}>
            {property.status === 1 ? "Active" : "Draft"}
          </span>
        </td>
      )}
      {isVisible("listing_type") && (
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LISTING_TYPE_COLORS[property.listing_type?.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
            {property.listing_type || "N/A"}
          </span>
        </td>
      )}
      {isVisible("price") && (
        <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">
          {formatPrice(property.price)}
        </td>
      )}
      {isVisible("beds") && (
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <BedDouble className="w-3.5 h-3.5" />
            {property.bedroom || property.bedrooms || "-"}
          </span>
        </td>
      )}
      {isVisible("location") && (
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 max-w-[150px]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{property.location || property.city || "-"}</span>
          </span>
        </td>
      )}
      {isVisible("developer") && (
        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[120px]">
          {property.developer_name || "-"}
        </td>
      )}
      {isVisible("agent") && (
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <User className="w-3.5 h-3.5" />
            {property.agent_name || "-"}
          </span>
        </td>
      )}
      {isVisible("featured") && (
        <td className="px-4 py-3">
          {property.featured_property === "1" || property.featured_property === 1 ? (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      )}
      {isVisible("created_at") && (
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(property.created_at)}
        </td>
      )}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(property.id)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
            title="View"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(property.id)}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(property.id)}
            disabled={deleteLoading === property.id}
            className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
            title="Delete"
          >
            {deleteLoading === property.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
});

const TableHeader = memo(function TableHeader({ visibleColumns, allSelected, onToggleAll }) {
  const isVisible = (col) => visibleColumns.has(col);
  
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-300">
        <th className="w-10 px-4 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-4 h-4 rounded border-gray-300"
          />
        </th>
        {isVisible("id") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>}
        {isVisible("picture") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Picture</th>}
        {isVisible("property_name") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase min-w-[200px]">Property Name</th>}
        {isVisible("status") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>}
        {isVisible("listing_type") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>}
        {isVisible("price") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>}
        {isVisible("beds") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Beds</th>}
        {isVisible("location") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Location</th>}
        {isVisible("developer") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Developer</th>}
        {isVisible("agent") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Agent</th>}
        {isVisible("featured") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Featured</th>}
        {isVisible("created_at") && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>}
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
      </tr>
    </thead>
  );
});

const FullPageLoader = memo(function FullPageLoader({ message }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">{message || "Loading..."}</p>
      </div>
    </div>
  );
});

const DeleteModal = memo(function DeleteModal({ 
  isOpen, 
  target, 
  selectedCount, 
  loading, 
  onClose, 
  onConfirm 
}) {
  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {target.type === "bulk" ? "Delete Properties" : "Delete Property"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {target.type === "bulk"
              ? `Are you sure you want to delete ${selectedCount} properties? This action cannot be undone.`
              : "Are you sure you want to delete this property? This action cannot be undone."}
          </p>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const ColumnSelectorModal = memo(function ColumnSelectorModal({ 
  isOpen, 
  columns, 
  visibleColumns, 
  onToggle, 
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Show / Hide Column in Listing</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {columns.map((col) => (
              <label
                key={col.id}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.has(col.id)}
                  onChange={() => onToggle(col.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                onClose();
                showSuccess("Columns updated successfully");
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ==================== CUSTOM HOOKS ====================
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function useScrollTop(threshold = 500) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > threshold);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return show;
}

// ==================== API HOOK ====================
function useAPI() {
  const abortControllerRef = useRef(null);

  const request = useCallback(async (endpoint, options = {}) => {
    const token = getAdminToken();
    if (!token) {
      window.location.href = "/admin/login";
      throw new Error("Please login to continue");
    }

    // Cancel previous request if exists
    if (options.cancelPrevious && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (options.cancelPrevious) {
      abortControllerRef.current = new AbortController();
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: options.cancelPrevious ? abortControllerRef.current.signal : options.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        logoutAll();
        window.location.href = "/admin/login";
        throw new Error("Session expired");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Network error" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      throw error;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { request, cleanup };
}

// ==================== AUTH HOOK ====================
function useAuth() {
  const [state, setState] = useState({
    admin: null,
    isAuthenticated: false,
    loading: true,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();
      if (sessionType !== "admin") {
        throw new Error("Please login as admin");
      }

      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        throw new Error("Session expired");
      }

      // Verify token
      const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok && response.status === 401) {
        throw new Error("Invalid token");
      }

      // Decode token
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.userType !== "admin") {
        throw new Error("Invalid session type");
      }

      setState({
        admin: {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || "admin",
          userType: payload.userType,
        },
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      console.error("Auth error:", error);
      logoutAll();
      setState({ admin: null, isAuthenticated: false, loading: false });
      router.replace("/admin/login");
    }
  }, [router]);

  const logout = useCallback(async () => {
    const toastId = showLoading("Logging out...");
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      toast.dismiss(toastId);
      showSuccess("Logged out successfully");
    } catch {
      toast.dismiss(toastId);
    } finally {
      logoutAll();
      router.replace("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { ...state, logout };
}

// ==================== MAIN COMPONENT ====================
export default function PropertiesPage() {
  const router = useRouter();
  const { admin, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { request, cleanup } = useAPI();
  const showScrollTop = useScrollTop();

  // Refs
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const fetchIdRef = useRef(0);

  // State
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [showOverviewDropdown, setShowOverviewDropdown] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // ==================== FETCH PROPERTIES ====================
  const fetchProperties = useCallback(async (page = 1, append = false) => {
    if (!isAuthenticated) return;

    const fetchId = ++fetchIdRef.current;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_LOAD.toString(),
        sort_by: "id",
        sort_order: "desc",
      });

      if (activeTab === "sale") params.append("listing_type", "sale");
      else if (activeTab === "rent") params.append("listing_type", "rent");
      else if (activeTab === "featured") params.append("featured_only", "true");

      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      // Check cache for non-append requests
      const cacheKey = `properties_${params.toString()}`;
      if (!append) {
        const cached = apiCache.get(cacheKey);
        if (cached) {
          setProperties(cached.properties);
          setTotal(cached.total);
          setHasMore(cached.hasMore);
          setCurrentPage(page);
          setLoading(false);
          return;
        }
      }

      const data = await request(`/api/v1/properties?${params}`, { cancelPrevious: true });

      // Check if this is still the latest request
      if (fetchId !== fetchIdRef.current) return;

      if (data.success) {
        // *** FIX: Added data.listings as fallback since API returns 'listings' ***
        let propertiesData = data.listings || data.data || [];
        propertiesData = propertiesData.sort((a, b) => b.id - a.id);

        const pagination = data.pagination;
        const newTotal = pagination?.total || data.total || propertiesData.length;
        const totalPages = pagination?.totalPages || Math.ceil(newTotal / ITEMS_PER_LOAD);
        const newHasMore = page < totalPages && propertiesData.length === ITEMS_PER_LOAD;

        if (append) {
          setProperties(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProperties = propertiesData.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProperties];
          });
        } else {
          setProperties(propertiesData);
          // Cache the result
          apiCache.set(cacheKey, {
            properties: propertiesData,
            total: newTotal,
            hasMore: newHasMore,
          });
        }

        setTotal(newTotal);
        setCurrentPage(page);
        setHasMore(newHasMore);
      }
    } catch (err) {
      if (err.name !== "AbortError" && fetchId === fetchIdRef.current) {
        setError(err.message);
        if (!append) showError("Failed to load properties");
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [isAuthenticated, activeTab, debouncedSearch, request]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchProperties(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, loading, currentPage, fetchProperties]);

  // ==================== EFFECTS ====================
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  // Fetch on filter change
  useEffect(() => {
    if (isAuthenticated) {
      setProperties([]);
      setCurrentPage(1);
      setHasMore(true);
      setSelectedProperties(new Set());
      fetchProperties(1, false);
    }

    return cleanup;
  }, [isAuthenticated, activeTab, debouncedSearch]);

  // ==================== HANDLERS ====================
  const handleDelete = useCallback(async (id) => {
    const toastId = showLoading("Deleting property...");
    try {
      setDeleteLoading(id);
      await request(`/api/v1/properties/${id}`, { method: "DELETE" });
      
      setProperties(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      setSelectedProperties(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      
      // Invalidate cache
      apiCache.clear();
      
      toast.dismiss(toastId);
      showSuccess("Property deleted successfully!");
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message || "Error deleting property");
    } finally {
      setDeleteLoading(null);
    }
  }, [request]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProperties.size === 0) return;

    const toastId = showLoading(`Deleting ${selectedProperties.size} properties...`);
    try {
      const ids = Array.from(selectedProperties);

      try {
        await request("/api/v1/properties/bulk", {
          method: "DELETE",
          body: JSON.stringify({ property_ids: ids }),
        });
      } catch {
        // Fallback to sequential delete
        await Promise.all(ids.map(id => 
          request(`/api/v1/properties/${id}`, { method: "DELETE" }).catch(() => {})
        ));
      }

      setProperties(prev => prev.filter(p => !selectedProperties.has(p.id)));
      setTotal(prev => Math.max(0, prev - ids.length));
      setSelectedProperties(new Set());
      
      // Invalidate cache
      apiCache.clear();

      toast.dismiss(toastId);
      showSuccess(`${ids.length} properties deleted successfully!`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.dismiss(toastId);
      showError("Error deleting properties");
    }
  }, [selectedProperties, request]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "bulk") {
      handleBulkDelete();
    } else {
      handleDelete(deleteTarget.id);
    }
  }, [deleteTarget, handleBulkDelete, handleDelete]);

  const handleEdit = useCallback((id) => {
    router.push(`/admin/properties/edit/${id}`);
  }, [router]);

  const handleAdd = useCallback(() => {
    router.push("/admin/properties/add");
  }, [router]);

  const handleView = useCallback((id) => {
    window.open(`/properties/${id}`, "_blank");
  }, []);

  const handleRefresh = useCallback(() => {
    apiCache.clear();
    setProperties([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchProperties(1, false);
  }, [fetchProperties]);

  const handleExport = useCallback(() => {
    if (properties.length === 0) {
      showError("No properties to export");
      return;
    }

    const headers = ["ID", "Property Name", "Price", "Beds", "Location", "Status", "Type", "Created"];
    const csvContent = [
      headers.join(","),
      ...properties.map(p =>
        [
          p.id,
          `"${(p.property_name || "").replace(/"/g, '""')}"`,
          p.price || "",
          p.bedroom || "",
          `"${(p.location || "").replace(/"/g, '""')}"`,
          p.status === 1 ? "Active" : "Draft",
          p.listing_type || "",
          p.created_at || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `properties_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Export completed!");
  }, [properties]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
  }, [logout]);

  // Column & Selection helpers
  const toggleColumn = useCallback((columnId) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedProperties(prev => {
      if (prev.size === properties.length) {
        return new Set();
      }
      return new Set(properties.map(p => p.id));
    });
  }, [properties]);

  const toggleSelect = useCallback((id) => {
    setSelectedProperties(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openDeleteModal = useCallback((type, id = null) => {
    setDeleteTarget(type === "bulk" ? { type: "bulk" } : { type: "single", id });
    setShowDeleteModal(true);
  }, []);

  // ==================== RENDER ====================
  if (authLoading) {
    return (
      <>
        <Toaster position="top-right" />
        <FullPageLoader message="Verifying authentication..." />
      </>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  const allSelected = selectedProperties.size === properties.length && properties.length > 0;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <ScrollToTopButton show={showScrollTop} />

      <DeleteModal
        isOpen={showDeleteModal}
        target={deleteTarget}
        selectedCount={selectedProperties.size}
        loading={deleteLoading}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <ColumnSelectorModal
        isOpen={showOverviewDropdown}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggle={toggleColumn}
        onClose={() => setShowOverviewDropdown(false)}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-3">
          {/* Tabs */}
          <div className="mb-3">
            <div className="inline-flex bg-white border border-gray-300 rounded overflow-hidden flex-wrap">
              {STATUS_TABS.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    index !== 0 ? "border-l border-gray-300" : ""
                  } ${activeTab === tab.key ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  style={activeTab === tab.key ? { backgroundColor: "rgb(39,113,183)" } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProperties.size > 0 && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
              <p className="text-sm text-blue-900">
                <strong>{selectedProperties.size}</strong> {selectedProperties.size > 1 ? "properties" : "property"} selected
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedProperties(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear selection
                </button>
                <button
                  onClick={() => openDeleteModal("bulk")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdd}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  New Property
                </button>
                <button
                  onClick={handleExport}
                  disabled={properties.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading || loadingMore}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>

                <button
                  onClick={() => setShowOverviewDropdown(true)}
                  style={{ backgroundColor: "rgb(39,113,183)", color: "#fff" }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded hover:opacity-90"
                >
                  Overview
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <span>
                Showing <strong>{properties.length}</strong>
                {total > properties.length && <> of <strong>{total}</strong></>} properties
              </span>
              {(loading || loadingMore) && (
                <span className="ml-4 flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingMore ? "Loading more..." : "Loading..."}
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-300 border-t-0" style={{ backgroundColor: "rgb(236,237,238)" }}>
            {loading && properties.length === 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ backgroundColor: "rgb(236,237,238)" }}>
                  <TableHeader 
                    visibleColumns={visibleColumns} 
                    allSelected={false} 
                    onToggleAll={() => {}} 
                  />
                  <tbody>
                    {Array.from({ length: 15 }, (_, i) => (
                      <LoadingSkeleton key={i} columns={visibleColumns} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No properties found</p>
                {search && <p className="text-sm text-gray-500 mt-1">Try a different search term</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ backgroundColor: "rgb(236,237,238)" }}>
                  <TableHeader
                    visibleColumns={visibleColumns}
                    allSelected={allSelected}
                    onToggleAll={toggleSelectAll}
                  />
                  <tbody>
                    {properties.map((property) => (
                      <PropertyRow
                        key={property.id}
                        property={property}
                        visibleColumns={visibleColumns}
                        isSelected={selectedProperties.has(property.id)}
                        onToggleSelect={toggleSelect}
                        onEdit={handleEdit}
                        onView={handleView}
                        onDelete={(id) => openDeleteModal("single", id)}
                        deleteLoading={deleteLoading}
                      />
                    ))}

                    {/* Loading More Skeleton */}
                    {loadingMore && Array.from({ length: 10 }, (_, i) => (
                      <LoadingSkeleton key={`loading-more-${i}`} columns={visibleColumns} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Infinite Scroll Trigger */}
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center bg-white border border-gray-300 border-t-0 px-4 py-4 rounded-b"
          >
            {loading && properties.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading properties...
              </div>
            ) : loadingMore ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more properties...
              </div>
            ) : hasMore ? (
              <button
                onClick={loadMore}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
              >
                <ChevronDown className="w-4 h-4" />
                Load more properties (Scroll or click)
              </button>
            ) : properties.length > 0 ? (
              <div className="text-sm text-gray-500">
                ✓ All <strong>{properties.length}</strong> properties loaded
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}