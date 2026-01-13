"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Loader2, Trash2, Edit, Eye, RefreshCw, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import TextEditor from "../../components/common/SimpleTextEditor";
import AdminNavbar from "../dashboard/header/DashboardNavbar"; // ✅ Same import as Agent page
import { getAdminToken, removeAdminToken } from "../../../utils/auth";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Constants & Configuration
// ─────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Bahrain",
  "Kuwait",
  "Oman",
];

const UAE_CITIES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

const SLIDER_TYPES = ["image", "video"];
const STATUS_OPTIONS = ["active", "inactive"];

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const INITIAL_FORM_STATE = {
  country: "United Arab Emirates",
  city: "Dubai",
  name: "",
  longitude: "",
  latitude: "",
  slider_type: "image",
  seo_title: "",
  seo_description: "",
  focus_keyword: "",
  description: "",
  status: "active",
};

const INITIAL_MODAL_STATE = {
  city: "",
  communityName: "",
};

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
};

const truncateText = (str, maxLength = 120) => {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

const createAuthHeaders = (includeJson = false) => {
  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}` };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const validateFile = (file, type) => {
  const isImage = type === "image";
  const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const typeLabel = isImage ? "image" : "video";

  if (!allowedTypes.includes(file.type)) {
    const extensions = allowedTypes.map((t) => t.split("/")[1]).join(", ");
    return { valid: false, error: `Invalid ${typeLabel} type. Allowed: ${extensions}` };
  }

  if (file.size > maxSize) {
    const sizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} size must be less than ${sizeMB}MB` };
  }

  return { valid: true, error: null };
};

// ─────────────────────────────────────────────────────────────
// Custom Hooks
// ─────────────────────────────────────────────────────────────
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const useFileUpload = (onTypeChange) => {
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const handleImageChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateFile(file, "image");
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      onTypeChange?.("image");
    },
    [onTypeChange]
  );

  const handleVideoChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateFile(file, "video");
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      onTypeChange?.("video");
    },
    [onTypeChange]
  );

  const clearImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  const clearVideo = useCallback(() => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  }, [videoPreview]);

  const resetFiles = useCallback(() => {
    clearImage();
    clearVideo();
  }, [clearImage, clearVideo]);

  const setPreviewsFromCommunity = useCallback((community) => {
    setImagePreview(community?.image_url || null);
    setVideoPreview(community?.video_url || null);
    setImageFile(null);
    setVideoFile(null);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, []);

  return {
    imageFile,
    videoFile,
    imagePreview,
    videoPreview,
    handleImageChange,
    handleVideoChange,
    clearImage,
    clearVideo,
    resetFiles,
    setPreviewsFromCommunity,
  };
};

