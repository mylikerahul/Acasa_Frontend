"use client";

import Link from "next/link";
import React from "react";

export default function LikedProperties({ children }) {
  // Count children to check if empty
  const childCount = React.Children.count(children);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
        border: "1px solid #e5e7eb",
        padding: "18px 18px 16px",
        minHeight: "280px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Liked Properties
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            Properties you&apos;ve saved to your favourites.
          </p>
        </div>
        <Link
          href="/properties"
          style={{
            fontSize: "12px",
            color: "#2563eb",
            textDecoration: "none",
          }}
        >
          View all
        </Link>
      </div>

      {/* Content */}
      {childCount === 0 ? (
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          You haven&apos;t liked any properties yet.{" "}
          <Link
            href="/properties"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            Start exploring
          </Link>
          .
        </div>
      ) : (
        <div
          style={{
            marginTop: "10px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "10px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}