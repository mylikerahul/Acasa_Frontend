"use client";

import { useEffect } from "react";

export default function SmoothWrapper({ children }) {
  useEffect(() => {
    // Smooth scrolling behavior for entire page
    document.documentElement.style.scrollBehavior = "smooth";

    // Add hardware acceleration and smooth transforms
    const style = document.createElement("style");
    style.textContent = `
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }

      /* Smooth scrolling with momentum */
      html {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }

      /* Hardware acceleration for all animations */
      *,
      *::before,
      *::after {
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }

      /* Smooth transitions for interactive elements */
      a, button, input, textarea, select, [role="button"] {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform, opacity, background-color, color;
      }

      /* Hover effects with smooth scaling */
      a:hover, button:hover, [role="button"]:hover {
        transform: translateY(-1px) translateZ(0);
      }

      a:active, button:active, [role="button"]:active {
        transform: translateY(0) translateZ(0);
        transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Smooth image loading */
      img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        transform: translateZ(0);
        will-change: transform;
      }

      /* Remove janky animations on page load */
      .page-loaded * {
        transition-duration: 0.3s !important;
      }

      /* Smooth scrollbar (webkit only) */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        transition: background 0.3s ease;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.4);
      }

      /* Smooth focus transitions */
      *:focus-visible {
        outline: 2px solid rgba(0, 0, 0, 0.8);
        outline-offset: 2px;
        transition: outline 0.2s ease;
      }

      /* Prevent layout shift during loading */
      @media (prefers-reduced-motion: no-preference) {
        * {
          scroll-behavior: smooth;
        }
      }

      /* Respect user's motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* Performance optimization for transforms */
      @supports (will-change: transform) {
        a, button, img, video, [role="button"] {
          will-change: transform;
        }
      }

      /* GPU acceleration for common elements */
      .ant-btn,
      .ant-card,
      .ant-modal,
      .ant-drawer,
      .ant-dropdown,
      [class*="transition"],
      [class*="animate"] {
        transform: translateZ(0);
        will-change: transform, opacity;
        backface-visibility: hidden;
      }

      /* Smooth entrance animations */
      @keyframes smoothFadeIn {
        from {
          opacity: 0;
          transform: translateY(10px) translateZ(0);
        }
        to {
          opacity: 1;
          transform: translateY(0) translateZ(0);
        }
      }

      body > * {
        animation: smoothFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Reduce motion for animations on mobile */
      @media (hover: none) and (pointer: coarse) {
        * {
          transition-duration: 0.2s !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Add page-loaded class after initial render
    const timer = setTimeout(() => {
      document.body.classList.add("page-loaded");
    }, 100);

    // Smooth scroll to anchor links
    const handleAnchorClick = (e) => {
      const target = e.target.closest("a");
      if (target?.hash) {
        const element = document.querySelector(target.hash);
        if (element) {
          e.preventDefault();
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          // Update URL without jumping
          history.pushState(null, "", target.hash);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleAnchorClick);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return <>{children}</>;
}