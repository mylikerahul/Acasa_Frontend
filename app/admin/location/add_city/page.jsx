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

// React‑Quill (react-quill-new)
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

// Dummy table data for District list
const DISTRICT_ROWS = [
  {
    id: 1,
    name: "Business District One",
    city: "Dubai",
    country: "United Arab Emirates",
    description: "Prime business district in the heart of Dubai.",
    status: "Active",
  },
  {
    id: 2,
    name: "Waterfront District",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    description: "Waterfront living district near Corniche.",
    status: "Active",
  },
];

const INITIAL_DISTRICT_FORM = {
  country: "",
  city: "",
  name: "",
  longitude: "",
  latitude: "",
  seoTitle: "",
  seoDescription: "",
  seoKeyword: "",
  description: "",
};

export default function DistrictPage() {
  const [formData, setFormData] = useState(INITIAL_DISTRICT_FORM);
  const [search, setSearch] = useState("");
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState("");

  // handlers
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("District form submit:", formData);
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    console.log("Add New City Database for UAE:", newCityName);
    setShowCityModal(false);
    setNewCityName("");
  };

  // React‑Quill config
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

  const filteredRows = DISTRICT_ROWS.filter((row) =>
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
              <h1 className="text-3xl font-bold text-gray-900">District</h1>
              <p className="text-gray-600">
                Add New District and manage city‑level locations
              </p>
            </div>

            {/* Add City Data button -> popup */}
            <button
              type="button"
              onClick={() => setShowCityModal(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-600 text-white text-sm font-semibold shadow-md hover:bg-amber-700"
            >
              <FiPlus className="w-4 h-4" />
              Add City Data
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Add New District form */}
            <div className="lg:col-span-2 space-y-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add New District
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Country */}
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

                  {/* Location Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location Image
                    </label>
                    <input
                      type="file"
                      className="block w-full text-xs text-gray-600
                                 file:mr-3 file:py-2 file:px-4
                                 file:rounded-lg file:border-0
                                 file:text-xs file:font-semibold
                                 file:bg-amber-50 file:text-amber-700
                                 hover:file:bg-amber-100"
                    />
                  </div>

                  {/* City + District Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) =>
                          handleChange("city", e.target.value)
                        }
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select</option>
                        <option>Dubai</option>
                        <option>Abu Dhabi</option>
                        <option>Sharjah</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleChange("name", e.target.value)
                        }
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="District name"
                      />
                    </div>
                  </div>

                  {/* Longitude / Latitude */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Longitude / Latitude
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
                      <li> Add Focus Keyword to the SEO title.</li>
                      <li> Add Focus Keyword to your SEO Meta Description.</li>
                      <li> Use Focus Keyword in the URL.</li>
                      <li> Use Focus Keyword in the content.</li>
                      <li>
                        Content is {plainTextDesc.length || 1} words long.
                        Consider using at least 600 words.
                      </li>
                    </ul>
                  </div>

                  {/* City Description – ReactQuill */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City Description
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(val) => handleChange("description", val)}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write detailed description for this district / city area..."
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {plainTextDesc.length} words. Try to write at least 600
                      words.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(INITIAL_DISTRICT_FORM)}
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
                    Save District
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT: Search + District table */}
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
                  No. of District : {DISTRICT_ROWS.length}
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
                          District Name
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
                                row.status === "Active"
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
                            colSpan={7}
                            className="px-4 py-6 text-center text-sm text-gray-500"
                          >
                            No districts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* simple footer */}
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 bg-gray-50">
                  <span>No. of District : {DISTRICT_ROWS.length}</span>
                  <span>Page 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP: Add New City Database for UAE */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200">
            {/* header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Add New City Database for United Arab Emirates
              </h3>
              <button
                type="button"
                onClick={() => setShowCityModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* body */}
            <form onSubmit={handleCitySubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City Name
                </label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  required
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter City Name"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCityModal(false)}
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