"use client";

import { useState } from "react";
import { FiArrowLeft, FiSave, FiX } from "react-icons/fi";

export default function AddCategoryPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug from name if editing name
      if (field === "name") {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Category:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 group mb-2"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Categories</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add Category</h1>
          <p className="text-gray-600">
            Create a new category and define its slug.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6 space-y-5 text-sm">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                placeholder="e.g. Apartments"
                className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category Slug */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                required
                placeholder="apartments"
                className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Slug will be used in URLs, e.g.{" "}
                <span className="font-mono text-gray-700">
                  /category/{formData.slug || "slug"}
                </span>
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}