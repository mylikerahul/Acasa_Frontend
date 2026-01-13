"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Download,
  RefreshCw,
  X,
  ExternalLink,
  CreditCard,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart,
  BarChart3,
  Filter,
  FileText,
  Mail,
  Phone,
  Building2,
  Hash,
  Banknote,
  CircleDollarSign,
  BadgeCheck,
  XCircle,
  Clock3,
  RotateCcw,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/* =========================================================
   STATUS CONFIGURATIONS
========================================================= */

const STATUS_CONFIG = {
  succeeded: {
    label: "Succeeded",
    color: "from-green-500 to-green-600",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    color: "from-yellow-500 to-amber-500",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: Clock3,
  },
  failed: {
    label: "Failed",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: RotateCcw,
  },
  canceled: {
    label: "Canceled",
    color: "from-gray-500 to-gray-600",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: XCircle,
  },
  processing: {
    label: "Processing",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Loader2,
  },
};

const PAYMENT_TYPE_CONFIG = {
  full: {
    label: "Full Payment",
    color: "bg-blue-100 text-blue-700",
  },
  booking: {
    label: "Booking (10%)",
    color: "bg-amber-100 text-amber-700",
  },
  installment: {
    label: "Installment",
    color: "bg-purple-100 text-purple-700",
  },
};

