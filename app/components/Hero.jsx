"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import BedroomsModal from "./BedroomsModal";

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const words = useMemo(() => ["Villa", "Townhouse", "Apartment", "Penthouse"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [searchData, setSearchData] = useState({
    location: "",
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

  const [showBedroomsModal, setShowBedroomsModal] = useState(false);
  const [selectedBedrooms, setSelectedBedrooms] = useState([]);

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

  const toggleBedroom = (bedroom) => {
    setSelectedBedrooms(prev => 
      prev.includes(bedroom) ? prev.filter(b => b !== bedroom) : [...prev, bedroom]
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
      types: selectedTypes,
      bedrooms: selectedBedrooms
    };
    console.log("Search Results:", result);
    alert(`Searching for: ${searchData.location || 'Anywhere'} with ${selectedTypes.length} property types and ${selectedBedrooms.length} bedroom options`);
  };

  const wordV = {
    initial: { y: "100%", opacity: 0 },
    animate: { y: "0%", opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { y: "-100%", opacity: 0, transition: { duration: 0.4, ease: "easeIn" } },
  };

  return (
    <section className="relative bg-white py-8 sm:py-12 lg:py-20 overflow-visible z-10">
      
      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 sm:p-7 shadow-2xl"
            >
              <button 
                onClick={() => setShowLocationModal(false)} 
                className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20}/>
              </button>
              <div className="mb-4 h-12 w-12 rounded-full bg-black flex items-center justify-center text-white">
                <MapPin />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2">Enable Location?</h3>
              {locationError && <p className="text-red-500 text-xs sm:text-sm mb-3">{locationError}</p>}
              <div className="space-y-3">
                <button 
                  onClick={handleFetchLocation} 
                  disabled={locationLoading} 
                  className="w-full bg-black text-white py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {locationLoading ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />} 
                  Use My Location
                </button>
                <button 
                  onClick={() => setShowLocationModal(false)} 
                  className="w-full border border-gray-200 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors"
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

      {/* Bedrooms Modal */}
      <BedroomsModal
        isOpen={showBedroomsModal}
        onClose={() => setShowBedroomsModal(false)}
        selectedBedrooms={selectedBedrooms}
        onToggleBedroom={toggleBedroom}
      />

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 sm:gap-10 lg:gap-12 px-4 sm:px-6 lg:px-4 xl:px-0">
        {/* Left Side: Text Section */}
        <div className="flex-1 w-full">
          <h1 className="playfair text-[28px] xs:text-[32px] sm:text-[38px] md:text-[45px] lg:text-[52px] leading-[1.15] text-[#111111] font-bold">
            We're Happy To Help You <br className="hidden sm:block" />
            <span className="sm:hidden">Source the Best </span>
            <span className="hidden sm:inline">Source the Best </span>
            <span className="inline-block relative" style={{ minWidth: "140px", minHeight: "1.2em" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  variants={wordV}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute left-0 top-0 whitespace-nowrap"
                >
                  {words[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="mt-4 sm:mt-5 lg:mt-6 max-w-full lg:max-w-lg text-[14px] sm:text-[15px] lg:text-[16px] text-[#4B4B4B] leading-relaxed">
            A Casa is all set to help you find a dream home in Dubai. Get your favourite 
            <span className="font-semibold text-black"> Luxury Apartments, Villas, Penthouses, Plot.</span>
          </p>
          <button className="mt-6 sm:mt-7 lg:mt-8 rounded-full border-2 border-black px-8 sm:px-10 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-md hover:bg-black hover:text-white transition-all active:scale-95">
            Learn More
          </button>
        </div>

        {/* Right Side: Search Card */}
        <div className="w-full flex-1 lg:max-w-[500px]">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 lg:p-7 border border-gray-100">
            <h2 className="mb-5 sm:mb-6 text-base sm:text-lg font-bold text-[#111111]">
              Search your Favourite Home
            </h2>
            
            <div className="space-y-3.5 sm:space-y-4">
              {/* Location Input */}
              <div className="relative z-10">
                <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Enter project name or location"
                  value={searchData.location}
                  onClick={() => !searchData.location && setShowLocationModal(true)}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className={`h-11 sm:h-12 w-full rounded-lg border pl-10 sm:pl-11 pr-3 sm:pr-4 text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black ${
                    locationSaved ? 'border-green-500 bg-green-50/30' : 'border-[#E2E2E2]'
                  }`}
                />
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-xl max-h-40 overflow-y-auto"
                    >
                      {searchSuggestions.map((loc, i) => (
                        <div 
                          key={i} 
                          onClick={() => { 
                            handleInputChange("location", loc); 
                            setShowSuggestions(false); 
                          }} 
                          className="px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer text-xs sm:text-sm border-b last:border-b-0"
                        >
                          {loc}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Row: Property Type & Bedrooms */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                
                {/* Property Type Button */}
                <button
                  type="button"
                  onClick={() => setShowTypeModal(true)}
                  className="flex h-11 sm:h-12 w-full items-center justify-between rounded-lg border border-[#E2E2E2] px-2.5 sm:px-3 text-xs sm:text-sm text-[#333] bg-white hover:border-gray-300 transition-colors active:scale-95"
                >
                  <span className="truncate">
                    {selectedTypes.length > 0 ? `${selectedTypes.length} selected` : "Property Type"}
                  </span>
                  <ChevronDown size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                </button>

                {/* Bedrooms Button */}
                <button
                  type="button"
                  onClick={() => setShowBedroomsModal(true)}
                  className="flex h-11 sm:h-12 w-full items-center justify-between rounded-lg border border-[#E2E2E2] px-2.5 sm:px-3 text-xs sm:text-sm text-[#333] bg-white hover:border-gray-300 transition-colors active:scale-95"
                >
                  <span className="truncate">
                    {selectedBedrooms.length > 0 ? `${selectedBedrooms.length} selected` : "Bedrooms"}
                  </span>
                  <ChevronDown size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                </button>
              </div>

              {/* Price Select */}
              <div className="relative z-0">
                <select 
                  value={searchData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="h-11 sm:h-12 w-full appearance-none rounded-lg border border-[#E2E2E2] bg-white px-3 pr-8 sm:pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select Price</option>
                  <option value="1m">Under 1M AED</option>
                  <option value="5m">1M - 5M AED</option>
                  <option value="10m">5M - 10M AED</option>
                  <option value="10m+">Above 10M AED</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="mt-2 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-xs sm:text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 active:scale-[0.98]"
              >
                <Search size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                Search your Property
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}