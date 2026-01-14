"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * HERO COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * @description    Hero section with animated text and property search functionality.
 *                 Includes location detection, property type selection, and search filters.
 * @version        2.0.0
 * @author         Your Company Name
 * @license        CodeCanyon Regular/Extended License
 *
 * @features
 * - Animated word rotation with reduced motion support
 * - Geolocation-based location detection
 * - Property type multi-select modal
 * - Auto-complete location suggestions
 * - Fully responsive design
 * - SSR compatible (Next.js App Router)
 * - Accessible (WCAG 2.1 AA compliant)
 *
 * @dependencies
 * - react ^18.0.0
 * - next ^14.0.0
 * - framer-motion ^10.0.0
 * - lucide-react ^0.300.0
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  ChevronDown,
  MapPin,
  Navigation,
  X,
  Loader2,
} from "lucide-react";
import PropertyTypeModal from "./PropertyTypeModal";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Animation Configuration
 * @constant
 */
const ANIMATION_CONFIG = {
  WORD_ROTATION_INTERVAL: 2500,
  MODAL_TRANSITION_DURATION: 0.2,
};

/**
 * Geolocation Configuration
 * @constant
 */
const GEOLOCATION_CONFIG = {
  TIMEOUT: 10000,
  ENABLE_HIGH_ACCURACY: true,
  MAXIMUM_AGE: 0,
};

/**
 * Rotating words for hero animation
 * @constant
 */
const ROTATING_WORDS = ["Villa", "Townhouse", "Apartment", "Penthouse"];

/**
 * Popular locations for search suggestions
 * @constant
 */
const POPULAR_LOCATIONS = [
  "Dubai Marina",
  "Downtown Dubai",
  "Palm Jumeirah",
  "Business Bay",
  "JBR",
  "Arabian Ranches",
  "Dubai Hills Estate",
  "Meydan City",
];

/**
 * Bedroom options for filter
 * @constant
 */
const BEDROOM_OPTIONS = [
  { value: "", label: "Bedrooms" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4+ Bedrooms" },
];

/**
 * Price range options for filter
 * @constant
 */
const PRICE_OPTIONS = [
  { value: "", label: "Select Price" },
  { value: "1m", label: "Under 1M AED" },
  { value: "5m", label: "1M - 5M AED" },
  { value: "10m", label: "5M - 10M AED" },
  { value: "10m+", label: "10M+ AED" },
];

/**
 * Initial search form state
 * @constant
 */
const INITIAL_SEARCH_STATE = {
  location: "",
  bedrooms: "",
  price: "",
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Word rotation animation variants
 */
const wordVariants = {
  initial: { y: "100%", opacity: 0 },
  animate: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    y: "-100%",
    opacity: 0,
    transition: { duration: 0.4, ease: "easeIn" },
  },
};

/**
 * Modal overlay animation variants
 */
const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Modal content animation variants
 */
const modalVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

/**
 * Dropdown animation variants
 */
const dropdownVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for SSR-safe mounting detection
 * @returns {boolean} Whether component is mounted on client
 */
const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};

/**
 * Hook for word rotation animation
 * @param {string[]} words - Array of words to rotate
 * @param {number} interval - Rotation interval in ms
 * @param {boolean} shouldReduceMotion - Whether to reduce motion
 * @returns {number} Current word index
 */
const useWordRotation = (words, interval, shouldReduceMotion) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval, shouldReduceMotion]);

  return currentIndex;
};

/**
 * Hook for click outside detection
 * @param {React.RefObject} ref - Reference to the element
 * @param {Function} callback - Callback when clicked outside
 */
const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

/**
 * Hook for location search suggestions
 * @param {string} query - Search query
 * @param {string[]} locations - Available locations
 * @returns {object} Suggestions state and methods
 */
const useLocationSuggestions = (query, locations) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length > 0) {
      const filtered = locations.filter((loc) =>
        loc.toLowerCase().includes(trimmedQuery.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, locations]);

  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  return { suggestions, showSuggestions, hideSuggestions };
};

