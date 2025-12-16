import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | VibeMatch',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#050a0e] to-[#0a1218] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <h1 className="text-9xl font-bold bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] bg-clip-text text-transparent">
              404
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Page not found
          </h2>
          <p className="text-gray-400 mb-8">
            Sorry, we couldn't find the page you're looking for.
            The link might be broken or the page may have been removed.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] text-[#050a0e] font-medium rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
