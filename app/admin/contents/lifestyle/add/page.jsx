"use client";

import { useState, useMemo } from "react";
import { FiArrowLeft, FiSave, FiX } from "react-icons/fi";
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
      <div className="w-full h-40 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    ),
  }
);

export default function EditLifestylePage() {
  const [formData, setFormData] = useState({
    lifestyleName: "",
    title: "",
    countryId: "250",
    developerId: "30",
    subtitle: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    seoKeyword: "",
    thumbImage: null,
    mainImage: null,
  });

  const [thumbPreview, setThumbPreview] = useState(null);
  const [mainPreview, setMainPreview] = useState(null);

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleThumbUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB allowed");
      return;
    }
    setFormData((p) => ({ ...p, thumbImage: file }));
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleMainUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB allowed");
      return;
    }
    setFormData((p) => ({ ...p, mainImage: file }));
    setMainPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Lifestyle form:", formData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 group mb-2"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Lifestyle</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Lifestyle</h1>
          <p className="text-gray-600">
            Update lifestyle details, SEO settings and images.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6 space-y-6 text-sm">
            {/* Lifestyle basic */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Lifestyle
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name of the lifestyle
                  </label>
                  <input
                    type="text"
                    value={formData.lifestyleName}
                    onChange={(e) =>
                      handleChange("lifestyleName", e.target.value)
                    }
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title (H1)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country_id
                  </label>
                  <input
                    type="text"
                    value={formData.countryId}
                    onChange={(e) =>
                      handleChange("countryId", e.target.value)
                    }
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Developer_id
                  </label>
                  <input
                    type="text"
                    value={formData.developerId}
                    onChange={(e) =>
                      handleChange("developerId", e.target.value)
                    }
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(val) => handleChange("description", val)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write detailed lifestyle description..."
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Content is {plainTextDesc.length} words long. Consider using
                  at least 600 words.
                </p>
              </div>
            </div>

            {/* SEO Preview */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                SEO Preview
              </h2>

              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleChange("seoTitle", e.target.value)}
                    maxLength={60}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.seoTitle.length} / 60 – This is what will appear
                    in the first line when this shows up in the search results.
                  </p>
                </div>

                {/* SEO Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
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
                    {formData.seoDescription.length} / 160 – This is what will
                    appear as the description when this shows up in the search
                    results.
                  </p>
                </div>

                {/* Focus Keyword */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Focus Keyword
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
              </div>
            </div>

            {/* Images */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Images
              </h2>

              {/* Thumbnail Category Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Thumbnail Category Image
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Width: 377px. Height: 212px
                    <br />
                    Max File Size: 5MB. Filetypes Allowed: JPG, PNG
                  </p>
                  {thumbPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={thumbPreview}
                        alt="Thumb Preview"
                        className="w-60 h-36 object-cover rounded-lg border border-gray-200 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(thumbPreview);
                          setThumbPreview(null);
                          handleChange("thumbImage", null);
                        }}
                        className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleThumbUpload}
                      className="block w-full text-xs text-gray-600
                                 file:mr-3 file:py-2 file:px-4
                                 file:rounded-lg file:border-0
                                 file:text-xs file:font-semibold
                                 file:bg-amber-50 file:text-amber-700
                                 hover:file:bg-amber-100"
                    />
                  )}
                </div>

                {/* Main Category Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Image Category Image
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Width: 589px. Height: 331px
                    <br />
                    Max File Size: 5MB. Filetypes Allowed: JPG, PNG
                  </p>
                  {mainPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={mainPreview}
                        alt="Main Preview"
                        className="w-72 h-40 object-cover rounded-lg border border-gray-200 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(mainPreview);
                          setMainPreview(null);
                          handleChange("mainImage", null);
                        }}
                        className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleMainUpload}
                      className="block w-full text-xs text-gray-600
                                 file:mr-3 file:py-2 file:px-4
                                 file:rounded-lg file:border-0
                                 file:text-xs file:font-semibold
                                 file:bg-amber-50 file:text-amber-700
                                 hover:file:bg-amber-100"
                    />
                  )}
                </div>
              </div>
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
              Save Lifestyle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}