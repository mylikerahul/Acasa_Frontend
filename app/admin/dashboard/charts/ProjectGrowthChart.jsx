"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getAdminToken } from "../../../../utils/auth";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProjectGrowthChart() {
  // ✅ Local State (No Redux)
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch Growth Analytics
  const fetchGrowthData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAdminToken();

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/projects/analytics/growth`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const growthData = response.data.data || response.data.growth || [];
        setGrowth(growthData);
      } else {
        setGrowth([]);
      }
    } catch (err) {
      console.error("Error fetching growth data:", err);
      
      if (err.response?.status === 404) {
        // API doesn't exist - use empty data
        setGrowth([]);
      } else {
        setError(err.response?.data?.message || "Failed to load growth data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  // Prepare chart data
  const chartData = growth && growth.length > 0
    ? {
        labels: growth.map((item) => item.month_name || item.month),
        datasets: [
          {
            label: "New Projects",
            data: growth.map((item) => item.new_projects || item.count || 0),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Growth %",
            data: growth.map((item) => item.growth_percentage || item.growth || 0),
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.3,
            fill: false,
            yAxisID: "y1",
          },
        ],
      }
    : null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "New Projects",
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Growth %",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function (value) {
            return value + "%";
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.datasetIndex === 1) {
              label += context.parsed.y + "%";
            } else {
              label += context.parsed.y;
            }
            return label;
          },
        },
      },
    },
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur shadow-sm shadow-gray-100/70 p-4 sm:p-5">
        <div className="h-[250px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur shadow-sm shadow-gray-100/70 p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
          6-Month Project Growth
        </h3>
        <div className="h-[220px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchGrowthData}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur shadow-sm shadow-gray-100/70 p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
        6-Month Project Growth
      </h3>

      <div className="h-[220px]">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No growth data available
          </div>
        )}
      </div>

      {growth && growth.length > 0 && (
        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>
            Average Growth:{" "}
            {Math.round(
              growth.reduce(
                (sum, item) => sum + (item.growth_percentage || item.growth || 0),
                0
              ) / growth.length
            )}
            %
          </span>
          <span>
            Total New:{" "}
            {growth.reduce(
              (sum, item) => sum + (item.new_projects || item.count || 0),
              0
            )}
          </span>
        </div>
      )}
    </div>
  );
}