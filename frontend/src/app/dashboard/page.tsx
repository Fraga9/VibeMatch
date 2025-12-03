'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getTopMatches, getMatchingStats, getUserProfile } from '@/lib/api';
import {
  DashboardHeader,
  ProfileCard,
  NowPlayingCard,
  QuickStatsCards,
  TopArtistsCard,
  TopTracksCard,
  MatchesSection,
  DashboardStyles,
  DashboardBackground,
  LoadingState,
} from '@/components/dashboard';

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
          <DashboardHeader 
            user={user} 
            username={storedUsername} 
            onLogout={handleLogout} 
          />

          <div className="px-6 lg:px-10 py-8">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 gap-4 lg:gap-5 max-w-[1600px] mx-auto">
              
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

              <TopArtistsCard artists={user?.top_artists || []} />

              <TopTracksCard tracks={user?.top_tracks || []} />

              <MatchesSection matches={matches} />

            </div>
          </div>
        </div>
      </div>
    </>
  );
}