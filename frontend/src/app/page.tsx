'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Music, Headphones, Users, Zap, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simple authentication with username only
      const response = await axios.post(`${API_URL}/auth/simple?username=${username}`);

      const { access_token } = response.data;

      // Store token and username
      localStorage.setItem('vibematch_token', access_token);
      localStorage.setItem('vibematch_username', username);

      // Create user embedding
      await axios.post(
        `${API_URL}/user/embedding`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );

      // Redirect to dashboard
      router.push('/dashboard');

    } catch (err: any) {
      console.error('Login error:', err);

      if (err.response?.status === 404) {
        setError(`User "${username}" not found on Last.fm. Please check the username.`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to login. Please try again.');
      }
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f0f4f8] relative overflow-hidden">
      {/* Background Blur Orbs */}
      <div className="blur-orb w-[600px] h-[600px] bg-cyan-400/30 -top-40 -right-40 animate-float" />
      <div className="blur-orb w-[500px] h-[500px] bg-blue-400/25 top-1/2 -left-60 animate-float-delayed" />
      <div className="blur-orb w-[400px] h-[400px] bg-teal-300/20 bottom-20 right-1/4 animate-float" />

      {/* Main Container - Full Screen */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 md:px-16 lg:px-24 py-6">
          <div className="flex items-center gap-3">
            <img
              src="/VibeMatch.svg"
              alt="VibeMatch Logo"
              className="h-10 w-auto"
              style={{ filter: 'invert(39%) sepia(90%) saturate(1842%) hue-rotate(196deg) brightness(102%) contrast(101%)' }}
            />
          </div>

          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <button className="nav-pill">Home</button>
            <button className="nav-pill">How it Works</button>
            <button className="nav-pill">About</button>
          </div>

          {/* Spacer para mantener el logo a la izquierda */}
          <div className="hidden md:block w-[120px]"></div>
        </nav>

        {/* Hero Content - Full Width */}
        <main className="flex-1 flex items-center px-8 md:px-16 lg:px-24 py-12">
          <div className="w-full max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              1,337 people found their match today
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-gray-900">
              Find your{' '}
              <span className="text-gradient-ios italic">music</span>
              <br />
              soulmate
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              Connect through the music you love. Our AI analyzes your taste
              and matches you with people who share your exact vibe.
            </p>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="max-w-md">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your Last.fm username"
                    disabled={loading}
                    className="w-full px-5 py-3.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="btn-primary flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Hint */}
              <p className="mt-3 text-gray-400 text-sm">
                Don't have a Last.fm account?{' '}
                <a
                  href="https://www.last.fm/join"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0a84ff] hover:underline"
                >
                  Create one here
                </a>
              </p>
            </form>
          </div>

          {/* Decorative element - right side */}
          <div className="hidden lg:flex absolute right-24 top-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Pulsing circles decoration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-44 h-44 rounded-full bg-gradient-to-br from-[#0a84ff]/10 to-cyan-400/10 animate-pulse-slow" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border border-[#0a84ff]/10 animate-pulse-slow" style={{ animationDelay: '-1s' }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 rounded-full border border-cyan-400/5 animate-pulse-slow" style={{ animationDelay: '-2s' }} />
              </div>

              {/* Center icon */}
              <div className="relative w-24 h-24 rounded-2xl bg-[#0a84ff] flex items-center justify-center shadow-xl shadow-blue-500/25">
                <Music className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </main>


        {/* Footer */}
        <footer className="px-8 md:px-16 lg:px-24 py-6">
          <p className="text-sm text-gray-400">
            © 2025 VibeMatch · Made by{' '}
            <a
              href="https://www.last.fm/es/user/Fraga9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a84ff] hover:underline"
            >
              Fraga9
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}