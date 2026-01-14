"use client";

import { Suspense, memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CgMouse } from "react-icons/cg";
import MetaData from "./MetaData";
import Hero from "./components/Hero";

// ═══════════════════════════════════════════════════════════════════
// OPTIMIZED DYNAMIC IMPORTS WITH LOADING STATES
// ═══════════════════════════════════════════════════════════════════

// Loading Component for better UX
const SectionLoader = memo(() => (
  <div className="w-full h-64 flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
));
SectionLoader.displayName = "SectionLoader";

// Critical components - Load immediately
const FeaturedProjects = dynamic(
  () => import("./components/FeaturedProjects"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

const FeaturedProperties = dynamic(
  () => import("./components/FeaturedProperties"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

// Secondary components - Load with slight delay
const DevelopersCarousel = dynamic(
  () => import("./components/DevelopersCarousel"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

const BuyerSellerGuide = dynamic(
  () => import("./components/BuyerSellerGuide"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

// Tertiary components - Load when visible
const ExpertAdvice = dynamic(
  () => import("./components/ExpertAdvice"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

const BlogsSection = dynamic(
  () => import("./components/BlogsSection"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

const Newsletter = dynamic(
  () => import("./components/Newsletter"),
  {
    loading: () => <SectionLoader />,
    ssr: false,
  }
);

// ═══════════════════════════════════════════════════════════════════
// SCROLL BUTTON COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════

const ScrollButton = memo(() => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex justify-center -mt-16 relative z-10">
      <button
        onClick={scrollToContent}
        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-full
                   shadow-[0_10px_40px_rgba(0,0,0,0.25)]
                   hover:scale-105 transition-transform duration-300 
                   animate-bounce"
        aria-label="Scroll to content"
      >
        <CgMouse className="text-xl" />
      </button>
    </div>
  );
});
ScrollButton.displayName = "ScrollButton";

// ═══════════════════════════════════════════════════════════════════
// PROGRESSIVE LOADING WRAPPER
// ═══════════════════════════════════════════════════════════════════

const ProgressiveSection = memo(({ children, delay = 0 }) => {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!shouldRender) {
    return <SectionLoader />;
  }

  return <>{children}</>;
});
ProgressiveSection.displayName = "ProgressiveSection";

// ═══════════════════════════════════════════════════════════════════
// INTERSECTION OBSERVER WRAPPER (Load when visible)
// ═══════════════════════════════════════════════════════════════════

const LazySection = memo(({ children, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "100px" }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return (
    <div ref={setRef}>
      {isVisible ? children : <SectionLoader />}
    </div>
  );
});
LazySection.displayName = "LazySection";

// ═══════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function Home() {
  // Prefetch critical routes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Prefetch critical pages
      const prefetchLinks = ["/projects", "/properties", "/developers"];
      prefetchLinks.forEach((link) => {
        const linkEl = document.createElement("link");
        linkEl.rel = "prefetch";
        linkEl.href = link;
        document.head.appendChild(linkEl);
      });
    }
  }, []);

  return (
    <main className="bg-white min-h-screen">
      <MetaData title="Flavor Starter - Premium Real Estate in Dubai" />

      {/* Critical above-the-fold content */}
      <Navbar />
      <Hero />
      <ScrollButton />

      {/* Progressive loading strategy */}
      <Suspense fallback={<SectionLoader />}>
        {/* Priority 1: Immediate load (Featured content) */}
        <ProgressiveSection delay={0}>
          <FeaturedProjects />
        </ProgressiveSection>

        <ProgressiveSection delay={100}>
          <FeaturedProperties />
        </ProgressiveSection>

        {/* Priority 2: Short delay (Secondary content) */}
        <ProgressiveSection delay={300}>
          <DevelopersCarousel />
        </ProgressiveSection>

        <ProgressiveSection delay={400}>
          <BuyerSellerGuide />
        </ProgressiveSection>

        {/* Priority 3: Lazy load when scrolling (Below-fold content) */}
        <LazySection threshold={0.1}>
          <ExpertAdvice />
        </LazySection>

        <LazySection threshold={0.1}>
          <BlogsSection />
        </LazySection>

        <LazySection threshold={0.1}>
          <Newsletter />
        </LazySection>

        {/* Footer always loads last */}
        <Footer />
      </Suspense>
    </main>
  );
}