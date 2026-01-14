// app/admin/dashboard/page.jsx - FIXED & OPTIMIZED

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  getAdminUser,
  setAdminUser,
  setAuthTimestamp,
} from "../../../utils/auth";

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
import AnalyticsDashboard from "./analytics/AnalyticsDashboard.jsx";
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
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingAnalyticsStats, setIsLoadingAnalyticsStats] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ============================================
  // REFS FOR SECURITY & PERFORMANCE
  // ============================================
  const isFetchingAnalytics = useRef(false);
  const isFetchingAnalyticsStats = useRef(false);
  const authCheckDone = useRef(false);
  const isRedirecting = useRef(false);
  const redirectTimeout = useRef(null);

  // ============================================
  // AXIOS CLIENT
  // ============================================
  const apiClient = useRef(
    axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      timeout: 15000,
    })
  );

  // ============================================
  // TOAST HELPER FUNCTIONS
  // ============================================
  const showSuccess = useCallback((message) => {
    toast.success(message, {
      duration: 3000,
      position: "top-right",
      style: {
        background: "#10B981",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10B981",
      },
    });
  }, []);

  const showError = useCallback((message) => {
    toast.error(message, {
      duration: 4000,
      position: "top-right",
      style: {
        background: "#EF4444",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#EF4444",
      },
    });
  }, []);

  const showLoadingToast = useCallback((message) => {
    return toast.loading(message, {
      position: "top-right",
    });
  }, []);

  // ============================================
  // LOAD DASHBOARD ANALYTICS
  // ============================================
  const loadDashboardAnalytics = useCallback(async (token) => {
    if (isFetchingAnalytics.current || !token) return;

    isFetchingAnalytics.current = true;
    setIsLoadingAnalytics(true);

    try {
      console.log("📊 Loading dashboard analytics...");

      const response = await apiClient.current.get(
        "/api/v1/dashboard/analytics",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response?.data?.data || response?.data || null;
      setDashboardAnalytics(data);

      console.log("✅ Dashboard analytics loaded");
    } catch (error) {
      console.error("❌ Dashboard analytics failed:", error.message);

      if (error.response?.status === 401) {
        showError("Session expired");
        clearAdminTokens();
        isRedirecting.current = true;
        redirectTimeout.current = setTimeout(() => {
          window.location.replace("/admin/login");
        }, 500);
      } else {
        console.warn("Failed to load dashboard analytics (non-critical)");
      }
    } finally {
      setIsLoadingAnalytics(false);
      isFetchingAnalytics.current = false;
    }
  }, [showError]);

  // ============================================
  // LOAD ANALYTICS STATS
  // ============================================
  const loadAnalyticsStats = useCallback(async (token) => {
    if (isFetchingAnalyticsStats.current || !token) return;

    isFetchingAnalyticsStats.current = true;
    setIsLoadingAnalyticsStats(true);

    try {
      console.log("📊 Loading analytics stats...");

      const response = await apiClient.current.get(
        "/api/v1/analytics/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAnalyticsStats(response.data.data);
        console.log("✅ Analytics stats loaded");
      }
    } catch (error) {
      console.error("❌ Analytics stats failed:", error.message);

      if (error.response?.status === 401) {
        showError("Session expired");
        clearAdminTokens();
        isRedirecting.current = true;
        redirectTimeout.current = setTimeout(() => {
          window.location.replace("/admin/login");
        }, 500);
      } else {
        console.warn("Failed to load analytics stats (non-critical)");
      }
    } finally {
      setIsLoadingAnalyticsStats(false);
      isFetchingAnalyticsStats.current = false;
    }
  }, [showError]);

  // ============================================
  // MAIN AUTH CHECK - RUNS ONCE
  // ============================================
  useEffect(() => {
    if (authCheckDone.current || isRedirecting.current) return;
    authCheckDone.current = true;

    const checkAuth = async () => {
      console.log("🔐 [DASHBOARD] Auth check starting...");

      try {
        const token = getAdminToken();

        // ❌ NO TOKEN
        if (!token) {
          console.log("❌ [DASHBOARD] No token found");
          setAuthLoading(false);
          isRedirecting.current = true;
          redirectTimeout.current = setTimeout(() => {
            window.location.replace("/admin/login");
          }, 100);
          return;
        }

        // ❌ TOKEN EXPIRED
        if (!isAdminTokenValid()) {
          console.log("❌ [DASHBOARD] Token expired");
          showError("Session expired. Please login again.");
          clearAdminTokens();
          setAuthLoading(false);
          isRedirecting.current = true;
          redirectTimeout.current = setTimeout(() => {
            window.location.replace("/admin/login");
          }, 500);
          return;
        }

        // ✅ DECODE TOKEN
        const decoded = decodeToken(token);
        console.log("🔐 [DASHBOARD] Token decoded:", {
          email: decoded?.email,
          usertype: decoded?.usertype,
        });

        if (!decoded?.id || !decoded?.email) {
          console.log("❌ [DASHBOARD] Invalid token payload");
          showError("Invalid session. Please login again.");
          clearAdminTokens();
          setAuthLoading(false);
          isRedirecting.current = true;
          redirectTimeout.current = setTimeout(() => {
            window.location.replace("/admin/login");
          }, 500);
          return;
        }

        // ✅ TRY TO GET FROM CACHE FIRST (INSTANT)
        let cachedUser = getAdminUser();
        if (cachedUser) {
          console.log("✅ [DASHBOARD] Using cached user");
          setAdmin({
            id: cachedUser.id,
            name: cachedUser.name,
            email: cachedUser.email,
            role: "admin",
            userType: cachedUser.usertype,
            avatar: cachedUser.image_icon,
          });
          setIsAuthenticated(true);
          setAuthLoading(false);
        } else {
          // FALLBACK TO TOKEN DATA
          console.log("⚠️ [DASHBOARD] No cached user, using token data");
          setAdmin({
            id: decoded.id,
            name: decoded.name || "Admin",
            email: decoded.email,
            role: "admin",
            userType: decoded.usertype,
          });
          setIsAuthenticated(true);
          setAuthLoading(false);
        }

        // ✅ VERIFY WITH BACKEND IN BACKGROUND (DON'T BLOCK UI)
        console.log("🔄 [DASHBOARD] Verifying with backend...");

        try {
          const verifyResponse = await apiClient.current.get(
            "/api/v1/users/admin/verify-token",
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000,
            }
          );

          if (verifyResponse.data.success && verifyResponse.data.admin) {
            const userData = verifyResponse.data.admin;
            console.log("✅ [DASHBOARD] Backend verified:", userData.email);

            // Update with fresh data
            setAdmin({
              id: userData.id,
              name: userData.full_name || userData.name,
              email: userData.email,
              role: "admin",
              userType: userData.usertype,
              avatar: userData.image_icon,
            });

            // Update cache
            setAdminUser(userData);
            setAuthTimestamp();
          }
        } catch (verifyError) {
          console.log(
            "⚠️ [DASHBOARD] Backend verify failed:",
            verifyError.message
          );

          // If 401, clear tokens and redirect
          if (verifyError.response?.status === 401) {
            clearAdminTokens();
            isRedirecting.current = true;
            redirectTimeout.current = setTimeout(() => {
              window.location.replace("/admin/login");
            }, 500);
            return;
          }

          // Otherwise, continue with cached/token data
        }

        // ✅ LOAD ANALYTICS DATA
        console.log("📊 [DASHBOARD] Loading analytics...");
        await Promise.all([
          loadDashboardAnalytics(token),
          loadAnalyticsStats(token),
        ]);

        console.log("✅ [DASHBOARD] Ready!");
      } catch (error) {
        console.error("❌ [DASHBOARD] Unexpected error:", error);
        showError("Authentication failed. Please login again.");
        clearAdminTokens();
        setAuthLoading(false);
        isRedirecting.current = true;
        redirectTimeout.current = setTimeout(() => {
          window.location.replace("/admin/login");
        }, 500);
      }
    };

    // Small delay for Next.js hydration
    setTimeout(checkAuth, 100);

    // Cleanup
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [loadDashboardAnalytics, loadAnalyticsStats, showError]);

  // ============================================
  // REFRESH ALL ANALYTICS
  // ============================================
  const refreshAllAnalytics = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      showError("Session expired");
      return;
    }

    if (isLoadingAnalytics || isLoadingAnalyticsStats) {
      toast.error("Already refreshing...");
      return;
    }

    const promises = [
      loadDashboardAnalytics(token),
      loadAnalyticsStats(token),
    ];
    await Promise.all(promises);
    showSuccess("Dashboard refreshed");
  }, [
    isLoadingAnalytics,
    isLoadingAnalyticsStats,
    loadDashboardAnalytics,
    loadAnalyticsStats,
    showError,
    showSuccess,
  ]);

  // ============================================
  // LOGOUT HANDLER
  // ============================================
  const handleLogout = useCallback(async () => {
    if (logoutLoading || isRedirecting.current) return;

    setLogoutLoading(true);
    const logoutToastId = showLoadingToast("Logging out...");

    try {
      const token = getAdminToken();

      // Try to call logout API
      if (token) {
        try {
          await apiClient.current.post(
            "/api/v1/users/logout",
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );
        } catch (err) {
          console.warn("Logout API error (continuing anyway):", err.message);
        }
      }

      // Clear all auth data
      clearAdminTokens();
      setAdmin(null);
      setIsAuthenticated(false);

      toast.dismiss(logoutToastId);
      showSuccess("Logged out successfully");

      // Redirect to login
      isRedirecting.current = true;
      redirectTimeout.current = setTimeout(() => {
        window.location.replace("/admin/login");
      }, 500);
    } catch (err) {
      console.error("❌ Logout error:", err);
      toast.dismiss(logoutToastId);
      showError("Logout failed. Please try again.");
      setLogoutLoading(false);
    }
  }, [logoutLoading, showLoadingToast, showSuccess, showError]);

  // ============================================
  // LOADING SCREEN
  // ============================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Loading Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Please wait while we initialize...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT AUTHENTICATED
  // ============================================
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Toaster />
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // ============================================
  // MAIN DASHBOARD
  // ============================================
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
            style: {
              background: "#10B981",
              fontWeight: "500",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#fff",
              secondary: "#EF4444",
            },
            style: {
              background: "#EF4444",
              fontWeight: "500",
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: "#3B82F6",
              color: "#fff",
              fontWeight: "500",
            },
          },
        }}
      />

      {/* NAVBAR */}
      <AdminNavbar
        admin={admin}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />

      {/* MAIN CONTENT */}
      <div className="min-h-screen bg-gray-100 pt-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {/* DASHBOARD HEADER */}
          <DashboardHeader
            admin={admin}
            isLoadingAnalytics={isLoadingAnalytics || isLoadingAnalyticsStats}
            refreshAnalytics={refreshAllAnalytics}
            handleLogout={handleLogout}
            logoutLoading={logoutLoading}
          />

          {/* TABS NAVIGATION */}
          <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* TAB CONTENT */}
          <TabContent
            activeTab={activeTab}
            analytics={dashboardAnalytics}
            analyticsStats={analyticsStats}
            isLoadingAnalyticsStats={isLoadingAnalyticsStats}
          />

          {/* FOOTER */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Admin Dashboard · Manage your platform efficiently
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================
// SUB COMPONENTS
// ============================================

/**
 * Dashboard Header Component
 */
function DashboardHeader({
  admin,
  isLoadingAnalytics,
  refreshAnalytics,
  handleLogout,
  logoutLoading,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8 border-b border-gray-200 pb-4">
      {/* LEFT SIDE - TITLE & INFO */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          {isLoadingAnalytics && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back,{" "}
          <span className="font-semibold text-gray-900">{admin.name}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
            🟢 Online
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            Role: {admin.role}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            {admin.email}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE - ACTIONS */}
      <div className="flex items-center gap-3">
        {/* DateTime Info */}
        <div className="hidden md:flex flex-col items-end text-xs text-gray-600 border-r border-gray-300 pr-4">
          <div className="flex items-center gap-1.5 font-semibold text-gray-800">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-1 font-semibold text-gray-800">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshAnalytics}
          disabled={isLoadingAnalytics}
          className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 
            rounded-lg hover:bg-gray-50 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            inline-flex items-center gap-2 transition-all duration-200"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingAnalytics ? "animate-spin" : ""}`}
          />
          Refresh
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="px-4 py-2 text-sm font-semibold text-white 
            bg-red-500 hover:bg-red-600 rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            inline-flex items-center gap-2 transition-all duration-200 
            active:scale-95 shadow-md hover:shadow-lg"
        >
          {logoutLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              Logout
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Tabs Navigation Component
 */
function TabsNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg mb-6 p-2 flex flex-wrap gap-2 shadow-sm">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-gray-900 text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Tab Content Router
 */
function TabContent({
  activeTab,
  analytics,
  analyticsStats,
  isLoadingAnalyticsStats,
}) {
  const tabs = {
    overview: <OverviewTab analyticsStats={analyticsStats} />,
    analytics: (
      <AnalyticsTab
        analytics={analytics}
        analyticsStats={analyticsStats}
        isLoadingAnalyticsStats={isLoadingAnalyticsStats}
      />
    ),
    users: <UsersTab />,
    properties: <PropertiesTab />,
    projects: <ProjectsTab />,
  };

  return tabs[activeTab] || <OverviewTab analyticsStats={analyticsStats} />;
}

/**
 * Overview Tab
 */
function OverviewTab({ analyticsStats }) {
  return (
    <>
      <DashboardSection
        title="Quick Stats"
        description="Real-time overview of your platform"
        icon={Activity}
        headerRight={
          <span className="text-xs text-gray-400">
            Last updated{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
          <DashboardSection
            title="Task Manager"
            description="Track your daily activities"
            icon={Activity}
          >
            <TaskManager />
          </DashboardSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardSection
              title="International Properties"
              description="Properties worldwide"
              icon={Globe}
              compact
            >
              <InternationalPropertiesChart />
            </DashboardSection>
            <DashboardSection
              title="Indian Properties"
              description="Properties across India"
              icon={MapPin}
              compact
            >
              <IndianPropertiesChart />
            </DashboardSection>
          </div>
        </div>

        <div className="space-y-6">
          <DashboardSection
            title="Recent Activity"
            description="Latest events"
            icon={Activity}
          >
            <RecentActivity />
          </DashboardSection>
          <DashboardSection
            title="Notice Board"
            description="Important announcements"
            icon={Activity}
          >
            <NoticeBoard />
          </DashboardSection>
        </div>
      </div>
    </>
  );
}

/**
 * Analytics Tab
 */
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
        ) : analyticsStats ? (
          <AnalyticsDashboard stats={analyticsStats} />
        ) : (
          <div className="text-center py-8 text-gray-400">
            No analytics data available
          </div>
        )}
      </DashboardSection>

      {/* Project Growth */}
      <DashboardSection
        title="Project Growth"
        description="Track project development over time"
        icon={TrendingUp}
      >
        {analytics ? (
          <ProjectGrowthChart data={analytics?.projectGrowth} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>No project growth data</p>
          </div>
        )}
      </DashboardSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardSection
          title="International Projects"
          description="Global project distribution"
          icon={Globe}
        >
          {analytics ? (
            <InternationalProjectsChart data={analytics?.internationalProjects} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No international projects data</p>
            </div>
          )}
        </DashboardSection>
        <DashboardSection
          title="Property Analytics"
          description="Detailed property insights"
          icon={Building2}
        >
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

/**
 * Users Tab
 */
function UsersTab() {
  return (
    <DashboardSection
      title="User Analytics"
      description="Detailed user insights and statistics"
      icon={Users}
    >
      <UserAnalyticsChart />
    </DashboardSection>
  );
}

/**
 * Properties Tab
 */
function PropertiesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DashboardSection
        title="International Properties"
        description="Properties worldwide"
        icon={Globe}
      >
        <InternationalPropertiesChart />
      </DashboardSection>
      <DashboardSection
        title="Indian Properties"
        description="Properties across India"
        icon={MapPin}
      >
        <IndianPropertiesChart />
      </DashboardSection>
    </div>
  );
}

/**
 * Projects Tab
 */
function ProjectsTab() {
  return (
    <div className="space-y-6">
      <DashboardSection
        title="Project Growth"
        description="Track project development over time"
        icon={TrendingUp}
      >
        <ProjectGrowthChart />
      </DashboardSection>
      <DashboardSection
        title="International Projects"
        description="Global project distribution"
        icon={Globe}
      >
        <InternationalProjectsChart />
      </DashboardSection>
    </div>
  );
}

/**
 * Analytics Overview Widget Component
 */
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
      {/* Total Events */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Total Events
            </p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {(overview.total_events || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Unique Users */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest">
              Unique Users
            </p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {(overview.unique_users || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">
              Sessions
            </p>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {(overview.total_sessions || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Today Events */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Today
            </p>
            <p className="text-2xl font-bold text-orange-900 mt-2">
              {(overview.today_events || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}