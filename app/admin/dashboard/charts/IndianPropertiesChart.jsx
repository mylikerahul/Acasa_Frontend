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
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Chart options – same simple UI as InternationalProjectsChart
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
        font: { size: 11 },
        color: "#4b5563",
      },
    },
    tooltip: {
      mode: "index",
      intersect: false,
      backgroundColor: "#020617",
      borderColor: "#1f2937",
      borderWidth: 1,
      titleFont: { size: 11, weight: "600" },
      bodyFont: { size: 11 },
      padding: 8,
      cornerRadius: 6,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || "";
          if (label) label += ": ";
          label += `${context.parsed.y.toLocaleString()} properties`;
          return label;
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
      ticks: { font: { size: 11 }, color: "#6b7280" },
      border: { color: "#e5e7eb" },
    },
    y: {
      grid: { color: "#e5e7eb", drawBorder: false },
      ticks: {
        font: { size: 11 },
        color: "#6b7280",
        precision: 0,
        callback(value) {
          return value.toLocaleString();
        },
      },
      title: {
        display: true,
        text: "Record per Month (unit)",
        font: { size: 11 },
        color: "#6b7280",
      },
      suggestedMax: maxValue ? Math.ceil(maxValue * 1.2) : 10,
      beginAtZero: true,
    },
  },
});

export default function IndianPropertiesChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback: empty bar data
  const setFallbackData = () => {
    setChartData({
      labels: MONTHS,
      datasets: [
        {
          label: "Indian Properties",
          data: Array(12).fill(0),
          backgroundColor: "#1990ff",
          borderColor: "#1990ff",
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 26,
        },
      ],
    });
  };

  const fetchIndianPropertiesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAdminToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/properties/analytics/indian`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const data = response.data.data || response.data;

        // Case 1: structured analytics { byType: {type: {monthly:[]}}, months:[] }
        if (data && data.byType) {
          const labels = data.months || MONTHS;

          // Sum all property types per month into single series
          const monthlyTotals = labels.map((_, monthIndex) => {
            let total = 0;
            Object.values(data.byType).forEach((typeInfo) => {
              const arr = typeInfo.monthly || [];
              total += arr[monthIndex] || 0;
            });
            return total;
          });

          setChartData({
            labels,
            datasets: [
              {
                label: "Indian Properties",
                data: monthlyTotals,
                backgroundColor: "#1990ff",
                borderColor: "#1990ff",
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 26,
              },
            ],
          });
        }
        // Case 2: plain array of properties
        else if (Array.isArray(data)) {
          const monthlyCounts = Array(12).fill(0);
          data.forEach((property) => {
            const createdAt = new Date(
              property.created_at || property.createdAt || property.date
            );
            if (!isNaN(createdAt)) {
              const idx = createdAt.getMonth();
              monthlyCounts[idx] += 1;
            }
          });

          setChartData({
            labels: MONTHS,
            datasets: [
              {
                label: "Indian Properties",
                data: monthlyCounts,
                backgroundColor: "#1990ff",
                borderColor: "#1990ff",
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 26,
              },
            ],
          });
        } else {
          setFallbackData();
        }
      } else {
        setFallbackData();
      }
    } catch (err) {
      console.error("Error fetching Indian properties data:", err);
      if (err.response?.status !== 404) {
        setError(
          err.response?.data?.message || "Failed to load properties data"
        );
      }
      setFallbackData();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndianPropertiesData();
  }, [fetchIndianPropertiesData]);

  // Loading UI
  if (loading && !chartData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">
            Indian Properties from the last 12 month
          </h3>
        </div>

        <div className="h-[260px] sm:h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-gray-500">
              Loading chart data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error UI
  if (error && !chartData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">
            Indian Properties from the last 12 month
          </h3>
        </div>

        <div className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm text-gray-700 mb-1">
            Unable to load properties data
          </p>
          <p className="text-xs text-gray-500 mb-3">{error}</p>
          <button
            onClick={fetchIndianPropertiesData}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxValue =
    chartData &&
    chartData.datasets &&
    chartData.datasets.length > 0 &&
    chartData.datasets[0].data.length > 0
      ? Math.max(...chartData.datasets[0].data)
      : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      {/* Header same style as other chart card */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
          Indian Properties from the last 12 month
        </h3>
        <div className="flex flex-col gap-1 cursor-default">
          <span className="w-4 h-[2px] bg-gray-400 rounded" />
          <span className="w-4 h-[2px] bg-gray-400 rounded" />
          <span className="w-4 h-[2px] bg-gray-400 rounded" />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px] sm:h-[300px]">
        {chartData ? (
          <Bar data={chartData} options={getChartOptions(maxValue)} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}