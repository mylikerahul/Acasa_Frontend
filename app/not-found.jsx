"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Home, 
  ArrowLeft, 
  Search,
  AlertTriangle,
  Shield,
  CreditCard,
  FileText,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Globe,
  Lock
} from "lucide-react";
import { useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRefresh = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Elements - Matching Payments Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-green-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-40 w-[400px] h-[400px] bg-amber-200/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-50"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-14 py-12 flex flex-col items-center justify-center min-h-screen">
        {/* Main Card */}
        <div className="w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header - Matching Payments Theme */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: '"Playfair Display", serif' }}>
                    404 - Page <span className="italic text-amber-400">Not Found</span>
                  </h1>
                  <p className="text-sm text-gray-300">The requested resource could not be located</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Secure Connection
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 md:p-10">
            <div className="flex flex-col lg:flex-row items-start gap-12">
              {/* Left - Large GIF Section */}
              <div className="flex-1">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="absolute -top-3 -left-3 px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">
                    ERROR 404
                  </div>
                  
                  {/* Large GIF Container */}
                  <div className="relative h-[400px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                    <div
                      className="w-full h-full bg-center bg-no-repeat bg-cover"
                      style={{
                        backgroundImage:
                          'url("https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif")',
                      }}
                    />
                    
                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <div className="flex items-center justify-between">
                        <div className="text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm font-medium">Page Not Available</span>
                          </div>
                          <p className="text-xs text-gray-300">
                            This animation illustrates the search for your missing page
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-white">Live Animation</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Below GIF */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl font-bold text-gray-800">404</div>
                      <div className="text-xs text-gray-500 mt-1">Error Code</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl font-bold text-gray-800">100%</div>
                      <div className="text-xs text-gray-500 mt-1">Secure</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl font-bold text-gray-800">24/7</div>
                      <div className="text-xs text-gray-500 mt-1">Support</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Text & Actions */}
              <div className="flex-1 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4 leading-tight">
                    Lost in the Digital Maze?
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      The page you're trying to reach seems to have wandered off. This could be due to:
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs mt-0.5">1</div>
                        <span>An outdated or broken link</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs mt-0.5">2</div>
                        <span>A typo in the URL address</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mt-0.5">3</div>
                        <span>The page has been moved or removed</span>
                      </li>
                    </ul>
                    <p className="text-sm text-gray-500 pt-2">
                      Don't worry, we'll help you find your way back!
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                    Quick Navigation
                  </h3>
                  
                  <div className="space-y-3">
                    <Link
                      href="/admin/payments"
                      className="group flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-semibold text-gray-800 group-hover:text-gray-900">
                            Payments Dashboard
                          </p>
                          <p className="text-sm text-gray-500">
                            Return to payment management
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-400 group-hover:text-gray-600">Click to navigate</div>
                      </div>
                    </Link>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={handleRefresh}
                        className="group flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-2 border-amber-200 hover:border-amber-300 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <RefreshCw className={`w-5 h-5 text-white ${isAnimating ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-amber-800 group-hover:text-amber-900">
                            Refresh Page
                          </p>
                          <p className="text-xs text-amber-600">
                            Try loading again
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ArrowLeft className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-blue-800 group-hover:text-blue-900">
                            Go Back
                          </p>
                          <p className="text-xs text-blue-600">
                            Previous page
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Support Section */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700">
                        Need Immediate Assistance?
                      </h4>
                      <p className="text-sm text-gray-500">
                        Our support team is available 24/7
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/admin/support"
                      className="inline-flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <Shield className="w-4 h-4" />
                      Contact Support
                    </Link>
                    <Link
                      href="/admin/docs"
                      className="inline-flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <FileText className="w-4 h-4" />
                      View Documentation
                    </Link>
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-3 px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <Home className="w-4 h-4" />
                      Admin Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/70">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Page Not Found Diagnostics
                  </p>
                  <p className="text-xs text-gray-500">
                    Check URL accuracy or contact system administrator for unresolved issues
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">
                  System Status: <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="text-xs text-gray-400">
                  Timestamp: {new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/admin/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-800 hover:underline transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="text-sm font-medium text-gray-600 hover:text-gray-800 hover:underline transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            User Management
          </Link>
          <Link
            href="/admin/projects"
            className="text-sm font-medium text-gray-600 hover:text-gray-800 hover:underline transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Projects
          </Link>
          <Link
            href="/admin/settings"
            className="text-sm font-medium text-gray-600 hover:text-gray-800 hover:underline transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Settings
          </Link>
          <Link
            href="/admin/analytics"
            className="text-sm font-medium text-gray-600 hover:text-gray-800 hover:underline transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}