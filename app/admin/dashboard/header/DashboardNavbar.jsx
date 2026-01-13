"use client";

import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  X,
  Settings,
  User,
  Loader2,
  Shield,
  Bell,
  HelpCircle,
  ChevronRight,
  Activity,
  LayoutDashboard,
  Building,
  FolderKanban,
  MessageSquare,
  Handshake,
  FileText,
  Phone,
  MapPin,
  Users,
  Building2,
  Briefcase,
  Mail,
  Newspaper,
  Tags,
  Heart,
  BriefcaseBusiness,
  Map,
  MapPinned,
  Home,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../../utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== CONSTANTS ====================
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/admin/properties", icon: Building },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
  { name: "Deals", href: "/admin/deals", icon: Handshake },
  {
    name: "Contents",
    href: "/admin/contents",
    icon: FileText,
    hasDropdown: true,
    dropdownItems: [
      { name: "Blogs", href: "/admin/blogs", icon: Newspaper },
      { name: "Blog Categories", href: "/admin/blogs/categories", icon: Tags },
      { name: "Lifestyle", href: "/admin/lifestyle", icon: Heart },
      { name: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
    ],
  },
  { name: "Contacts", href: "/admin/contacts", icon: Phone },
  {
    name: "Location",
    href: "/admin/location",
    icon: MapPin,
    hasDropdown: true,
    dropdownItems: [
      { name: "Community", href: "/admin/communities", icon: Home },
      { name: "Sub Community", href: "/admin/sub-communities", icon: MapPinned },
      { name: "City/District", href: "/admin/cities", icon: Map },
    ],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    hasDropdown: true,
    dropdownItems: [
      { name: "All Users", href: "/admin/users", icon: Users },
      { name: "Agents", href: "/admin/agents", icon: Briefcase },
      { name: "Developers", href: "/admin/developers", icon: Building2 },
      { name: "Subscribers", href: "/admin/subscribers", icon: Mail },
    ],
  },
];

const PROFILE_MENU_ITEMS = [
  { name: "My Profile", href: "/admin/profile", icon: User },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "Help", href: "/admin/help", icon: HelpCircle },
];

