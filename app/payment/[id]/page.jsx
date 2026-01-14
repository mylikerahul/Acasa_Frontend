"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  AlertCircle,
  Sparkles,
  DollarSign,
  FileText,
  User,
  Mail,
  Phone,
  Home,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const utils = {
  formatPrice: (value) =>
    value ? Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0",

  getImageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\/+/, "");
    return `${API_URL}/uploads/projects/${cleanPath}`;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const api = {
  checkAuth: async () => {
    const response = await axios.get(`${API_URL}/api/v1/users/me`, {
      withCredentials: true,
    });
    return response.data;
  },

  getProject: async (id) => {
    const response = await axios.get(`${API_URL}/api/v1/projects/${id}`);
    return response.data;
  },

  createPaymentIntent: async (data) => {
    const response = await axios.post(
      `${API_URL}/api/v1/payment/create-payment-intent`,
      data,
      { withCredentials: true }
    );
    return response.data;
  },

  verifyPayment: async (paymentIntentId) => {
    const response = await axios.post(
      `${API_URL}/api/v1/payment/verify-payment`,
      { paymentIntentId },
      { withCredentials: true }
    );
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING COMPONENT FOR SUSPENSE FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Loading payment page...</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingState = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Something Went Wrong</h2>
      <p className="text-gray-500 mb-8">{error}</p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/projects"
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse Projects
        </Link>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  </div>
);

const AuthRequired = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="h-10 w-10 text-amber-600" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Login Required</h2>
      <p className="text-gray-500 mb-8">Please login to proceed with the payment.</p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/login"
          className="px-8 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
        >
          Login Now
        </Link>
        <Link
          href="/register"
          className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Create Account
        </Link>
      </div>
    </div>
  </div>
);

