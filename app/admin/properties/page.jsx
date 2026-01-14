// app/admin/properties/page.jsx - FULL FEATURED FIXED VERSION

"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  AlertCircle,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import {
  getAdminToken,
  isAdminTokenValid,
  clearAdminTokens,
  getAdminUser,
  decodeToken,
} from "../../../utils/auth";

import AdminNavbar from "../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_LOAD = 50;

// ============================================
// CONSTANTS
// ============================================
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

// ============================================
// UTILITY FUNCTIONS
// ============================================
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

// ============================================
// TOAST HELPERS
// ============================================
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

// ============================================
// CUSTOM HOOKS
// ============================================
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

// ============================================
// MEMOIZED COMPONENTS
// ============================================
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
  onView,
  onDelete,
  deleteLoading,
}) {
  const isVisible = (col) => visibleColumns.has(col);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(property.id)}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
        />
      </td>
      {isVisible("id") && (
        <td className="px-4 py-3">
          <Link
            href={`/admin/properties/edit/${property.id}`}
            className="text-blue-600 hover:underline text-sm font-medium font-mono"
          >
            #{property.id}
          </Link>
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
          <Link
            href={`/admin/properties/edit/${property.id}`}
            className="text-left text-sm text-gray-800 font-medium hover:text-blue-600 block max-w-[200px] truncate"
            title={property.property_name}
          >
            {property.property_name || "Untitled Property"}
          </Link>
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(property.id)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            title="View"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <Link
            href={`/admin/properties/edit/${property.id}`}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(property.id)}
            disabled={deleteLoading === property.id}
            className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors"
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
            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          />
        </th>
        {isVisible("id") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>}
        {isVisible("picture") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Picture</th>}
        {isVisible("property_name") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase min-w-[200px]">Property Name</th>}
        {isVisible("status") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>}
        {isVisible("listing_type") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>}
        {isVisible("price") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>}
        {isVisible("beds") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Beds</th>}
        {isVisible("location") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>}
        {isVisible("developer") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Developer</th>}
        {isVisible("agent") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>}
        {isVisible("featured") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Featured</th>}
        {isVisible("created_at") && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>}
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
      </tr>
    </thead>
  );
});

