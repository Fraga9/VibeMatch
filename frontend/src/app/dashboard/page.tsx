'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getTopMatches, getMatchingStats, getUserProfile } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { Music, LogOut, Loader2, Users, Sparkles, Headphones } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { logout, matches, setMatches, setProfile, profile } = useStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [storedUsername, setStoredUsername] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('vibematch_token');
    const username = localStorage.getItem('vibematch_username');

    if (!token || !username) {
      router.push('/');
      return;
    }

    setStoredUsername(username);
    // Load data
    loadDashboardData(username);
  }, []);

  const loadDashboardData = async (user: string) => {
    try {
      setLoading(true);

      // Load user profile
      const profileData = await getUserProfile(user);
      setProfile(profileData);

      // Load matches
      const matchesData = await getTopMatches(20);
      setMatches(matchesData);

      // Load stats
      const statsData = await getMatchingStats();
      setStats(statsData);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#0a84ff] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-xl font-medium">Analyzing your music taste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] relative overflow-hidden">
      {/* Background Blur Orbs - same as landing */}
      <div className="blur-orb w-[600px] h-[600px] bg-cyan-400/30 -top-40 -right-40 animate-float" />
      <div className="blur-orb w-[500px] h-[500px] bg-blue-400/25 top-1/2 -left-60 animate-float-delayed" />
      <div className="blur-orb w-[400px] h-[400px] bg-teal-300/20 bottom-20 right-1/4 animate-float" />

      <div className="relative z-10">
        {/* Header - iOS Style */}
        <nav className="backdrop-blur-md bg-white/60 border-b border-gray-200/50 sticky top-0 z-20">
          <div className="container mx-auto px-8 md:px-16 lg:px-24 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a84ff] flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-gray-900">VibeMatch</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{storedUsername}</p>
                  {profile && (
                    <p className="text-xs text-gray-500">
                      {formatNumber(profile.playcount)} scrobbles
                    </p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/80 text-gray-700 rounded-full border border-gray-200/50 hover:bg-white transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-8 md:px-16 lg:px-24 py-12">
          {/* Stats Cards - iOS Style */}
          {stats && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#0a84ff] flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{formatNumber(stats.total_users)}</div>
                <div className="text-sm text-gray-500 mt-1">Total Users</div>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#0a84ff] flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{matches.length}</div>
                <div className="text-sm text-gray-500 mt-1">Your Matches</div>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#0a84ff] flex items-center justify-center mx-auto mb-3">
                  <Music className="w-6 h-6 text-white" />
                </div>
                {profile && (
                  <>
                    <div className="text-3xl font-bold text-gray-900">{profile.top_artists.length}</div>
                    <div className="text-sm text-gray-500 mt-1">Top Artists</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Top Artists Section */}
          {profile && profile.top_artists.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Top Artists</h2>
              <div className="glass-card p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {profile.top_artists.slice(0, 10).map((artist, idx) => (
                    <div
                      key={idx}
                      className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/80 transition-all border border-gray-200/50"
                    >
                      <div className="text-gray-900 font-semibold text-sm mb-1 truncate">
                        {artist.name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {formatNumber(artist.playcount)} plays
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Matches Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#0a84ff]" />
              Your Top Matches
            </h2>

            {matches.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium mb-2">No matches yet</p>
                <p className="text-gray-400">
                  We're finding your perfect music soulmates. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {matches.map((match, idx) => (
                  <MatchCard key={idx} match={match} rank={idx + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Share Section */}
          <div className="mt-12 glass-card p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Share Your Music Taste
            </h3>
            <p className="text-gray-500 mb-6">
              Let your friends discover their music soulmates too!
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all text-sm font-medium">
                Share on Instagram
              </button>
              <button className="px-6 py-3 bg-white/80 text-gray-700 rounded-full hover:bg-white transition-all border border-gray-200/50 text-sm font-medium">
                Share on Twitter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