const ProjectSummary = ({ project }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
    <div className="relative aspect-[16/9] bg-gray-100">
      {project.image ? (
        <img
          src={utils.getImageUrl(project.image)}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Building2 size={48} className="text-gray-300" />
        </div>
      )}
      {project.featured_project === 1 && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles size={12} />
          Featured
        </div>
      )}
    </div>

    <div className="p-6">
      {project.developer_name && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 mb-3">
          <Building2 size={12} />
          {project.developer_name}
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-800 mb-2">{project.title}</h2>

      <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
        <MapPin size={14} className="text-amber-500" />
        <span>{project.location || project.city || "Location TBA"}</span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400 uppercase">Property Price</p>
          <p className="text-2xl font-bold text-gray-900">
            {project.currency || "AED"} {utils.formatPrice(project.price)}
          </p>
        </div>
        {project.handover_date && (
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase">Handover</p>
            <p className="text-sm font-medium text-gray-700">{project.handover_date}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const PaymentTypeSelector = ({ paymentType, setPaymentType, project }) => {
  const bookingAmount = Math.round(project.price * 0.1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Select Payment Option</h3>

      <button
        type="button"
        onClick={() => setPaymentType("full")}
        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
          paymentType === "full"
            ? "border-gray-800 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                paymentType === "full" ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <DollarSign
                size={24}
                className={paymentType === "full" ? "text-white" : "text-gray-600"}
              />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Full Payment</h4>
              <p className="text-sm text-gray-500 mb-2">Complete payment now</p>
              <p className="text-xl font-bold text-gray-900">
                {project.currency || "AED"} {utils.formatPrice(project.price)}
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              paymentType === "full" ? "border-gray-800 bg-gray-800" : "border-gray-300"
            }`}
          >
            {paymentType === "full" && <CheckCircle size={14} className="text-white" />}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => setPaymentType("booking")}
        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
          paymentType === "booking"
            ? "border-green-600 bg-green-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                paymentType === "booking" ? "bg-green-600" : "bg-green-100"
              }`}
            >
              <CheckCircle
                size={24}
                className={paymentType === "booking" ? "text-white" : "text-green-600"}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-800">Booking Amount</h4>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Reserve now, pay rest later</p>
              <p className="text-xl font-bold text-gray-900">
                {project.currency || "AED"} {utils.formatPrice(bookingAmount)}
              </p>
              <p className="text-xs text-gray-400 mt-1">10% of total price</p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              paymentType === "booking" ? "border-green-600 bg-green-600" : "border-gray-300"
            }`}
          >
            {paymentType === "booking" && <CheckCircle size={14} className="text-white" />}
          </div>
        </div>
      </button>
    </div>
  );
};

const BillingDetails = ({ billingData, setBillingData, disabled }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingData((prev) => ({ ...prev, [name]: value }));
  };

  const inputClass =
    "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Billing Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="name"
              value={billingData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={billingData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <div className="relative">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={billingData.phone}
              onChange={handleChange}
              placeholder="+971 50 123 4567"
              required
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <div className="relative">
            <Home size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="address"
              value={billingData.address}
              onChange={handleChange}
              placeholder="Street Address"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderSummary = ({ project, paymentType, amount }) => {
  const bookingAmount = Math.round(project.price * 0.1);
  const remainingAmount = project.price - bookingAmount;

  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Property</span>
          <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">
            {project.title}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payment Type</span>
          <span className="font-medium text-gray-800">
            {paymentType === "booking" ? "Booking (10%)" : "Full Payment"}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Property Price</span>
          <span className="text-gray-800">
            {project.currency || "AED"} {utils.formatPrice(project.price)}
          </span>
        </div>

        {paymentType === "booking" && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Balance Due Later</span>
            <span>
              {project.currency || "AED"} {utils.formatPrice(remainingAmount)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-gray-800">Total Due Now</span>
            <span className="text-xl font-bold text-gray-900">
              {project.currency || "AED"} {utils.formatPrice(amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityBadge = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <ShieldCheck size={20} className="text-green-600" />
      <h3 className="font-semibold text-gray-800">Secure Payment</h3>
    </div>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <Lock size={18} className="text-gray-600" />
        </div>
        <p className="text-xs text-gray-500">SSL Secured</p>
      </div>
      <div>
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <CreditCard size={18} className="text-gray-600" />
        </div>
        <p className="text-xs text-gray-500">PCI Compliant</p>
      </div>
      <div>
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <ShieldCheck size={18} className="text-gray-600" />
        </div>
        <p className="text-xs text-gray-500">Verified</p>
      </div>
    </div>
  </div>
);

const PaymentSuccess = ({ paymentId, project, amount, paymentType }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-6 py-12">
    <div className="max-w-lg w-full">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-green-100">
            Your {paymentType === "booking" ? "booking" : "payment"} has been confirmed
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-gray-800 text-xs">
                {paymentId?.slice(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Property</span>
              <span className="font-medium text-gray-800">{project.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-green-600">
                {project.currency || "AED"} {utils.formatPrice(amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-800">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FileText size={16} />
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium"
            >
              Browse More
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CheckoutForm = ({ project, paymentType, amount, billingData, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [intentCreating, setIntentCreating] = useState(false);

  const isBillingValid = billingData.name && billingData.email && billingData.phone;

  useEffect(() => {
    if (!isBillingValid || !amount || clientSecret) return;

    const createIntent = async () => {
      setIntentCreating(true);
      setError(null);

      try {
        const response = await api.createPaymentIntent({
          amount: amount,
          currency: (project.currency || "aed").toLowerCase(),
          description: `${paymentType === "booking" ? "Booking" : "Full Payment"} for ${project.title}`,
          projectId: project.id,
          paymentType: paymentType,
          metadata: {
            projectId: project.id,
            projectTitle: project.title,
            paymentType: paymentType,
            customerName: billingData.name,
            customerEmail: billingData.email,
            customerPhone: billingData.phone,
          },
        });

        if (response.success) {
          const secret = response.data?.clientSecret || response.clientSecret;
          if (secret) {
            setClientSecret(secret);
          } else {
            throw new Error("No client secret in response");
          }
        } else {
          throw new Error(response.message || "Failed to create payment intent");
        }
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Failed to initialize payment";
        setError(message);
        toast.error(message);
      } finally {
        setIntentCreating(false);
      }
    };

    createIntent();
  }, [isBillingValid, amount, project, paymentType, billingData, clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment system not ready");
      return;
    }

    if (!clientSecret) {
      toast.error("Please wait for payment to initialize");
      return;
    }

    if (!isBillingValid) {
      toast.error("Please fill all required billing details");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: billingData.name,
              email: billingData.email,
              phone: billingData.phone,
              address: { line1: billingData.address || "" },
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        const verifyResponse = await api.verifyPayment(paymentIntent.id);

        if (verifyResponse.success) {
          onSuccess(paymentIntent.id, verifyResponse.data);
        } else {
          throw new Error("Payment verification failed");
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Payment failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cardOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1f2937",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        "::placeholder": { color: "#9ca3af" },
      },
      invalid: { color: "#ef4444", iconColor: "#ef4444" },
    },
    hidePostalCode: true,
  };

  if (!isBillingValid) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Please fill in your billing details above to proceed with payment.
        </p>
      </div>
    );
  }

  if (intentCreating) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500 text-sm">Initializing payment...</span>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Payment Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 flex items-center gap-2 text-sm text-red-700 hover:text-red-800"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Card Details</h3>
        <div className="px-4 py-4 border-2 border-gray-200 rounded-xl focus-within:border-gray-400 transition-colors bg-white">
          <CardElement options={cardOptions} />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Lock size={12} />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard size={12} />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-800">
          <strong>Test Card:</strong> 4242 4242 4242 4242 | Expiry: 12/34 | CVC: 123
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 
          bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl text-sm font-semibold
          hover:from-gray-900 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={18} />
            Pay {project.currency || "AED"} {utils.formatPrice(amount)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck size={14} className="text-green-600" />
        <span>Secured by Stripe • 256-bit SSL Encryption</span>
      </div>
    </form>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT PAGE CONTENT - Contains useSearchParams
// ═══════════════════════════════════════════════════════════════════════════════

function PaymentPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const [paymentType, setPaymentType] = useState(searchParams.get("type") || "booking");
  const [billingData, setBillingData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [successData, setSuccessData] = useState(null);

  const amount = useMemo(() => {
    if (!project) return 0;
    return paymentType === "booking" ? Math.round(project.price * 0.1) : project.price;
  }, [project, paymentType]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const authResponse = await api.checkAuth();

        if (!authResponse.success) {
          setStatus("auth-required");
          return;
        }

        const userData = authResponse.user || authResponse.data;
        setUser(userData);

        setBillingData({
          name: userData?.name || userData?.fullName || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          address: "",
        });

        const projectResponse = await api.getProject(id);

        if (!projectResponse.success || !projectResponse.data) {
          throw new Error("Project not found");
        }

        setProject(projectResponse.data);
        setStatus("ready");
      } catch (err) {
        if (err.response?.status === 401) {
          sessionStorage.setItem(
            "redirectAfterLogin",
            `/payment/${id}?type=${searchParams.get("type") || "booking"}`
          );
          setStatus("auth-required");
        } else {
          setError(err.response?.data?.message || err.message || "Something went wrong");
          setStatus("error");
        }
      }
    };

    if (id) initialize();
  }, [id, searchParams]);

  const handlePaymentSuccess = useCallback((paymentIntentId, data) => {
    setSuccessData({ paymentId: paymentIntentId, ...data });
    setStatus("success");
    toast.success("Payment successful! 🎉");
  }, []);

  if (status === "loading") {
    return <LoadingState message="Loading payment details..." />;
  }

  if (status === "auth-required") {
    return <AuthRequired />;
  }

  if (status === "error") {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  if (status === "success") {
    return (
      <PaymentSuccess
        paymentId={successData?.paymentId}
        project={project}
        amount={amount}
        paymentType={paymentType}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Project</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-800 uppercase tracking-wide mb-2">
            Secure Checkout
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-gray-800 to-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Complete your payment securely with Stripe</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <PaymentTypeSelector
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                project={project}
              />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <BillingDetails
                billingData={billingData}
                setBillingData={setBillingData}
                disabled={false}
              />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  project={project}
                  paymentType={paymentType}
                  amount={amount}
                  billingData={billingData}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <ProjectSummary project={project} />
            <OrderSummary project={project} paymentType={paymentType} amount={amount} />
            <SecurityBadge />
          </div>
        </div>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT WITH SUSPENSE BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════════

export default function PaymentPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaymentPageContent />
    </Suspense>
  );
}