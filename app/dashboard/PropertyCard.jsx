"use client";

import { FiHeart } from "react-icons/fi";

export default function PropertyCard({ property, onRemove }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        alignItems: "stretch",
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          width: "96px",
          height: "70px",
          borderRadius: "10px",
          overflow: "hidden",
          background: "#e5e7eb",
        }}
      >
        <img
          src={property.image}
          alt={property.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <button
          onClick={() => onRemove(property.id)}
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            border: "none",
            outline: "none",
            width: "20px",
            height: "20px",
            borderRadius: "999px",
            background: "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Remove from liked"
        >
          <FiHeart
            style={{
              fontSize: "12px",
              color: "#ef4444",
              fill: "#ef4444",
            }}
          />
        </button>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 600,
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {property.title}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          {property.location}
        </p>
        <div
          style={{
            marginTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
          }}
        >
          <span style={{ fontWeight: 700, color: "#111827" }}>
            AED {property.price}
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              background: "#eef2ff",
              color: "#4f46e5",
              fontWeight: 500,
            }}
          >
            {property.beds}
          </span>
        </div>
      </div>
    </div>
  );
}