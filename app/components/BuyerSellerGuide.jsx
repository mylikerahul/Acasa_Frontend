"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

const GUIDES = [
  {
    id: "buyer",
    title: "Buyer Guide",
    description: "Complete guide for property buyers in Dubai",
    image: "https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg",
    href: "/buyer-guide",
  },
  {
    id: "seller",
    title: "Seller Guide",
    description: "Essential tips for selling your property",
    image: "https://images.pexels.com/photos/275484/pexels-photo-275484.jpeg",
    href: "/seller-guide",
  },
];

export default function BuyerSellerGuide() {
  const router = useRouter();

  const handleClick = useCallback(
    (href) => {
      if (!href) return;
      router.push(href);
    },
    [router]
  );

  return (
    <section
      className="bg-gradient-to-r from-white via-white to-[#ffe9c4] py-10 px-4 md:px-8"
      aria-label="Buyer and seller guides"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDES.map((guide) => (
            <article
              key={guide.id}
              onClick={() => handleClick(guide.href)}
              className="flex items-center bg-white rounded-3xl shadow-sm overflow-hidden cursor-pointer"
            >
              {/* Left: Image */}
              <div className="w-40 md:w-56 h-24 md:h-32 flex-shrink-0">
                <img
                  src={guide.image}
                  alt={guide.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right: Text */}
              <div className="flex-1 px-5 md:px-7 py-4">
                <h3 className="text-base md:text-lg font-semibold text-black mb-1">
                  {guide.title}
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs md:text-sm text-[#6b5cff]"
                >
                  <span>View more</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}