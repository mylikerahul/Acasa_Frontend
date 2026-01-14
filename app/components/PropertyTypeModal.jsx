"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function PropertyTypeModal({ isOpen, onClose, selectedTypes, onToggleType }) {
  const propertyTypes = [
    "Apartment",
    "Villa", 
    "Town house",
    "Sale",
    "New Development",
    "Rent"
  ];

  const handleApply = () => {
    onClose();
  };

  const handleReset = () => {
    selectedTypes.forEach(type => {
      if (propertyTypes.includes(type)) {
        onToggleType(type);
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <h3 className="mb-6 text-lg font-bold text-gray-800">
                Select Property Types
              </h3>

              {/* Checkbox Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {propertyTypes.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => onToggleType(type)}
                      className="h-4 w-4 rounded border-gray-300 accent-black cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {type}
                    </span>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 rounded-full bg-black py-2.5 text-sm font-bold text-white shadow-md hover:bg-zinc-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}