// ==================== UTILITY FUNCTIONS ====================
const verifyTokenAPI = async (token, signal) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/admin/verify-token`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal,
  });
  if (!response.ok) throw new Error("Token invalid");
  return response.json();
};

// ==================== MEMOIZED SUB-COMPONENTS ====================
const NavLink = memo(function NavLink({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      prefetch={true}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "text-indigo-700 bg-indigo-50 font-medium"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{item.name}</span>
    </Link>
  );
});

const DropdownLink = memo(function DropdownLink({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      prefetch={true}
      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
        isActive
          ? "bg-indigo-50 text-indigo-700 font-medium"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4 opacity-70" />
      <span>{item.name}</span>
    </Link>
  );
});

const NavDropdown = memo(function NavDropdown({ 
  item, 
  isActive, 
  isOpen, 
  onToggle, 
  onLinkClick,
  checkActive 
}) {
  const Icon = item.icon;
  
  return (
    <div className="relative nav-dropdown">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? "text-indigo-700 bg-indigo-50 font-medium"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{item.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {item.dropdownItems.map((sub) => (
            <DropdownLink
              key={sub.href}
              item={sub}
              isActive={checkActive(sub.href)}
              onClick={onLinkClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const MobileNavLink = memo(function MobileNavLink({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      prefetch={true}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${
        isActive ? "text-indigo-700 bg-indigo-50 font-medium" : "text-gray-700"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{item.name}</span>
    </Link>
  );
});

const MobileDropdown = memo(function MobileDropdown({
  item,
  isActive,
  isOpen,
  onToggle,
  onLinkClick,
  checkActive,
}) {
  const Icon = item.icon;

  return (
    <div className="nav-dropdown">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg ${
          isActive ? "text-indigo-700 bg-indigo-50 font-medium" : "text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" />
          <span>{item.name}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      
      {isOpen && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-3">
          {item.dropdownItems.map((sub) => {
            const SubIcon = sub.icon;
            const subActive = checkActive(sub.href);
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onLinkClick}
                prefetch={true}
                className={`flex items-center gap-2 py-2 px-2 rounded ${
                  subActive ? "text-indigo-600 font-medium" : "text-gray-600"
                }`}
              >
                <SubIcon className="w-4 h-4 opacity-70" />
                <span>{sub.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

const ProfileSidebar = memo(function ProfileSidebar({
  isOpen,
  onClose,
  admin,
  profileImage,
  pathname,
  onLogout,
  logoutLoading,
}) {
  const router = useRouter();

  const handleNavigation = useCallback((href) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  if (!isOpen) return null;

  const adminInitial = admin?.name?.charAt(0)?.toUpperCase() || "A";
  const adminName = admin?.name || "Admin";
  const adminEmail = admin?.email || "admin@example.com";
  const adminRole = admin?.role || "Administrator";

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      <aside className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Account</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full bg-indigo-600 overflow-hidden flex-shrink-0">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={adminName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                  {adminInitial}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{adminName}</p>
              <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                <Shield className="w-3 h-3" />
                {adminRole}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {PROFILE_MENU_ITEMS.map((menuItem) => {
            const IconComponent = menuItem.icon;
            const isMenuActive = pathname === menuItem.href;
            return (
              <button
                key={menuItem.href}
                type="button"
                onClick={() => handleNavigation(menuItem.href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isMenuActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <IconComponent className="w-4 h-4 opacity-70" />
                <span>{menuItem.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {logoutLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="font-medium">
              {logoutLoading ? "Logging out..." : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
export default function AdminNavbar({
  admin,
  isAuthenticated,
  onLogout,
  logoutLoading,
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  const verificationRef = useRef(false);
  const abortControllerRef = useRef(null);

  // ==================== AUTH HANDLERS ====================
  const handleSessionExpired = useCallback(() => {
    toast.error("Session expired. Please login again.", {
      duration: 3000,
      position: "top-right",
    });
    logoutAll();
    router.replace("/admin/login");
  }, [router]);

  const verifyAuthToken = useCallback(async () => {
    if (verificationRef.current) return;
    verificationRef.current = true;

    try {
      const token = getAdminToken();
      
      if (!token || !isAdminTokenValid() || getCurrentSessionType() !== "admin") {
        setTokenValid(false);
        handleSessionExpired();
        return;
      }

      // Cancel previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await verifyTokenAPI(token, abortControllerRef.current.signal);
      
      if (response?.success || response?.valid || response?.data) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        handleSessionExpired();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Token verification error:", error);
        setTokenValid(false);
        handleSessionExpired();
      }
    } finally {
      verificationRef.current = false;
    }
  }, [handleSessionExpired]);

  // ==================== EFFECTS ====================
  // Token verification on mount and interval
  useEffect(() => {
    if (!isAuthenticated || !admin) return;

    verifyAuthToken();
    const interval = setInterval(verifyAuthToken, TOKEN_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [isAuthenticated, admin, verifyAuthToken]);

  // Verify on visibility change
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        verifyAuthToken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated, verifyAuthToken]);

  // Close menus on route change
  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Handle body scroll
  useEffect(() => {
    document.body.style.overflow = profileOpen || mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [profileOpen, mobileMenuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClick = (e) => {
      if (!e.target.closest(".nav-dropdown")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [activeDropdown]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ==================== MEMOIZED VALUES ====================
  const profileImage = useMemo(() => {
    const url = admin?.avatar || admin?.profileImage;
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }
    return null;
  }, [admin?.avatar, admin?.profileImage]);

  const adminInitial = useMemo(() => 
    admin?.name?.charAt(0)?.toUpperCase() || "A", [admin?.name]
  );

  // ==================== CALLBACKS ====================
  const isActive = useCallback((href) => {
    if (!href || !pathname) return false;
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }, [pathname]);

  const isDropdownActive = useCallback((item) => {
    if (!item || !pathname) return false;
    if (item.hasDropdown && item.dropdownItems) {
      return item.dropdownItems.some((sub) => pathname.startsWith(sub.href));
    }
    return pathname.startsWith(item.href);
  }, [pathname]);

  const handleDropdownToggle = useCallback((name, e) => {
    e?.stopPropagation();
    setActiveDropdown((prev) => (prev === name ? null : name));
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, []);

  const handleLogoutClick = useCallback(async () => {
    const toastId = toast.loading("Logging out...", { position: "top-right" });
    
    try {
      if (onLogout) {
        await onLogout();
      } else {
        const token = getAdminToken();
        await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
        
        logoutAll();
      }
      
      toast.dismiss(toastId);
      toast.success("Logged out successfully", { position: "top-right" });
      router.replace("/admin/login");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Logout failed", { position: "top-right" });
    }
  }, [onLogout, router]);

  // ==================== RENDER ====================
  if (!isAuthenticated || !admin || !tokenValid) {
    return <Toaster position="top-right" />;
  }

  return (
    <>
      <Toaster position="top-right" />

      <header className="w-full sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] h-14 flex items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/admin/dashboard"
            prefetch={true}
            className="flex items-center flex-shrink-0"
          >
            <Image
              src="/logo.svg"
              alt="Admin Logo"
              width={100}
              height={32}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 text-sm">
            {NAV_ITEMS.map((item) => {
              const active = isDropdownActive(item);

              if (item.hasDropdown) {
                return (
                  <NavDropdown
                    key={item.name}
                    item={item}
                    isActive={active}
                    isOpen={activeDropdown === item.name}
                    onToggle={(e) => handleDropdownToggle(item.name, e)}
                    onLinkClick={() => setActiveDropdown(null)}
                    checkActive={isActive}
                  />
                );
              }

              return (
                <NavLink
                  key={item.name}
                  item={item}
                  isActive={active}
                  onClick={() => {}}
                />
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative h-8 w-8 rounded-full bg-indigo-600 overflow-hidden flex-shrink-0">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={admin?.name || "Admin"}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-medium text-white">
                    {adminInitial}
                  </span>
                )}
              </div>
              <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-56px)] overflow-y-auto">
            <div className="px-3 py-2 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isDropdownActive(item);

                if (item.hasDropdown) {
                  return (
                    <MobileDropdown
                      key={item.name}
                      item={item}
                      isActive={active}
                      isOpen={activeDropdown === item.name}
                      onToggle={(e) => handleDropdownToggle(item.name, e)}
                      onLinkClick={closeMobileMenu}
                      checkActive={isActive}
                    />
                  );
                }

                return (
                  <MobileNavLink
                    key={item.name}
                    item={item}
                    isActive={active}
                    onClick={closeMobileMenu}
                  />
                );
              })}

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  disabled={logoutLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  {logoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{logoutLoading ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        admin={admin}
        profileImage={profileImage}
        pathname={pathname}
        onLogout={handleLogoutClick}
        logoutLoading={logoutLoading}
      />

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}