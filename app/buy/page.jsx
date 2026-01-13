"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Home,
  Building,
  ChevronDown,
  ChevronRight,
  Heart,
  Share2,
  Eye,
  Bed,
  Bath,
  Square,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  ArrowRight,
  BookOpen,
  User,
  Clock as TimeIcon,
} from "lucide-react";

const BuyPage = () => {
  const [activeTab, setActiveTab] = useState("properties");
  const [filters, setFilters] = useState({
    propertyType: "",
    location: "",
    priceRange: "",
    bedrooms: "",
    sortBy: "newest",
  });
  const [wishlist, setWishlist] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Properties Data
  const properties = useMemo(
    () => [
      {
        id: 1,
        title: "Luxury Villa with Private Pool",
        location: "Palm Jumeirah",
        price: "12,500,000",
        type: "Villa",
        status: "Ready to Move",
        beds: 5,
        baths: 6,
        area: "8500",
        image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
        featured: true,
        rating: 4.9,
        developer: "Emaar Properties",
        yearBuilt: "2023",
        amenities: ["Pool", "Gym", "Private Beach", "Security"],
      },
      {
        id: 2,
        title: "Modern Apartment with Sea View",
        location: "Dubai Marina",
        price: "3,200,000",
        type: "Apartment",
        status: "Ready to Move",
        beds: 2,
        baths: 2,
        area: "1800",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        featured: true,
        rating: 4.7,
        developer: "Damac Properties",
        yearBuilt: "2022",
        amenities: ["Sea View", "Gym", "Pool", "24/7 Security"],
      },
      {
        id: 3,
        title: "Penthouse in Downtown Dubai",
        location: "Downtown Dubai",
        price: "8,750,000",
        type: "Penthouse",
        status: "Ready to Move",
        beds: 4,
        baths: 4,
        area: "4500",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        featured: true,
        rating: 4.8,
        developer: "Emaar Properties",
        yearBuilt: "2023",
        amenities: ["Private Pool", "Panoramic View", "Smart Home", "Concierge"],
      },
      {
        id: 4,
        title: "Family Townhouse in Arabian Ranches",
        location: "Arabian Ranches",
        price: "4,500,000",
        type: "Townhouse",
        status: "Ready to Move",
        beds: 4,
        baths: 3,
        area: "3200",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        featured: false,
        rating: 4.6,
        developer: "Emaar Properties",
        yearBuilt: "2021",
        amenities: ["Garden", "Community Pool", "Park", "BBQ Area"],
      },
      {
        id: 5,
        title: "Luxury Apartment in Business Bay",
        location: "Business Bay",
        price: "2,800,000",
        type: "Apartment",
        status: "Ready to Move",
        beds: 1,
        baths: 1,
        area: "1100",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
        featured: false,
        rating: 4.5,
        developer: "Dubai Properties",
        yearBuilt: "2022",
        amenities: ["Gym", "Pool", "Business Center", "Valet Parking"],
      },
      {
        id: 6,
        title: "Beachfront Villa in JBR",
        location: "Jumeirah Beach Residence",
        price: "15,000,000",
        type: "Villa",
        status: "Ready to Move",
        beds: 6,
        baths: 7,
        area: "9500",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        featured: true,
        rating: 4.9,
        developer: "Nakheel",
        yearBuilt: "2023",
        amenities: ["Private Beach", "Infinity Pool", "Home Theater", "Wine Cellar"],
      },
    ],
    []
  );

  // Projects Data (Off-Plan)
  const projects = useMemo(
    () => [
      {
        id: 101,
        name: "Grand Polo",
        location: "Dubai Investments Park",
        developer: "Emaar Properties",
        type: "Villa",
        startPrice: "5,670,000",
        status: "Under Construction",
        completion: "Q4 2025",
        beds: "4-6",
        area: "3,500-5,000",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        featured: true,
        paymentPlan: "60/40",
        roi: "8.5%",
      },
      {
        id: 102,
        name: "Sunset Bay 4",
        location: "Dubai Islands",
        developer: "Nakheel",
        type: "Apartment",
        startPrice: "1,900,000",
        status: "Launching Soon",
        completion: "Q3 2026",
        beds: "1-3",
        area: "800-1,800",
        image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
        featured: true,
        paymentPlan: "70/30",
        roi: "7.2%",
      },
      {
        id: 103,
        name: "Sobha Orbis",
        location: "Motor City",
        developer: "Sobha Group",
        type: "Apartment",
        startPrice: "1,000,000",
        status: "Under Construction",
        completion: "Q2 2025",
        beds: "Studio-3",
        area: "500-1,500",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        featured: false,
        paymentPlan: "80/20",
        roi: "9.1%",
      },
    ],
    []
  );

  // Blog Data
  const blogs = useMemo(
    () => [
      {
        id: 1,
        title: "Dubai Real Estate Market Outlook 2024",
        excerpt: "Analyzing the trends and opportunities in Dubai's booming real estate market for 2024.",
        category: "Market Insights",
        date: "Mar 15, 2024",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
        featured: true,
      },
      {
        id: 2,
        title: "Top 5 Areas to Invest in Dubai Right Now",
        excerpt: "Discover the most promising investment locations in Dubai for maximum returns.",
        category: "Investment Guide",
        date: "Mar 10, 2024",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        featured: true,
      },
      {
        id: 3,
        title: "Complete Guide to Buying Property in Dubai",
        excerpt: "Step-by-step guide for foreigners looking to invest in Dubai real estate.",
        category: "Buyer's Guide",
        date: "Mar 5, 2024",
        readTime: "8 min read",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        featured: false,
      },
      {
        id: 4,
        title: "Understanding Dubai's Property Laws",
        excerpt: "Essential legal information for property buyers and investors in Dubai.",
        category: "Legal Guide",
        date: "Feb 28, 2024",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        featured: false,
      },
      {
        id: 5,
        title: "Benefits of Buying Off-Plan Properties",
        excerpt: "Why off-plan properties offer excellent investment opportunities in Dubai.",
        category: "Investment Strategy",
        date: "Feb 25, 2024",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
        featured: true,
      },
      {
        id: 6,
        title: "Luxury Living: Dubai's Most Exclusive Communities",
        excerpt: "Explore Dubai's premium residential communities and their unique features.",
        category: "Lifestyle",
        date: "Feb 20, 2024",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        featured: false,
      },
    ],
    []
  );

  const locations = useMemo(
    () => ["All Locations", "Palm Jumeirah", "Dubai Marina", "Downtown Dubai", "Arabian Ranches", "Business Bay", "JBR", "Dubai Hills"],
    []
  );

  const propertyTypes = useMemo(
    () => ["All Types", "Villa", "Apartment", "Penthouse", "Townhouse"],
    []
  );

  const priceRanges = useMemo(
    () => ["Any Price", "Under 2M", "2M - 5M", "5M - 10M", "10M - 20M", "20M+"],
    []
  );

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (filters.propertyType && filters.propertyType !== "All Types") {
      result = result.filter((p) => p.type === filters.propertyType);
    }

    if (filters.location && filters.location !== "All Locations") {
      result = result.filter((p) => p.location === filters.location);
    }

    if (filters.priceRange) {
      switch (filters.priceRange) {
        case "Under 2M":
          result = result.filter((p) => parseFloat(p.price.replace(/,/g, "")) < 2000000);
          break;
        case "2M - 5M":
          result = result.filter(
            (p) =>
              parseFloat(p.price.replace(/,/g, "")) >= 2000000 &&
              parseFloat(p.price.replace(/,/g, "")) <= 5000000
          );
          break;
        case "5M - 10M":
          result = result.filter(
            (p) =>
              parseFloat(p.price.replace(/,/g, "")) > 5000000 &&
              parseFloat(p.price.replace(/,/g, "")) <= 10000000
          );
          break;
        case "10M - 20M":
          result = result.filter(
            (p) =>
              parseFloat(p.price.replace(/,/g, "")) > 10000000 &&
              parseFloat(p.price.replace(/,/g, "")) <= 20000000
          );
          break;
        case "20M+":
          result = result.filter((p) => parseFloat(p.price.replace(/,/g, "")) > 20000000);
          break;
      }
    }

    if (filters.bedrooms) {
      result = result.filter((p) => p.beds === parseInt(filters.bedrooms));
    }

    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => parseFloat(a.price.replace(/,/g, "")) - parseFloat(b.price.replace(/,/g, "")));
        break;
      case "price-high":
        result.sort((a, b) => parseFloat(b.price.replace(/,/g, "")) - parseFloat(a.price.replace(/,/g, "")));
        break;
      case "newest":
        // Sort by year built (descending)
        result.sort((a, b) => parseInt(b.yearBuilt) - parseInt(a.yearBuilt));
        break;
      default:
        break;
    }

    return result;
  }, [properties, filters]);

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      propertyType: "",
      location: "",
      priceRange: "",
      bedrooms: "",
      sortBy: "newest",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Your Perfect Property in Dubai
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Browse thousands of verified properties and off-plan projects with ACASA.
              Your dream home awaits.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D19026]" />
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#D19026]" />
                <span>Best Price Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D19026]" />
                <span>Expert Advisors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-8 py-4 font-medium border-b-2 transition-colors ${
                activeTab === "properties"
                  ? "border-[#D19026] text-[#D19026]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Properties ({properties.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-8 py-4 font-medium border-b-2 transition-colors ${
                activeTab === "projects"
                  ? "border-[#D19026] text-[#D19026]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Projects ({projects.length})
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties by location, developer, or project name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                  Search
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Advanced
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange("propertyType", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange("priceRange", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                >
                  {priceRanges.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {Object.values(filters).some(Boolean) && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filters.propertyType && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      Type: {filters.propertyType}
                    </span>
                  )}
                  {filters.location && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      Location: {filters.location}
                    </span>
                  )}
                  {filters.priceRange && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      Price: {filters.priceRange}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#D19026] hover:text-[#b87d20]"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Properties/Projects Grid */}
        {activeTab === "properties" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Property Image */}
                <div className="relative h-64">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  {property.featured && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-[#D19026] text-white text-xs font-semibold rounded-full">
                        Featured
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                      onClick={() => toggleWishlist(property.id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          wishlist.includes(property.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                    <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      {property.status}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{property.title}</h3>
                    <span className="text-sm text-gray-500">{property.type}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{property.location}</span>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="text-2xl font-bold text-[#D19026]">
                      AED {property.price}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#D19026]" fill="#D19026" />
                      <span className="font-medium">{property.rating}</span>
                    </div>
                  </div>

                  {/* Property Features */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Bed className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{property.beds}</span>
                      </div>
                      <div className="text-xs text-gray-500">Bedrooms</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Bath className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{property.baths}</span>
                      </div>
                      <div className="text-xs text-gray-500">Bathrooms</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Square className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{property.area}</span>
                      </div>
                      <div className="text-xs text-gray-500">Sq. Ft</div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Key Amenities
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{property.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-64">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  {project.featured && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Off-Plan
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                    <span className="text-sm text-gray-500">{project.type}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{project.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{project.developer}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Completion: {project.completion}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#D19026]">
                        AED {project.startPrice}
                      </div>
                      <div className="text-xs text-gray-500">Start Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {project.roi}
                      </div>
                      <div className="text-xs text-gray-500">Expected ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{project.paymentPlan}</div>
                      <div className="text-xs text-gray-500">Payment Plan</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                      Pre-Book Now
                    </button>
                    <button className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-16 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#D19026]/10 rounded-xl">
                  <Home className="w-8 h-8 text-[#D19026]" />
                </div>
                <div>
                  <div className="text-3xl font-bold">1,250+</div>
                  <div className="text-gray-600">Properties Sold</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">850+</div>
                  <div className="text-gray-600">Happy Clients</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">15%</div>
                  <div className="text-gray-600">Avg. ROI</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Section */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest Insights & Blogs</h2>
              <p className="text-gray-600">
                Stay updated with the latest market trends and investment insights
              </p>
            </div>
            <button className="text-[#D19026] font-medium hover:text-[#b87d20] transition-colors flex items-center gap-2">
              View All Blogs
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gray-300 relative">
                  {blog.featured && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-[#D19026] text-white text-xs font-semibold rounded-full">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {blog.category}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{blog.date}</span>
                  </div>

                  <h3 className="text-xl font-bold mb-3">{blog.title}</h3>
                  <p className="text-gray-600 mb-4">{blog.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <TimeIcon className="w-4 h-4" />
                      <span className="text-sm">{blog.readTime}</span>
                    </div>
                    <button className="text-[#D19026] hover:text-[#b87d20] transition-colors flex items-center gap-1">
                      Read More
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-black to-gray-900 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need Help Finding Your Dream Property?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Our expert advisors are here to guide you through every step of the process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Schedule Call
              </button>
              <button className="px-8 py-3 bg-[#D19026] text-white font-semibold rounded-lg hover:bg-[#b87d20] transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Chat
              </button>
              <button className="px-8 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                Download Brochure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyPage;