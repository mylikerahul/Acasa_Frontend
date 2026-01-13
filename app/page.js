"use client"; 

import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CgMouse } from "react-icons/cg"; 
import MetaData from "./MetaData";
import Hero from "./components/Hero";




const FeaturedProjects = dynamic(
  () => import("./components/FeaturedProjects"),
  {
    loading: () => <div className="h-96 bg-gray-100" />,
    ssr: false,
  }
);



// Lazy load components with ssr disabled for better performance
const FeaturedProperties = dynamic(
  () => import("./components/FeaturedProperties"),
  {
    loading: () => <div className="h-96 bg-gray-100" />,
    ssr: false,
  }
);



const DevelopersCarousel = dynamic(
  () => import("./components/DevelopersCarousel"),
  {
    loading: () => <div className="h-64 bg-gray-50" />,
    ssr: false,
  }
);

const BuyerSellerGuide = dynamic(
  () => import("./components/BuyerSellerGuide"),
  {
    loading: () => <div className="h-80 bg-gray-100" />,
    ssr: false,
  }
);

const ExpertAdvice = dynamic(
  () => import("./components/ExpertAdvice"),
  {
    loading: () => <div className="h-72 bg-gray-50" />,
    ssr: false,
  }
);

const BlogsSection = dynamic(
  () => import("./components/BlogsSection"),
  {
    loading: () => <div className="h-96 bg-gray-100" />,
    ssr: false,
  }
);

const Newsletter = dynamic(
  () => import("./components/Newsletter"),
  {
    loading: () => <div className="h-64 bg-gray-50" />,
    ssr: false,
  }
);

export default function Home() {
  // Optimized smooth scroll
  const scrollToContent = () => {
    const vh = window.innerHeight;
    window.scrollTo({
      top: vh,
      behavior: "smooth",
    });
  };

  return (
    <main className="bg-white min-h-screen">
      <MetaData title="Flavor Starter - Premium Real Estate in Dubai" />
      
      <Navbar />
      
      <Hero />
      
      {/* Optimized Scroll Button */}
      <div className="flex justify-center -mt-16 relative z-10">
        <button
          onClick={scrollToContent}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full
                     shadow-[0_10px_40px_rgba(0,0,0,0.25)]
                     hover:scale-105 transition-transform duration-300 
                     animate-[bounce_2s_ease-in-out_infinite]
                     will-change-transform"
          aria-label="Scroll to content"
        >
          <CgMouse className="text-xl" />
        </button>
      </div>
      
      <FeaturedProjects />
      <FeaturedProperties />
      <DevelopersCarousel />
      <BuyerSellerGuide />
      <ExpertAdvice />
      <BlogsSection />
      <Newsletter />
      <Footer />
    </main>
  );
}