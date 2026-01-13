// app/admin/test-auth/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TestAuthPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState({
    localStorage: {},
    cookies: {},
    backend: null,
    error: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAuth = async () => {
      try {
        console.log("🧪 Running auth tests...");
        
        // 1. Check localStorage
        const localStorageData = {
          adminToken: localStorage.getItem("adminToken"),
          adminData: localStorage.getItem("adminData"),
          allKeys: Object.keys(localStorage)
        };
        
        console.log("📦 localStorage:", localStorageData);
        
        // 2. Check cookies
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {});
        
        console.log("🍪 Cookies:", cookies);
        
        // 3. Test backend API
        let backendResponse = null;
        const token = localStorage.getItem("adminToken");
        
        if (token) {
          try {
            const response = await fetch("http://localhost:8080/api/v1/admin/me", {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            
            backendResponse = {
              status: response.status,
              ok: response.ok,
              data: await response.json().catch(() => ({ error: "No JSON" }))
            };
            
            console.log("📡 Backend response:", backendResponse);
          } catch (error) {
            console.error("Backend test error:", error);
            backendResponse = { error: error.message };
          }
        }
        
        setAuthState({
          localStorage: localStorageData,
          cookies,
          backend: backendResponse,
          error: null
        });
        
      } catch (error) {
        console.error("Auth test error:", error);
        setAuthState(prev => ({ ...prev, error: error.message }));
      } finally {
        setLoading(false);
      }
    };
    
    testAuth();
  }, []);

  const handleRedirect = () => {
    router.push("/admin/dashboard");
  };

  const handleClearStorage = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    alert("LocalStorage cleared! Refresh page.");
    window.location.reload();
  };

  if (loading) {
    return <div className="p-8">Testing authentication...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* localStorage Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">LocalStorage</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">adminToken:</span>{" "}
                {authState.localStorage.adminToken ? (
                  <span className="text-green-600">
                    Present ({authState.localStorage.adminToken.substring(0, 20)}...)
                  </span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </div>
              <div>
                <span className="font-medium">adminData:</span>{" "}
                {authState.localStorage.adminData ? (
                  <span className="text-green-600">Present</span>
                ) : (
                  <span className="text-red-600">Missing</span>
                )}
              </div>
              <div>
                <span className="font-medium">All Keys:</span>{" "}
                {authState.localStorage.allKeys?.join(", ")}
              </div>
            </div>
          </div>
          
          {/* Cookies Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Cookies</h2>
            <div className="space-y-2">
              {Object.keys(authState.cookies).length > 0 ? (
                Object.entries(authState.cookies).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span>{" "}
                    <span className="text-gray-600">{value.substring(0, 30)}...</span>
                  </div>
                ))
              ) : (
                <div className="text-red-600">No cookies found</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Backend Test Result */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Backend API Test</h2>
          {authState.backend ? (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Status:</span>{" "}
                <span className={authState.backend.ok ? "text-green-600" : "text-red-600"}>
                  {authState.backend.status} ({authState.backend.ok ? "OK" : "Failed"})
                </span>
              </div>
              <div>
                <span className="font-medium">Response:</span>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(authState.backend.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-yellow-600">Backend test not performed (no token)</div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleRedirect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleClearStorage}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear LocalStorage
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
        
        {/* Debug Info */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Info</h3>
          <p className="text-sm text-yellow-700">
            Open browser console (F12) to see detailed logs. Check if:
          </p>
          <ul className="text-sm text-yellow-700 mt-2 list-disc pl-5">
            <li>Token is present in localStorage after login</li>
            <li>Dashboard page can read the token</li>
            <li>Backend API accepts the token</li>
          </ul>
        </div>
      </div>
    </div>
  );
}