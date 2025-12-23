'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getTopMatches, getMatchingStats, getUserProfile } from '@/lib/api';
import {
  ProfileCard,
  NowPlayingCard,
  QuickStatsCards,
  MatchesSection,
  DashboardStyles,
  DashboardBackground,
  LoadingState,
} from '@/components/dashboard';
import { Header } from '@/components/shared';
import { LogOut } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface ExtendedTrack {
  name: string;
  artist: string;
  album?: string;
  image?: string;
  timestamp?: number;
  nowplaying?: boolean;
  playcount?: number;
}

interface ExtendedProfile {
  username: string;
  real_name?: string;
  country?: string;
  image?: string;
  registered?: number;
  url?: string;
  playcount: number;
  top_artists: any[];
  top_tracks?: ExtendedTrack[];
  recent_tracks?: ExtendedTrack[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { logout, matches, setMatches, setProfile, profile } = useStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [storedUsername, setStoredUsername] = useState('');

  const user = profile as unknown as ExtendedProfile;

  useEffect(() => {
    const token = localStorage.getItem('vibematch_token');
    const username = localStorage.getItem('vibematch_username');

    if (!token || !username) {
      router.push('/');
      return;
    }

    setStoredUsername(username);
    loadDashboardData(username);
  }, []);

  const loadDashboardData = async (username: string) => {
    try {
      setLoading(true);
      const profileData = await getUserProfile(username);
      setProfile(profileData);
      
      const matchesData = await getTopMatches(20);
      setMatches(matchesData);

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
    return <LoadingState />;
  }

  return (
    <>
      <DashboardStyles />

      <div className="min-h-screen relative" style={{ background: '#050a0e' }}>
        <DashboardBackground />

        {/* Content */}
        <div className="relative z-10">
          <Header
            variant="dashboard"
            rightContent={
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full" style={{
                  background: 'rgba(14, 165, 233, 0.06)',
                  border: '1px solid rgba(14, 165, 233, 0.1)'
                }}>
                  <div className="w-8 h-8 rounded-full overflow-hidden" style={{
                    background: 'rgba(14, 165, 233, 0.2)'
                  }}>
                    {user?.image ? (
                      <img src={user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: '#0ea5e9' }}>
                        {storedUsername[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#e8f4f8' }}>{user?.real_name || storedUsername}</p>
                    <p className="text-[11px] font-medium" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>{formatNumber(user?.playcount || 0)} scrobbles</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl transition-all"
                  style={{
                    color: 'rgba(232, 244, 248, 0.4)',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#f87171';
                    e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(232, 244, 248, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            }
          />

          <div className="px-6 lg:px-10 py-8">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 gap-4 lg:gap-5 max-w-[1400px] mx-auto">
              
              <ProfileCard 
                user={user} 
                storedUsername={storedUsername} 
                matchesCount={matches.length} 
              />

              <NowPlayingCard recentTracks={user?.recent_tracks || []} />

              <QuickStatsCards
                playcount={user?.playcount || 0}
                registered={user?.registered}
              />

              <MatchesSection matches={matches} />

            </div>
          </div>
        </div>
      </div>
    </>
  );
}