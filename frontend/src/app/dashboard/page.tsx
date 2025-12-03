'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getTopMatches, getMatchingStats, getUserProfile } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { 
  Music, LogOut, Loader2, Users, Sparkles, 
  MapPin, Calendar, Activity, Disc3, 
  ExternalLink, Clock, TrendingUp, Play, Heart,
  BarChart2, Headphones, Radio
} from 'lucide-react';
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

  const loadDashboardData = async (user: string) => {
    try {
      setLoading(true);
      const profileData = await getUserProfile(user);
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

  const joinDate = user?.registered 
    ? new Date(user.registered * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : null;

  const nowPlaying = user?.recent_tracks?.find(t => t.nowplaying);
  const recentTracks = user?.recent_tracks?.filter(t => !t.nowplaying)?.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050a0e' }}>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 animate-pulse" />
            <div className="absolute inset-[3px] rounded-xl bg-[#050a0e] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          </div>
          <p style={{ color: 'rgba(232, 244, 248, 0.5)', fontWeight: 500 }}>Syncing your vibe...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        :root {
          --color-bg: #050a0e;
          --color-surface: rgba(14, 165, 233, 0.04);
          --color-border: rgba(14, 165, 233, 0.12);
          --color-text: #e8f4f8;
          --color-text-muted: rgba(232, 244, 248, 0.5);
          --color-accent: #0ea5e9;
          --color-accent-light: #38bdf8;
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-body: 'Outfit', -apple-system, sans-serif;
        }

        * { box-sizing: border-box; }
        
        body {
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
          margin: 0;
        }

        .bento-card {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(6, 182, 212, 0.02) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(14, 165, 233, 0.1);
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .bento-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, transparent 50%, rgba(6, 182, 212, 0.1) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .bento-card:hover::before {
          opacity: 1;
        }

        .bento-card:hover {
          transform: translateY(-2px);
          border-color: rgba(14, 165, 233, 0.2);
          box-shadow: 0 20px 40px -20px rgba(14, 165, 233, 0.15);
        }

        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #a5f3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .now-playing-pulse {
          animation: nowPlayingPulse 2s ease-in-out infinite;
        }

        @keyframes nowPlayingPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
        }

        .audio-visualizer {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 32px;
        }

        .audio-bar {
          width: 4px;
          background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
          border-radius: 2px;
          animation: audioBar 1s ease-in-out infinite;
        }

        @keyframes audioBar {
          0%, 100% { height: 8px; }
          50% { height: 100%; }
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        .track-row {
          transition: all 0.3s ease;
        }
        
        .track-row:hover {
          background: rgba(14, 165, 233, 0.06);
        }

        .artist-card {
          position: relative;
          padding: 1rem;
          border-radius: 16px;
          background: rgba(14, 165, 233, 0.04);
          border: 1px solid rgba(14, 165, 233, 0.08);
          transition: all 0.3s ease;
        }

        .artist-card:hover {
          background: rgba(14, 165, 233, 0.08);
          border-color: rgba(14, 165, 233, 0.15);
          transform: translateY(-2px);
        }

        .rank-badge {
          position: absolute;
          top: -8px;
          left: -8px;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #050a0e;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
      `}</style>

      <div className="min-h-screen relative" style={{ background: '#050a0e' }}>
        {/* Background */}
        <div className="fixed inset-0 z-0" style={{
          background: `
            radial-gradient(ellipse 100% 80% at 0% 0%, rgba(14, 165, 233, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 100% 100%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, #050a0e 0%, #071015 100%)
          `
        }} />

        {/* Subtle Grid Pattern */}
        <div className="fixed inset-0 z-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <nav className="flex items-center justify-between px-6 lg:px-10 py-5 backdrop-blur-xl border-b sticky top-0 z-50" style={{
            background: 'rgba(5, 10, 14, 0.85)',
            borderColor: 'rgba(14, 165, 233, 0.1)'
          }}>
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 20px rgba(14, 165, 233, 0.3)'
                }}>
                  <Music size={20} color="#050a0e" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>VibeMatch</span>
            </a>

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
          </nav>

          <div className="px-6 lg:px-10 py-8">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 gap-4 lg:gap-5 max-w-[1600px] mx-auto">
              
              {/* Profile Card - Spans 4 cols */}
              <div className="col-span-12 lg:col-span-4 bento-card p-6">
                <div className="flex flex-col h-full">
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl p-[2px]" style={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                      }}>
                        <img 
                          src={user?.image || `https://ui-avatars.com/api/?name=${storedUsername}&background=0a1218&color=0ea5e9`} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-[14px]"
                          style={{ background: '#0a1218' }}
                        />
                      </div>
                      <a 
                        href={user?.url || `https://last.fm/user/${storedUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-lg transition-transform hover:scale-110"
                        style={{
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)'
                        }}
                      >
                        <ExternalLink className="w-3 h-3" color="#050a0e" />
                      </a>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold truncate mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                        {user?.real_name || user?.username}
                      </h1>
                      <p className="text-sm font-medium" style={{ color: '#0ea5e9' }}>@{user?.username}</p>
                    </div>
                  </div>

                  {/* Meta Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {user?.country && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(14, 165, 233, 0.12)',
                        color: 'rgba(232, 244, 248, 0.7)'
                      }}>
                        <MapPin className="w-3 h-3" style={{ color: '#0ea5e9' }} /> {user.country}
                      </span>
                    )}
                    {joinDate && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(14, 165, 233, 0.12)',
                        color: 'rgba(232, 244, 248, 0.7)'
                      }}>
                        <Calendar className="w-3 h-3" style={{ color: '#22d3ee' }} /> {joinDate}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mt-auto">
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(14, 165, 233, 0.04)' }}>
                      <div className="stat-value gradient-text">{formatNumber(user?.playcount || 0)}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Scrobbles</div>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(14, 165, 233, 0.04)' }}>
                      <div className="stat-value gradient-text">{user?.top_artists?.length || 50}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Artists</div>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(14, 165, 233, 0.04)' }}>
                      <div className="stat-value gradient-text">{matches.length}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Matches</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Now Playing / Recent - Spans 5 cols */}
              <div className="col-span-12 lg:col-span-5 bento-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5" style={{ color: nowPlaying ? '#22c55e' : '#0ea5e9' }} />
                    <h3 className="text-lg font-semibold">{nowPlaying ? 'Now Playing' : 'Recent Vibe'}</h3>
                  </div>
                  {nowPlaying && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold now-playing-pulse" style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>LIVE</span>
                  )}
                </div>

                {nowPlaying ? (
                  <div className="flex gap-5">
                    {/* Album Art */}
                    <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden" style={{
                      background: 'rgba(14, 165, 233, 0.1)',
                      border: '1px solid rgba(14, 165, 233, 0.15)'
                    }}>
                      {nowPlaying.image ? (
                        <img src={nowPlaying.image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-10 h-10" style={{ color: 'rgba(232, 244, 248, 0.3)' }} />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.9)' }}>
                          <Play className="w-5 h-5 ml-0.5" color="#fff" fill="#fff" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Track Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-xl font-bold truncate mb-1" style={{ color: '#e8f4f8' }}>{nowPlaying.name}</p>
                      <p className="text-sm truncate mb-4" style={{ color: 'rgba(232, 244, 248, 0.6)' }}>{nowPlaying.artist}</p>
                      
                      {/* Audio Visualizer */}
                      <div className="audio-visualizer">
                        {[...Array(12)].map((_, i) => (
                          <div 
                            key={i} 
                            className="audio-bar" 
                            style={{ animationDelay: `${i * 0.1}s`, height: `${8 + Math.random() * 16}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTracks.slice(0, 4).map((track, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl track-row">
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{
                          background: 'rgba(14, 165, 233, 0.08)',
                          border: '1px solid rgba(14, 165, 233, 0.1)'
                        }}>
                          {track.image ? (
                            <img src={track.image} className="w-full h-full object-cover" />
                          ) : (
                            <Disc3 className="w-5 h-5" style={{ color: 'rgba(232, 244, 248, 0.3)' }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: '#e8f4f8' }}>{track.name}</p>
                          <p className="text-xs truncate" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>{track.artist}</p>
                        </div>
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(232, 244, 248, 0.2)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats - Spans 3 cols */}
              <div className="col-span-12 lg:col-span-3 grid grid-rows-2 gap-4 lg:gap-5">
                <div className="bento-card p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Listening Time</span>
                  </div>
                  <div>
                    <div className="stat-value gradient-text" style={{ fontSize: '2rem' }}>
                      {Math.round((user?.playcount || 0) * 3.5 / 60)}h
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>~3.5 min avg per track</p>
                  </div>
                </div>
                
                <div className="bento-card p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-4 h-4" style={{ color: '#22d3ee' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Avg per Day</span>
                  </div>
                  <div>
                    <div className="stat-value gradient-text" style={{ fontSize: '2rem' }}>
                      {user?.registered ? Math.round((user?.playcount || 0) / ((Date.now() / 1000 - user.registered) / 86400)) : 0}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>tracks scrobbled</p>
                  </div>
                </div>
              </div>

              {/* Top Artists - Spans 6 cols */}
              <div className="col-span-12 lg:col-span-6 bento-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: '#0ea5e9' }} />
                    <h3 className="text-lg font-semibold">Top Artists</h3>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{
                    background: 'rgba(14, 165, 233, 0.08)',
                    color: 'rgba(232, 244, 248, 0.5)'
                  }}>All Time</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {user?.top_artists?.slice(0, 6).map((artist, idx) => (
                    <div key={idx} className="artist-card">
                      {idx < 3 && <div className="rank-badge">{idx + 1}</div>}
                      <div className="font-semibold text-sm truncate mb-1" style={{ color: '#e8f4f8' }}>
                        {artist.name}
                      </div>
                      <div className="text-xs font-medium" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>
                        {formatNumber(artist.playcount)} plays
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Tracks - Spans 6 cols */}
              <div className="col-span-12 lg:col-span-6 bento-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: '#22d3ee' }} />
                    <h3 className="text-lg font-semibold">Top Tracks</h3>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{
                    background: 'rgba(14, 165, 233, 0.08)',
                    color: 'rgba(232, 244, 248, 0.5)'
                  }}>All Time</span>
                </div>

                <div className="space-y-1">
                  {user?.top_tracks?.slice(0, 5).map((track, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-2.5 rounded-xl track-row"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
                        background: idx < 3 ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'rgba(14, 165, 233, 0.1)',
                        color: idx < 3 ? '#050a0e' : 'rgba(232, 244, 248, 0.4)'
                      }}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: '#e8f4f8' }}>{track.name}</p>
                        <p className="text-xs truncate" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>{track.artist}</p>
                      </div>
                      <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg flex-shrink-0" style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        color: '#0ea5e9'
                      }}>
                        {formatNumber(track.playcount || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matches Section - Full Width */}
              <div className="col-span-12 mt-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl" style={{
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                    border: '1px solid rgba(14, 165, 233, 0.2)'
                  }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#0ea5e9' }} />
                  </div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    Your Top <span className="gradient-text">Matches</span>
                  </h2>
                </div>
                
                {matches.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {matches.slice(0, 8).map((match, idx) => (
                      <MatchCard key={idx} match={match} rank={idx + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="bento-card p-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: '#0ea5e9' }} />
                    <p style={{ color: 'rgba(232, 244, 248, 0.5)' }}>Finding your matches...</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}