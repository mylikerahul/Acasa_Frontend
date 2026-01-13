// app/components/ClientErrorBoundary.jsx
"use client";

import { Component } from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

class ClientErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Error Message */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              
              <p className="text-sm text-gray-600">
                We're sorry for the inconvenience. Please try refreshing the page.
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-700">Error Details:</span>
                </div>
                <pre className="text-xs font-mono text-red-600 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If the problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClientErrorBoundary;