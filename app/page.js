"use client";

import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CgMouse } from "react-icons/cg";
import MetaData from "./MetaData";
import Hero from "./components/Hero";

// Dynamic imports
const FeaturedProjects = dynamic(() => import("./components/FeaturedProjects"), { ssr: false });
const FeaturedProperties = dynamic(() => import("./components/FeaturedProperties"), { ssr: false });
const DevelopersCarousel = dynamic(() => import("./components/DevelopersCarousel"), { ssr: false });
const BuyerSellerGuide = dynamic(() => import("./components/BuyerSellerGuide"), { ssr: false });
const ExpertAdvice = dynamic(() => import("./components/ExpertAdvice"), { ssr: false });
const BlogsSection = dynamic(() => import("./components/BlogsSection"), { ssr: false });
const Newsletter = dynamic(() => import("./components/Newsletter"), { ssr: false });

export default function Home() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <main className="bg-white min-h-screen">
      <MetaData title="Flavor Starter - Premium Real Estate in Dubai" />

      <Navbar />
      <Hero />

      <div className="flex justify-center -mt-16 relative z-10">
        <button
          onClick={scrollToContent}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full
                     shadow-[0_10px_40px_rgba(0,0,0,0.25)]
                     hover:scale-105 transition-transform duration-300 
                     animate-bounce"
        >
          <CgMouse className="text-xl" />
        </button>
      </div>

      <FeaturedProjects />
      <FeaturedProperties />
      <DevelopersCarousel />
      <BuyerSellerGuide />
      <ExpertAdvice />

      {/* Yahan problem aa rahi hogi */}
      <BlogsSection />

      <Newsletter />
      <Footer />
    </main>
  );
}
