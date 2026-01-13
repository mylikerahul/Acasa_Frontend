"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Mail, Send, CheckCircle, Sparkles } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useNewsletter = () => {
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const validate = useCallback(() => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the Terms & Conditions");
      return false;
    }

    return true;
  }, [email, acceptedTerms]);

  const subscribe = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);

    // Debug logs
    console.log("========== NEWSLETTER SUBSCRIBE DEBUG ==========");
    console.log("1. Email:", email);
    console.log("2. API URL:", API_URL);
    console.log("3. Full endpoint:", `${API_URL}/api/v1/subscribe/subscribe`);

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/subscribe`, // ← Updated endpoint
        { email },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("4. Response:", response.data);

      if (response.data.success) {
        toast.success("🎉 Successfully subscribed to our newsletter!", {
          duration: 4000,
          style: {
            background: "#10B981",
            color: "#fff",
            fontWeight: "500",
          },
        });

        setEmail("");
        setAcceptedTerms(false);
        setSubscribed(true);

        // Reset success state after 5 seconds
        setTimeout(() => setSubscribed(false), 5000);
      }
    } catch (error) {
      console.log("5. Error:", error);
      console.log("6. Error response:", error?.response?.data);

      if (error?.response?.status === 409) {
        toast.error("This email is already subscribed", {
          icon: "📧",
        });
      } else if (error?.response?.status === 400) {
        toast.error(error?.response?.data?.message || "Invalid email address");
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to subscribe. Please try again."
        );
      }
    } finally {
      setLoading(false);
      console.log("========== DEBUG END ==========");
    }
  }, [email, validate]);

  const reset = useCallback(() => {
    setEmail("");
    setAcceptedTerms(false);
    setSubscribed(false);
  }, []);

  return {
    email,
    setEmail,
    acceptedTerms,
    setAcceptedTerms,
    loading,
    subscribed,
    subscribe,
    reset,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SectionHeader = () => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Mail size={20} className="text-gray-600" />
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        Stay Updated
      </span>
    </div>
    <h2 className="text-3xl md:text-4xl font-light text-gray-800 uppercase tracking-wide">
      Subscribe to Newsletter
    </h2>
    <p className="text-gray-500 mt-3 max-w-md">
      Get the latest news, property listings, and market insights delivered to your inbox
    </p>
    <div className="mt-4 h-0.5 w-20 bg-gradient-to-r from-gray-800 to-transparent" />
  </div>
);

const EmailInput = ({ value, onChange, disabled }) => (
  <div className="relative flex-1">
    <Mail
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
    />
    <input
      type="email"
      placeholder="Enter your email address"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl 
        text-sm outline-none transition-all duration-200
        focus:border-gray-400 focus:ring-2 focus:ring-gray-100
        disabled:bg-gray-50 disabled:cursor-not-allowed"
    />
  </div>
);

const SubscribeButton = ({ loading, subscribed, onClick }) => (
  <button
    type="submit"
    disabled={loading || subscribed}
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-8 py-4 
      text-sm font-semibold rounded-xl transition-all duration-300
      disabled:cursor-not-allowed min-w-[160px]
      ${
        subscribed
          ? "bg-green-500 text-white"
          : "bg-gray-800 text-white hover:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5"
      }
      ${loading ? "opacity-70" : ""}`}
  >
    {loading ? (
      <>
        <Loader2 size={18} className="animate-spin" />
        <span>Subscribing...</span>
      </>
    ) : subscribed ? (
      <>
        <CheckCircle size={18} />
        <span>Subscribed!</span>
      </>
    ) : (
      <>
        <Send size={18} />
        <span>Subscribe</span>
      </>
    )}
  </button>
);

const TermsCheckbox = ({ checked, onChange, disabled }) => (
  <label
    className={`flex items-start gap-3 cursor-pointer group
      ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
  >
    <div className="relative mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="peer sr-only"
      />
      <div
        className={`w-5 h-5 border-2 rounded-md transition-all duration-200
          ${
            checked
              ? "bg-gray-800 border-gray-800"
              : "border-gray-300 group-hover:border-gray-400"
          }`}
      >
        {checked && (
          <svg
            className="w-full h-full text-white p-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
    <span className="text-sm text-gray-600 leading-relaxed">
      I accept the{" "}
      <a
        href="/terms-and-conditions"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-800 font-medium underline underline-offset-2 
          hover:text-blue-600 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        Terms & Conditions
      </a>{" "}
      and{" "}
      <a
        href="/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-800 font-medium underline underline-offset-2 
          hover:text-blue-600 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        Privacy Policy
      </a>
    </span>
  </label>
);

const FeatureBadges = () => (
  <div className="flex flex-wrap gap-3 mt-6">
    {[
      { icon: Sparkles, text: "Exclusive Updates" },
      { icon: Mail, text: "Weekly Digest" },
      { icon: CheckCircle, text: "No Spam" },
    ].map(({ icon: Icon, text }) => (
      <div
        key={text}
        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full 
          border border-gray-100 shadow-sm"
      >
        <Icon size={14} className="text-gray-500" />
        <span className="text-xs text-gray-600 font-medium">{text}</span>
      </div>
    ))}
  </div>
);

const NewsletterForm = ({
  email,
  setEmail,
  acceptedTerms,
  setAcceptedTerms,
  loading,
  subscribed,
  onSubmit,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input & Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <EmailInput value={email} onChange={setEmail} disabled={loading || subscribed} />
          <SubscribeButton loading={loading} subscribed={subscribed} />
        </div>

        {/* Terms Checkbox */}
        <TermsCheckbox
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          disabled={loading || subscribed}
        />
      </form>

      {/* Success Message */}
      {subscribed && (
        <div
          className="mt-5 p-4 bg-green-50 border border-green-100 rounded-xl 
          flex items-center gap-3 animate-fadeIn"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Welcome to our newsletter!
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Check your inbox for a confirmation email
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function NewsletterSection() {
  const newsletter = useNewsletter();

  return (
    <section
      className="bg-gray-50 py-20 px-6 md:px-14 border-t border-gray-100"
      aria-labelledby="newsletter-section-title"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Side - Header */}
          <div>
            <SectionHeader />
            <FeatureBadges />
          </div>

          {/* Right Side - Form */}
          <NewsletterForm
            email={newsletter.email}
            setEmail={newsletter.setEmail}
            acceptedTerms={newsletter.acceptedTerms}
            setAcceptedTerms={newsletter.setAcceptedTerms}
            loading={newsletter.loading}
            subscribed={newsletter.subscribed}
            onSubmit={newsletter.subscribe}
          />
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </section>
  );
}