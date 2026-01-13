"use client";

import { useState } from "react";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

// Dummy category data
const CATEGORY_ROWS = [
  { id: 1, name: "Apartments", slug: "apartments" },
  { id: 2, name: "Villas", slug: "villas" },
  { id: 3, name: "Townhouses", slug: "townhouses" },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = CATEGORY_ROWS.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 group mb-2"
            >
              <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">
              Manage property / content categories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/categories/add")}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-600 text-white text-sm font-semibold shadow-md hover:bg-amber-700"
          >
            <FiPlus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="relative">
            <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Search Category Name"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{row.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <button
                        className="p-1.5 rounded hover:bg-gray-100"
                        title="View"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-gray-100"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-600 bg-gray-50 flex items-center justify-between">
            <span>Showing {filtered.length} entries</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}