/**
 * Hook for geolocation with SSR safety
 * @returns {object} Geolocation state and methods
 */
const useGeolocation = () => {
  const [state, setState] = useState({
    location: null,
    loading: false,
    error: "",
    saved: false,
  });

  const isMounted = useMounted();

  /**
   * Check if geolocation is supported
   */
  const isSupported = useMemo(() => {
    if (!isMounted) return false;
    return typeof navigator !== "undefined" && !!navigator?.geolocation;
  }, [isMounted]);

  /**
   * Request user's location
   */
  const requestLocation = useCallback(async () => {
    // SSR safety check
    if (typeof window === "undefined" || !navigator?.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
      }));
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: GEOLOCATION_CONFIG.TIMEOUT,
          enableHighAccuracy: GEOLOCATION_CONFIG.ENABLE_HIGH_ACCURACY,
          maximumAge: GEOLOCATION_CONFIG.MAXIMUM_AGE,
        });
      });

      const { latitude, longitude } = position.coords;
      const displayLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      setState({
        location: { latitude, longitude },
        loading: false,
        error: "",
        saved: true,
      });

      return displayLocation;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Permission denied or location unavailable.",
      }));
      return null;
    }
  }, []);

  /**
   * Reset location state
   */
  const resetLocation = useCallback(() => {
    setState({
      location: null,
      loading: false,
      error: "",
      saved: false,
    });
  }, []);

  return {
    ...state,
    isSupported,
    requestLocation,
    resetLocation,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Location Modal Component
 * @component
 */
const LocationModal = ({
  isOpen,
  onClose,
  onUseLocation,
  loading,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl"
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-modal-title"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 
              transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
            aria-label="Close modal"
          >
            <X size={20} aria-hidden="true" />
          </button>

          {/* Modal Icon */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full 
              bg-black text-white mb-4"
            aria-hidden="true"
          >
            <MapPin size={24} />
          </div>

          {/* Modal Title */}
          <h3
            id="location-modal-title"
            className="text-lg font-bold text-gray-900 mb-2"
          >
            Enable Location?
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            Allow us to detect your location for better property recommendations.
          </p>

          {/* Error Message */}
          {error && (
            <p
              className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onUseLocation}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg flex items-center 
                justify-center gap-2 hover:bg-gray-800 transition-colors 
                disabled:opacity-70 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Navigation size={18} aria-hidden="true" />
              )}
              <span>{loading ? "Detecting..." : "Use My Location"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full border border-gray-200 py-3 rounded-lg 
                hover:bg-gray-50 transition-colors
                focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Manual Search
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Location Suggestions Dropdown Component
 * @component
 */
const LocationSuggestions = ({ suggestions, onSelect, isVisible }) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 
          bg-white shadow-xl max-h-40 overflow-y-auto"
        variants={dropdownVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        role="listbox"
        aria-label="Location suggestions"
      >
        {suggestions.map((location, index) => (
          <div
            key={`suggestion-${index}`}
            onClick={() => onSelect(location)}
            className="px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 
              transition-colors focus:bg-gray-50"
            role="option"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(location);
              }
            }}
          >
            {location}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Select Input Component
 * @component
 */
const SelectInput = ({ value, onChange, options, id, label }) => (
  <div className="relative">
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="h-12 w-full appearance-none rounded-md border border-gray-200 
        bg-white px-3 text-sm text-gray-700 outline-none 
        focus:border-black focus:ring-1 focus:ring-black transition-colors"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      size={16}
      aria-hidden="true"
    />
  </div>
);

/**
 * Property Type Button Component
 * @component
 */
const PropertyTypeButton = ({ selectedCount, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-12 w-full items-center justify-between rounded-md 
      border border-gray-200 px-3 text-sm text-gray-700 bg-white 
      hover:border-gray-300 transition-colors
      focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
    aria-haspopup="dialog"
  >
    <span className="truncate">
      {selectedCount > 0 ? `${selectedCount} selected` : "Property Type"}
    </span>
    <ChevronDown size={16} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
  </button>
);

/**
 * Hero Text Section Component
 * @component
 */
const HeroTextSection = ({ currentWord, wordVariants }) => (
  <div className="flex-1">
    <h1 className="font-playfair text-[clamp(32px,5vw,52px)] leading-tight text-gray-900 font-bold">
      <span className="block">We&apos;re Happy To Help You</span>
      <span className="block mt-1">
        Source the Best{" "}
        <span className="relative inline-flex h-[1.1em] overflow-hidden items-baseline text-[#E79A2D]">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentWord}
              variants={wordVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-block"
            >
              {currentWord}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </h1>

    <p className="mt-6 max-w-lg text-base text-gray-600 leading-relaxed">
      A Casa is all set to help you find a dream home in Dubai. Get your
      favourite
      <span className="font-semibold text-black">
        {" "}Luxury Apartments, Villas, Penthouses, Plot.
      </span>
    </p>

    <button
      className="mt-8 rounded-full border border-black px-10 py-3 text-sm 
        font-bold shadow-md bg-transparent text-black
        hover:bg-black hover:text-white transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
    >
      Learn More
    </button>
  </div>
);

/**
 * Search Card Component
 * @component
 */
const SearchCard = ({
  searchData,
  onInputChange,
  onLocationClick,
  onSearch,
  onPropertyTypeClick,
  selectedTypesCount,
  locationSaved,
  dropdownRef,
  suggestions,
  showSuggestions,
  onSuggestionSelect,
}) => {
  const handleLocationChange = useCallback(
    (e) => onInputChange("location", e.target.value),
    [onInputChange]
  );

  const handleBedroomChange = useCallback(
    (e) => onInputChange("bedrooms", e.target.value),
    [onInputChange]
  );

  const handlePriceChange = useCallback(
    (e) => onInputChange("price", e.target.value),
    [onInputChange]
  );

  return (
    <div className="w-full flex-1 lg:max-w-[500px]">
      <div className="bg-white rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
        <h2 className="mb-6 text-lg font-bold text-gray-900">
          Search your Favourite Home
        </h2>

        <form onSubmit={onSearch} className="flex flex-col gap-4">
          {/* Location Input */}
          <div ref={dropdownRef} className="relative z-10">
            <label htmlFor="location-input" className="sr-only">
              Location
            </label>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
              aria-hidden="true"
            />
            <input
              id="location-input"
              type="text"
              placeholder="Enter project name or location"
              value={searchData.location}
              onClick={onLocationClick}
              onChange={handleLocationChange}
              className={`
                h-12 w-full rounded-md border pl-11 pr-4 text-sm
                outline-none transition-all duration-200
                focus:border-black focus:ring-1 focus:ring-black
                ${locationSaved
                  ? "border-green-500 bg-green-50/50"
                  : "border-gray-200 bg-white"
                }
              `}
              autoComplete="off"
            />

            <LocationSuggestions
              suggestions={suggestions}
              onSelect={onSuggestionSelect}
              isVisible={showSuggestions}
            />
          </div>

          {/* Property Type & Bedrooms Row */}
          <div className="grid grid-cols-2 gap-3">
            <PropertyTypeButton
              selectedCount={selectedTypesCount}
              onClick={onPropertyTypeClick}
            />
            <SelectInput
              id="bedrooms-select"
              label="Bedrooms"
              value={searchData.bedrooms}
              onChange={handleBedroomChange}
              options={BEDROOM_OPTIONS}
            />
          </div>

          {/* Price Select */}
          <SelectInput
            id="price-select"
            label="Price Range"
            value={searchData.price}
            onChange={handlePriceChange}
            options={PRICE_OPTIONS}
          />

          {/* Search Button */}
          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 
              rounded-full bg-black text-sm font-bold text-white shadow-lg 
              hover:bg-gray-800 active:scale-[0.98] transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <Search size={18} aria-hidden="true" />
            <span>Search your Property</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hero Section Component
 *
 * Main hero section with animated text and property search functionality.
 * Includes location detection, property type selection, and search filters.
 *
 * @component
 * @example
 * return <Hero />
 */
export default function Hero() {
  // ─────────────────────────────────────────────────────────────────────────────
  // Hooks & Refs
  // ─────────────────────────────────────────────────────────────────────────────

  const dropdownRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Word rotation
  const currentWordIndex = useWordRotation(
    ROTATING_WORDS,
    ANIMATION_CONFIG.WORD_ROTATION_INTERVAL,
    shouldReduceMotion
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────────

  // Search form state
  const [searchData, setSearchData] = useState(INITIAL_SEARCH_STATE);

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Property type selection
  const [selectedTypes, setSelectedTypes] = useState([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Custom Hooks
  // ─────────────────────────────────────────────────────────────────────────────

  // Geolocation
  const {
    loading: locationLoading,
    error: locationError,
    saved: locationSaved,
    requestLocation,
    resetLocation,
  } = useGeolocation();

  // Location suggestions
  const {
    suggestions: searchSuggestions,
    showSuggestions,
    hideSuggestions,
  } = useLocationSuggestions(searchData.location, POPULAR_LOCATIONS);

  // Click outside to close suggestions
  useClickOutside(dropdownRef, hideSuggestions);

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Handle form input changes
   */
  const handleInputChange = useCallback((field, value) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
    if (field === "location") {
      resetLocation();
    }
  }, [resetLocation]);

  /**
   * Handle property type toggle
   */
  const handleToggleType = useCallback((type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  }, []);

  /**
   * Handle location input click
   */
  const handleLocationInputClick = useCallback(() => {
    if (!searchData.location) {
      setShowLocationModal(true);
    }
  }, [searchData.location]);

  /**
   * Handle use location button
   */
  const handleUseLocation = useCallback(async () => {
    const displayLocation = await requestLocation();
    if (displayLocation) {
      setSearchData((prev) => ({ ...prev, location: displayLocation }));
      setShowLocationModal(false);
    }
  }, [requestLocation]);

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback((location) => {
    handleInputChange("location", location);
    hideSuggestions();
  }, [handleInputChange, hideSuggestions]);

  /**
   * Handle search form submission
   */
  const handleSearch = useCallback((e) => {
    e.preventDefault();

    const searchPayload = {
      ...searchData,
      types: selectedTypes,
    };

    console.log("Search Payload:", searchPayload);

    // TODO: Implement actual search functionality
    alert(
      `Searching for: ${searchData.location || "Anywhere"} with ${selectedTypes.length} property types`
    );
  }, [searchData, selectedTypes]);

  /**
   * Close location modal
   */
  const handleCloseLocationModal = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  /**
   * Open property type modal
   */
  const handleOpenTypeModal = useCallback(() => {
    setShowTypeModal(true);
  }, []);

  /**
   * Close property type modal
   */
  const handleCloseTypeModal = useCallback(() => {
    setShowTypeModal(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section
      className="relative bg-white py-12 lg:py-20 overflow-visible z-10"
      aria-labelledby="hero-heading"
    >
      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={handleCloseLocationModal}
        onUseLocation={handleUseLocation}
        loading={locationLoading}
        error={locationError}
      />

      {/* Property Type Modal */}
      <PropertyTypeModal
        isOpen={showTypeModal}
        onClose={handleCloseTypeModal}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
      />

      {/* Main Content Container */}
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-12 px-4 lg:flex-row lg:px-0">
        {/* Left Section - Hero Text */}
        <HeroTextSection
          currentWord={ROTATING_WORDS[currentWordIndex]}
          wordVariants={wordVariants}
        />

        {/* Right Section - Search Card */}
        <SearchCard
          searchData={searchData}
          onInputChange={handleInputChange}
          onLocationClick={handleLocationInputClick}
          onSearch={handleSearch}
          onPropertyTypeClick={handleOpenTypeModal}
          selectedTypesCount={selectedTypes.length}
          locationSaved={locationSaved}
          dropdownRef={dropdownRef}
          suggestions={searchSuggestions}
          showSuggestions={showSuggestions}
          onSuggestionSelect={handleSuggestionSelect}
        />
      </div>
    </section>
  );
}