const DeleteModal = memo(function DeleteModal({ isOpen, target, selectedCount, loading, onClose, onConfirm }) {
  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {target.type === "bulk" ? "Delete Properties" : "Delete Property"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
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
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
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

const ColumnSelectorModal = memo(function ColumnSelectorModal({ isOpen, columns, visibleColumns, onToggle, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-bold text-gray-800">Show / Hide Columns</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {columns.map((col) => (
              <label key={col.id} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={visibleColumns.has(col.id)}
                  onChange={() => onToggle(col.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => { onClose(); showSuccess("Columns updated!"); }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
export default function PropertiesPage() {
  const router = useRouter();
  const showScrollTop = useScrollTop();

  // ============================================
  // REFS
  // ============================================
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const fetchIdRef = useRef(0);
  const authChecked = useRef(false);

  // ============================================
  // AUTH STATE
  // ============================================
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ============================================
  // DATA STATE
  // ============================================
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // ============================================
  // AUTH CHECK - SAME PATTERN AS WORKING VERSION
  // ============================================
  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    console.log("🔐 [PROPERTIES] Starting auth check...");

    const token = getAdminToken();
    console.log("🔐 [PROPERTIES] Token exists:", !!token);

    if (!token) {
      console.log("❌ [PROPERTIES] No token - redirecting");
      window.location.replace("/admin/login");
      return;
    }

    const isValid = isAdminTokenValid();
    console.log("🔐 [PROPERTIES] Token valid:", isValid);

    if (!isValid) {
      console.log("❌ [PROPERTIES] Token expired - redirecting");
      clearAdminTokens();
      window.location.replace("/admin/login");
      return;
    }

    let user = getAdminUser();
    console.log("🔐 [PROPERTIES] Cached user:", user);

    if (!user) {
      const decoded = decodeToken(token);
      console.log("🔐 [PROPERTIES] Decoded token:", decoded);
      if (decoded) {
        user = {
          id: decoded.id,
          name: decoded.name || "Admin",
          email: decoded.email,
          usertype: decoded.usertype,
        };
      }
    }

    if (!user) {
      console.log("❌ [PROPERTIES] No user data - redirecting");
      clearAdminTokens();
      window.location.replace("/admin/login");
      return;
    }

    console.log("✅ [PROPERTIES] Auth successful:", user.email);

    setAdmin({
      id: user.id,
      name: user.name,
      email: user.email,
      role: "admin",
      userType: user.usertype,
      avatar: user.image_icon,
    });
    setIsAuthenticated(true);
    setAuthLoading(false);
  }, []);

  // ============================================
  // FETCH PROPERTIES
  // ============================================
  const fetchProperties = useCallback(async (page = 1, append = false) => {
    if (!isAuthenticated) return;

    const token = getAdminToken();
    if (!token) return;

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

      console.log("📊 [PROPERTIES] Fetching:", params.toString());

      const response = await fetch(`${API_BASE_URL}/api/v1/properties?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📊 [PROPERTIES] Response status:", response.status);

      if (response.status === 401) {
        clearAdminTokens();
        window.location.replace("/admin/login");
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log("📊 [PROPERTIES] Response:", data);

      if (fetchId !== fetchIdRef.current) return;

      if (data.success) {
        let list = data.listings || data.data || [];
        list = list.sort((a, b) => b.id - a.id);

        const pagination = data.pagination;
        const newTotal = pagination?.total || data.total || list.length;
        const totalPages = pagination?.totalPages || Math.ceil(newTotal / ITEMS_PER_LOAD);
        const newHasMore = page < totalPages && list.length === ITEMS_PER_LOAD;

        if (append) {
          setProperties(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = list.filter(p => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        } else {
          setProperties(list);
        }

        setTotal(newTotal);
        setCurrentPage(page);
        setHasMore(newHasMore);
        
        console.log("📊 [PROPERTIES] Loaded:", list.length, "items");
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        console.error("❌ [PROPERTIES] Error:", err);
        setError(err.message);
        if (!append) showError("Failed to load properties");
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [isAuthenticated, activeTab, debouncedSearch]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchProperties(currentPage + 1, true);
    }
  }, [loadingMore, hasMore, loading, currentPage, fetchProperties]);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
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
  }, [isAuthenticated, activeTab, debouncedSearch]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleDelete = useCallback(async (id) => {
    const token = getAdminToken();
    if (!token) return;

    const toastId = showLoading("Deleting property...");
    try {
      setDeleteLoading(id);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/properties/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Delete failed");

      setProperties(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      setSelectedProperties(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast.dismiss(toastId);
      showSuccess("Property deleted!");
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.dismiss(toastId);
      showError(err.message || "Delete failed");
    } finally {
      setDeleteLoading(null);
    }
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProperties.size === 0) return;

    const token = getAdminToken();
    if (!token) return;

    const toastId = showLoading(`Deleting ${selectedProperties.size} properties...`);
    try {
      const ids = Array.from(selectedProperties);

      await Promise.all(
        ids.map(id =>
          fetch(`${API_BASE_URL}/api/v1/properties/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {})
        )
      );

      setProperties(prev => prev.filter(p => !selectedProperties.has(p.id)));
      setTotal(prev => Math.max(0, prev - ids.length));
      setSelectedProperties(new Set());

      toast.dismiss(toastId);
      showSuccess(`${ids.length} properties deleted!`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.dismiss(toastId);
      showError("Bulk delete failed");
    }
  }, [selectedProperties]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "bulk") {
      handleBulkDelete();
    } else {
      handleDelete(deleteTarget.id);
    }
  }, [deleteTarget, handleBulkDelete, handleDelete]);

  const handleView = useCallback((id) => {
    window.open(`/properties/${id}`, "_blank");
  }, []);

  const handleRefresh = useCallback(() => {
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
    if (logoutLoading) return;

    setLogoutLoading(true);
    const toastId = showLoading("Signing out...");

    try {
      const token = getAdminToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      clearAdminTokens();
      toast.dismiss(toastId);
      showSuccess("Logged out!");

      setTimeout(() => {
        window.location.replace("/admin/login");
      }, 500);
    } catch {
      toast.dismiss(toastId);
      showError("Logout failed");
      setLogoutLoading(false);
    }
  }, [logoutLoading]);

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
      if (prev.size === properties.length) return new Set();
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

  // ============================================
  // RENDER - AUTH LOADING
  // ============================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER - NOT AUTHENTICATED
  // ============================================
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-right" />
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ============================================
  // RENDER - MAIN PAGE
  // ============================================
  const allSelected = selectedProperties.size === properties.length && properties.length > 0;

  return (
    <>
      <Toaster position="top-right" />
      
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
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
      />

      <ColumnSelectorModal
        isOpen={showColumnModal}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggle={toggleColumn}
        onClose={() => setShowColumnModal(false)}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="p-4">
          {/* Status Tabs */}
          <div className="mb-4">
            <div className="inline-flex bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              {STATUS_TABS.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 text-sm font-semibold transition-all ${
                    index !== 0 ? "border-l border-gray-300" : ""
                  } ${
                    activeTab === tab.key
                      ? "text-white bg-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProperties.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                <strong>{selectedProperties.size}</strong> {selectedProperties.size > 1 ? "properties" : "property"} selected
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedProperties(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => openDeleteModal("bulk")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white border border-gray-300 rounded-t-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/properties/add"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  New Property
                </Link>
                <button
                  onClick={handleExport}
                  disabled={properties.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading || loadingMore}
                  className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
                    className="pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded">
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>
                <button
                  onClick={() => setShowColumnModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
          <div className="border border-gray-300 border-t-0 bg-white">
            {loading && properties.length === 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHeader visibleColumns={visibleColumns} allSelected={false} onToggleAll={() => {}} />
                  <tbody>
                    {Array.from({ length: 15 }, (_, i) => (
                      <LoadingSkeleton key={i} columns={visibleColumns} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
                <p className="text-gray-500 mb-4">
                  {search ? `No results for "${search}"` : "Start by adding your first property"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
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
                        onView={handleView}
                        onDelete={(id) => openDeleteModal("single", id)}
                        deleteLoading={deleteLoading}
                      />
                    ))}
                    {loadingMore && Array.from({ length: 10 }, (_, i) => (
                      <LoadingSkeleton key={`more-${i}`} columns={visibleColumns} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Load More Trigger */}
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center bg-white border border-gray-300 border-t-0 px-4 py-5 rounded-b-lg"
          >
            {loading && properties.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading properties...
              </div>
            ) : loadingMore ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more...
              </div>
            ) : hasMore ? (
              <button
                onClick={loadMore}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <ChevronDown className="w-4 h-4" />
                Load more (scroll or click)
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