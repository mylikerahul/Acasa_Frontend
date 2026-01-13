"use client";

import { 
  Activity, 
  Users, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  Chrome,
  TrendingUp,
  Eye,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react";

export default function AnalyticsDashboard({ stats }) {
  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No analytics data available</p>
        <p className="text-sm mt-1">Start tracking events to see insights</p>
      </div>
    );
  }

  const { overview, eventsByType, deviceStats, browserStats, countryStats, popularPages } = stats;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={overview?.total_events || 0}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Unique Users"
          value={overview?.unique_users || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Sessions"
          value={overview?.total_sessions || 0}
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Avg Duration"
          value={formatDuration(overview?.avg_duration)}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Time-based Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview?.today_events || 0}</p>
          <p className="text-xs text-gray-500 mt-1">events tracked</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Last 7 Days</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview?.week_events || 0}</p>
          <p className="text-xs text-gray-500 mt-1">events tracked</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overview?.month_events || 0}</p>
          <p className="text-xs text-gray-500 mt-1">events tracked</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types */}
        {eventsByType && eventsByType.length > 0 && (
          <ChartCard title="Events by Type" icon={BarChart3}>
            <div className="space-y-2">
              {eventsByType.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-700 capitalize">
                      {item.event_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(item.count / eventsByType[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Device Stats */}
        {deviceStats && deviceStats.length > 0 && (
          <ChartCard title="Devices" icon={Monitor}>
            <div className="space-y-3">
              {deviceStats.map((device, index) => {
                const Icon = getDeviceIcon(device.device_type);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {device.device_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{device.percentage}%</span>
                      <span className="text-sm font-semibold text-gray-900">{device.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}

        {/* Browser Stats */}
        {browserStats && browserStats.length > 0 && (
          <ChartCard title="Browsers" icon={Chrome}>
            <div className="space-y-2">
              {browserStats.slice(0, 5).map((browser, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700">{browser.browser || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${browser.percentage}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {browser.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Country Stats */}
        {countryStats && countryStats.length > 0 && (
          <ChartCard title="Top Countries" icon={Globe}>
            <div className="space-y-2">
              {countryStats.slice(0, 5).map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-700">{country.country || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${country.percentage}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {country.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Popular Pages */}
      {popularPages && popularPages.length > 0 && (
        <ChartCard title="Popular Pages" icon={Eye}>
          <div className="space-y-3">
            {popularPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {page.page_title || 'Untitled Page'}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{page.page_url}</p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">{page.views}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600 bg-blue-500',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600 bg-green-500',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600 bg-purple-500',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600 bg-orange-500',
  };

  const [from, to, border, text, iconBg] = colors[color].split(' ');

  return (
    <div className={`bg-gradient-to-br ${from} ${to} rounded-lg p-4 border ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium ${text} uppercase tracking-wide`}>{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Helper Functions
function formatDuration(seconds) {
  if (!seconds) return "N/A";
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}s`;
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}m ${secs}s`;
}

function getDeviceIcon(deviceType) {
  const icons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };
  return icons[deviceType?.toLowerCase()] || Monitor;
}