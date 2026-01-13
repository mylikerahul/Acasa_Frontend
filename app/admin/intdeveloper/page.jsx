"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function DevelopersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [developers, setDevelopers] = useState([
    {
      id: 314,
      picture: "/prestige-one-logo.jpg",
      fullName: "Prestige One",
      yearEstablished: "",
      countryOfOrigin: "",
      chairmanCEO: "",
      responsibleAgent: "",
      phone: "",
      email: "",
      status: "active",
    },
    {
      id: 313,
      picture: "/pmr-logo.jpg",
      fullName: "PMR",
      yearEstablished: "",
      countryOfOrigin: "",
      chairmanCEO: "",
      responsibleAgent: "",
      phone: "",
      email: "",
      status: "active",
    },
    {
      id: 312,
      picture: "/sankari-logo.jpg",
      fullName: "Sankari Properties",
      yearEstablished: "",
      countryOfOrigin: "",
      chairmanCEO: "",
      responsibleAgent: "",
      phone: "",
      email: "",
      status: "active",
    },
    {
      id: 311,
      picture: "/sobha-logo.jpg",
      fullName: "Sobha Development",
      yearEstablished: "",
      countryOfOrigin: "",
      chairmanCEO: "",
      responsibleAgent: "",
      phone: "",
      email: "",
      status: "active",
    },
  ]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this developer?")) {
      setDevelopers(developers.filter((dev) => dev.id !== id));
    }
  };

  const filteredDevelopers = developers.filter((dev) =>
    dev.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-10">
        {/* Page Title */}
        <h1 className="text-[22px] font-semibold text-slate-800 mb-6">
          International Developers
        </h1>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/developers/add"
              className="h-9 px-4 bg-[#0d6efd] text-white text-[13px] font-medium rounded hover:bg-[#0b5ed7] inline-flex items-center"
            >
              + New Developer
            </Link>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Name"
                value={searchQuery}
                onChange={handleSearch}
                className="h-9 w-64 px-3 pr-10 border border-gray-300 rounded text-[13px] focus:outline-none focus:border-[#0d6efd]"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </button>
            </div>
          </div>
          <div className="relative">
            <button className="h-9 px-4 bg-white border border-gray-300 rounded text-[13px] hover:bg-gray-50 inline-flex items-center gap-2">
              Overview ▼
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <input type="checkbox" className="w-4 h-4" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    ID ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Picture ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Full Name ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Year established ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Country of Origin ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Chairman/CEO name ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Responsible Agent ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Phone ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    E-mail ↕
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Status ↕
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevelopers.map((dev, idx) => (
                  <tr
                    key={dev.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="w-4 h-4" />
                    </td>
                    <td className="px-4 py-3 text-[#0d6efd]">
                      <Link href={`/admin/developers/${dev.id}`}>
                        {dev.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {dev.picture ? (
                          <img
                            src={dev.picture}
                            alt={dev.fullName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No Image</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{dev.fullName}</td>
                    <td className="px-4 py-3">{dev.yearEstablished}</td>
                    <td className="px-4 py-3">{dev.countryOfOrigin}</td>
                    <td className="px-4 py-3">{dev.chairmanCEO}</td>
                    <td className="px-4 py-3">{dev.responsibleAgent}</td>
                    <td className="px-4 py-3">{dev.phone}</td>
                    <td className="px-4 py-3">{dev.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/developers/${dev.id}/crm`}
                          className="px-3 py-1 bg-black text-white rounded text-[11px] font-medium hover:bg-gray-800"
                        >
                          CRM
                        </Link>
                        <Link
                          href={`/admin/developers/${dev.id}/web`}
                          className="px-3 py-1 bg-green-600 text-white rounded text-[11px] font-medium hover:bg-green-700"
                        >
                          WEB
                        </Link>
                        <button
                          onClick={() => handleDelete(dev.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-[11px] font-medium hover:bg-red-700"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-[13px] text-gray-600">
          Showing {filteredDevelopers.length} of {developers.length} developers
        </div>
      </div>
    </div>
  );
}