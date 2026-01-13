"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getAdminToken } from "../../../../utils/auth";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ============ Chart Options ============
const getChartOptions = (maxValue) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: "circle",
        font: { size: 11, weight: "500" },
        color: "#4b5563",
        padding: 12,
      },
    },
    tooltip: {
      mode: "index",
      intersect: false,
      backgroundColor: "#020617",
      borderColor: "#1f2937",
      borderWidth: 1,
      titleFont: { size: 12, weight: "600" },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const value = context.parsed.y;
          return `${context.dataset.label}: ${value.toLocaleString()} properties`;
        },
      },
    },
  },
  interaction: {
    mode: "index",
    intersect: false,
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { 
        font: { size: 10 }, 
        color: "#6b7280",
        maxRotation: 0,
      },
      border: { color: "#e5e7eb" },
    },
    y: {
      grid: { color: "#f3f4f6", drawBorder: false },
      ticks: {
        font: { size: 10 },
        color: "#6b7280",
        precision: 0,
        callback(value) {
          return value.toLocaleString();
        },
      },
      title: {
        display: true,
        text: "Properties Count",
        font: { size: 11, weight: "600" },
        color: "#6b7280",
      },
      suggestedMax: maxValue ? Math.ceil(maxValue * 1.2) : 10,
      beginAtZero: true,
    },
  },
});

// ============ Skeleton Loader ============
const SkeletonLoader = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 w-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
    <div className="h-[260px] sm:h-[300px] bg-gray-100 rounded-lg animate-pulse" />
  </div>
);

// ============ Error State ============
const ErrorState = ({ error, onRetry }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
        Properties Chart
      </h3>
    </div>
    <div className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center">
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-700 mb-2 font-medium">
          Unable to load properties data
        </p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🔄 Retry
        </button>
      </div>
    </div>
  </div>
);

// ============ Main Component ============
export default function PropertiesChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setFallbackData = useCallback(() => {
    setChartData({
      labels: MONTHS,
      datasets: [
        {
          label: "Properties",
          data: Array(12).fill(0),
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
          borderWidth: 2,
          borderRadius: 6,
          maxBarThickness: 32,
          hoverBackgroundColor: "#2563eb",
        },
      ],
    });
  }, []);

  const fetchPropertiesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAdminToken();
      if (!token) {
        setError("Authentication token not found. Please login again.");
        setFallbackData();
        setLoading(false);
        return;
      }

      // FIXED: Using correct API endpoint
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/properties/admin/statistics`,
        {
          withCredentials: true,
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data?.success) {
        const data = response.data.data || response.data;

        // Case 1: Structured analytics response
        if (data?.byMonth && typeof data.byMonth === "object") {
          const monthlyData = MONTHS.map((_, idx) => 
            data.byMonth[idx] || data.byMonth[MONTHS[idx]] || 0
          );

          setChartData({
            labels: MONTHS,
            datasets: [
              {
                label: "Total Properties",
                data: monthlyData,
                backgroundColor: "#3b82f6",
                borderColor: "#2563eb",
                borderWidth: 2,
                borderRadius: 6,
                maxBarThickness: 32,
                hoverBackgroundColor: "#2563eb",
              },
            ],
          });
        }
        // Case 2: Array of properties
        else if (Array.isArray(data)) {
          const monthlyCounts = Array(12).fill(0);

          data.forEach((property) => {
            try {
              const createdAt = new Date(
                property.created_at || property.createdAt || property.date
              );
              if (!isNaN(createdAt.getTime())) {
                monthlyCounts[createdAt.getMonth()] += 1;
              }
            } catch (e) {
              console.warn("Invalid date format:", property.created_at);
            }
          });

          setChartData({
            labels: MONTHS,
            datasets: [
              {
                label: "Total Properties",
                data: monthlyCounts,
                backgroundColor: "#3b82f6",
                borderColor: "#2563eb",
                borderWidth: 2,
                borderRadius: 6,
                maxBarThickness: 32,
                hoverBackgroundColor: "#2563eb",
              },
            ],
          });
        }
        // Case 3: Direct data object
        else if (data?.total !== undefined) {
          setFallbackData();
        } else {
          setFallbackData();
        }
      } else {
        setError(response.data?.message || "Invalid response format");
        setFallbackData();
      }
    } catch (err) {
      console.error("Error fetching properties data:", err);

      let errorMsg = "Failed to load properties data";
      
      if (err.response?.status === 401) {
        errorMsg = "Authentication failed. Please login again.";
      } else if (err.response?.status === 403) {
        errorMsg = "You don't have permission to view this data.";
      } else if (err.response?.status === 404) {
        errorMsg = "Statistics endpoint not found.";
      } else if (err.code === "ECONNABORTED") {
        errorMsg = "Request timeout. Please check your connection.";
      } else if (!err.response) {
        errorMsg = "Network error. Please check your internet connection.";
      }

      setError(err.response?.data?.message || errorMsg);
      setFallbackData();
    } finally {
      setLoading(false);
    }
  }, [setFallbackData]);

  useEffect(() => {
    fetchPropertiesData();
  }, [fetchPropertiesData]);

  // Loading State
  if (loading && !chartData) {
    return <SkeletonLoader />;
  }

  // Error State
  if (error && !chartData) {
    return <ErrorState error={error} onRetry={fetchPropertiesData} />;
  }

  const maxValue =
    chartData?.datasets?.[0]?.data?.length > 0
      ? Math.max(...chartData.datasets[0].data)
      : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            📊 Properties Overview
          </h3>
          <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
        </div>
        <div className="flex flex-col gap-1.5 cursor-default">
          <span className="w-4 h-1 bg-gray-300 rounded-full" />
          <span className="w-4 h-1 bg-gray-300 rounded-full" />
          <span className="w-4 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px] sm:h-[300px] w-full">
        {chartData ? (
          <Bar data={chartData} options={getChartOptions(maxValue)} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {chartData && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Properties</p>
            <p className="text-lg font-bold text-gray-900">
              {chartData.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Peak Month</p>
            <p className="text-lg font-bold text-blue-600">
              {maxValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
