'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#050a0e] to-[#0a1218] px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Critical Error
              </h1>
              <p className="text-gray-400 mb-6">
                A critical error occurred. Please try refreshing the page.
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] text-[#050a0e] font-medium rounded-full hover:shadow-lg transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
