"use client";

export default function DashboardSection({ title, description, children, className = "" }) {
  return (
    <section className="w-full">
      <div
        className={`rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-sm shadow-gray-100/80 ${className}`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-5 py-3 border-b border-gray-200 flex flex-col gap-0.5">
            {title && (
              <h2 className="text-[15px] font-semibold text-slate-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[11px] text-slate-500">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-4 py-3">{children}</div>
      </div>
    </section>
  );
}