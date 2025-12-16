'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#050a0e] to-[#0a1218] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-400 mb-2">
            We're sorry, but something unexpected happened.
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 mb-6">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] text-[#050a0e] font-medium rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white/5 text-white font-medium rounded-full border border-white/10 hover:bg-white/10 transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
