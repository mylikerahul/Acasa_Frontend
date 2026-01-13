"use client";

import { useState, useMemo } from "react";
import {
  FiArrowLeft,
  FiSave,
  FiX,
  FiSearch,
  FiPlus,
} from "react-icons/fi";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// React‑Quill (react-quill-new) – same pattern jaisa tum Property page me use kar rahe ho
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }) => <RQ ref={forwardedRef} {...props} />;
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    ),
  }
);

// ----------------- Dummy table data -----------------
const COMMUNITY_ROWS = [
  {
    id: 243,
    name: "Umm Al Quwain",
    city: "Dubai",
    country: "United Arab Emirates",
    description: "Umm Al Quwain..",
    status: "Publish",
  },
  {
    id: 241,
    name: "Creek Beach",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "Creek Beach, crafted by Emaar, invites you to indulge in the epitome of waterfront living, nestled i..",
    status: "Publish",
  },
  {
    id: 240,
    name: "Eden Hills",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "The guiding design principles for the Eden Hills Plots Development within Mohammed Bin Rashid City a..",
    status: "Publish",
  },
  {
    id: 239,
    name: "Ras Al Khaimah",
    city: "Ras Al Khaimah",
    country: "United Arab Emirates",
    description:
      "Elevate Your Luxurious Lifestyle at Eden House the CaElevate Your Luxurious Lifestyle at Eden House ..",
    status: "Publish",
  },
  {
    id: 231,
    name: "Dubai Marina",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "DUBAI MARINA Exploring the ins and outs of Dubai’s most desirable waterfront community, Dub..",
    status: "Publish",
  },
  {
    id: 228,
    name: "Uptown Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "DMCC introduces the first supertall tower in Dubai’s Uptown district at Uptown Tower featuring..",
    status: "Publish",
  },
  {
    id: 226,
    name: "Zaabeel",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "One Za’abeel is an engineering marvel in Dubai, located between Dubai World Trade Centre and Z..",
    status: "Publish",
  },
  {
    id: 225,
    name: "Wadi, Al Safa",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "Wadi, Al Safa lies to the West of Falcon City of Wonders in DubaiLand. This community is known for h..",
    status: "Publish",
  },
  {
    id: 224,
    name: "Umm Suqeim",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "Umm Seqeim 3 cluster lies in the ‘Umm Seqeim’ master community alongside the Jumeirah Ro..",
    status: "Publish",
  },
  {
    id: 223,
    name: "Nine Elms",
    city: "Dubai",
    country: "United Arab Emirates",
    description:
      "A new icon has arrived in London. Aykon Nine Elms is the city’s first-ever fashion-branded res..",
    status: "Not Publish",
  },
];

const INITIAL_FORM = {
  country: "",
  communityName: "",
  subCommunity: "",
  longitude: "",
  latitude: "",
  sliderType: "image",
  seoTitle: "",
  seoDescription: "",
  seoKeyword: "",
  description: "",
};

