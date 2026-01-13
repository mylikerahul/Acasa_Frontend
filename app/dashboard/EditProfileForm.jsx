"use client";

import { useState } from "react";
import { FiSave } from "react-icons/fi";

export default function EditProfileForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const inputStyle = {
    width: "100%",
    height: "34px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    padding: "4px 10px",
    fontSize: "13px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "3px",
    color: "#4b5563",
    fontSize: "12px",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
        border: "1px solid #e5e7eb",
        padding: "16px 16px 14px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: 700,
          color: "#111827",
          marginBottom: "10px",
        }}
      >
        Edit Profile
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr)",
          gap: "8px",
          fontSize: "13px",
        }}
      >
        <FormField
          label="Name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
        <FormField
          label="Phone"
          type="text"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="+971 XX XXX XXXX"
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
        <FormField
          label="Location"
          type="text"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            color: "#4b5563",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            border: "none",
            background: "linear-gradient(135deg, #f97316 0%, #facc15 100%)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FiSave style={{ fontSize: "14px" }} />
          Save changes
        </button>
      </div>
    </form>
  );
}

// Helper component for form fields
function FormField({ label, type, value, onChange, placeholder, inputStyle, labelStyle }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}