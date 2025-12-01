'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music2, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900 flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music2 className="w-12 h-12 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">
              Vibe<span className="text-pink-400">Match</span>
            </h1>
          </div>
          <p className="text-white/80 text-lg">Enter your Last.fm username</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-white text-sm font-medium mb-2">
              Last.fm Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., RJ, musiclover123"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="mt-2 text-white/60 text-xs">
              Don't have a Last.fm account?{' '}
              <a
                href="https://www.last.fm/join"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:underline"
              >
                Create one here
              </a>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing your music taste...
              </>
            ) : (
              <>
                <Music2 className="w-5 h-5" />
                Find My Matches
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            We only use public Last.fm data. No password required.
          </p>
        </div>

        {/* Example usernames */}
        <div className="mt-6">
          <p className="text-white/60 text-xs mb-2">Try these example users:</p>
          <div className="flex flex-wrap gap-2">
            {['RJ', 'Zakalwe_', 'ilovebees'].map((exampleUser) => (
              <button
                key={exampleUser}
                onClick={() => setUsername(exampleUser)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 text-xs rounded-full transition-all"
                disabled={loading}
              >
                {exampleUser}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
