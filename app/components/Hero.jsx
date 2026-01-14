"use client";

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

// ============================================
// HERO COMPONENT - Property Search Section
// ============================================

export default function Hero() {
  // Refs
  const dropdownRef = useRef(null);
  
  // Accessibility
  const shouldReduceMotion = useReducedMotion();

  // Word Animation State
  const words = useMemo(
    () => ["Villa", "Townhouse", "Apartment", "Penthouse"],
    []
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Search Form State
  const [searchData, setSearchData] = useState({
    location: "",
    bedrooms: "",
    price: "",
  });

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // Search Suggestions State
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Property Type Modal State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Mounted State for SSR Safety
  const [isMounted, setIsMounted] = useState(false);

  // Popular Locations Data
  const popularLocations = useMemo(
    () => [
      "Dubai Marina",
      "Downtown Dubai",
      "Palm Jumeirah",
      "Business Bay",
      "JBR",
      "Arabian Ranches",
      "Dubai Hills Estate",
      "Meydan City",
    ],
    []
  );

  // ============================================
  // EFFECTS
  // ============================================

  // SSR Safety - Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Word Rotation Animation
  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [words.length, shouldReduceMotion]);

  // Location Search Suggestions
  useEffect(() => {
    const query = searchData.location.trim();
    
    if (query.length > 0) {
      const filtered = popularLocations.filter((loc) =>
        loc.toLowerCase().includes(query.toLowerCase())
      );
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchData.location, popularLocations]);

  // Close Suggestions on Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleInputChange = useCallback((field, value) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
    if (field === "location") {
      setLocationSaved(false);
    }
  }, []);

  const toggleType = useCallback((type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const handleFetchLocation = async () => {
    setLocationLoading(true);
    setLocationError("");
    
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported");
      }
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        });
      });
      
      const { latitude, longitude } = position.coords;
      const displayLoc = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      setUserLocation({ latitude, longitude });
      setSearchData((prev) => ({ ...prev, location: displayLoc }));
      setLocationSaved(true);
      setShowLocationModal(false);
    } catch (error) {
      setLocationError("Permission denied or location unavailable.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearch = (e) => {
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
  };

  const handleLocationInputClick = () => {
    if (!searchData.location) {
      setShowLocationModal(true);
    }
  };

  const handleSuggestionClick = (location) => {
    handleInputChange("location", location);
    setShowSuggestions(false);
  };

  // ============================================
  // ANIMATION VARIANTS
  // ============================================

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

  const modalOverlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalContentVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  };

  const dropdownVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <section className="relative bg-white py-12 lg:py-20 overflow-visible z-10">
      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            variants={modalOverlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div
              className="relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl"
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLocationModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* Modal Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white mb-4">
                <MapPin size={24} />
              </div>

              {/* Modal Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Enable Location?
              </h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Allow us to detect your location for better property recommendations.
              </p>

              {/* Error Message */}
              {locationError && (
                <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">
                  {locationError}
                </p>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleFetchLocation}
                  disabled={locationLoading}
                  className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {locationLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Navigation size={18} />
                  )}
                  <span>Use My Location</span>
                </button>
                
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-full border border-gray-200 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Manual Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Type Modal */}
      <PropertyTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
      />

      {/* Main Content Container */}
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-12 px-4 lg:flex-row lg:px-0">
        {/* Left Section - Hero Text */}
        <div className="flex-1">
          <h1 className="font-playfair text-[clamp(32px,5vw,52px)] leading-tight text-gray-900 font-bold">
            <span className="block">We're Happy To Help You</span>
            <span className="block mt-1">
              Source the Best{" "}
              <span className="relative inline-flex h-[1.1em] overflow-hidden items-baseline text-[#E79A2D]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    variants={wordVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="inline-block"
                  >
                    {words[currentWordIndex]}
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

          <button className="mt-8 rounded-full border border-black px-10 py-3 text-sm font-bold shadow-md hover:bg-black hover:text-white transition-all duration-200">
            Learn More
          </button>
        </div>

        {/* Right Section - Search Card */}
        <div className="w-full flex-1 lg:max-w-[500px]">
          <div className="bg-white rounded-2xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Search your Favourite Home
            </h2>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              {/* Location Input with Suggestions */}
              <div ref={dropdownRef} className="relative z-10">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Enter project name or location"
                  value={searchData.location}
                  onClick={handleLocationInputClick}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className={`
                    h-12 w-full rounded-md border pl-11 pr-4 text-sm
                    outline-none transition-all duration-200
                    focus:border-black focus:ring-1 focus:ring-black
                    ${locationSaved 
                      ? "border-green-500 bg-green-50/50" 
                      : "border-gray-200 bg-white"
                    }
                  `}
                />

                {/* Location Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl max-h-40 overflow-y-auto"
                    >
                      {searchSuggestions.map((location, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(location)}
                          className="px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          {location}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Property Type & Bedrooms Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Property Type Button */}
                <button
                  type="button"
                  onClick={() => setShowTypeModal(true)}
                  className="flex h-12 w-full items-center justify-between rounded-md border border-gray-200 px-3 text-sm text-gray-700 bg-white hover:border-gray-300 transition-colors"
                >
                  <span className="truncate">
                    {selectedTypes.length > 0
                      ? `${selectedTypes.length} selected`
                      : "Property Type"}
                  </span>
                  <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                </button>

                {/* Bedrooms Select */}
                <div className="relative">
                  <select
                    value={searchData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    className="h-12 w-full appearance-none rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  >
                    <option value="">Bedrooms</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              {/* Price Select */}
              <div className="relative">
                <select
                  value={searchData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                >
                  <option value="">Select Price</option>
                  <option value="1m">Under 1M AED</option>
                  <option value="5m">1M - 5M AED</option>
                  <option value="10m">5M - 10M AED</option>
                  <option value="10m+">10M+ AED</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-bold text-white shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200"
              >
                <Search size={18} />
                <span>Search your Property</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}