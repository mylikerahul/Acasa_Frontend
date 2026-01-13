"use client";

import { useState } from "react";
import { MapPin, Navigation, Loader2, X } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

export default function LocationButton({ 
  onLocationFetched, 
  isLoggedIn = false,
  showAddress = true,
  className = "" 
}) {
  const { location, loading, error, fetchLocation, clearLocation } = useLocation();
  const [showError, setShowError] = useState(false);

  const handleClick = async () => {
    setShowError(false);
    
    // If logged in, save to DB; otherwise just fetch
    const result = await fetchLocation(isLoggedIn);
    
    if (result) {
      onLocationFetched?.(result);
    } else {
      setShowError(true);
    }
  };

  const handleClear = () => {
    clearLocation();
    onLocationFetched?.(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Location Display */}
      {location && showAddress ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800 truncate flex-1">
            {location.display?.short || location.formatted_address || "Location detected"}
          </span>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-green-100 rounded-full"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Detecting Location...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Use My Location
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {(error || showError) && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error || "Failed to get location"}
        </p>
      )}

      {/* Saved indicator for logged users */}
      {location && isLoggedIn && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          ✓ Location saved to your profile
        </p>
      )}
    </div>
  );
}