import React from 'react';

const OwnerTrackSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Owner Track Page Working!</h1>
        <p className="text-gray-600 mb-4">
          The owner tracking page is loading successfully.
        </p>
        <div className="text-sm text-gray-500 mb-4">
          Current URL: <code className="bg-gray-100 px-2 py-1 rounded">{window.location.pathname}</code>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Reload Page
          </button>
          <a
            href="/"
            className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default OwnerTrackSimple;
