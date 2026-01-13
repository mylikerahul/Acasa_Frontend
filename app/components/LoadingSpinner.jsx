// components/LoadingSpinner.jsx
export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600">Verifying admin access...</p>
    </div>
  );
}