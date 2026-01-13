"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Home,
  Building2,
  Newspaper,
  MapPin,
  Phone,
  MessageSquare,
  Users,
  UserCircle,
  Mail,
  FileCheck,
  FileText,
  TrendingUp,
  Heart,
  Briefcase,
  Inbox,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAdminToken } from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== ALL MODULES CONFIG WITH DUMMY DATA ====================
const STATS_CONFIG = [
  {
    id: "properties",
    label: "Properties",
    icon: Home,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    link: "/admin/properties",
    endpoint: "/api/v1/properties",
    dummyCount: 1923,
  },
  {
    id: "projects",
    label: "Projects",
    icon: Building2,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    link: "/admin/projects",
    endpoint: "/api/v1/projects",
    dummyCount: 707,
  },
  {
    id: "blogs",
    label: "Blogs",
    icon: Newspaper,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    link: "/admin/blogs",
    endpoint: "/api/v1/blogs/all",
    dummyCount: 384,
  },
  {
    id: "locations",
    label: "Locations",
    icon: MapPin,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    link: "/admin/locations",
    endpoint: "/api/v1/locations",
    dummyCount: 97,
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Phone,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-500",
    link: "/admin/contacts",
    endpoint: "/api/v1/contacts",
    dummyCount: 39415,
  },
  {
    id: "inquiries",
    label: "Inquiries",
    icon: MessageSquare,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    link: "/admin/inquiries",
    endpoint: "/api/v1/inquiries",
    dummyCount: 69421,
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    link: "/admin/users",
    endpoint: "/api/v1/users",
    dummyCount: 268,
  },
  {
    id: "agents",
    label: "Agents",
    icon: UserCircle,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    link: "/admin/agents",
    endpoint: "/api/v1/agents",
    dummyCount: 1,
  },
  {
    id: "subscribers",
    label: "Subscribers",
    icon: Mail,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    link: "/admin/subscribers",
    endpoint: "/api/v1/subscribers",
    dummyCount: 322,
  },
  {
    id: "leads",
    label: "Leads",
    icon: FileCheck,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    link: "/admin/leads",
    endpoint: "/api/v1/leads",
    dummyCount: 8,
  },
  {
    id: "pages",
    label: "Pages",
    icon: FileText,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-500",
    link: "/admin/pages",
    endpoint: "/api/v1/pages",
    dummyCount: 25,
  },
  {
    id: "deals",
    label: "Deals",
    icon: TrendingUp,
    iconBg: "bg-fuchsia-50",
    iconColor: "text-fuchsia-500",
    link: "/admin/deals",
    endpoint: "/api/v1/deals",
    dummyCount: 2,
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    icon: Heart,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    link: "/admin/lifestyle",
    endpoint: "/api/v1/lifestyle",
    dummyCount: 18,
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: Briefcase,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    link: "/admin/jobs",
    endpoint: "/api/v1/jobs",
    dummyCount: 6,
  },
  {
    id: "communities",
    label: "Communities",
    icon: MapPin,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    link: "/admin/communities",
    endpoint: "/api/v1/communities/all",
    dummyCount: 45,
  },
  {
    id: "agencies",
    label: "Agencies",
    icon: Building2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    link: "/admin/agencies",
    endpoint: "/api/v1/agency/all",
    dummyCount: 12,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: FileCheck,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    link: "/admin/tasks",
    endpoint: "/api/v1/tasks",
    dummyCount: 36,
  },
  {
    id: "notices",
    label: "Notices",
    icon: Inbox,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    link: "/admin/notices",
    endpoint: "/api/v1/notices",
    dummyCount: 4,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    link: "/admin/dashboard?tab=analytics",
    endpoint: "/api/v1/analytics/stats",
    countKey: "data.overview.total_events",
    dummyCount: 15420,
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    link: "/admin/dashboard?tab=activity",
    endpoint: "/api/v1/activity/stats",
    countKey: "data.overview.total",
    dummyCount: 8750,
  },
];