export default function CommunityPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [showAddDbModal, setShowAddDbModal] = useState(false);
  const [dbCity, setDbCity] = useState("");
  const [dbName, setDbName] = useState("");

  // ---------- handlers ----------
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Community form submit:", formData);
  };

  const handleDbSubmit = (e) => {
    e.preventDefault();
    console.log("Add New Community Database:", { city: dbCity, name: dbName });
    // yaha API call laga sakte ho
    setShowAddDbModal(false);
    setDbCity("");
    setDbName("");
  };

  // ---------- React‑Quill config ----------
  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ["blockquote", "link"],
          ["clean"],
        ],
      },
    }),
    []
  );

  const quillFormats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "align",
      "color",
      "background",
      "blockquote",
      "link",
    ],
    []
  );

  const plainTextDesc = formData.description
    .replace(/<[^>]*>/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const filteredRows = COMMUNITY_ROWS.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* MAIN PAGE */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* HEADER */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 group mb-2"
              >
                <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Community</h1>
              <p className="text-gray-600">
                Manage Communities, Sub Communities and SEO details
              </p>
            </div>

            {/* Add Community Data button -> popup */}
            <button
              type="button"
              onClick={() => setShowAddDbModal(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-600 text-white text-sm font-semibold shadow-md hover:bg-amber-700"
            >
              <FiPlus className="w-4 h-4" />
              Add Community Data
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Add / Edit Community */}
            <div className="lg:col-span-2 space-y-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add New Community
                  </h2>
                  <p className="text-sm text-gray-600">
                    Community 97 • Sub Community • Communities Data / IDs info
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Country + Community name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Country
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) =>
                          handleChange("country", e.target.value)
                        }
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select</option>
                        <option>United Arab Emirates</option>
                        <option>Saudi Arabia</option>
                        <option>India</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Community Name
                      </label>
                      <input
                        type="text"
                        value={formData.communityName}
                        onChange={(e) =>
                          handleChange("communityName", e.target.value)
                        }
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g. Dubai Marina"
                      />
                    </div>
                  </div>

                  {/* Sub Community */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub Community
                    </label>
                    <input
                      type="text"
                      value={formData.subCommunity}
                      onChange={(e) =>
                        handleChange("subCommunity", e.target.value)
                      }
                      className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Lat / Long */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Choose Community Lat Log
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Longitude
                        </label>
                        <input
                          type="text"
                          value={formData.longitude}
                          onChange={(e) =>
                            handleChange("longitude", e.target.value)
                          }
                          className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Longitude"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Latitude
                        </label>
                        <input
                          type="text"
                          value={formData.latitude}
                          onChange={(e) =>
                            handleChange("latitude", e.target.value)
                          }
                          className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Latitude"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        handleChange("seoTitle", e.target.value)
                      }
                      maxLength={60}
                      className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoTitle.length} / 60 – This is what will
                      appear in the first line when this shows up in the search
                      results.
                    </p>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.seoDescription}
                      onChange={(e) =>
                        handleChange("seoDescription", e.target.value)
                      }
                      maxLength={160}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoDescription.length} / 160 – This is what
                      will appear as the description when this shows up in the
                      search results.
                    </p>
                  </div>

                  {/* SEO Focus Keyword */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SEO Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={formData.seoKeyword}
                      onChange={(e) =>
                        handleChange("seoKeyword", e.target.value)
                      }
                      maxLength={100}
                      className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.seoKeyword.length} / 100
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-700">
                      <li>Add Focus Keyword to the SEO title.</li>
                      <li>Add Focus Keyword to your SEO Meta Description.</li>
                      <li>Use Focus Keyword in the URL.</li>
                      <li>Use Focus Keyword in the content.</li>
                      <li>
                        Content is {plainTextDesc.length || 1} words long.
                        Consider using at least 600 words.
                      </li>
                    </ul>
                  </div>

                  {/* Community Description – ReactQuill */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Community Description
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(val) => handleChange("description", val)}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write detailed description about the community..."
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {plainTextDesc.length} words. Try to write at least 600
                      words.
                    </p>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(INITIAL_FORM)}
                    className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    Save Community
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT: Search + Table */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Search by Name"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  No. of Community : 97
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
                          Community Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          City
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {row.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {/* image column blank */}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {row.city}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {row.country}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {row.description}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                row.status === "Publish"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <button className="text-amber-600 hover:text-amber-800 font-semibold">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-center text-sm text-gray-500"
                          >
                            No communities found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Fake pagination */}
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50">
                  <span>No. of Community : 97</span>
                  <div className="flex items-center gap-1">
                    <button className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
                      Previous
                    </button>
                    <span className="px-2 py-1 rounded bg-amber-600 text-white">
                      1
                    </span>
                    <span className="px-2 py-1 rounded border border-gray-200 bg-white">
                      2
                    </span>
                    <span className="px-2 py-1 rounded border border-gray-200 bg-white">
                      3
                    </span>
                    <span className="px-2 py-1 rounded border border-gray-200 bg-white">
                      4
                    </span>
                    <span className="px-2 py-1 rounded border border-gray-200 bg-white">
                      5
                    </span>
                    <span className="px-2 py-1 rounded border border-gray-200 bg-white">
                      6
                    </span>
                    <span className="px-2 py-1 rounded border border-gray-200 bg-white">
                      7
                    </span>
                    <button className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP: Add New Community Database */}
      {showAddDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200">
            {/* Modal header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Add New Community Database
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDbModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleDbSubmit} className="px-5 py-4 space-y-4">
              {/* Select City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select City
                </label>
                <select
                  value={dbCity}
                  onChange={(e) => setDbCity(e.target.value)}
                  required
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select</option>
                  <option>Dubai</option>
                  <option>Abu Dhabi</option>
                  <option>Sharjah</option>
                  <option>Ras Al Khaimah</option>
                </select>
              </div>

              {/* Community Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Community Name
                </label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  required
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Community Name"
                />
              </div>

              {/* Footer buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDbModal(false)}
                  className="h-9 px-4 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 flex items-center gap-1"
                >
                  <FiSave className="w-4 h-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}