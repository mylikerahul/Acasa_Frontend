// app/admin/dashboard/charts/ProjectsByCountryChart.js
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getProjectsCountryAnalytics } from "@/redux/actions/projectsAction";
import toast from "react-hot-toast";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProjectsByCountryChart() {
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const { analytics } = useSelector((state) => state.projects);
  const { byCountry, loading, error } = analytics;

  // Fetch country analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getProjectsCountryAnalytics()).unwrap();
      } catch (err) {
        console.error("Failed to fetch country analytics:", err);
        toast.error("Failed to load country data");
      }
    };

    fetchData();
  }, [dispatch]);

  // Prepare chart data
  const chartData = byCountry ? {
    labels: byCountry.map(item => item.country_name),
    datasets: [
      {
        label: 'Projects by Country',
        data: byCountry.map(item => item.project_count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(14, 165, 233)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} projects (${percentage}%)`;
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur shadow-sm shadow-gray-100/70 p-4 sm:p-5">
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-500">Loading country data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur shadow-sm shadow-gray-100/70 p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">
        Projects by Country
      </h3>
      
      <div className="h-[250px]">
        {chartData ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            {error ? 'Failed to load data' : 'No data available'}
          </div>
        )}
      </div>
      
      {byCountry && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Total countries: {byCountry.length} | Top: {byCountry[0]?.country_name || 'N/A'}
        </div>
      )}
    </div>
  );
}