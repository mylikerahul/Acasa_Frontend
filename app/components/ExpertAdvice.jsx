"use client";

export default function ExpertAdvice() {
  return (
    <section className="bg-[#f5f5f5] px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left – Text */}
          <div className="flex items-center py-6 md:py-10 pr-0 md:pr-10">
            <div>
              <h2
                className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-black mb-3"
              >
                WANT ADVICE FROM OUR EXPERTS?
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-xl">
                Operating from Dubai, one of the world&apos;s most dynamic cities
                for real estate, we have the expertise and contacts to source
                those properties.
              </p>
            </div>
          </div>

          {/* Right – Image */}
          <div className="h-48 md:h-72 lg:h-80 w-full">
            {/* चाहो तो इसे किसी local image से बदल सकते हो, जैसे /office.jpg */}
            <img
              src="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=80"
              alt="Modern office"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}