const ALL_COLUMNS = [
  "ID",
  "Status",
  "Customer",
  "Amount",
  "Type",
  "Project",
  "Payment ID",
  "Date",
  "Action",
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminPaymentsPage() {
  const router = useRouter();

  // State Management
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState(new Set(ALL_COLUMNS));
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [total, setTotal] = useState(0);

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  /* =========================================================
     API HELPER
  ========================================================= */

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        throw new Error("Please login to continue");
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Network error" }));
        throw new Error(
          error.message || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    },
    [router]
  );

  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      params.append("limit", "500");

      const data = await apiRequest(`/api/v1/payment/admin/all?${params}`);

      if (data.success) {
        setPayments(data.data || []);
        setTotal(data.total || data.data?.length || 0);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, dateRange, apiRequest]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest("/api/v1/payment/admin/stats");
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [apiRequest]);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPayments();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter, dateRange]);

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleRefund = async () => {
    if (!selectedPayment) return;

    try {
      setRefundLoading(true);

      const data = await apiRequest(
        `/api/v1/payment/${selectedPayment.id}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: refundAmount ? parseFloat(refundAmount) : null,
            reason: refundReason || "Admin initiated refund",
          }),
        }
      );

      if (data.success) {
        toast.success("Refund processed successfully!");
        setShowRefundModal(false);
        setRefundAmount("");
        setRefundReason("");
        setSelectedPayment(null);
        fetchPayments();
        fetchStats();
      }
    } catch (err) {
      console.error("Refund error:", err);
      toast.error(err.message || "Failed to process refund");
    } finally {
      setRefundLoading(false);
    }
  };

  const handleExport = () => {
    if (payments.length === 0) {
      toast.error("No payments to export");
      return;
    }

    const headers = [
      "ID",
      "Stripe Payment ID",
      "Customer Name",
      "Customer Email",
      "Amount",
      "Currency",
      "Status",
      "Payment Type",
      "Project ID",
      "Description",
      "Created At",
    ];

    const csvContent = [
      headers.join(","),
      ...payments.map((payment) =>
        [
          payment.id,
          `"${payment.stripe_payment_id || ""}"`,
          `"${payment.user_name || ""}"`,
          `"${payment.user_email || ""}"`,
          payment.amount || 0,
          payment.currency?.toUpperCase() || "AED",
          payment.payment_status || "",
          payment.payment_type || "full",
          payment.project_id || "",
          `"${payment.description || ""}"`,
          payment.created_at || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Payments exported successfully!");
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const openRefundModal = (payment) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount?.toString() || "");
    setShowRefundModal(true);
  };

  /* =========================================================
     UTILITY FUNCTIONS
  ========================================================= */

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (amount, currency = "aed") => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusInfo = (status) => {
    return (
      STATUS_CONFIG[status?.toLowerCase()] || {
        label: status || "Unknown",
        color: "from-gray-500 to-gray-600",
        bg: "bg-gray-50",
        text: "text-gray-700",
        icon: AlertCircle,
      }
    );
  };

  const getPaymentTypeInfo = (type) => {
    return (
      PAYMENT_TYPE_CONFIG[type?.toLowerCase()] || {
        label: type || "Payment",
        color: "bg-gray-100 text-gray-700",
      }
    );
  };

  const truncateId = (id) => {
    if (!id) return "N/A";
    if (id.length <= 20) return id;
    return `${id.slice(0, 12)}...${id.slice(-6)}`;
  };

  /* =========================================================
     FILTERED DATA
  ========================================================= */

  const filteredPayments = useMemo(() => {
    let filtered = payments || [];

    // Tab filtering
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (p) => p.payment_status?.toLowerCase() === activeTab
      );
    }

    // Search filtering (client-side additional filtering)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.user_name?.toLowerCase().includes(searchLower) ||
          p.user_email?.toLowerCase().includes(searchLower) ||
          p.stripe_payment_id?.toLowerCase().includes(searchLower) ||
          p.id?.toString().includes(searchLower)
      );
    }

    return filtered.filter((p) => p && p.id);
  }, [payments, activeTab, search]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredPayments.slice(start, start + showCount);
  }, [filteredPayments, currentPage, showCount]);

  const totalPages = Math.ceil(filteredPayments.length / showCount);

  /* =========================================================
     STATS CALCULATIONS
  ========================================================= */

  const overview = stats?.overview || {};
  const totalRevenue = parseFloat(overview.total_revenue) || 0;
  const totalPayments = parseInt(overview.total_payments) || payments.length;
  const successfulPayments = parseInt(overview.successful_payments) || 0;
  const pendingPayments = parseInt(overview.pending_payments) || 0;
  const failedPayments = parseInt(overview.failed_payments) || 0;
  const avgPayment = parseFloat(overview.average_payment) || 0;

  const getTabCount = (tab) => {
    if (tab === "all") return totalPayments;
    return payments.filter((p) => p.payment_status?.toLowerCase() === tab).length;
  };

  /* =========================================================
     COLUMN VISIBILITY
  ========================================================= */

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const isVisible = (col) => visibleColumns.has(col);

  /* =========================================================
     SELECTION
  ========================================================= */

  const toggleSelectAll = () => {
    if (selectedPayments.size === paginatedPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(paginatedPayments.map((p) => p.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedPayments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
            <CreditCard className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-gray-200/30 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Payment Details</h3>
                  <p className="text-sm text-gray-300">#{selectedPayment.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status & Amount */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {(() => {
                    const statusInfo = getStatusInfo(selectedPayment.payment_status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatPrice(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedPayment.user_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                        {selectedPayment.user_email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Payment Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Payment Type</span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        getPaymentTypeInfo(selectedPayment.payment_type).color
                      }`}
                    >
                      {getPaymentTypeInfo(selectedPayment.payment_type).label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Currency</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedPayment.currency?.toUpperCase() || "AED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Stripe Payment ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-800">
                        {truncateId(selectedPayment.stripe_payment_id)}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedPayment.stripe_payment_id,
                            "stripe"
                          )
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {copiedId === "stripe" ? (
                          <CheckCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Customer ID</span>
                    <span className="text-xs font-mono text-gray-800">
                      {truncateId(selectedPayment.stripe_customer_id)}
                    </span>
                  </div>
                  {selectedPayment.project_id && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Project ID</span>
                      <span className="text-sm font-medium text-gray-800">
                        #{selectedPayment.project_id}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Created At</span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatDate(selectedPayment.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPayment.description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
                    {selectedPayment.description}
                  </p>
                </div>
              )}

              {/* Metadata */}
              {selectedPayment.metadata &&
                Object.keys(selectedPayment.metadata).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      Metadata
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(selectedPayment.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {selectedPayment.payment_status === "succeeded" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openRefundModal(selectedPayment);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Issue Refund
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRefundModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Process Refund
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Original Amount</span>
                  <span className="text-lg font-bold text-gray-800">
                    {formatPrice(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedPayment.user_name || selectedPayment.user_email}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Leave empty for full refund"
                    max={selectedPayment.amount}
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to refund full amount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refund..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowRefundModal(false)}
                  disabled={refundLoading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {refundLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Toggle Modal */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsColumnModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Show / Hide Columns
              </h3>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      visibleColumns.has(col)
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="sr-only"
                    />
                    {visibleColumns.has(col) ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{col}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setVisibleColumns(new Set(ALL_COLUMNS))}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="px-6 py-2 text-sm font-medium bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-6 md:px-14 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1
                className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Payment <span className="italic text-green-600">Management</span>
              </h1>
              <p className="text-gray-600">
                Track and manage all payment transactions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  fetchPayments();
                  fetchStats();
                }}
                disabled={loading}
                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            {
              label: "Total Revenue",
              count: formatPrice(totalRevenue, "aed"),
              icon: CircleDollarSign,
              gradient: "from-green-500 to-green-600",
              isPrice: true,
            },
            {
              label: "Total Payments",
              count: totalPayments,
              icon: CreditCard,
              gradient: "from-gray-600 to-gray-800",
            },
            {
              label: "Successful",
              count: successfulPayments,
              icon: CheckCircle,
              gradient: "from-emerald-500 to-emerald-600",
            },
            {
              label: "Pending",
              count: pendingPayments,
              icon: Clock3,
              gradient: "from-yellow-500 to-amber-500",
            },
            {
              label: "Failed",
              count: failedPayments,
              icon: XCircle,
              gradient: "from-red-500 to-red-600",
            },
            {
              label: "Avg. Payment",
              count: formatPrice(avgPayment, "aed"),
              icon: TrendingUp,
              gradient: "from-blue-500 to-blue-600",
              isPrice: true,
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`font-bold text-gray-800 truncate ${
                      stat.isPrice ? "text-lg" : "text-2xl"
                    }`}
                  >
                    {stat.count}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6 overflow-hidden">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-4 border-b border-gray-100 bg-gray-50/50">
            {[
              { key: "all", label: "All Payments", color: "bg-gray-800" },
              { key: "succeeded", label: "Succeeded", color: "bg-green-600" },
              { key: "pending", label: "Pending", color: "bg-yellow-500" },
              { key: "failed", label: "Failed", color: "bg-red-600" },
              { key: "refunded", label: "Refunded", color: "bg-purple-600" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : `${tab.color} text-white`
                  }`}
                >
                  {getTabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Filters Row */}
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-sm"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-sm"
                />
              </div>
            </div>

            {/* Column Toggle */}
            <button
              onClick={() => setIsColumnModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              <Eye className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Columns</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button
              onClick={fetchPayments}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {/* Table Header Info */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Show
                <select
                  value={showCount}
                  onChange={(e) => {
                    setShowCount(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="mx-2 px-2 py-1 border border-gray-200 rounded-lg focus:outline-none"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                entries
              </span>
              <span className="text-sm text-gray-500">
                Showing {paginatedPayments.length} of {filteredPayments.length}
              </span>
            </div>
          </div>

          {/* Table Content */}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No payments found
              </h3>
              <p className="text-gray-500 mb-6">
                Payments will appear here once customers make purchases
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={
                          selectedPayments.size === paginatedPayments.length &&
                          paginatedPayments.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800"
                      />
                    </th>
                    {isVisible("ID") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                    )}
                    {isVisible("Status") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {isVisible("Customer") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                    )}
                    {isVisible("Amount") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                    )}
                    {isVisible("Type") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                    )}
                    {isVisible("Project") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Project
                      </th>
                    )}
                    {isVisible("Payment ID") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment ID
                      </th>
                    )}
                    {isVisible("Date") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                    )}
                    {isVisible("Action") && (
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedPayments.map((payment) => {
                    const statusInfo = getStatusInfo(payment.payment_status);
                    const StatusIcon = statusInfo.icon;
                    const typeInfo = getPaymentTypeInfo(payment.payment_type);

                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPayments.has(payment.id)}
                            onChange={() => toggleSelect(payment.id)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800"
                          />
                        </td>

                        {isVisible("ID") && (
                          <td className="px-4 py-4">
                            <span className="text-sm font-mono text-gray-500">
                              #{payment.id}
                            </span>
                          </td>
                        )}

                        {isVisible("Status") && (
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                            >
                              <StatusIcon
                                className={`w-3.5 h-3.5 ${
                                  payment.payment_status === "processing"
                                    ? "animate-spin"
                                    : ""
                                }`}
                              />
                              {statusInfo.label}
                            </span>
                          </td>
                        )}

                        {isVisible("Customer") && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {payment.user_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {payment.user_name || "Guest"}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                  {payment.user_email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                        )}

                        {isVisible("Amount") && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">
                                {formatPrice(payment.amount, payment.currency)}
                              </span>
                            </div>
                          </td>
                        )}

                        {isVisible("Type") && (
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                          </td>
                        )}

                        {isVisible("Project") && (
                          <td className="px-4 py-4">
                            {payment.project_id ? (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                #{payment.project_id}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        )}

                        {isVisible("Payment ID") && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-gray-500">
                                {truncateId(payment.stripe_payment_id)}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    payment.stripe_payment_id,
                                    payment.id
                                  )
                                }
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {copiedId === payment.id ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </td>
                        )}

                        {isVisible("Date") && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatDate(payment.created_at)}
                            </div>
                          </td>
                        )}

                        {isVisible("Action") && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => viewPaymentDetails(payment)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              {payment.payment_status === "succeeded" && (
                                <button
                                  onClick={() => openRefundModal(payment)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Refund"
                                >
                                  <RotateCcw className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredPayments.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`w-10 h-10 text-sm font-medium rounded-xl transition-all ${
                        currentPage === pageNum
                          ? "bg-gray-800 text-white"
                          : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4 text-green-500" />
          Manage your payment transactions securely
        </p>
      </div>
    </div>
  );
}