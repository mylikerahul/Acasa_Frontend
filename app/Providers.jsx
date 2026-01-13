"use client";

import { Toaster, toast } from "react-hot-toast";
import SmoothWrapper from "./SmoothWrapper";
import ClientErrorBoundary from "./ClientErrorBoundary";

// ─────────────────────────────────────────────────────────────
// Unified Toast Helpers (react-hot-toast)
// ─────────────────────────────────────────────────────────────
export const showToast = {
  success: (message) =>
    toast.success(message, { duration: 3000 }),

  error: (message) =>
    toast.error(message, { duration: 4000 }),

  warning: (message) =>
    toast(message, {
      icon: "⚠️",
      duration: 3500,
    }),

  info: (message) =>
    toast(message, {
      icon: "ℹ️",
      duration: 3000,
    }),

  loading: (message = "Loading...") =>
    toast.loading(message),

  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss(),

  promise: (promise, messages = {}) => {
    return toast.promise(promise, {
      loading: messages.loading || "Loading...",
      success: messages.success || "Success!",
      error: messages.error || "Something went wrong",
    });
  },
};

// ─────────────────────────────────────────────────────────────
// Providers Component
// ─────────────────────────────────────────────────────────────
export default function Providers({ children }) {
  return (
    <ClientErrorBoundary>
      <SmoothWrapper>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: "13px",
              background: "#ffffff",
              color: "#333",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
            success: {
              iconTheme: {
                primary: "#16a34a",
                secondary: "#ecfdf5",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#fef2f2",
              },
            },
          }}
        />
        {children}
      </SmoothWrapper>
    </ClientErrorBoundary>
  );
}

// direct toast export (optional)
export { toast };
