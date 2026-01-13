"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  Filter,
  Search,
  Calendar,
  Building2,
  Loader2,
  FileText,
  Download,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }
  return null;
};

const formatPrice = (value) =>
  value ? Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const statusConfig = {
  succeeded: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-700",
    icon: RefreshCw,
  },
};

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchPayments = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const { data } = await axios.get(
          `${API_URL}/api/payment/my-payments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data.success) {
          setPayments(data.data || []);
        }
      } catch (error) {
        console.error("Fetch payments error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-800 uppercase tracking-wide mb-2">
            My Payments
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-gray-800 to-transparent" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-2">
            {["all", "succeeded", "pending", "failed", "refunded"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Payments Found
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't made any payments yet.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium">
              Browse Projects
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const status = statusConfig[payment.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <CreditCard size={24} className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {payment.projectTitle || "Property Payment"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(payment.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {payment.paymentType === "booking"
                              ? "Booking"
                              : "Full Payment"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 mb-2">
                        {payment.currency || "AED"} {formatPrice(payment.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      ID: {payment.transactionId?.slice(0, 24)}...
                    </span>
                    <Link
                      href={`/payment/receipt/${payment.id}`}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
                      <Download size={14} />
                      Receipt
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}