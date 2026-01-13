// DashboardPage.jsx - With Analytics Integration
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import {
  RefreshCw,
  LogOut,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  Loader2,
  Building2,
  Globe,
  MapPin,
  Activity,
} from "lucide-react";

import {
  getAdminToken,
  isAdminTokenValid,
  clearAdminTokens,
  decodeToken,
} from "../../../utils/auth.js";

// Components
import AdminNavbar from "./header/DashboardNavbar";
import StatsGrid from "./stats/StatsGrid";
import TaskManager from "./task-manager/TaskManager";
import RecentActivity from "./recent-activity/RecentActivity";
import NoticeBoard from "./noticeboard/NoticeBoard";
import InternationalPropertiesChart from "./charts/InternationalPropertiesChart";
import InternationalProjectsChart from "./charts/InternationalProjectsChart";
import IndianPropertiesChart from "./charts/IndianPropertiesChart";
import ProjectGrowthChart from "./charts/ProjectGrowthChart";
import UserAnalyticsChart from "./charts/UserDetail";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard.jsx"; // New Analytics Component
import DashboardSection from "./layout/DashboardSection";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "users", label: "User Analytics" },
  { id: "properties", label: "Properties" },
  { id: "projects", label: "Projects" },
];

export default function DashboardPage() {
  const router = useRouter();

  // States
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingAnalyticsStats, setIsLoadingAnalyticsStats] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Refs
  const isFetchingAnalytics = useRef(false);
  const isFetchingAnalyticsStats = useRef(false);
  const authCheckDone = useRef(false);

  // Create axios instance
  const apiClient = useRef(
    axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
    })
  );

  // Toast Helper Functions
  const showSuccess = (message) => {
    toast.success(message, {
      duration: 3000,
      position: "top-right",
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    });
  };

  const showError = (message) => {
    toast.error(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: '#EF4444',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    });
  };

  const showLoadingToast = (message) => {
    return toast.loading(message, {
      position: "top-right",
    });
  };

  // Load dashboard analytics function
  const loadDashboardAnalytics = useCallback(async () => {
    if (isFetchingAnalytics.current) return;

    isFetchingAnalytics.current = true;
    setIsLoadingAnalytics(true);

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await apiClient.current.get("/api/v1/dashboard/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDashboardAnalytics(response?.data?.data || response?.data || null);
    } catch (error) {
      console.error("Dashboard analytics fetch failed:", error);

      if (error.response?.status === 401) {
        showError("Session expired");
        clearAdminTokens();
        window.location.href = "/admin/login";
      } else {
        showError("Failed to load dashboard analytics.");
      }
    } finally {
      setIsLoadingAnalytics(false);
      isFetchingAnalytics.current = false;
    }
  }, []);

  // Load analytics stats function (NEW)
  const loadAnalyticsStats = useCallback(async () => {
    if (isFetchingAnalyticsStats.current) return;

    isFetchingAnalyticsStats.current = true;
    setIsLoadingAnalyticsStats(true);

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await apiClient.current.get("/api/v1/analytics/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAnalyticsStats(response.data.data);
      }
    } catch (error) {
      console.error("Analytics stats fetch failed:", error);

      if (error.response?.status === 401) {
        showError("Session expired");
        clearAdminTokens();
        window.location.href = "/admin/login";
      } else {
        console.error("Failed to load analytics stats:", error.message);
      }
    } finally {
      setIsLoadingAnalyticsStats(false);
      isFetchingAnalyticsStats.current = false;
    }
  }, []);

  // Main auth check - runs once on mount
  useEffect(() => {
    if (authCheckDone.current) return;
    authCheckDone.current = true;

    const checkAuth = async () => {
      console.log("🔐 Dashboard: Starting auth check...");

      try {
        const token = getAdminToken();
        console.log("🔐 Token exists:", !!token);

        if (!token) {
          console.log("❌ No token found");
          setAuthLoading(false);
          router.replace("/admin/login");
          return;
        }

        if (!isAdminTokenValid()) {
          console.log("❌ Token expired");
          showError("Session expired. Please login again.");
          clearAdminTokens();
          setAuthLoading(false);
          router.replace("/admin/login");
          return;
        }

        const decoded = decodeToken(token);
        console.log("🔐 Token decoded:", { email: decoded?.email, usertype: decoded?.usertype });

        if (!decoded || !decoded.id) {
          console.log("❌ Invalid token payload");
          showError("Invalid session. Please login again.");
          clearAdminTokens();
          setAuthLoading(false);
          router.replace("/admin/login");
          return;
        }

        try {
          console.log("🔄 Verifying with backend...");

          const response = await apiClient.current.get("/api/v1/users/admin/verify-token", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.data.success) {
            throw new Error("Verification failed by backend");
          }

          const userData = response.data.admin;
          console.log("✅ Backend verified:", userData.email);

          setAdmin({
            id: userData.id,
            name: userData.full_name || userData.name,
            email: userData.email,
            role: "admin",
            userType: userData.usertype,
            avatar: userData.image_icon,
          });

        } catch (verifyError) {
          console.log("⚠️ Backend verify failed, falling back to token data:", verifyError.message);
          setAdmin({
            id: decoded.id,
            name: decoded.name || "Admin",
            email: decoded.email,
            role: "admin",
            userType: decoded.usertype,
          });
        }

        setIsAuthenticated(true);
        setAuthLoading(false);

        console.log("✅ Auth successful, loading data...");
        loadDashboardAnalytics();
        loadAnalyticsStats();

      } catch (error) {
        console.error("❌ Auth check error:", error);
        showError("Authentication failed. Please login again.");
        clearAdminTokens();
        setAuthLoading(false);
        router.replace("/admin/login");
      }
    };

    setTimeout(checkAuth, 100);
  }, [loadDashboardAnalytics, loadAnalyticsStats, router]);

  // Refresh all analytics
  const refreshAllAnalytics = useCallback(async () => {
    if (isLoadingAnalytics || isLoadingAnalyticsStats) {
      toast.error("Already refreshing...");
      return;
    }

    const promises = [loadDashboardAnalytics(), loadAnalyticsStats()];
    await Promise.all(promises);
    showSuccess("Dashboard refreshed");
  }, [isLoadingAnalytics, isLoadingAnalyticsStats, loadDashboardAnalytics, loadAnalyticsStats]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    if (logoutLoading) return;

    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();
      if (token) {
        await apiClient.current.post("/api/v1/users/logout", {}, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Logout API error:", err);
      showError("Logout failed. Please try again.");
    } finally {
      toast.dismiss(logoutToastId);
      clearAdminTokens();
      showSuccess("Logged out successfully");
      router.replace("/admin/login");
      setLogoutLoading(false);
    }
  }, [logoutLoading, router]);

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
            style: {
              background: '#10B981',
              fontWeight: '500',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
            style: {
              background: '#EF4444',
              fontWeight: '500',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: '#3B82F6',
              color: '#fff',
              fontWeight: '500',
            },
          },
        }}
      />

      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <DashboardHeader
            admin={admin}
            isLoadingAnalytics={isLoadingAnalytics || isLoadingAnalyticsStats}
            refreshAnalytics={refreshAllAnalytics}
            handleLogout={handleLogout}
            logoutLoading={logoutLoading}
          />

          <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <TabContent 
            activeTab={activeTab} 
            analytics={dashboardAnalytics}
            analyticsStats={analyticsStats}
            isLoadingAnalyticsStats={isLoadingAnalyticsStats}
          />

          <p className="text-center text-xs text-gray-400 mt-8">
            Admin Dashboard · Manage your platform efficiently
          </p>
        </div>
      </div>
    </>
  );
}

