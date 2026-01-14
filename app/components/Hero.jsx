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
import PropertyTypeModal from "./PropertyTypeModal"; // Import the new component

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const dropdownRef = useRef(null);

  const words = useMemo(() => ["Villa", "Townhouse", "Apartment", "Penthouse"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [searchData, setSearchData] = useState({
    location: "",
    bedrooms: "",
    price: "",
  });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [, setUserLocation] = useState(null);

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularLocations = useMemo(
    () => [
      "Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "Business Bay",
      "JBR", "Arabian Ranches", "Dubai Hills Estate", "Meydan City",
    ],
    []
  );

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Word rotation logic
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length, shouldReduceMotion]);

  // Location search suggestions logic
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

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleFetchLocation = async () => {
    setLocationLoading(true);
    setLocationError("");
    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported");
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
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
    const result = { 
      ...searchData, 
      types: selectedTypes
    };
    console.log("Search Results:", result);
    alert(`Searching for: ${searchData.location || 'Anywhere'} with ${selectedTypes.length} property types`);
  };

  const wordV = {
    initial: { y: "100%", opacity: 0 },
    animate: { y: "0%", opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { y: "-100%", opacity: 0, transition: { duration: 0.4, ease: "easeIn" } },
  };

  return (
    <section className="relative bg-white py-12 lg:py-20 overflow-visible z-10">
      
      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
              <button onClick={() => setShowLocationModal(false)} className="absolute right-4 top-4 text-gray-400"><X size={20}/></button>
              <div className="mb-4 h-12 w-12 rounded-full bg-black flex items-center justify-center text-white"><MapPin /></div>
              <h3 className="text-lg font-bold mb-2">Enable Location?</h3>
              {locationError && <p className="text-red-500 text-sm mb-3">{locationError}</p>}
              <div className="space-y-3">
                <button onClick={handleFetchLocation} disabled={locationLoading} className="w-full bg-black text-white py-3 rounded-lg flex items-center justify-center gap-2">
                  {locationLoading ? <Loader2 className="animate-spin" /> : <Navigation size={18} />} Use My Location
                </button>
                <button onClick={() => setShowLocationModal(false)} className="w-full border border-gray-200 py-3 rounded-lg">Manual Search</button>
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

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-12 px-4 lg:flex-row lg:px-0">
        {/* Left Side: Text Section */}
        <div className="flex-1">
          <h1 className="playfair text-[32px] sm:text-[45px] lg:text-[52px] leading-[1.15] text-[#111111] font-bold">
            We're Happy To Help You <br />
            Source the Best 
            <span className="word-container" style={{ minWidth: "220px" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  variants={wordV}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="rotating-word absolute left-0"
                >
                  {words[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-[16px] text-[#4B4B4B] leading-relaxed">
            A Casa is all set to help you find a dream home in Dubai. Get your favourite 
            <span className="font-semibold text-black"> Luxury Apartments, Villas, Penthouses, Plot.</span>
          </p>
          <button className="mt-8 rounded-full border border-black px-10 py-3 text-sm font-bold shadow-md hover:bg-black hover:text-white transition-all">
            Learn More
          </button>
        </div>

        {/* Right Side: Search Card */}
        <div className="w-full flex-1 lg:max-w-[500px]">
          <form onSubmit={handleSearch} className="buy-container">
            <h2 className="mb-6 text-lg font-bold text-[#111111]">Search your Favourite Home</h2>
            
            <div className="space-y-4">
              {/* Location Input */}
              <div className="relative z-10">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter project name or location"
                  value={searchData.location}
                  onClick={() => !searchData.location && setShowLocationModal(true)}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className={`h-12 w-full rounded border pl-11 pr-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-black ${locationSaved ? 'border-green-500 bg-green-50/30' : 'border-[#E2E2E2]'}`}
                />
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-xl max-h-40 overflow-y-auto">
                      {searchSuggestions.map((loc, i) => (
                        <div key={i} onClick={() => { handleInputChange("location", loc); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">{loc}</div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Row: Property Type & Bedrooms */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Property Type Button (Opens Modal) */}
                <button
                  type="button"
                  onClick={() => setShowTypeModal(true)}
                  className="flex h-12 w-full items-center justify-between rounded border border-[#E2E2E2] px-3 text-sm text-[#333] bg-white hover:border-gray-300 transition-colors"
                >
                  <span className="truncate">
                    {selectedTypes.length > 0 ? `${selectedTypes.length} selected` : "Property Type"}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {/* Bedrooms Select */}
                <div className="relative">
                  <select 
                    value={searchData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    className="h-12 w-full appearance-none rounded border border-[#E2E2E2] bg-white px-3 text-sm focus:outline-none"
                  >
                    <option value="">Bedrooms</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              {/* Price Select */}
              <div className="relative z-0">
                <select 
                  value={searchData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="h-12 w-full appearance-none rounded border border-[#E2E2E2] bg-white px-3 text-sm focus:outline-none"
                >
                  <option value="">Select Price</option>
                  <option value="1m">Under 1M AED</option>
                  <option value="5m">1M - 5M AED</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 active:scale-[0.98]"
              >
                <Search size={18} /> Search your Property
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}