const useCommunityApi = () => {
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [pagination, setPagination] = useState({});
  const abortControllerRef = useRef(null);

  const fetchCommunities = useCallback(async (page = 1, limit = 10) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/communities?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: createAuthHeaders(),
          signal: abortControllerRef.current.signal,
        }
      );
      const data = await response.json();

      if (data.success) {
        setCommunities(data.data || []);
        setPagination(data.pagination || {});
        return { success: true };
      } else {
        toast.error(data.message || "Failed to fetch communities");
        return { success: false };
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("Failed to fetch communities");
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommunityById = useCallback(async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/communities/${id}`,
        {
          method: "GET",
          headers: createAuthHeaders(),
        }
      );
      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        toast.error(data.message || "Failed to load community");
        return { success: false };
      }
    } catch {
      toast.error("Failed to load community");
      return { success: false };
    }
  }, []);

  const createCommunity = useCallback(async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/communities`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Community created successfully!");
        return { success: true, data: data.data };
      } else {
        toast.error(data.message || "Failed to create community");
        return { success: false };
      }
    } catch {
      toast.error("Failed to create community");
      return { success: false };
    }
  }, []);

  const updateCommunity = useCallback(async (id, formData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/communities/${id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${getAdminToken()}` },
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Community updated successfully!");
        return { success: true, data: data.data };
      } else {
        toast.error(data.message || "Failed to update community");
        return { success: false };
      }
    } catch {
      toast.error("Failed to update community");
      return { success: false };
    }
  }, []);

  const deleteCommunity = useCallback(async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/communities/${id}`,
        {
          method: "DELETE",
          headers: createAuthHeaders(),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Community deleted successfully!");
        return { success: true };
      } else {
        toast.error(data.message || "Failed to delete community");
        return { success: false };
      }
    } catch {
      toast.error("Failed to delete community");
      return { success: false };
    }
  }, []);

  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/communities/${id}/status`,
        {
          method: "PATCH",
          headers: createAuthHeaders(true),
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        return { success: true };
      } else {
        toast.error(data.message || "Failed to update status");
        return { success: false };
      }
    } catch {
      toast.error("Failed to update status");
      return { success: false };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    communities,
    pagination,
    fetchCommunities,
    fetchCommunityById,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    updateStatus,
  };
};

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────
const MediaThumbnail = React.memo(({ community }) => {
  const { slider_type, image_url, video_url, name } = community || {};

  if (slider_type === "video" && video_url) {
    return (
      <div className="relative w-32 h-18 overflow-hidden rounded border border-gray-300 bg-black">
        <video src={video_url} className="w-full h-full object-cover" muted />
        <span className="absolute bottom-0 left-0 m-0.5 px-1 py-px text-[9px] bg-black/70 text-white rounded">
          Video
        </span>
      </div>
    );
  }

  if (image_url) {
    return (
      <div className="relative w-32 h-18 overflow-hidden rounded border border-gray-300 bg-gray-100">
        <img
          src={image_url}
          alt={name || "Community"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-0 left-0 m-0.5 px-1 py-px text-[9px] bg-black/60 text-white rounded">
          Image
        </span>
      </div>
    );
  }

  return (
    <span className="text-[11px] text-gray-400 whitespace-nowrap">
      No media
    </span>
  );
});

MediaThumbnail.displayName = "MediaThumbnail";

const StatusBadge = React.memo(({ status, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
      status === "active"
        ? "bg-green-100 text-green-700 hover:bg-green-200"
        : "bg-red-100 text-red-700 hover:bg-red-200"
    }`}
  >
    {status}
  </button>
));

StatusBadge.displayName = "StatusBadge";

const ActionButtons = React.memo(({ onView, onEdit, onDelete }) => (
  <div className="flex items-center justify-center gap-1">
    <button
      onClick={onView}
      className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      title="View"
    >
      <Eye size={12} />
    </button>
    <button
      onClick={onEdit}
      className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
      title="Edit"
    >
      <Edit size={12} />
    </button>
    <button
      onClick={onDelete}
      className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
      title="Delete"
    >
      <Trash2 size={12} />
    </button>
  </div>
));

ActionButtons.displayName = "ActionButtons";

