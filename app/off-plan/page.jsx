"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Building,
  Home,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Star,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle,
  Heart,
  Share2,
  X,
} from "lucide-react";

const OffPlanPage = () => {
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    developer: "",
    minPrice: "",
    maxPrice: "",
  });

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  // Mock data for off-plan projects
  const projects = useMemo(
    () => [
      {
        id: 1,
        name: "Grand Polo",
        location: "Dubai Investments Park",
        developer: "Emaar Properties",
        type: "Villa",
        startPrice: "5,670,000",
        status: "Under Construction",
        completion: "Q4 2025",
        beds: "4-6",
        area: "3,500-5,000 sq.ft",
        image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
        featured: true,
        paymentPlan: "60/40",
        roi: "8.5%",
      },
      {
        id: 2,
        name: "Sunset Bay 4",
        location: "Dubai Islands",
        developer: "Nakheel",
        type: "Apartment",
        startPrice: "1,900,000",
        status: "Launching Soon",
        completion: "Q3 2026",
        beds: "1-3",
        area: "800-1,800 sq.ft",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        featured: true,
        paymentPlan: "70/30",
        roi: "7.2%",
      },
      {
        id: 3,
        name: "Sobha Orbis",
        location: "Motor City",
        developer: "Sobha Group",
        type: "Apartment",
        startPrice: "1,000,000",
        status: "Under Construction",
        completion: "Q2 2025",
        beds: "Studio-3",
        area: "500-1,500 sq.ft",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        featured: false,
        paymentPlan: "80/20",
        roi: "9.1%",
      },
      {
        id: 4,
        name: "Sobha Aquamont",
        location: "Umm Al Quwain",
        developer: "Sobha Group",
        type: "Villa",
        startPrice: "1,110,000",
        status: "Planning",
        completion: "Q1 2026",
        beds: "3-5",
        area: "2,800-4,200 sq.ft",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        featured: false,
        paymentPlan: "50/50",
        roi: "6.8%",
      },
      {
        id: 5,
        name: "Siniya Island",
        location: "Umm Al Quwain",
        developer: "Eagle Hills",
        type: "Villa",
        startPrice: "10,500,000",
        status: "Launching Soon",
        completion: "Q4 2027",
        beds: "5-7",
        area: "8,000-12,000 sq.ft",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        featured: true,
        paymentPlan: "40/60",
        roi: "10.2%",
      },
      {
        id: 6,
        name: "Coastal Haven",
        location: "Dubailand",
        developer: "Damac Properties",
        type: "Townhouse",
        startPrice: "1,930,000",
        status: "Under Construction",
        completion: "Q3 2025",
        beds: "3-4",
        area: "2,200-3,000 sq.ft",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        featured: false,
        paymentPlan: "65/35",
        roi: "7.8%",
      },
      {
        id: 7,
        name: "The One by Prestige One",
        location: "Barsha South",
        developer: "Prestige One",
        type: "Penthouse",
        startPrice: "8,252,000",
        status: "Under Construction",
        completion: "Q4 2025",
        beds: "4-5",
        area: "4,500-6,000 sq.ft",
        image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
        featured: true,
        paymentPlan: "55/45",
        roi: "8.9%",
      },
      {
        id: 8,
        name: "The Place by Prestige One",
        location: "Dubai Sports City",
        developer: "Prestige One",
        type: "Apartment",
        startPrice: "750,000",
        status: "Ready Soon",
        completion: "Q1 2025",
        beds: "Studio-2",
        area: "400-1,200 sq.ft",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
        featured: false,
        paymentPlan: "90/10",
        roi: "6.5%",
      },
      {
        id: 9,
        name: "The Waterway by Prestige One",
        location: "Meydan",
        developer: "Prestige One",
        type: "Villa",
        startPrice: "12,500,000",
        status: "Planning",
        completion: "Q2 2026",
        beds: "5-6",
        area: "5,000-7,000 sq.ft",
        image: "https://images.unsplash.com/photo-1600585154340-043788447eb1?w=800",
        featured: true,
        paymentPlan: "40/60",
        roi: "9.5%",
      },
      {
        id: 10,
        name: "The Rings",
        location: "Jumeirah 2",
        developer: "Omniyat",
        type: "Penthouse",
        startPrice: "59,000,000",
        status: "Under Construction",
        completion: "Q3 2026",
        beds: "6+",
        area: "15,000+ sq.ft",
        image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
        featured: true,
        paymentPlan: "30/70",
        roi: "11.2%",
      },
      {
        id: 11,
        name: "One Sankari",
        location: "Business Bay",
        developer: "Sankari Group",
        type: "Penthouse",
        startPrice: "40,000,000",
        status: "Launching Soon",
        completion: "Q4 2027",
        beds: "5+",
        area: "10,000+ sq.ft",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        featured: true,
        paymentPlan: "35/65",
        roi: "10.8%",
      },
      {
        id: 12,
        name: "Calia Beach Collection",
        location: "Tilal Al Ghaf",
        developer: "Majid Al Futtaim",
        type: "Villa",
        startPrice: "36,900,000",
        status: "Under Construction",
        completion: "Q2 2026",
        beds: "6-8",
        area: "12,000-18,000 sq.ft",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        featured: true,
        paymentPlan: "25/75",
        roi: "12.5%",
      },
    ],
    []
  );

  const locations = useMemo(
    () => [
      "All Locations",
      "Dubai Investments Park",
      "Dubai Islands",
      "Motor City",
      "Umm Al Quwain",
      "Dubailand",
      "Barsha South",
      "Dubai Sports City",
      "Meydan",
      "Jumeirah 2",
      "Business Bay",
      "Tilal Al Ghaf",
    ],
    []
  );

  const developers = useMemo(
    () => [
      "All Developers",
      "Emaar Properties",
      "Nakheel",
      "Sobha Group",
      "Eagle Hills",
      "Damac Properties",
      "Prestige One",
      "Omniyat",
      "Sankari Group",
      "Majid Al Futtaim",
    ],
    []
  );

  const propertyTypes = useMemo(
    () => ["All Types", "Villa", "Apartment", "Penthouse", "Townhouse"],
    []
  );

  const faqs = useMemo(
    () => [
      {
        question: "What is an Off Plan property?",
        answer:
          "Off-plan properties are real estate units that are sold before they are completed. Buyers purchase based on architectural plans and projections, often at lower prices with flexible payment plans during the construction phase.",
      },
      {
        question: "What is the process of buying Off Plan in Dubai?",
        answer:
          "1. Research and select a project\n2. Reserve unit with booking fee\n3. Sign Sales Purchase Agreement (SPA)\n4. Make payments according to construction milestones\n5. Receive completion certificate\n6. Register property with DLD\n7. Move in or rent out",
      },
      {
        question: "What options are there for an Off Plan payment plan?",
        answer:
          "Common payment plans include:\n• 70/30: 70% during construction, 30% on completion\n• 60/40: 60% during construction, 40% on completion\n• 50/50: Equal payments during construction and on handover\n• Post-handover plans: Extended payment terms after completion",
      },
      {
        question: "What are the benefits of buying Off Plan property in Dubai?",
        answer:
          "• Lower entry prices\n• Flexible payment plans\n• Higher capital appreciation potential\n• Customization options\n• First choice of units\n• Attractive ROI during construction\n• Developer incentives and offers",
      },
      {
        question: "What is the difference between Off Plan and ready to move in Dubai?",
        answer:
          "Off Plan properties are under development; ready properties are fully built and available for immediate use. Off-plan offers lower prices and payment flexibility while ready properties provide immediate occupancy and rental income.",
      },
    ],
    []
  );

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply filters
    if (filters.type && filters.type !== "All Types") {
      result = result.filter((project) => project.type === filters.type);
    }

    if (filters.location && filters.location !== "All Locations") {
      result = result.filter((project) => project.location === filters.location);
    }

    if (filters.developer && filters.developer !== "All Developers") {
      result = result.filter((project) => project.developer === filters.developer);
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice.replace(/,/g, ""));
      result = result.filter((project) => {
        const price = parseFloat(project.startPrice.replace(/,/g, ""));
        return price >= min;
      });
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice.replace(/,/g, ""));
      result = result.filter((project) => {
        const price = parseFloat(project.startPrice.replace(/,/g, ""));
        return price <= max;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => {
          const priceA = parseFloat(a.startPrice.replace(/,/g, ""));
          const priceB = parseFloat(b.startPrice.replace(/,/g, ""));
          return priceA - priceB;
        });
        break;
      case "price-high":
        result.sort((a, b) => {
          const priceA = parseFloat(a.startPrice.replace(/,/g, ""));
          const priceB = parseFloat(b.startPrice.replace(/,/g, ""));
          return priceB - priceA;
        });
        break;
      case "roi":
        result.sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));
        break;
      case "newest":
        // Sort by completion date (assuming earlier dates are newer)
        result.sort((a, b) => new Date(a.completion) - new Date(b.completion));
        break;
      default:
        break;
    }

    return result;
  }, [projects, filters, sortBy]);

  const projectsPerPage = 6;
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setFilters({
      type: "",
      location: "",
      developer: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  const toggleWishlist = (projectId) => {
    setWishlist((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleContactAgent = (project) => {
    setSelectedProject(project);
    setShowContactModal(true);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              New Projects in Dubai - Upcoming Developments
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Discover the latest off-plan properties in Dubai with ACASA. Invest in tomorrow's
              premier real estate developments today.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D19026]" />
                <span>Trusted Developers</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D19026]" />
                <span>High ROI Potential</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D19026]" />
                <span>Flexible Payment Plans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-[#D19026] hover:text-[#b87d20]"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <div className="space-y-2">
                    {propertyTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleFilterChange("type", type)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          filters.type === type
                            ? "bg-[#D19026] text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                    >
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Developer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Developer
                  </label>
                  <div className="relative">
                    <select
                      value={filters.developer}
                      onChange={(e) => handleFilterChange("developer", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                    >
                      {developers.map((developer) => (
                        <option key={developer} value={developer}>
                          {developer}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (AED)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projects Found</span>
                      <span className="font-semibold">{filteredProjects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average ROI</span>
                      <span className="font-semibold text-green-600">8.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. Completion</span>
                      <span className="font-semibold">2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="lg:w-3/4">
            {/* Sort Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Showing {paginatedProjects.length} of {filteredProjects.length} projects</span>
                  {Object.values(filters).some(Boolean) && (
                    <span className="px-2 py-1 bg-[#D19026]/10 text-[#D19026] text-xs rounded-full">
                      Filters Applied
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="roi">Highest ROI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative">
                    {/* Project Image */}
                    <div className="h-48 bg-gray-300 relative">
                      {project.featured && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3 py-1 bg-[#D19026] text-white text-xs font-semibold rounded-full">
                            Featured
                          </span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                          onClick={() => toggleWishlist(project.id)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              wishlist.includes(project.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                        <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white">
                          <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {project.type}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{project.location}</span>
                      </div>

                      <div className="flex items-center text-gray-600 mb-4">
                        <Building2 className="w-4 h-4 mr-1" />
                        <span className="text-sm">{project.developer}</span>
                      </div>

                      {/* Project Details */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#D19026]">
                            AED {project.startPrice}
                          </div>
                          <div className="text-xs text-gray-500">Start Price</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{project.roi}</div>
                          <div className="text-xs text-gray-500">Expected ROI</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{project.paymentPlan}</div>
                          <div className="text-xs text-gray-500">Payment Plan</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            {project.beds} beds
                          </span>
                          <span>{project.area}</span>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          project.status === "Under Construction"
                            ? "bg-blue-100 text-blue-700"
                            : project.status === "Launching Soon"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {project.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Completion: {project.completion}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleContactAgent(project)}
                          className="flex-1 bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                          Enquire Now
                        </button>
                        <button className="px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {renderPagination().map((page, index) =>
                      page === "..." ? (
                        <span key={`dots-${index}`} className="px-3">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg ${
                            currentPage === page
                              ? "bg-[#D19026] text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Got a question?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We've got answers. Here are some of the questions we get from our clients.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-3 text-[#D19026]">
                  {faq.question}
                </h3>
                <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#D19026] to-[#b87d20] rounded-2xl p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Invest in Dubai's Future?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Our expert advisors will guide you through the entire off-plan investment process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-[#D19026] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Schedule Consultation
              </button>
              <button className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                Download Investment Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">Enquire about {selectedProject.name}</h3>
                <p className="text-gray-600">{selectedProject.location}</p>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D19026] focus:border-transparent"
                  placeholder="Any specific questions?"
                  defaultValue={`I'm interested in ${selectedProject.name}. Please send me more details.`}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Send Enquiry
              </button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#D19026]" />
                </div>
                <div>
                  <p className="font-medium">Get immediate assistance</p>
                  <p className="text-sm text-gray-600">
                    Call us at <span className="font-semibold">+971 4 123 4567</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OffPlanPage;