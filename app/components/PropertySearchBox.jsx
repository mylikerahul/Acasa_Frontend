"use client";
import { useState } from "react";
import { FiSearch, FiHome, FiChevronDown, FiMapPin } from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import { BsCurrencyDollar } from "react-icons/bs";
import PropertyTypeFilter from "./PropertyTypeFilter";

export default function PropertySearchBox() {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedBedrooms, setSelectedBedrooms] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative">
      <div className="w-full max-w-lg bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-7">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center">
            <FiHome className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Search your Favourite Home
            </h3>
            <p className="text-xs text-gray-500">Find your perfect property</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <FiMapPin className="text-gray-500 text-sm" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter project name or location"
            className="w-full bg-gray-50 border border-gray-200 text-[15px] text-gray-700 pl-14 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400 transition-all duration-200"
          />
        </div>

        {/* Type & Bedrooms Row */}
        <div className="flex gap-3 mb-4">
          
          {/* Type Dropdown */}
          <div className="w-1/2 relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`w-full flex items-center gap-2 bg-gray-50 border text-[15px] px-3 py-3.5 rounded-xl transition-all duration-200 ${
                showFilter 
                  ? "border-gray-400 bg-white" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiHome className="text-gray-500 text-sm" />
              </div>
              <span className={`flex-1 text-left ${selectedType ? "text-gray-900" : "text-gray-500"}`}>
                {selectedType || "Type"}
              </span>
              <FiChevronDown 
                className={`text-gray-400 transition-transform duration-200 ${
                  showFilter ? "rotate-180" : ""
                }`} 
              />
            </button>

            {/* PropertyTypeFilter Popup */}
            {showFilter && (
              <div className="absolute top-[calc(100%+8px)] left-0 z-50">
                <PropertyTypeFilter
                  onClose={() => setShowFilter(false)}
                  onApply={(type) => {
                    setSelectedType(type);
                    setShowFilter(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Bedrooms Dropdown */}
          <div className="w-1/2 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center pointer-events-none">
              <IoBedOutline className="text-gray-500 text-sm" />
            </div>
            <select
              value={selectedBedrooms}
              onChange={(e) => setSelectedBedrooms(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-[15px] text-gray-500 pl-14 pr-8 py-3.5 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white appearance-none cursor-pointer hover:border-gray-300 transition-all duration-200"
            >
              <option value="">Bedrooms</option>
              <option value="1">1 Bedroom</option>
              <option value="2">2 Bedrooms</option>
              <option value="3">3 Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Price Dropdown */}
        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center pointer-events-none">
            <BsCurrencyDollar className="text-gray-500 text-sm" />
          </div>
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-[15px] text-gray-500 pl-14 pr-8 py-3.5 rounded-xl focus:outline-none focus:border-gray-400 focus:bg-white appearance-none cursor-pointer hover:border-gray-300 transition-all duration-200"
          >
            <option value="">Select Price</option>
            <option value="under-1m">Under AED 1M</option>
            <option value="1m-2m">AED 1M - 2M</option>
            <option value="2m-3m">AED 2M - 3M</option>
            <option value="above-3m">Above AED 3M</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Search Button */}
        <button className="w-full bg-gray-900 text-white py-4 text-[15px] font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
          <FiSearch className="text-lg" />
          <span>Search Property</span>
        </button>
      </div>
    </div>
  );
}