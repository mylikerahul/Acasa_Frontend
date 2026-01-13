"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddDeveloperPage() {
  const [activeTab, setActiveTab] = useState("details");

  const [form, setForm] = useState({
    name: "",
    yearEstablished: "",
    country: "",
    chairman: "",
    website: "",
    agent: "",
    email: "",
    mobile: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    seoPermalink: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Developer payload:", form);
    // yahan API call / redirect karega
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[1280px] mx-auto px-4 pt-6 pb-10">
        {/* Title + Back */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[20px] font-semibold text-slate-800">
            Add Developer
          </h1>
          <Link
            href="/admin/intdeveloper"
            className="text-[13px] text-[#0d6efd] hover:underline"
          >
            ← Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <div className="inline-flex flex-wrap gap-1 text-[13px]">
            {["details", "info", "projects", "properties"].map((key) => {
              const label =
                key === "details"
                  ? "Details | Info"
                  : key === "projects"
                  ? "Projects"
                  : key === "properties"
                  ? "Properties"
                  : "Info";
              // first tab text hi screenshot jaisa alag hai, simple rakhte
              const showLabel =
                key === "details" ? "Details | Info" : label;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-1.5 border-t border-l border-r rounded-t-md ${
                    activeTab === key
                      ? "bg-white border-gray-300 border-b-white text-slate-900 font-medium"
                      : "bg-[#f8f9fa] border-transparent text-slate-700 hover:bg-gray-100"
                  }`}
                >
                  {showLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Only details tab ka UI bana rahe; baaki tabs ke liye baad me expand kar sakta hai */}
        {activeTab === "details" && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-6 space-y-6"
          >
            {/* Top section: left = Developer details, right = logo + SEO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT: Developer details */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-[14px] font-semibold text-slate-800 border-b border-gray-200 pb-2">
                  Developer Details
                </h2>

                {[
                  { label: "Name of the Developer", field: "name" },
                  { label: "Year established", field: "yearEstablished" },
                  { label: "Country of Origin", field: "country" },
                  { label: "Chairman/CEO name", field: "chairman" },
                  { label: "Website", field: "website" },
                  { label: "Responsible Agent", field: "agent" },
                  { label: "Email", field: "email" },
                  { label: "Mobile", field: "mobile" },
                ].map((row) => (
                  <div
                    key={row.field}
                    className="flex flex-col md:flex-row md:items-center md:gap-6"
                  >
                    <label className="md:w-48 text-[13px] text-slate-700 md:text-right mb-1 md:mb-0">
                      {row.label}
                    </label>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full h-9 px-3 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-[#0d6efd]"
                        value={form[row.field]}
                        onChange={handleChange(row.field)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: Logo + basic SEO title */}
              <div className="space-y-4">
                {/* Logo */}
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-[13px] font-semibold text-slate-800 mb-2">
                    Developer Logo
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Dimensions: 482W / 334H
                  </p>
                  <div className="w-full h-40 border border-dashed border-gray-300 rounded-md flex items-center justify-center bg-[#f9fafb] text-gray-400 text-[12px] mb-2">
                    Logo preview
                  </div>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Width: 210px.
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Max File Size: 5MB. Filetypes allowed: JPG &amp; PNG.
                  </p>
                  <button
                    type="button"
                    className="h-8 px-4 rounded-sm bg-[#0d6efd] text-white text-[12px] font-medium hover:bg-[#0b5ed7]"
                  >
                    Upload
                  </button>
                </div>

                {/* SEO Title (simple) */}
                <div className="border border-gray-200 rounded-md p-4 bg-[#f9fafb]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-slate-800 font-medium">
                      Title
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {form.seoTitle.length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.seoTitle}
                    onChange={handleChange("seoTitle")}
                    className="w-full h-9 px-3 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-[#0d6efd]"
                    placeholder="This will appear in search results"
                  />
                  <div className="mt-3">
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Permalink
                    </label>
                    <input
                      type="text"
                      value={form.seoPermalink}
                      onChange={handleChange("seoPermalink")}
                      className="w-full h-9 px-3 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-[#0d6efd]"
                      placeholder="Unique URL for this developer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section: Description + SEO description */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Description */}
              <div className="lg:col-span-2">
                <h3 className="text-[14px] font-semibold text-slate-800 mb-2">
                  Description
                </h3>
                <textarea
                  rows={8}
                  value={form.description}
                  onChange={handleChange("description")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-[#0d6efd]"
                  placeholder="Write about the developer..."
                />
              </div>

              {/* SEO Description */}
              <div className="border border-gray-200 rounded-md p-4 bg-[#f9fafb]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-slate-800 font-medium">
                    Meta Description
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {form.seoDescription.length} / 160
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={form.seoDescription}
                  onChange={handleChange("seoDescription")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-[13px] focus:outline-none focus:border-[#0d6efd]"
                  placeholder="This will show up in search result snippet"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="h-9 px-6 rounded-sm bg-[#0d6efd] text-white text-[13px] font-medium hover:bg-[#0b5ed7]"
              >
                Save Developer
              </button>
            </div>
          </form>
        )}

        {activeTab !== "details" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-10 text-center text-[13px] text-slate-500">
            {/* Placeholder other tabs ke liye */}
            Content for <span className="font-semibold">{activeTab}</span> tab
            abhi implement nahi kiya. (Sirf UI ke liye Details tab ready hai.)
          </div>
        )}
      </div>
    </div>
  );
}