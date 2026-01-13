"use client";
import { useState } from "react";
import { FiCheck, FiX, FiRefreshCw } from "react-icons/fi";

export default function PropertyTypeFilter({ onClose, onApply }) {
  const [selected, setSelected] = useState([]);

  const toggleOption = (option) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const resetSelection = () => setSelected([]);

  const categories = [
    {
      title: "Status",
      options: ["Ready to move in", "Under construction"]
    },
    {
      title: "Property Type",
      options: ["Apartment", "Villa", "Town house", "Penthouse"]
    },
    {
      title: "Listing Type",
      options: ["Sale", "Rent", "New Development"]
    }
  ];

  return (
    <div className="w-[400px] bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-base font-bold text-gray-900">
          Property Filters
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <FiX className="text-gray-500 text-sm" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 max-h-[350px] overflow-y-auto">
        {categories.map((category, idx) => (
          <div key={category.title} className={idx > 0 ? "mt-5" : ""}>
            
            {/* Category Title */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {category.title}
            </p>

            {/* Options */}
            <div className="flex flex-wrap gap-2">
              {category.options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isSelected && <FiCheck className="text-xs" />}
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Count */}
      {selected.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700">
              <span className="font-semibold">{selected.length}</span> filter{selected.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={resetSelection}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex gap-3 p-5 border-t border-gray-100">
        <button
          onClick={resetSelection}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          <FiRefreshCw className="text-sm" />
          <span>Reset</span>
        </button>
        <button
          onClick={() => onApply(selected.join(", "))}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <FiCheck className="text-sm" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  );
}