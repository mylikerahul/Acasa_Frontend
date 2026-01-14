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

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const dropdownRef = useRef(null);

  const words = useMemo(
    () => ["Villa", "Townhouse", "Apartment", "Penthouse"],
    []
  );
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

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Word rotation logic
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(
      () => setCurrentWordIndex((prev) => (prev + 1) % words.length),
      2500
    );
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
    if (field === "location") setLocationSaved(false);
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
      if (!navigator.geolocation) throw new Error("Geolocation not supported");
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
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
    const result = {
      ...searchData,
      types: selectedTypes,
    };
    console.log("Search Results:", result);
    alert(
      `Searching for: ${
        searchData.location || "Anywhere"
      } with ${selectedTypes.length} property types`
    );
  };

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

  // Inline styles for production stability
  const styles = {
    section: {
      position: 'relative',
      backgroundColor: '#ffffff',
      paddingTop: '3rem',
      paddingBottom: '3rem',
      overflow: 'visible',
      zIndex: 10
    },
    sectionLg: {
      paddingTop: '5rem',
      paddingBottom: '5rem'
    },
    container: {
      margin: '0 auto',
      display: 'flex',
      maxWidth: '72rem',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '3rem',
      padding: '0 1rem'
    },
    containerLg: {
      flexDirection: 'row',
      padding: '0'
    },
    buyContainer: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
    },
    heading: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 'clamp(32px, 5vw, 52px)',
      lineHeight: '1.15',
      color: '#111111',
      fontWeight: 'bold'
    },
    wordWrapper: {
      position: 'relative',
      display: 'inline-flex',
      height: '1.1em',
      overflow: 'hidden',
      alignItems: 'baseline',
      color: '#E79A2D'
    },
    description: {
      marginTop: '1.5rem',
      maxWidth: '32rem',
      fontSize: '16px',
      color: '#4B4B4B',
      lineHeight: '1.625'
    },
    input: {
      height: '48px',
      width: '100%',
      borderRadius: '6px',
      border: '1px solid',
      paddingLeft: '44px',
      paddingRight: '16px',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    select: {
      height: '48px',
      width: '100%',
      appearance: 'none',
      borderRadius: '6px',
      border: '1px solid #E2E2E2',
      backgroundColor: '#ffffff',
      padding: '0 12px',
      fontSize: '14px',
      outline: 'none'
    },
    button: {
      marginTop: '2rem',
      borderRadius: '9999px',
      border: '1px solid #000000',
      paddingLeft: '2.5rem',
      paddingRight: '2.5rem',
      paddingTop: '0.75rem',
      paddingBottom: '0.75rem',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    searchButton: {
      marginTop: '0.5rem',
      display: 'flex',
      height: '48px',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      borderRadius: '9999px',
      backgroundColor: '#000000',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: 'none'
    }
  };

  return (
    <section 
      style={{
        ...styles.section,
        ...(window.innerWidth >= 1024 ? styles.sectionLg : {})
      }}
      className="relative bg-white py-12 lg:py-20 overflow-visible z-10"
    >
      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              padding: '1rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '24rem',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                padding: '1.75rem',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
              }}
            >
              <button
                onClick={() => setShowLocationModal(false)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '48px',
                width: '48px',
                borderRadius: '9999px',
                backgroundColor: '#000000',
                color: '#ffffff',
                marginBottom: '1rem'
              }}>
                <MapPin />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Enable Location?
              </h3>
              {locationError && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '0.75rem' }}>
                  {locationError}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleFetchLocation}
                  disabled={locationLoading}
                  style={{
                    width: '100%',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: locationLoading ? 0.7 : 1,
                    cursor: locationLoading ? 'not-allowed' : 'pointer',
                    border: 'none'
                  }}
                >
                  {locationLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Navigation size={18} />
                  )}
                  Use My Location
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  style={{
                    width: '100%',
                    border: '1px solid #e5e7eb',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
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

      <div 
        style={{
          ...styles.container,
          ...(window.innerWidth >= 1024 ? styles.containerLg : {})
        }}
        className="mx-auto flex max-w-6xl flex-col items-start gap-12 px-4 lg:flex-row lg:px-0"
      >
        {/* Left Side: Text Section */}
        <div style={{ flex: 1 }} className="flex-1">
          <h1 style={styles.heading}>
            <span style={{ display: 'block' }}>We're Happy To Help You</span>
            <span style={{ display: 'block', marginTop: '0.25rem' }}>
              Source the Best{" "}
              <span style={styles.wordWrapper}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentWordIndex}
                    variants={wordVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ display: 'inline-block' }}
                  >
                    {words[currentWordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </h1>

          <p style={styles.description}>
            A Casa is all set to help you find a dream home in Dubai. Get your
            favourite
            <span style={{ fontWeight: 600, color: '#000000' }}>
              {" "}
              Luxury Apartments, Villas, Penthouses, Plot.
            </span>
          </p>
          <button 
            style={styles.button}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#000000';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#000000';
            }}
          >
            Learn More
          </button>
        </div>

        {/* Right Side: Search Card */}
        <div style={{ width: '100%', flex: 1, maxWidth: '500px' }} className="w-full flex-1 lg:max-w-[500px]">
          <div style={styles.buyContainer}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '18px', fontWeight: 'bold', color: '#111111' }}>
              Search your Favourite Home
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Location Input */}
              <div ref={dropdownRef} style={{ position: 'relative', zIndex: 10 }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Enter project name or location"
                  value={searchData.location}
                  onClick={() => !searchData.location && setShowLocationModal(true)}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: locationSaved ? '#22c55e' : '#E2E2E2',
                    backgroundColor: locationSaved ? 'rgba(34, 197, 94, 0.05)' : '#ffffff'
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = '1px solid #000000';
                    e.target.style.borderColor = '#000000';
                  }}
                  onBlur={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = locationSaved ? '#22c55e' : '#E2E2E2';
                  }}
                />
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      style={{
                        position: 'absolute',
                        zIndex: 50,
                        marginTop: '4px',
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        maxHeight: '160px',
                        overflowY: 'auto'
                      }}
                    >
                      {searchSuggestions.map((loc, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            handleInputChange("location", loc);
                            setShowSuggestions(false);
                          }}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          {loc}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Row: Property Type & Bedrooms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Property Type Button */}
                <button
                  type="button"
                  onClick={() => setShowTypeModal(true)}
                  style={{
                    display: 'flex',
                    height: '48px',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '6px',
                    border: '1px solid #E2E2E2',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: '#333333',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.borderColor = '#E2E2E2'}
                >
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {selectedTypes.length > 0
                      ? `${selectedTypes.length} selected`
                      : "Property Type"}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {/* Bedrooms Select */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={searchData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Bedrooms</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                  <ChevronDown
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }}
                    size={16}
                  />
                </div>
              </div>

              {/* Price Select */}
              <div style={{ position: 'relative', zIndex: 0 }}>
                <select
                  value={searchData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Price</option>
                  <option value="1m">Under 1M AED</option>
                  <option value="5m">1M - 5M AED</option>
                  <option value="10m">5M - 10M AED</option>
                  <option value="10m+">10M+ AED</option>
                </select>
                <ChevronDown
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }}
                  size={16}
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                style={styles.searchButton}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#18181b'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#000000'}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              >
                <Search size={18} />
                Search your Property
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}