// ==================== EXTRACT COUNT HELPER ====================
const extractCount = (data, countKey) => {
  if (!data) return null;
  if (data.success === false) return null;

  // Custom countKey for nested responses
  if (countKey) {
    try {
      const keys = countKey.split(".");
      let value = data;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) break;
      }
      if (typeof value === "number") return value;
    } catch (err) {
      // Ignore
    }
  }

  // Standard patterns
  if (typeof data.total === "number") return data.total;
  if (typeof data.count === "number") return data.count;
  if (typeof data.totalCount === "number") return data.totalCount;

  if (data.data) {
    if (typeof data.data.total === "number") return data.data.total;
    if (typeof data.data.count === "number") return data.data.count;
    if (Array.isArray(data.data)) return data.data.length;

    if (data.data.overview) {
      if (typeof data.data.overview.total === "number") return data.data.overview.total;
      if (typeof data.data.overview.total_events === "number") return data.data.overview.total_events;
    }
  }

  if (Array.isArray(data)) return data.length;

  return null;
};

// ==================== STAT CARD COMPONENT ====================
const StatCard = ({ item, statData, onClick }) => {
  const Icon = item.icon;
  const count = statData?.count ?? item.dummyCount;
  const loading = statData?.loading ?? false;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 flex flex-col justify-between min-h-[110px] cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className={`w-5 h-5 ${item.iconColor}`} />
        </div>

        {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
      </div>

      <div className="mt-3">
        <p className="text-xs text-gray-500 font-medium">{item.label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-16 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
            {count.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function StatsGrid() {
  const router = useRouter();

  const [stats, setStats] = useState(() => {
    const initial = {};
    STATS_CONFIG.forEach((item) => {
      initial[item.id] = {
        count: item.dummyCount, // Start with dummy
        loading: true,
        isReal: false,
      };
    });
    return initial;
  });

  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch single stat
  const fetchStat = useCallback(async (item) => {
    try {
      const token = getAdminToken();

      if (!token) {
        // Use dummy data silently
        setStats((prev) => ({
          ...prev,
          [item.id]: { count: item.dummyCount, loading: false, isReal: false },
        }));
        return;
      }

      const response = await axios.get(`${API_BASE_URL}${item.endpoint}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      const count = extractCount(response.data, item.countKey);

      if (count !== null) {
        setStats((prev) => ({
          ...prev,
          [item.id]: { count, loading: false, isReal: true },
        }));
      } else {
        // Use dummy if can't extract count
        setStats((prev) => ({
          ...prev,
          [item.id]: { count: item.dummyCount, loading: false, isReal: false },
        }));
      }
    } catch (error) {
      // Silently use dummy data on error
      setStats((prev) => ({
        ...prev,
        [item.id]: { count: item.dummyCount, loading: false, isReal: false },
      }));
    }
  }, []);

  // Fetch all stats
  const fetchAllStats = useCallback(async () => {
    setIsRefreshing(true);

    // Set all to loading
    setStats((prev) => {
      const updated = { ...prev };
      STATS_CONFIG.forEach((item) => {
        updated[item.id] = { ...updated[item.id], loading: true };
      });
      return updated;
    });

    // Fetch in parallel batches
    const batchSize = 5;
    for (let i = 0; i < STATS_CONFIG.length; i += batchSize) {
      const batch = STATS_CONFIG.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((item) => fetchStat(item)));
    }

    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, [fetchStat]);

  // Initial fetch
  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAllStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllStats]);

  // Handle card click
  const handleCardClick = useCallback(
    (link) => {
      router.push(link);
    },
    [router]
  );

  // Calculate summary
  const summary = STATS_CONFIG.reduce(
    (acc, item) => {
      const stat = stats[item.id];
      acc.total += stat?.count ?? item.dummyCount;
      if (stat?.loading) acc.loading++;
      if (stat?.isReal) acc.realData++;
      return acc;
    },
    { total: 0, loading: 0, realData: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl px-6 py-5 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 md:gap-10">
            {/* Total Records */}
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Total Records
              </p>
              <p className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
                {summary.total.toLocaleString()}
              </p>
            </div>

            {/* Modules */}
            <div className="border-l border-gray-700 pl-6 md:pl-10">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Active Modules
              </p>
              <p className="text-3xl md:text-4xl font-bold text-green-400 tracking-tight mt-1">
                {STATS_CONFIG.length}
              </p>
            </div>

            {/* Live Data */}
            <div className="border-l border-gray-700 pl-6 md:pl-10">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Live Data
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-semibold text-lg">
                  {summary.realData}/{STATS_CONFIG.length}
                </span>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <p className="text-xs text-gray-500 hidden md:block">
                {lastUpdate.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={fetchAllStats}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {STATS_CONFIG.map((item) => (
          <StatCard
            key={item.id}
            item={item}
            statData={stats[item.id]}
            onClick={() => handleCardClick(item.link)}
          />
        ))}
      </div>
    </div>
  );
}