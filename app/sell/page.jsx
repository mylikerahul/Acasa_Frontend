"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Menu,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Home,
  Building,
  Crown,
  TrendingUp,
  Shield,
  Globe,
  Heart,
  Star,
  Calendar,
  Users,
  Target,
  Award,
  Briefcase,
  Check,
  Clock,
  DollarSign,
  Map,
  Filter,
  Eye,
  Share2,
  Bookmark,
} from "lucide-react";

export default function CompletePage() {
  const shouldReduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef(null);

  const words = useMemo(() => ["Villa", "Townhouse", "Apartment", "Penthouse"], []);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [searchData, setSearchData] = useState({
    location: "",
    type: "",
    bedrooms: "",
    price: "",
  });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

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
      "Jumeirah Village Circle",
      "Dubai Creek Harbour",
      "Al Barsha",
      "Jumeirah",
      "Al Furjan",
      "Dubai Silicon Oasis",
      "International City",
    ],
    []
  );

  const propertyTypes = [
    { value: "villa", label: "Villa", icon: Home },
    { value: "apartment", label: "Apartment", icon: Building },
    { value: "penthouse", label: "Penthouse", icon: Crown },
    { value: "townhouse", label: "Townhouse", icon: Building },
  ];

  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [statistics, setStatistics] = useState({
    propertiesSold: 0,
    happyClients: 0,
    yearsExperience: 0,
    citiesCovered: 0,
  });

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Word rotation effect
  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length, shouldReduceMotion]);

  // Search suggestions
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

  // Load featured properties
  useEffect(() => {
    const loadProperties = async () => {
      // Mock data - In real app, fetch from API
      const mockProperties = [
        {
          id: 1,
          title: "Luxury Villa in Palm Jumeirah",
          location: "Palm Jumeirah, Dubai",
          price: "12,500,000",
          beds: 5,
          baths: 6,
          area: "8500",
          image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
          featured: true,
          rating: 4.9,
        },
        {
          id: 2,
          title: "Modern Apartment with Sea View",
          location: "Dubai Marina",
          price: "3,200,000",
          beds: 2,
          baths: 2,
          area: "1800",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w-800",
          featured: true,
          rating: 4.7,
        },
        {
          id: 3,
          title: "Penthouse in Downtown Dubai",
          location: "Downtown Dubai",
          price: "8,750,000",
          beds: 4,
          baths: 4,
          area: "4500",
          image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
          featured: true,
          rating: 4.8,
        },
      ];
      setFeaturedProperties(mockProperties);

      // Animate statistics
      setTimeout(() => {
        setStatistics({
          propertiesSold: 1250,
          happyClients: 850,
          yearsExperience: 12,
          citiesCovered: 8,
        });
      }, 1000);
    };

    loadProperties();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error("Error loading recent searches:", e);
      }
    }
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
    if (field === "location") {
      setLocationSaved(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      
      if (!searchData.location && !searchData.type && !searchData.bedrooms && !searchData.price) {
        setLocationError("Please enter at least one search criteria");
        return;
      }

      setSearchLoading(true);

      // Save to recent searches
      const searchEntry = {
        location: searchData.location || "Any",
        type: searchData.type || "Any",
        bedrooms: searchData.bedrooms || "Any",
        price: searchData.price || "Any",
        timestamp: new Date().toISOString(),
      };

      const updatedSearches = [
        searchEntry,
        ...recentSearches.filter(
          (s) => s.location !== searchEntry.location || s.type !== searchEntry.type
        ),
      ].slice(0, 5);

      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      // Simulate API call
      setTimeout(() => {
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

        console.log("Search params:", params.toString());
        setSearchLoading(false);
        
        // In real app, navigate to search results page
        alert(
          `Search submitted!\nFound 24 properties matching your criteria.\nLocation: ${searchData.location || "Any"}\nType: ${
            searchData.type || "Any"
          }\nBedrooms: ${searchData.bedrooms || "Any"}\nPrice: ${searchData.price || "Any"}`
        );
      }, 800);
    },
    [searchData, userLocation, recentSearches]
  );

  const handleLocationInputClick = () => {
    if (!searchData.location) {
      setShowLocationModal(true);
    }
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

      // Reverse geocoding (mock)
      const city = "Dubai";
      const area = "Business Bay";

      const locationData = {
        latitude,
        longitude,
        city,
        area,
        display: `${area}, ${city}`,
        saved: true,
      };

      setUserLocation(locationData);
      setSearchData((prev) => ({ ...prev, location: locationData.display }));
      setLocationSaved(true);
      setShowLocationModal(false);
      
      // Save location preference
      localStorage.setItem("userLocation", JSON.stringify(locationData));
      
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
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setSearchData((prev) => ({ ...prev, location: "" }));
    setLocationSaved(false);
    localStorage.removeItem("userLocation");
  };

  const handleSelectSuggestion = (location) => {
    setSearchData((prev) => ({ ...prev, location }));
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchData({
      location: "",
      type: "",
      bedrooms: "",
      price: "",
    });
    setLocationSaved(false);
    setUserLocation(null);
  };

  const handleRecentSearchClick = (search) => {
    setSearchData({
      location: search.location !== "Any" ? search.location : "",
      type: search.type !== "Any" ? search.type : "",
      bedrooms: search.bedrooms !== "Any" ? search.bedrooms : "",
      price: search.price !== "Any" ? search.price : "",
    });
  };

  const isFormValid =
    searchData.location || searchData.type || searchData.bedrooms || searchData.price;

  // Animation variants
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

  const statV = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        
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
          color: rgb(209,144,38);
        }
        
        .property-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .property-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 1px solid rgba(209, 213, 219, 0.3);
        }
        
        .search-card {
          background: linear-gradient(145deg, #ffffff 0%, #fafafa 100%);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        
        .nav-blur {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.92);
          border-bottom: 1px solid rgba(229, 231, 235, 0.8);
        }
      `}</style>

      {/* Enhanced Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "nav-blur shadow-lg" : "bg-white border-b border-gray-200"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-[#111111]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  ACASA
                </span>
              </div>
              <span className="hidden sm:inline text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-full">
                Premium Real Estate
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {[
                  { label: "Home", active: true },
                  { label: "Properties", count: 1250 },
                  { label: "Services" },
                  { label: "About" },
                  { label: "Contact" },
                ].map((item, index) => (
                  <a
                    key={index}
                    href="#"
                    className="relative text-sm font-medium text-[#111111] hover:text-[#D19026] transition-colors group"
                  >
                    {item.label}
                    {item.active && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#D19026] transform scale-x-100 transition-transform" />
                    )}
                    {item.count && (
                      <span className="absolute -top-1 -right-3 text-xs bg-[#D19026] text-white px-1.5 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D19026] group-hover:w-full transition-all duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="tel:+971"
                className="flex items-center gap-2 text-sm font-medium text-[#666666] hover:text-[#111111] transition-colors group"
              >
                <div className="p-2 bg-gray-100 rounded-full group-hover:bg-[#D19026] group-hover:text-white transition-colors">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Call Us</span>
                  <span>+971 4 123 4567</span>
                </div>
              </a>
              <button className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-[#222] transition-all shadow-lg hover:shadow-xl">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Book a Viewing
                </span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 bg-white shadow-lg"
            >
              <div className="space-y-1 px-4 pb-3 pt-2">
                {["Home", "Properties", "Services", "About", "Contact"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block px-3 py-2.5 text-base font-medium text-[#111111] hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {item}
                  </a>
                ))}
                <div className="pt-4 space-y-3">
                  <button className="w-full rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg">
                    <span className="flex items-center justify-center gap-2">
                      <Calendar size={16} />
                      Book a Viewing
                    </span>
                  </button>
                  <a
                    href="tel:+971"
                    className="flex items-center justify-center gap-2 text-sm text-gray-600"
                  >
                    <Phone size={16} />
                    +971 4 123 4567
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Location Modal */}
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
              className="relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl"
              variants={modalV}
              initial="hidden"
              animate="show"
              exit="exit"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-black to-gray-800 text-white">
                <MapPin className="h-7 w-7" />
              </div>

              <h3 className="mb-2 text-left text-xl font-semibold text-[#111111]">
                How would you like to search?
              </h3>
              <p className="mb-5 text-left text-sm text-[#6B6B6B]">
                Use your current location for nearby properties or search manually.
              </p>

              <AnimatePresence>
                {locationError && (
                  <motion.div
                    className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2 border border-red-100"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{locationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={locationLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-black to-gray-800 px-5 py-3.5 text-sm font-medium text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching Location...
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      Use Current Location
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleManualSearch}
                  disabled={locationLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#E2E2E2] bg-white px-5 py-3.5 text-sm font-medium text-[#333333] transition-all hover:border-[#111111] hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search size={18} />
                  Search Manually
                </button>
              </div>

              <div className="mt-6 rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <Shield size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Your location data is encrypted and only used to find nearby properties. We never share your data.</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="flex-1 py-16 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-12 px-4 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
          {/* LEFT */}
          <motion.div
            className="flex-1"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-gradient-to-r from-[#D19026]/10 to-[#D19026]/5 rounded-full border border-[#D19026]/20">
              <Star size={14} className="text-[#D19026]" />
              <span className="text-sm font-medium text-[#D19026]">Dubai's #1 Real Estate Agency</span>
            </div>

            <h1
              style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}
              className="mb-6 text-[36px] leading-tight text-[#111111] sm:text-[42px] lg:text-[52px]"
            >
              Find Your Dream{" "}
              <span className="word-container" style={{ minWidth: "220px" }}>
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
              </span>{" "}
              in Dubai
            </h1>

            <p className="max-w-xl text-[16px] leading-relaxed text-[#4B4B4B] mb-8">
              ACASA connects you with the finest luxury properties in Dubai. From beachfront villas to sky-high penthouses, 
              we provide personalized service to help you find the perfect home or investment property.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="inline-flex items-center rounded-full bg-gradient-to-r from-black to-gray-800 px-7 py-3 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all">
                <span className="flex items-center gap-2">
                  <Target size={16} />
                  Explore Properties
                </span>
              </button>
              <button className="inline-flex items-center rounded-full border-2 border-black bg-white px-7 py-3 text-sm font-medium text-black hover:bg-black hover:text-white transition-all">
                <span className="flex items-center gap-2">
                  <Briefcase size={16} />
                  Investment Guide
                </span>
              </button>
            </div>

            {/* Statistics */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Properties Sold", value: statistics.propertiesSold, icon: Home },
                { label: "Happy Clients", value: statistics.happyClients, icon: Users },
                { label: "Years Experience", value: statistics.yearsExperience, icon: Award },
                { label: "Cities Covered", value: statistics.citiesCovered, icon: Map },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-card rounded-xl p-4"
                  custom={index}
                  variants={statV}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#D19026]/10 rounded-lg">
                      <stat.icon size={20} className="text-[#D19026]" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#111111]">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Search Card */}
          <div className="flex w-full flex-1 justify-start lg:justify-end">
            <motion.div
              className="w-full max-w-md"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("recentSearches");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        {search.location}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Card */}
              <form
                onSubmit={handleSearch}
                className="search-card rounded-2xl border border-gray-200 bg-white p-7"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                    <Filter size={20} />
                    Advanced Search
                  </h2>
                  {isFormValid && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Location Input */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700">Location</label>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="text-xs text-[#D19026] hover:text-[#b87d20] flex items-center gap-1"
                      >
                        <Navigation size={12} />
                        Use my location
                      </button>
                    </div>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B1B1B1]" />
                    <input
                      ref={searchInputRef}
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
                      className={`h-12 w-full rounded-xl border px-10 pr-9 text-sm text-[#333333] placeholder:text-[#B1B1B1] focus:outline-none focus:ring-3 transition-all ${
                        locationSaved
                          ? "border-green-300 bg-green-50/50 focus:ring-green-200"
                          : "border-[#E2E2E2] bg-white focus:ring-[#D19026]/20 focus:border-[#D19026]"
                      }`}
                    />
                    {searchData.location && (
                      <button
                        type="button"
                        onClick={handleClearLocation}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}

                    <AnimatePresence>
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <motion.div
                          className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl max-h-60 overflow-y-auto"
                          variants={dropdownV}
                          initial="hidden"
                          animate="show"
                          exit="exit"
                        >
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 px-3 py-2">Popular Locations</div>
                            {searchSuggestions.map((location, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleSelectSuggestion(location)}
                                className="w-full px-3 py-2.5 text-left text-sm text-[#333333] hover:bg-gray-50 transition-colors flex items-center gap-2 rounded-lg"
                              >
                                <MapPin size={14} className="text-[#D19026]" />
                                {location}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Property Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = searchData.type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange("type", isSelected ? "" : type.value)}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                              isSelected
                                ? "border-[#D19026] bg-[#D19026]/10 text-[#D19026]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Icon size={18} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bedrooms & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">Bedrooms</label>
                      <div className="relative">
                        <select
                          value={searchData.bedrooms}
                          onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                          className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-[#333333] focus:border-[#D19026] focus:outline-none focus:ring-2 focus:ring-[#D19026]/20 transition-all"
                        >
                          <option value="">Any</option>
                          <option value="studio">Studio</option>
                          <option value="1">1 Bedroom</option>
                          <option value="2">2 Bedrooms</option>
                          <option value="3">3 Bedrooms</option>
                          <option value="4">4 Bedrooms</option>
                          <option value="5+">5+ Bedrooms</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">Price Range</label>
                      <div className="relative">
                        <select
                          value={searchData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-[#333333] focus:border-[#D19026] focus:outline-none focus:ring-2 focus:ring-[#D19026]/20 transition-all"
                        >
                          <option value="">Any</option>
                          <option value="0-500k">Under 500K AED</option>
                          <option value="500k-1m">500K - 1M AED</option>
                          <option value="1m-2m">1M - 2M AED</option>
                          <option value="2m-5m">2M - 5M AED</option>
                          <option value="5m-10m">5M - 10M AED</option>
                          <option value="10m+">10M+ AED</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    disabled={!isFormValid || searchLoading}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-black to-gray-800 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {searchLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" />
                        Search Properties
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  {locationSaved && (
                    <motion.div
                      className="flex items-center justify-center gap-2 text-xs text-green-600"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Location saved to your profile</span>
                    </motion.div>
                  )}
                </div>
              </form>

              {/* Quick Tips */}
              <div className="mt-4 rounded-xl bg-gradient-to-br from-[#D19026]/5 to-transparent p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Search Tips
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Add location for more accurate results
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Select property type to narrow search
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Use price range for budget filtering
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      {featuredProperties.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#111111] mb-3" style={{ fontFamily: '"Playfair Display", serif' }}>
                Featured Properties
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover our handpicked selection of premium properties in Dubai's most sought-after locations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <motion.div
                  key={property.id}
                  className="property-card bg-white rounded-2xl overflow-hidden border border-gray-200"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#D19026] text-white text-xs font-medium px-3 py-1 rounded-full">
                          Featured
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white">
                          <Heart size={18} />
                        </button>
                        <button className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-[#111111]">{property.title}</h3>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-[#D19026]" fill="#D19026" />
                        <span className="text-sm font-medium">{property.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin size={14} className="mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500">Beds</div>
                        <div className="font-semibold">{property.beds}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500">Baths</div>
                        <div className="font-semibold">{property.baths}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500">Area</div>
                        <div className="font-semibold">{property.area} sq.ft</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-[#111111]">AED {property.price}</div>
                        <div className="text-xs text-gray-500">Price</div>
                      </div>
                      <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <button className="inline-flex items-center gap-2 text-[#D19026] font-medium hover:text-[#b87d20] transition-colors">
                View All Properties
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                ACASA
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Your trusted partner in finding luxury properties in Dubai. We help you discover your dream home.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Youtube, label: "YouTube" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className="p-2 bg-gray-800 rounded-lg hover:bg-[#D19026] transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2">
                {["About Us", "Properties", "Services", "Testimonials", "Career"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-400 hover:text-[#D19026] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Our Services</h4>
              <ul className="space-y-2">
                {["Property Buying", "Property Selling", "Property Management", "Investment Consulting", "Legal Assistance"].map((service) => (
                  <li key={service}>
                    <a href="#" className="text-sm text-gray-400 hover:text-[#D19026] transition-colors">
                      {service}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Contact Info</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <Phone size={16} />
                  <span>+971 4 123 4567</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail size={16} />
                  <span>info@acasa.com</span>
                </li>
                <li className="text-sm text-gray-400 mt-4">
                  <p className="mb-1">Office Address:</p>
                  <p className="text-gray-500">Business Bay, Dubai, UAE</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} ACASA Real Estate. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-600">Designed and developed with ❤️ in Dubai</p>
          </div>
        </div>
      </footer>
    </div>
  );
}