const Pagination = React.memo(({ pagination, onPageChange }) => {
  const { currentPage = 1, totalPages = 1, totalItems = 0 } = pagination;

  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const result = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-3 text-xs gap-2">
      <span>Total Communities: {totalItems}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1 rounded border flex items-center gap-1 ${
            currentPage <= 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          <ChevronLeft size={12} />
          Previous
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-2 py-1 rounded border bg-white hover:bg-gray-100"
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-1">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2 py-1 rounded border ${
              page === currentPage
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-2 py-1 rounded border bg-white hover:bg-gray-100"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1 rounded border flex items-center gap-1 ${
            currentPage >= totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          Next
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
});

Pagination.displayName = "Pagination";

const CommunityTableRow = React.memo(
  ({ community, isSelected, onToggleSelect, onView, onEdit, onDelete, onStatusUpdate }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="border border-gray-300 px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="cursor-pointer"
        />
      </td>
      <td className="border border-gray-300 px-2 py-1.5">{community.id}</td>
      <td className="border border-gray-300 px-2 py-1.5">
        <MediaThumbnail community={community} />
      </td>
      <td className="border border-gray-300 px-2 py-1.5 font-medium">
        {community.name}
      </td>
      <td className="border border-gray-300 px-2 py-1.5">{community.city}</td>
      <td className="border border-gray-300 px-2 py-1.5">{community.country}</td>
      <td className="border border-gray-300 px-2 py-1.5 max-w-xs">
        <span className="block text-[11px] text-gray-700">
          {truncateText(stripHtml(community.description || ""))}
        </span>
      </td>
      <td className="border border-gray-300 px-2 py-1.5">
        <StatusBadge
          status={community.status}
          onClick={() =>
            onStatusUpdate(
              community.id,
              community.status === "active" ? "inactive" : "active"
            )
          }
        />
      </td>
      <td className="border border-gray-300 px-2 py-1.5">
        <ActionButtons
          onView={() => onView(community)}
          onEdit={() => onEdit(community.id)}
          onDelete={() => onDelete(community.id)}
        />
      </td>
    </tr>
  )
);

CommunityTableRow.displayName = "CommunityTableRow";

// ─────────────────────────────────────────────────────────────
// Modal Components
// ─────────────────────────────────────────────────────────────
const QuickAddModal = React.memo(
  ({ isOpen, onClose, modalData, onModalChange, onSubmit, isLoading, variants }) => {
    if (!isOpen) return null;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        variants={variants.overlay}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg bg-white rounded-sm shadow-lg border border-gray-300"
          variants={variants.modal}
          initial="hidden"
          animate="show"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
            <h3 id="quick-add-title" className="text-sm font-semibold text-gray-800">
              Add New Community Database
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="px-4 py-4 space-y-3 text-xs">
            <div>
              <label htmlFor="modal-city" className="block mb-1 text-gray-700">
                Select City <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-city"
                value={modalData.city}
                onChange={(e) => onModalChange("city", e.target.value)}
                className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Select</option>
                {UAE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-community-name" className="block mb-1 text-gray-700">
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-community-name"
                type="text"
                value={modalData.communityName}
                onChange={(e) => onModalChange("communityName", e.target.value)}
                placeholder="Community Name"
                className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-1.5 text-xs font-semibold bg-[#007bff] text-white rounded-sm disabled:opacity-50 flex items-center gap-1 hover:bg-blue-600 transition-colors"
              >
                {isLoading && <Loader2 size={12} className="animate-spin" />}
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold bg-[#6f42c1] text-white rounded-sm hover:bg-purple-600 transition-colors"
              >
                Close
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  }
);

QuickAddModal.displayName = "QuickAddModal";

const ViewCommunityModal = React.memo(({ community, onClose, variants }) => {
  if (!community) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      variants={variants.overlay}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl bg-white rounded-sm shadow-lg border border-gray-300 max-h-[90vh] overflow-hidden"
        variants={variants.modal}
        initial="hidden"
        animate="show"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-community-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
          <h3 id="view-community-title" className="text-sm font-semibold text-gray-800">
            Community Details – {community?.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 text-xs space-y-3 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1 flex items-start justify-center">
              <MediaThumbnail community={community} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <p><span className="font-semibold">ID:</span> {community?.id}</p>
              <p><span className="font-semibold">Name:</span> {community?.name}</p>
              <p><span className="font-semibold">City:</span> {community?.city}</p>
              <p><span className="font-semibold">Country:</span> {community?.country}</p>
              <p>
                <span className="font-semibold">Coordinates:</span>{" "}
                {community?.latitude && community?.longitude
                  ? `${community.latitude}, ${community.longitude}`
                  : "Not specified"}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    community?.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {community?.status}
                </span>
              </p>
            </div>
          </div>

          {community?.seo_title && (
            <div className="border-t border-gray-200 pt-3">
              <p className="font-semibold mb-1">SEO Information</p>
              <p><span className="text-gray-600">Title:</span> {community.seo_title}</p>
              {community.seo_description && (
                <p><span className="text-gray-600">Description:</span> {community.seo_description}</p>
              )}
              {community.focus_keyword && (
                <p><span className="text-gray-600">Focus Keyword:</span> {community.focus_keyword}</p>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-3">
            <p className="font-semibold mb-1">Description</p>
            {community?.description ? (
              <div
                className="text-[11px] leading-relaxed text-gray-800 space-y-2 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: community.description }}
              />
            ) : (
              <p className="text-[11px] text-gray-500">No description available.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

ViewCommunityModal.displayName = "ViewCommunityModal";

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function CommunitiesScreen() {
  const router = useRouter();

  // ✅ Auth State - Same as Agent Page
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Community State
  const [showModal, setShowModal] = useState(false);
  const [viewCommunity, setViewCommunity] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalData, setModalData] = useState(INITIAL_MODAL_STATE);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Hooks
  const shouldReduceMotion = useReducedMotion();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    loading,
    communities,
    pagination,
    fetchCommunities,
    fetchCommunityById,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    updateStatus,
  } = useCommunityApi();

  const handleSliderTypeChange = useCallback((type) => {
    setFormData((prev) => ({ ...prev, slider_type: type }));
  }, []);

  const fileUpload = useFileUpload(handleSliderTypeChange);

  // ✅ Auth Check Effect - Same as Agent Page
  useEffect(() => {
    const checkAuth = () => {
      const token = getAdminToken();

      if (!token) {
        toast.error("Please login to access dashboard");
        router.replace("/admin/login");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expiry = payload.exp * 1000;

        if (Date.now() >= expiry) {
          toast.error("Session expired. Please login again.");
          removeAdminToken();
          router.replace("/admin/login");
          return;
        }

        const adminData = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || "admin",
          avatar: null,
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        console.error("Token decode error:", e);
        toast.error("Invalid session. Please login again.");
        removeAdminToken();
        router.replace("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  // ✅ Handle Logout - Same as Agent Page
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      removeAdminToken();
      setAdmin(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
      router.replace("/admin/login");
      setLogoutLoading(false);
    }
  }, [router]);

  // Animation Variants
  const animationVariants = useMemo(
    () => ({
      overlay: {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.18 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      },
      modal: {
        hidden: { opacity: 0, scale: 0.96, y: 8 },
        show: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 32 },
        },
        exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.14 } },
      },
    }),
    [shouldReduceMotion]
  );

  // Form Handlers
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleModalChange = useCallback((field, value) => {
    setModalData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    fileUpload.resetFiles();
    setEditMode(false);
    setEditId(null);
  }, [fileUpload]);

  // Validation
  const validateMainForm = useCallback(() => {
    if (!formData.country.trim()) {
      toast.error("Country is required");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Community name is required");
      return false;
    }
    return true;
  }, [formData]);

  const validateModalForm = useCallback(() => {
    if (!modalData.city) {
      toast.error("Please select a city");
      return false;
    }
    if (!modalData.communityName.trim()) {
      toast.error("Community name is required");
      return false;
    }
    return true;
  }, [modalData]);

  // Submit Handlers
  const handleMainSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateMainForm()) return;

      setSubmitLoading(true);
      try {
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });

        if (fileUpload.imageFile) {
          formDataToSend.append("image", fileUpload.imageFile);
        }
        if (fileUpload.videoFile) {
          formDataToSend.append("video", fileUpload.videoFile);
        }

        const result = editMode
          ? await updateCommunity(editId, formDataToSend)
          : await createCommunity(formDataToSend);

        if (result.success) {
          resetForm();
          fetchCommunities();
        }
      } finally {
        setSubmitLoading(false);
      }
    },
    [formData, fileUpload.imageFile, fileUpload.videoFile, editMode, editId, validateMainForm, createCommunity, updateCommunity, resetForm, fetchCommunities]
  );

  const handleModalSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateModalForm()) return;

      setSubmitLoading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("country", "United Arab Emirates");
        formDataToSend.append("city", modalData.city);
        formDataToSend.append("name", modalData.communityName);

        const result = await createCommunity(formDataToSend);

        if (result.success) {
          setShowModal(false);
          setModalData(INITIAL_MODAL_STATE);
          fetchCommunities();
        }
      } finally {
        setSubmitLoading(false);
      }
    },
    [modalData, validateModalForm, createCommunity, fetchCommunities]
  );

  // Action Handlers
  const handleEdit = useCallback(
    async (id) => {
      const result = await fetchCommunityById(id);

      if (result.success) {
        const community = result.data;
        setFormData({
          country: community.country || "United Arab Emirates",
          city: community.city || "Dubai",
          name: community.name || "",
          longitude: community.longitude || "",
          latitude: community.latitude || "",
          slider_type: community.slider_type || "image",
          seo_title: community.seo_title || "",
          seo_description: community.seo_description || "",
          focus_keyword: community.focus_keyword || "",
          description: community.description || "",
          status: community.status || "active",
        });
        fileUpload.setPreviewsFromCommunity(community);
        setEditMode(true);
        setEditId(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.success("Community loaded for editing");
      }
    },
    [fetchCommunityById, fileUpload]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this community?")) {
        return;
      }

      const result = await deleteCommunity(id);
      if (result.success) {
        fetchCommunities(pagination.currentPage || 1);
      }
    },
    [deleteCommunity, fetchCommunities, pagination.currentPage]
  );

  const handleStatusUpdate = useCallback(
    async (id, newStatus) => {
      const result = await updateStatus(id, newStatus);
      if (result.success) {
        fetchCommunities(pagination.currentPage || 1);
      }
    },
    [updateStatus, fetchCommunities, pagination.currentPage]
  );

  const handlePageChange = useCallback(
    (page) => {
      if (!pagination?.totalPages) return;
      if (page < 1 || page > pagination.totalPages) return;

      fetchCommunities(page);
      setSelectedIds([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pagination?.totalPages, fetchCommunities]
  );

  const handleRefresh = useCallback(() => {
    setSearchTerm("");
    setSelectedIds([]);
    fetchCommunities(pagination.currentPage || 1);
  }, [fetchCommunities, pagination.currentPage]);

  // Selection Handlers
  const filteredCommunities = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return communities;

    return communities.filter((community) =>
      (community.name || "")
        .toString()
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [communities, debouncedSearchTerm]);

  const allVisibleSelected = useMemo(() => {
    return (
      filteredCommunities.length > 0 &&
      filteredCommunities.every((c) => selectedIds.includes(c.id))
    );
  }, [filteredCommunities, selectedIds]);

  const toggleSelectAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredCommunities.some((c) => c.id === id))
      );
    } else {
      setSelectedIds((prev) => {
        const idsToAdd = filteredCommunities.map((c) => c.id);
        return Array.from(new Set([...prev, ...idsToAdd]));
      });
    }
  }, [allVisibleSelected, filteredCommunities]);

  const toggleRowSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Modal Handlers
  const handleOpenModal = useCallback(() => setShowModal(true), []);
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setModalData(INITIAL_MODAL_STATE);
  }, []);
  const handleCloseViewModal = useCallback(() => setViewCommunity(null), []);

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchCommunities();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setSelectedIds([]);
  }, [communities]);

  // ✅ Loading State - Same as Agent Page
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return null;
  }

  return (
    <>
      {/* ✅ Admin Navbar - Same as Agent Page */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <section className="bg-white py-6 px-4 md:px-6">
          {/* Quick Add Modal */}
          <AnimatePresence>
            {showModal && (
              <QuickAddModal
                isOpen={showModal}
                onClose={handleCloseModal}
                modalData={modalData}
                onModalChange={handleModalChange}
                onSubmit={handleModalSave}
                isLoading={submitLoading}
                variants={animationVariants}
              />
            )}
          </AnimatePresence>

          {/* View Community Modal */}
          <AnimatePresence>
            {viewCommunity && (
              <ViewCommunityModal
                community={viewCommunity}
                onClose={handleCloseViewModal}
                variants={animationVariants}
              />
            )}
          </AnimatePresence>

          <div className="max-w-6xl mx-auto border border-gray-400">
            {/* Header Tabs */}
            <div className="flex items-center justify-between bg-[#f5f5f5] border-b border-gray-400 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-4">
                <button className="px-3 py-1 bg-white border border-gray-400 text-xs font-semibold">
                  Community
                </button>

                <Link href="/admin/sub-communities">
                  <button className="px-3 py-1 text-gray-700 hover:underline">
                    Sub Community
                  </button>
                </Link>

                <Link href="/admin/project_lists">
                  <button className="px-3 py-1 text-gray-700 hover:underline">
                    Communities Data OR Ids Info
                  </button>
                </Link>
              </div>
              <button
                type="button"
                onClick={handleOpenModal}
                className="px-3 py-1 bg-[#6f42c1] text-white text-[11px] rounded-sm hover:bg-purple-600 transition-colors flex items-center gap-1"
              >
                <Plus size={12} />
                Add Community Data
              </button>
            </div>

            {/* Main Form */}
            <form onSubmit={handleMainSave} className="bg-[#fbfbc7] px-3 py-3 text-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">
                  {editMode ? "Edit Community" : "Add New Community"}
                </p>
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded-sm hover:bg-gray-600 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Form Fields - Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label htmlFor="country" className="block mb-1">
                    Select Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleFormChange("country", e.target.value)}
                    className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleFormChange("city", e.target.value)}
                    className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {UAE_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="name" className="block mb-1">
                    Community name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Enter Community Name"
                    className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="longitude" className="block mb-1">
                      Longitude
                    </label>
                    <input
                      id="longitude"
                      type="text"
                      value={formData.longitude}
                      onChange={(e) => handleFormChange("longitude", e.target.value)}
                      placeholder="e.g., 55.2708"
                      className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="latitude" className="block mb-1">
                      Latitude
                    </label>
                    <input
                      id="latitude"
                      type="text"
                      value={formData.latitude}
                      onChange={(e) => handleFormChange("latitude", e.target.value)}
                      placeholder="e.g., 25.2048"
                      className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields - Row 2: Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="slider_type" className="block mb-1">
                      Slider Type
                    </label>
                    <select
                      id="slider_type"
                      value={formData.slider_type}
                      onChange={(e) => handleFormChange("slider_type", e.target.value)}
                      className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {SLIDER_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="media-upload" className="block mb-1">
                      {formData.slider_type === "video" ? "Upload Video" : "Upload Image"}
                    </label>
                    {formData.slider_type === "video" ? (
                      <input
                        id="media-upload"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={fileUpload.handleVideoChange}
                        className="w-full border border-gray-400 bg-white px-1 py-[3px] text-[11px]"
                      />
                    ) : (
                      <input
                        id="media-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={fileUpload.handleImageChange}
                        className="w-full border border-gray-400 bg-white px-1 py-[3px] text-[11px]"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {fileUpload.imagePreview && (
                    <div className="relative group">
                      <img
                        src={fileUpload.imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={fileUpload.clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {fileUpload.videoPreview && (
                    <div className="relative group">
                      <video
                        src={fileUpload.videoPreview}
                        className="w-32 h-20 object-cover border border-gray-300 rounded"
                        controls
                      />
                      <button
                        type="button"
                        onClick={fileUpload.clearVideo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields - Status */}
              <div className="mb-3">
                <label htmlFor="status" className="block mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleFormChange("status", e.target.value)}
                  className="w-32 border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Fields - SEO & Description */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="seo_title" className="block mb-1">
                      SEO Title
                    </label>
                    <input
                      id="seo_title"
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleFormChange("seo_title", e.target.value)}
                      maxLength={60}
                      className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <p className="mt-1 text-[10px] text-gray-700">
                      {formData.seo_title.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="seo_description" className="block mb-1">
                      SEO Description
                    </label>
                    <textarea
                      id="seo_description"
                      rows={4}
                      value={formData.seo_description}
                      onChange={(e) => handleFormChange("seo_description", e.target.value)}
                      maxLength={160}
                      className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none resize-none focus:ring-1 focus:ring-blue-400"
                    />
                    <p className="mt-1 text-[10px] text-gray-700">
                      {formData.seo_description.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="focus_keyword" className="block mb-1">
                      SEO Focus Keyword
                    </label>
                    <input
                      id="focus_keyword"
                      type="text"
                      value={formData.focus_keyword}
                      onChange={(e) => handleFormChange("focus_keyword", e.target.value)}
                      className="w-full border border-gray-400 bg-[#ffffe6] px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <ul className="mt-2 text-[10px] text-orange-700 space-y-1 list-disc list-inside">
                      <li>Add Focus Keyword to the SEO title</li>
                      <li>Add Focus Keyword to your SEO Meta Description</li>
                      <li>Use Focus Keyword in the URL</li>
                      <li>Use Focus Keyword in the content</li>
                      <li>Content is long enough (600+ words)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Community Description</label>
                  <TextEditor
                    value={formData.description}
                    onChange={(value) => handleFormChange("description", value)}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-start gap-2 mt-4 border-t border-gray-300 pt-3">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#007bff] text-white border border-[#007bff] rounded-sm disabled:opacity-50 flex items-center gap-1 hover:bg-blue-600 transition-colors"
                >
                  {submitLoading && <Loader2 size={12} className="animate-spin" />}
                  {editMode ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#e0e0e0] text-black border border-gray-500 rounded-sm hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Communities List */}
            <div className="p-3 bg-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Communities List</h3>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by Name"
                      className="w-full md:w-56 border border-gray-300 rounded-sm pl-7 pr-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-sm">Loading communities...</span>
                </div>
              ) : filteredCommunities.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  {searchTerm.trim()
                    ? `No communities found for "${searchTerm}".`
                    : "No communities found. Add your first community!"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-2 py-1.5 text-center w-8">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left w-12">ID</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left w-36">Image</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left">Community Name</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left">City</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left">Country</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left">Description</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left w-20">Status</th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunities.map((community) => (
                        <CommunityTableRow
                          key={community.id}
                          community={community}
                          isSelected={selectedIds.includes(community.id)}
                          onToggleSelect={() => toggleRowSelect(community.id)}
                          onView={() => setViewCommunity(community)}
                          onEdit={() => handleEdit(community.id)}
                          onDelete={() => handleDelete(community.id)}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}