// ========== Sub Components ==========

function DashboardHeader({ admin, isLoadingAnalytics, refreshAnalytics, handleLogout, logoutLoading }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8 border-b border-gray-200 pb-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
          {isLoadingAnalytics && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back <span className="font-medium text-gray-900">{admin.name}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">Online</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Role: {admin.role}</span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">{admin.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end text-xs text-gray-500 mr-1">
          <div className="flex items-center gap-1 font-medium text-gray-700">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        <button
          onClick={refreshAnalytics}
          disabled={isLoadingAnalytics}
          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Logout
        </button>
      </div>
    </div>
  );
}

function TabsNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg mb-6 p-1 flex flex-wrap gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabContent({ activeTab, analytics, analyticsStats, isLoadingAnalyticsStats }) {
  const tabs = {
    overview: <OverviewTab analyticsStats={analyticsStats} />,
    analytics: <AnalyticsTab analytics={analytics} analyticsStats={analyticsStats} isLoadingAnalyticsStats={isLoadingAnalyticsStats} />,
    users: <UsersTab />,
    properties: <PropertiesTab />,
    projects: <ProjectsTab />,
  };
  return tabs[activeTab] || <OverviewTab analyticsStats={analyticsStats} />;
}

function OverviewTab({ analyticsStats }) {
  return (
    <>
      <DashboardSection
        title="Quick Stats"
        description="Real-time overview of your platform"
        icon={Activity}
        headerRight={
          <span className="text-xs text-gray-400">
            Last updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        }
      >
        <StatsGrid />
      </DashboardSection>

      {/* Analytics Overview Widget */}
      {analyticsStats && (
        <DashboardSection
          title="Analytics Overview"
          description="Quick insights from analytics"
          icon={BarChart3}
          className="mt-6"
        >
          <AnalyticsOverviewWidget stats={analyticsStats} />
        </DashboardSection>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardSection title="Task Manager" description="Track your daily activities" icon={Activity}>
            <TaskManager />
          </DashboardSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardSection title="International Properties" description="Properties worldwide" icon={Globe} compact>
              <InternationalPropertiesChart />
            </DashboardSection>
            <DashboardSection title="Indian Properties" description="Properties across India" icon={MapPin} compact>
              <IndianPropertiesChart />
            </DashboardSection>
          </div>
        </div>

        <div className="space-y-6">
          <DashboardSection title="Recent Activity" description="Latest events" icon={Activity}>
            <RecentActivity />
          </DashboardSection>
          <DashboardSection title="Notice Board" description="Important announcements" icon={Activity}>
            <NoticeBoard />
          </DashboardSection>
        </div>
      </div>
    </>
  );
}

function AnalyticsTab({ analytics, analyticsStats, isLoadingAnalyticsStats }) {
  return (
    <div className="space-y-6">
      {/* Full Analytics Dashboard */}
      <DashboardSection 
        title="Analytics Dashboard" 
        description="Comprehensive analytics and insights" 
        icon={BarChart3}
      >
        {isLoadingAnalyticsStats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <AnalyticsDashboard stats={analyticsStats} />
        )}
      </DashboardSection>

      {/* Project Growth */}
      <DashboardSection title="Project Growth" description="Track project development over time" icon={TrendingUp}>
        <ProjectGrowthChart data={analytics?.projectGrowth} />
      </DashboardSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardSection title="International Projects" description="Global project distribution" icon={Globe}>
          <InternationalProjectsChart data={analytics?.internationalProjects} />
        </DashboardSection>
        <DashboardSection title="Property Analytics" description="Detailed property insights" icon={Building2}>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Property analytics chart</p>
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <DashboardSection title="User Analytics" description="Detailed user insights and statistics" icon={Users}>
      <UserAnalyticsChart />
    </DashboardSection>
  );
}

function PropertiesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DashboardSection title="International Properties" description="Properties worldwide" icon={Globe}>
        <InternationalPropertiesChart />
      </DashboardSection>
      <DashboardSection title="Indian Properties" description="Properties across India" icon={MapPin}>
        <IndianPropertiesChart />
      </DashboardSection>
    </div>
  );
}

function ProjectsTab() {
  return (
    <div className="space-y-6">
      <DashboardSection title="Project Growth" description="Track project development over time" icon={TrendingUp}>
        <ProjectGrowthChart />
      </DashboardSection>
      <DashboardSection title="International Projects" description="Global project distribution" icon={Globe}>
        <InternationalProjectsChart />
      </DashboardSection>
    </div>
  );
}

// ========== Analytics Overview Widget Component ==========
function AnalyticsOverviewWidget({ stats }) {
  if (!stats?.overview) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No analytics data available</p>
      </div>
    );
  }

  const { overview } = stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Events</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{overview.total_events || 0}</p>
          </div>
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Unique Users</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{overview.unique_users || 0}</p>
          </div>
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Sessions</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{overview.total_sessions || 0}</p>
          </div>
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Today</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{overview.today_events || 0}</p>
          </div>
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}