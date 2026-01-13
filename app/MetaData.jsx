"use client";

import { useEffect } from "react";

const MetaData = ({ 
  title, 
  description, 
  keywords,
  image,
  url,
  type = "website",
  siteName = "Flavor Starter",
  author = "Flavor Starter Team",
  twitterHandle = "@flavorstarter",
  noIndex = false,
  noFollow = false,
  canonicalUrl,
  structuredData,
}) => {
  
  useEffect(() => {
    // ============ TITLE ============
    if (title) {
      document.title = `${title} | ${siteName}`;
    }

    // ============ META TAGS HANDLER ============
    const setMetaTag = (name, content, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (element) {
        element.setAttribute("content", content);
      } else {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        element.setAttribute("content", content);
        document.head.appendChild(element);
      }
    };

    // ============ BASIC META TAGS ============
    setMetaTag("description", description);
    setMetaTag("keywords", keywords);
    setMetaTag("author", author);

    // ============ ROBOTS ============
    const robotsContent = [
      noIndex ? "noindex" : "index",
      noFollow ? "nofollow" : "follow",
    ].join(", ");
    setMetaTag("robots", robotsContent);

    // ============ OPEN GRAPH TAGS ============
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", image, true);
    setMetaTag("og:url", url || window.location.href, true);
    setMetaTag("og:type", type, true);
    setMetaTag("og:site_name", siteName, true);
    setMetaTag("og:locale", "en_US", true);

    // ============ TWITTER CARD TAGS ============
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:site", twitterHandle);
    setMetaTag("twitter:creator", twitterHandle);
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", image);

    // ============ CANONICAL URL ============
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", canonicalUrl);
      } else {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        canonical.setAttribute("href", canonicalUrl);
        document.head.appendChild(canonical);
      }
    }

    // ============ STRUCTURED DATA (JSON-LD) ============
    if (structuredData) {
      let script = document.querySelector("#structured-data");
      if (script) {
        script.innerHTML = JSON.stringify(structuredData);
      } else {
        script = document.createElement("script");
        script.id = "structured-data";
        script.type = "application/ld+json";
        script.innerHTML = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    }

    // ============ CLEANUP ============
    return () => {
      // Optional: Reset to defaults when component unmounts
    };
  }, [
    title, 
    description, 
    keywords, 
    image, 
    url, 
    type, 
    siteName, 
    author, 
    twitterHandle, 
    noIndex, 
    noFollow, 
    canonicalUrl, 
    structuredData
  ]);

  // This component doesn't render anything visible
  return null;
};

export default MetaData;