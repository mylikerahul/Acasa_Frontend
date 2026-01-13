"use client";

import { useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { message } from "antd";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TopBar({ onLogout }) {
  const router = useRouter();

  const handleLogoutClick = async () => {
    if (!API_BASE_URL) {
      message.error("Config error. Please try again later.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST", // agar tumhari API GET hai to yahan GET kar dena
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        message.error("Logout failed. Please try again.");
        return;
      }

      // logout success
      message.success("Logged out successfully.");
      if (onLogout) onLogout(); // optional: parent ko bhi inform karna ho to

      // homepage par redirect
      router.push("/");
    } catch (err) {
      message.error("Something went wrong while logging out.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "26px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          My Dashboard
        </h1>
        <p
          style={{
            marginTop: "4px",
            marginBottom: 0,
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Overview of your profile and saved properties.
        </p>
      </div>

      <button
        onClick={handleLogoutClick}
        style={{
          border: "none",
          outline: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          background: "#dc2626",
          color: "#fff",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(220,38,38,0.35)",
        }}
      >
        <FiLogOut style={{ fontSize: "16px" }} />
        Logout
      </button>
    </div>
  );
}