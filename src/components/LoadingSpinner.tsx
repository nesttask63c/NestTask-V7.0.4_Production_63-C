export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Uses the same spinner CSS from index.html