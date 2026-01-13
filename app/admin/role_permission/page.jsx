"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  RotateCcw,
  Loader2,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAdminToken,
  isAdminTokenValid,
  getCurrentSessionType,
  logoutAll,
} from "../../../utils/auth";
import AdminNavbar from "../dashboard/header/DashboardNavbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ==================== ADMIN ROLE CONSTANT ====================
const ADMIN_ROLE = "admin";

// ==================== TOAST HELPERS ====================
const showSuccess = (message) => toast.success(message);
const showError = (message) => toast.error(message);
const showWarning = (message) => toast.warning(message);
const showInfo = (message) => toast.info(message);

// ==================== API FUNCTIONS ====================

const verifyToken = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Token verification failed");
  }

  return response.json();
};

const fetchPermissionsAPI = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/permissions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch permissions");
  }

  return response.json();
};

const savePermissionsAPI = async (token, permissions) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/permissions`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ permissions }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to save permissions");
  }

  return response.json();
};

const resetPermissionsAPI = async (token, roleId = null) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/permissions/reset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ roleId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to reset permissions");
  }

  return response.json();
};

// ==================== STYLES ====================

const btnPrimary =
  "h-9 px-5 rounded-md bg-[#0d6efd] text-white text-[13px] font-medium hover:bg-[#0b5ed7] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200";

const btnSecondary =
  "h-9 px-5 rounded-md border border-gray-300 bg-white text-[13px] text-slate-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200";

const btnDanger =
  "h-9 px-5 rounded-md bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200";

// ==================== MAIN COMPONENT ====================

export default function RolePermissionPage() {
  // Auth State
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Permissions State
  const [permissions, setPermissions] = useState({});
  const [originalPermissions, setOriginalPermissions] = useState({});
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // ==================== AUTH FUNCTIONS ====================

  const handleAuthFailure = useCallback(() => {
    logoutAll();
    setAdmin(null);
    setIsAuthenticated(false);
    setAuthLoading(false);
    window.location.href = "/admin/login";
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const sessionType = getCurrentSessionType();

      if (sessionType !== "admin") {
        showError(sessionType === "user" 
          ? "Please login as admin to access this dashboard" 
          : "Please login to access dashboard"
        );
        handleAuthFailure();
        return;
      }

      const token = getAdminToken();

      if (!token) {
        showError("Please login to access dashboard");
        handleAuthFailure();
        return;
      }

      if (!isAdminTokenValid()) {
        showError("Session expired. Please login again.");
        handleAuthFailure();
        return;
      }

      try {
        await verifyToken(token);
      } catch (verifyError) {
        if (verifyError.message?.includes("401")) {
          showError("Session expired. Please login again.");
          handleAuthFailure();
          return;
        }
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.userType !== "admin") {
          showError("Invalid session type. Please login as admin.");
          handleAuthFailure();
          return;
        }

        setAdmin({
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role || ADMIN_ROLE,
          userType: payload.userType,
        });
        setCurrentUserRole(payload.role || ADMIN_ROLE);
        setIsAuthenticated(true);
        setAuthLoading(false);
      } catch (e) {
        showError("Invalid session. Please login again.");
        handleAuthFailure();
      }
    } catch (error) {
      showError("Authentication failed. Please login again.");
      handleAuthFailure();
    }
  }, [handleAuthFailure]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const token = getAdminToken();
      await fetch(`${API_BASE_URL}/api/v1/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      }).catch(() => {});
    } finally {
      logoutAll();
      setAdmin(null);
      setIsAuthenticated(false);
      showSuccess("Logged out successfully");
      setTimeout(() => window.location.href = "/admin/login", 1000);
      setLogoutLoading(false);
    }
  }, []);

  // ==================== EFFECTS ====================

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) loadPermissions();
  }, [isAuthenticated]);

  useEffect(() => {
    setIsDirty(JSON.stringify(permissions) !== JSON.stringify(originalPermissions));
  }, [permissions, originalPermissions]);

  // ==================== LOAD PERMISSIONS ====================

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        throw new Error("Please login to access this page");
      }

      const data = await fetchPermissionsAPI(token);

      if (data.success) {
        setPermissions(data.permissions || {});
        setOriginalPermissions(data.permissions || {});
        setRoles(data.roles || []);
        setModules(data.modules || []);
        setActions(data.actions || ["create", "view", "update", "delete"]);
      } else {
        throw new Error(data.message || "Failed to load permissions");
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== PERMISSION HANDLERS ====================

  const isUserAdmin = currentUserRole === ADMIN_ROLE;

  const handleToggle = (roleId, moduleId, action) => {
    if (roleId === ADMIN_ROLE) {
      showWarning("Admin permissions cannot be modified");
      return;
    }

    if (!isUserAdmin) {
      showError("Only admin can modify permissions");
      return;
    }

    setPermissions((prev) => {
      const newPermissions = JSON.parse(JSON.stringify(prev));

      if (!newPermissions[roleId]) newPermissions[roleId] = {};
      if (!newPermissions[roleId][moduleId]) {
        newPermissions[roleId][moduleId] = { create: false, view: false, update: false, delete: false };
      }

      newPermissions[roleId][moduleId][action] = !newPermissions[roleId][moduleId][action];
      return newPermissions;
    });
  };

  const handleSave = async () => {
    if (!isUserAdmin) {
      showError("Only admin can save permissions");
      return;
    }

    setSaving(true);
    try {
      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        throw new Error("Session expired. Please login again.");
      }

      const data = await savePermissionsAPI(token, permissions);

      if (data.success) {
        setOriginalPermissions(data.permissions || permissions);
        setIsDirty(false);
        showSuccess("Permissions saved successfully!");
      } else {
        throw new Error(data.message || "Failed to save permissions");
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setIsDirty(false);
    showInfo("Changes discarded");
  };

  const handleResetAll = async () => {
    if (!isUserAdmin) {
      showError("Only admin can reset permissions");
      return;
    }

    if (!confirm("Are you sure you want to reset ALL permissions? This cannot be undone.")) {
      return;
    }

    setResetting(true);
    try {
      const token = getAdminToken();
      if (!token || !isAdminTokenValid()) {
        throw new Error("Session expired. Please login again.");
      }

      const data = await resetPermissionsAPI(token);

      if (data.success) {
        await loadPermissions();
        showSuccess("All permissions reset successfully!");
      } else {
        throw new Error(data.message || "Failed to reset permissions");
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleToggleAllForRole = (roleId, enable) => {
    if (roleId === ADMIN_ROLE) {
      showWarning("Admin permissions cannot be modified");
      return;
    }

    if (!isUserAdmin) {
      showError("Only admin can modify permissions");
      return;
    }

    setPermissions((prev) => {
      const newPermissions = JSON.parse(JSON.stringify(prev));
      if (!newPermissions[roleId]) newPermissions[roleId] = {};

      modules.forEach((mod) => {
        newPermissions[roleId][mod.id] = { create: enable, view: enable, update: enable, delete: enable };
      });

      return newPermissions;
    });

    showInfo(`All permissions ${enable ? "enabled" : "disabled"} for this role`);
  };

  const handleToggleAllForModule = (moduleId, enable) => {
    if (!isUserAdmin) {
      showError("Only admin can modify permissions");
      return;
    }

    setPermissions((prev) => {
      const newPermissions = JSON.parse(JSON.stringify(prev));

      roles.forEach((role) => {
        if (role.id === ADMIN_ROLE) return; // Skip admin

        if (!newPermissions[role.id]) newPermissions[role.id] = {};
        newPermissions[role.id][moduleId] = { create: enable, view: enable, update: enable, delete: enable };
      });

      return newPermissions;
    });

    showInfo(`All permissions ${enable ? "enabled" : "disabled"} for this module`);
  };

  const handleResetRole = async (roleId) => {
    if (roleId === ADMIN_ROLE) {
      showWarning("Admin permissions cannot be reset");
      return;
    }

    if (!isUserAdmin) {
      showError("Only admin can reset permissions");
      return;
    }

    if (!confirm("Reset all permissions for this role?")) return;

    try {
      const token = getAdminToken();
      const data = await resetPermissionsAPI(token, roleId);

      if (data.success) {
        await loadPermissions();
        showSuccess("Role permissions reset successfully!");
      }
    } catch (err) {
      showError(err.message);
    }
  };

  // ==================== RENDER ====================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Verifying authentication...</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  if (loading) {
    return (
      <>
        <ToastContainer />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading permissions...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && Object.keys(permissions).length === 0) {
    return (
      <>
        <ToastContainer />
        <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Permissions</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={loadPermissions} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable theme="light" />

      <AdminNavbar admin={admin} isAuthenticated={isAuthenticated} onLogout={handleLogout} logoutLoading={logoutLoading} />

      <div className="min-h-screen bg-[#f5f5f5] pt-4">
        <div className="max-w-[1400px] mx-auto px-4 pb-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-[22px] font-semibold text-slate-800">Role Permissions</h1>
                <p className="text-sm text-gray-500">Manage access control for different user roles</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-gray-100 rounded-md text-sm">
                <span className="text-gray-500">Your role: </span>
                <span className={`font-medium ${isUserAdmin ? "text-green-600" : "text-blue-600"}`}>
                  {currentUserRole}
                </span>
              </div>

              <button onClick={loadPermissions} disabled={loading} className={btnSecondary}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>

              {isUserAdmin && (
                <button onClick={handleSave} disabled={!isDirty || saving} className={btnPrimary}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </div>

          {/* Not Admin Warning */}
          {!isUserAdmin && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">You can only view permissions. Only Admin can modify them.</span>
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {isDirty && isUserAdmin && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
              <button onClick={handleDiscardChanges} className="text-sm text-yellow-700 hover:text-yellow-900 underline">
                Discard changes
              </button>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <PermissionTable
                roles={roles}
                modules={modules}
                actions={actions}
                permissions={permissions}
                onToggle={handleToggle}
                onToggleAllForRole={handleToggleAllForRole}
                onToggleAllForModule={handleToggleAllForModule}
                onResetRole={handleResetRole}
                isUserAdmin={isUserAdmin}
                adminRole={ADMIN_ROLE}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-[#f8f9fa] flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span>Allowed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 bg-gray-300 rounded-full"></span>
                  <span>Denied</span>
                </div>
                <div className="text-xs text-gray-400">|</div>
                <div className="text-xs">
                  {isDirty ? (
                    <span className="text-yellow-600 font-medium">● Unsaved changes</span>
                  ) : (
                    <span className="text-green-600">✓ All changes saved</span>
                  )}
                </div>
              </div>

              {isUserAdmin && (
                <div className="flex gap-3">
                  <button onClick={handleResetAll} disabled={resetting} className={btnDanger}>
                    {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Reset All
                  </button>
                  <button onClick={handleDiscardChanges} disabled={!isDirty} className={btnSecondary}>
                    <RotateCcw className="h-4 w-4" /> Discard
                  </button>
                  <button onClick={handleSave} disabled={!isDirty || saving} className={btnPrimary}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">ℹ️ Permission Guide</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>View:</strong> Can see/list items in this module</li>
              <li>• <strong>Create:</strong> Can add new items</li>
              <li>• <strong>Update:</strong> Can edit existing items</li>
              <li>• <strong>Delete:</strong> Can remove items</li>
              <li>• <strong>Admin</strong> has all permissions by default and cannot be modified</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== PERMISSION TABLE COMPONENT ====================

function PermissionTable({
  roles,
  modules,
  actions,
  permissions,
  onToggle,
  onToggleAllForRole,
  onToggleAllForModule,
  onResetRole,
  isUserAdmin,
  adminRole,
}) {
  if (!roles.length || !modules.length) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No roles or modules found.</p>
      </div>
    );
  }

  return (
    <table className="min-w-full text-[13px]">
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>
          <th className="border-b border-r border-gray-200 px-4 py-3 text-left font-semibold text-slate-800 min-w-[150px]">
            Module
          </th>
          {roles.map((role) => {
            const isAdmin = role.id === adminRole;
            return (
              <th key={role.id} className={`border-b border-r border-gray-200 px-3 py-3 text-center align-top min-w-[180px] ${isAdmin ? "bg-emerald-50" : ""}`}>
                <div className="flex flex-col items-center">
                  <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1">
                    {role.name}
                    {isAdmin && <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">FULL ACCESS</span>}
                  </div>

                  {!isAdmin && isUserAdmin && (
                    <div className="flex gap-1 mb-2">
                      <button onClick={() => onToggleAllForRole(role.id, true)} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                        All On
                      </button>
                      <button onClick={() => onToggleAllForRole(role.id, false)} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                        All Off
                      </button>
                      <button onClick={() => onResetRole(role.id)} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                        Reset
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-1 text-[10px] text-gray-500 w-full">
                    {actions.map((a) => (
                      <span key={a} className="capitalize text-center">{a.charAt(0).toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {modules.map((mod, idx) => (
          <tr key={mod.id} className={`group ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30`}>
            <td className="border-t border-r border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 capitalize">{mod.name}</span>
                {isUserAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onToggleAllForModule(mod.id, true)} className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                      ✓ All
                    </button>
                    <button onClick={() => onToggleAllForModule(mod.id, false)} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                      ✗ All
                    </button>
                  </div>
                )}
              </div>
            </td>

            {roles.map((role) => {
              const isAdmin = role.id === adminRole;
              const cell = permissions?.[role.id]?.[mod.id] || {};

              return (
                <td key={role.id} className={`border-t border-r border-gray-200 px-3 py-2 ${isAdmin ? "bg-emerald-50/50" : ""}`}>
                  <div className="grid grid-cols-4 gap-1 justify-items-center">
                    {actions.map((action) => (
                      <PermissionToggle
                        key={action}
                        checked={isAdmin ? true : !!cell[action]}
                        onChange={() => onToggle(role.id, mod.id, action)}
                        disabled={isAdmin || !isUserAdmin}
                        action={action}
                      />
                    ))}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ==================== PERMISSION TOGGLE COMPONENT ====================

function PermissionToggle({ checked, onChange, disabled, action }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
        ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-80"}
        ${checked ? "bg-emerald-500" : "bg-gray-300"}`}
      title={`${action}: ${checked ? "Allowed" : "Denied"}${disabled ? " (cannot modify)" : ""}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-1"}`} />
    </button>
  );
}