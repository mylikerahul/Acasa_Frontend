"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  ChevronDown,
  MapPin,
  ArrowRight,
  Navigation,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const words = useMemo(() => ["Villa", "Townhouse", "Apartment", "Penthouse"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [searchData, setSearchData] = useState({
    location: "",
    type: "",
    bedrooms: "",
    price: "",
  });

  // Modal and location states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularLocations = useMemo(
    () => [
      "Dubai Marina",
      "Downtown Dubai",
      "Palm Jumeirah",
      "Business Bay",
      "JBR - Jumeirah Beach Residence",
      "Arabian Ranches",
      "Dubai Hills Estate",
      "Meydan City",
    ],
    []
  );

  // Word rotation (smooth slide)
  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [words.length, shouldReduceMotion]);

  // Update suggestions
  useEffect(() => {
    const q = searchData.location.trim();
    if (q.length > 0) {
      const filtered = popularLocations.filter((loc) =>
        loc.toLowerCase().includes(q.toLowerCase())
      );
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchData.location, popularLocations]);

  const handleInputChange = useCallback((field, value) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
    if (field === "location") setLocationSaved(false);
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();

      const params = new URLSearchParams();
      if (searchData.location?.trim()) params.set("search", searchData.location.trim());
      if (searchData.type) params.set("type", searchData.type);
      if (searchData.bedrooms) params.set("bedrooms", searchData.bedrooms);
      if (searchData.price) params.set("price", searchData.price);

      if (userLocation?.latitude && userLocation?.longitude) {
        params.set("lat", userLocation.latitude.toString());
        params.set("lng", userLocation.longitude.toString());
        params.set("nearby", "true");
      }

      const queryString = params.toString();
      console.log("Search submitted with params:", queryString);

      alert(
        `Search submitted!\nLocation: ${searchData.location || "Any"}\nType: ${
          searchData.type || "Any"
        }\nBedrooms: ${searchData.bedrooms || "Any"}\nPrice: ${searchData.price || "Any"}`
      );
    },
    [searchData, userLocation]
  );

  const handleLocationInputClick = () => {
    if (!searchData.location) setShowLocationModal(true);
  };

  const handleFetchLocation = async () => {
    setLocationLoading(true);
    setLocationError("");

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      const locationData = {
        latitude,
        longitude,
        city: "Dubai",
        display: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        saved: true,
      };

      setUserLocation(locationData);
      setSearchData((prev) => ({ ...prev, location: locationData.display }));
      setLocationSaved(true);
      setShowLocationModal(false);
    } catch (error) {
      let errorMessage = "Unable to fetch location";

      const code = error?.code;
      if (code === 1) errorMessage = "Location permission denied. Please enable location access.";
      else if (code === 2) errorMessage = "Location unavailable. Please try again.";
      else if (code === 3) errorMessage = "Location request timed out. Please try again.";

      setLocationError(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleManualSearch = () => {
    setShowLocationModal(false);
    setTimeout(() => document.getElementById("property-search")?.focus(), 100);
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setSearchData((prev) => ({ ...prev, location: "" }));
    setLocationSaved(false);
  };

  const handleSelectSuggestion = (location) => {
    setSearchData((prev) => ({ ...prev, location }));
    setShowSuggestions(false);
  };

  const isFormValid =
    searchData.location || searchData.type || searchData.bedrooms || searchData.price;

  // Motion variants
  const overlayV = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const modalV = {
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
  };

  const wordV = {
    initial: { y: "100%", opacity: 0 },
    animate: {
      y: "0%",
      opacity: 1,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      y: "-100%",
      opacity: 0,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const dropdownV = {
    hidden: { opacity: 0, y: -6 },
    show: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.14, ease: "easeIn" },
    },
  };

  return (
    <section
      className="relative bg-[#F7F7F7] py-16 lg:py-20"
      role="search"
      aria-label="Property search hero section"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap');
        
        .word-container {
          display: inline-block;
          position: relative;
          height: 1.2em;
          overflow: hidden;
          vertical-align: bottom;
        }
        
        .rotating-word {
          display: inline-block;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 700;
          color: rgb(209,144,38); /* तुमने बोला हुआ exact रंग */
        }
      `}</style>

      {/* Location Permission Modal (unchanged) */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            variants={overlayV}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <motion.div
              className="relative w-full max-w-sm rounded-xl bg-white p-6 sm:p-7 shadow-2xl"
              variants={modalV}
              initial="hidden"
              animate="show"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Location permission"
            >
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                <MapPin className="h-6 w-6" />
              </div>

              <h3 className="mb-1 text-left text-lg font-semibold text-[#111111]">
                How would you like to search?
              </h3>
              <p className="mb-4 text-left text-sm text-[#6B6B6B]">
                Use your current location for nearby properties or search manually.
              </p>

              <AnimatePresence>
                {locationError && (
                  <motion.div
                    className="mb-3 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-600 flex items-start gap-2"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                  >
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{locationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={locationLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching Location...
                    </>
                  ) : (
                    <>
                      <Navigation size={16} />
                      Use Current Location
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  type="button"
                  onClick={handleManualSearch}
                  disabled={locationLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E2E2] bg:white px-4 py-3 text-sm font-medium text-[#333333] transition-all hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search size={16} />
                  Search Manually
                </motion.button>
              </div>

              <p className="mt-4 text-left text-xs text-[#999999] flex items-center gap-1">
                <span>🔒</span>
                <span>Your location data is only used to find nearby properties.</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Hero Layout */}
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-12 px-4 lg:flex-row lg:items-center lg:gap-16 lg:px-0">
        {/* LEFT */}
        <motion.div
          className="flex-1"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* यहाँ heading पूरा एक ही line में लिखा गया है */}
          <h1
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}
            className="mb-6 text-[32px] leading-tight text-[#111111] sm:text-[38px] lg:text-[44px]"
          >
            We&apos;re Happy To Help You Source the Best{" "}
            <span className="word-container" style={{ minWidth: "180px" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  variants={wordV}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="rotating-word"
                >
                  {words[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="max-w-xl text-[15px] leading-relaxed text-[#4B4B4B]">
            A Casa is all set to help you find a dream home in Dubai. Get your favourite{" "}
            <span className="font-semibold text-[#111111]">Luxury Apartments</span>,{" "}
            <span className="font-semibold text-[#111111]">Villas</span>,{" "}
            <span className="font-semibold text-[#111111]">Penthouses</span>, Plot.
          </p>

          <motion.button
            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            type="button"
            className="mt-7 inline-flex items-center rounded-full border border-black bg-black px-7 py-2.5 text-sm font-medium text-white shadow-[0_5px_14px_rgba(0,0,0,0.38)]"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* RIGHT: Search Card */}
        <div className="flex w-full flex-1 justify-start lg:justify-end">
          <motion.form
            onSubmit={handleSearch}
            className="w-full max-w-md rounded-xl border border-[#E0E0E0] bg-white p-7 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          >
            <h2 className="text-base font-semibold text-[#111111]">
              Search your Favourite Home
            </h2>

            <div className="mt-5 space-y-4">
              {/* Location input + suggestions */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B1B1B1]" />
                <input
                  id="property-search"
                  type="text"
                  placeholder="Enter project name or location"
                  value={searchData.location}
                  onClick={handleLocationInputClick}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  onFocus={() =>
                    searchData.location && setShowSuggestions(searchSuggestions.length > 0)
                  }
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={`h-11 w-full rounded-lg border px-10 pr-9 text-sm text-[#333333] placeholder:text-[#B1B1B1] focus:outline-none focus:ring-2 transition-all ${
                    locationSaved
                      ? "border-green-300 bg-green-50/50 focus:ring-green-200"
                      : "border-[#E2E2E2] bg-white focus:ring-black/10 focus:border-[#111111]"
                  }`}
                />
                {searchData.location && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Clear location"
                  >
                    <X size={14} />
                  </button>
                )}

                <AnimatePresence>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <motion.div
                      className="absolute z-10 mt-1 w-full rounded-lg border border-[#E2E2E2] bg-white shadow-lg max-h-48 overflow-y-auto"
                      variants={dropdownV}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                    >
                      {searchSuggestions.map((location, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(location)}
                          className="w-full px-4 py-2.5 text-left text-sm text-[#333333] hover:bg-[#F5F5F5] transition-colors flex items-center gap-2 border-b border-[#F0F0F0] last:border-b-0"
                        >
                          <MapPin size={14} className="text-[#B1B1B1]" />
                          {location}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {locationSaved && (
                  <motion.div
                    className="flex items-center gap-1.5 text-xs text-green-600"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Location saved to your profile</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Type + Bedrooms */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={searchData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-[#E2E2E2] bg-white px-3 pr-8 text-sm text-[#333333] focus:border-[#111111] focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                  >
                    <option value="">Type</option>
                    <option value="villa">Villa</option>
                    <option value="apartment">Apartment</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B1B1B1]" />
                </div>

                <div className="relative">
                  <select
                    value={searchData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-[#E2E2E2] bg-white px-3 pr-8 text-sm text-[#333333] focus:border-[#111111] focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                  >
                    <option value="">Bedrooms</option>
                    <option value="studio">Studio</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4 Bedrooms</option>
                    <option value="5+">5+ Bedrooms</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B1B1B1]" />
                </div>
              </div>

              {/* Price */}
              <div className="relative">
                <select
                  value={searchData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-[#E2E2E2] bg-white px-3 pr-8 text-sm text-[#333333] focus:border-[#111111] focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                >
                  <option value="">Select Price</option>
                  <option value="0-500k">Under 500K AED</option>
                  <option value="500k-1m">500K - 1M AED</option>
                  <option value="1m-2m">1M - 2M AED</option>
                  <option value="2m-5m">2M - 5M AED</option>
                  <option value="5m-10m">5M - 10M AED</option>
                  <option value="10m+">10M+ AED</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B1B1B1]" />
              </div>

              {/* Submit */}
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                type="submit"
                disabled={!isFormValid}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white shadow-[0_8px_18px_rgba(0,0,0,0.45)] transition-all hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black"
              >
                <Search className="h-4 w-4" />
                Search your Property
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}