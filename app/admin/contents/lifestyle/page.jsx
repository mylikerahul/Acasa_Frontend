"use client";

import { useState } from "react";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiChevronDown,
  FiEye,
  FiEdit2,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

// Dummy lifestyle data
const LIFESTYLE_ROWS = [
  {
    id: 22,
    name: "Resort Living",
    createdAt: "2021-04-06 11:22:58",
    status: "Active",
    verified: true,
  },
];

export default function LifestylePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const filtered = LIFESTYLE_ROWS.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setStatusDropdownOpen(false);
    console.log("Change status bulk action:", value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Lifestyle</h1>
            <p className="text-gray-600">
              Manage lifestyle tags like Resort Living, Golf, Waterfront etc.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Change status dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Change status
                <FiChevronDown className="w-4 h-4" />
              </button>
              {statusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg text-xs z-10">
                  {["Sold", "Public", "Draft"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleStatusChange(opt)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Lifestyle */}
            <button
              type="button"
              onClick={() => router.push("/lifestyle/add")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-600 text-white text-sm font-semibold shadow-md hover:bg-amber-700"
            >
              <FiPlus className="w-4 h-4" />
              New Lifestyle
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="relative">
            <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Search by Project Name"
            />
          </div>
          <span className="text-xs text-gray-500">
            Lifestyle Filter: {statusFilter}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {/* Image blank for now */}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.createdAt}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {row.verified ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          Verified
                        </span>
                      ) : (
                        "-"
                      )}
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
                          onClick={() => router.push("/lifestyle/add")}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No lifestyle found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-600 bg-gray-50 flex items-center justify-between">
            <span>Showing {filtered.length} entries</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}