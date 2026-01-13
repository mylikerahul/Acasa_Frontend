"use client";

import { useState } from "react";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import {
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Link2,
  Mail,
  MapPin,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const popularLocations = [
    "Palm Jumeirah",
    "Downtown Dubai",
    "Dubai Hills Estate",
    "Dubai Marina",
    "Arabian Ranches",
    "Dubai Harbour",
  ];

  const exploreLinks = [
    "All Projects",
    "Sell Properties",
    "Blogs",
    "Developers",
    "Archive Properties",
    "Archive Projects",
  ];

  const companyLinks = [
    "About us",
    "Contact us",
    "Career",
    "Buyer Guide",
    "Seller Guide",
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Successfully subscribed! Check your email.");
        setEmail("");
      } else {
        toast.error(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Failed to subscribe. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#222", color: "#fff", fontSize: 13 },
        }}
      />

      <footer className="bg-[#0b0b0b] text-gray-300 text-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-6">
          {/* Top grid */}
          <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-5 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-4">
                {/* logo.svg white via invert filter */}
                <Image
                  src="/logo.svg"
                  alt="A Casa logo"
                  width={140}
                  height={30}
                  className="h-6 w-auto invert"
                />
              </div>

              <p className="text-[13px] text-gray-400 mb-4 leading-relaxed">
                Acasa is all set to help you find a dream home in Dubai, one of
                the world&apos;s most dynamic hotspots known for its diverse
                cultural conglomeration.
              </p>

              <div className="flex items-center gap-3 mt-3">
                {[Instagram, Facebook, Youtube, Linkedin, Link2].map(
                  (Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="h-8 w-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-white"
                      aria-label="social-link"
                    >
                      <Icon size={15} />
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Popular Locations */}
            <div>
              <h3 className="text-[13px] font-semibold text-white mb-3">
                Popular Locations
              </h3>
              <ul className="space-y-1">
                {popularLocations.map((loc) => (
                  <li key={loc}>
                    <a
                      href="#"
                      className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white"
                    >
                      <span>{loc}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-2 inline-flex items-center gap-1 text-[13px] text-[#fbbf24]"
              >
                View all
              </a>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-[13px] font-semibold text-white mb-3">
                Explore
              </h3>
              <ul className="space-y-1">
                {exploreLinks.map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-[13px] text-gray-400 hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-[13px] font-semibold text-white mb-3">
                Company
              </h3>
              <ul className="space-y-1">
                {companyLinks.map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className={`text-[13px] ${
                        label === "Career"
                          ? "text-[#fbbf24]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {label}
                      {label === "Career" && (
                        <span className="ml-1 text-[11px] text-[#fbbf24]">
                          We&apos;re hiring
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stay up to date */}
            <div>
              <h3 className="text-[13px] font-semibold text-white mb-3">
                Stay up to date
              </h3>

              <form
                onSubmit={handleSubscribe}
                className="flex items-stretch mb-3"
              >
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-transparent border border-gray-600 text-[13px] px-3 py-2 text-gray-200 placeholder-gray-500 rounded-l-full outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 text-[13px] font-semibold bg-[#fbbf24] text-black rounded-r-full"
                >
                  {loading ? "..." : "Subscribe"}
                </button>
              </form>

              <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-2">
                <Mail size={13} />
                <span>marketing@acasa.ae</span>
              </div>
              <div className="flex items-start gap-2 text-[12px] text-gray-400">
                <MapPin size={13} className="mt-[2px]" />
                <span>
                  RNA RESOURCES BUILDING
                  <br />
                  Al Quoz Third 104-B – Dubai
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 my-4" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <p className="text-center md:text-left">
              Copyright © {new Date().getFullYear()} Acasa. All rights
              reserved.
            </p>

            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-gray-300">
                Terms &amp; Conditions
              </a>
              <a href="#" className="hover:text-gray-300">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-300">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}