"use client";

import { useState } from "react";
import { FiMail, FiPhone, FiMapPin, FiEdit2 } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi";

export default function UserCard({ user, likesCount, onEditClick }) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
        border: "1px solid #e5e7eb",
        padding: "20px 20px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        {/* Avatar */}
        {imageError ? (
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #f97316 0%, #facc15 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "24px",
            }}
          >
            {getInitials(user.name)}
          </div>
        ) : (
          <img
            src={user.avatar}
            alt={user.name}
            onError={() => setImageError(true)}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "999px",
              objectFit: "cover",
              border: "2px solid #e5e7eb",
            }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "6px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                Verified User
              </span>
            </div>

            <button
              type="button"
              onClick={onEditClick}
              style={{
                border: "none",
                outline: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <FiEdit2 style={{ fontSize: "13px" }} />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* INFO ROWS */}
      <div style={{ marginTop: "10px" }}>
        <InfoRow icon={<FiPhone />} text={user.phone} />
        <InfoRow icon={<FiMail />} text={user.email} />
        <InfoRow icon={<FiMapPin />} text={user.location} isLast />
      </div>

      {/* Stats mini row */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "10px",
          borderTop: "1px dashed #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        <div>
          <span style={{ fontWeight: 600, color: "#111827" }}>{likesCount}</span>{" "}
          saved properties
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#f97316",
          }}
        >
          <HiOutlineHome />
          <span>Keep exploring</span>
        </div>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ icon, text, isLast = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "#4b5563",
        marginBottom: isLast ? 0 : "6px",
      }}
    >
      <span style={{ color: "#6b7280" }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}