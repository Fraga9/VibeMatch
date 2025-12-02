'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getTopMatches, getMatchingStats, getUserProfile } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { 
  Music, LogOut, Loader2, Users, Sparkles, 
  MapPin, Calendar, Activity, Disc3, 
  ExternalLink, Clock, TrendingUp
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050a0e' }}>
        <div className="text-center">
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <Loader2 className="w-8 h-8 text-[#050a0e] animate-spin" />
          </div>
          <p style={{ color: 'rgba(232, 244, 248, 0.5)', fontWeight: 500 }}>Syncing your vibe...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --color-bg: #050a0e;
          --color-bg-secondary: #0a1218;
          --color-surface: rgba(56, 189, 248, 0.03);
          --color-border: rgba(56, 189, 248, 0.1);
          --color-text: #e8f4f8;
          --color-text-muted: rgba(232, 244, 248, 0.5);
          --color-accent: #38bdf8;
          --color-accent-secondary: #06b6d4;
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-body: 'Outfit', -apple-system, sans-serif;
        }

        body {
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
        }

        .glass-card {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.12);
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%);
          border-color: rgba(56, 189, 248, 0.2);
        }

        .stat-number {
          font-family: var(--font-display);
          background: linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(56, 189, 248, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.3);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>

      <div className="min-h-screen relative" style={{ background: '#050a0e' }}>
        {/* Background Effects */}
        <div className="fixed inset-0 z-0" style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 80%, rgba(34, 211, 238, 0.05) 0%, transparent 50%),
            linear-gradient(180deg, #050a0e 0%, #0a1218 100%)
          `
        }} />

        {/* Floating Orbs */}
        <div className="fixed w-[500px] h-[500px] rounded-full -top-[200px] -right-[100px] opacity-30 blur-[120px] pointer-events-none" style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
        }} />
        <div className="fixed w-[400px] h-[400px] rounded-full -bottom-[150px] -left-[100px] opacity-30 blur-[120px] pointer-events-none" style={{
          background: 'linear-gradient(135deg, #22d3ee 0%, #38bdf8 100%)'
        }} />

        {/* Noise Overlay */}
        <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-[1]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <nav className="flex items-center justify-between px-6 md:px-12 lg:px-24 py-6 backdrop-blur-md border-b sticky top-0 z-50" style={{
            background: 'rgba(5, 10, 14, 0.8)',
            borderColor: 'rgba(56, 189, 248, 0.1)'
          }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Music size={20} color="#050a0e" />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 400,
                color: '#e8f4f8'
              }}>VibeMatch</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold" style={{ color: '#e8f4f8' }}>{user?.real_name || storedUsername}</p>
                <p className="text-xs font-medium" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>{formatNumber(user?.playcount || 0)} scrobbles</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden" style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '2px solid rgba(56, 189, 248, 0.2)'
                }}>
                  {user?.image ? (
                    <img src={user.image} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: '#38bdf8' }}>
                      {storedUsername[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full transition-all"
                  style={{ color: 'rgba(232, 244, 248, 0.4)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#f87171';
                    e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(232, 244, 248, 0.4)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-6 md:px-12 lg:px-24 py-10 space-y-8">
            
            {/* Hero Section */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 w-full h-32 opacity-50" style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
                }} />
                
                <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-end">
                  {/* Avatar */}
                  <div className="relative -mt-4">
                    <div className="w-32 h-32 rounded-full p-1" style={{
                      background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
                      boxShadow: '0 8px 32px -8px rgba(56, 189, 248, 0.4)'
                    }}>
                      <img 
                        src={user?.image || `https://ui-avatars.com/api/?name=${storedUsername}&background=0a1218&color=38bdf8`} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                        style={{ border: '4px solid #050a0e' }}
                      />
                    </div>
                    <a 
                      href={user?.url || `https://last.fm/user/${storedUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-2 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" color="#050a0e" />
                    </a>
                  </div>

                  <div className="flex-1 text-center md:text-left mb-2">
                    <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ 
                      fontFamily: 'var(--font-display)',
                      color: '#e8f4f8' 
                    }}>
                      {user?.real_name || user?.username}
                    </h1>
                    
                    {/* Info Badges */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8'
                      }}>
                        @{user?.username}
                      </span>
                      {user?.country && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.1)',
                          color: 'rgba(232, 244, 248, 0.7)'
                        }}>
                          <MapPin className="w-3.5 h-3.5" style={{ color: '#38bdf8' }} /> {user.country}
                        </span>
                      )}
                      {joinDate && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.1)',
                          color: 'rgba(232, 244, 248, 0.7)'
                        }}>
                          <Calendar className="w-3.5 h-3.5" style={{ color: '#22d3ee' }} /> Since {joinDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-8 mt-10 pt-8" style={{ borderTop: '1px solid rgba(56, 189, 248, 0.1)' }}>
                  <div>
                    <div className="stat-number text-3xl font-bold">{formatNumber(user?.playcount || 0)}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Total Scrobbles</div>
                  </div>
                  <div>
                    <div className="stat-number text-3xl font-bold">{user?.top_artists?.length || 50}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Top Artists</div>
                  </div>
                  <div>
                    <div className="stat-number text-3xl font-bold">{matches.length}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Matches Found</div>
                  </div>
                </div>
              </div>

              {/* Recent Vibe */}
              <div className="glass-card p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#e8f4f8' }}>
                    <Activity className="w-5 h-5" style={{ color: '#22c55e' }} /> Recent Vibe
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>LIVE</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                  {(user?.recent_tracks || []).slice(0, 8).map((track, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl transition-all group" 
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden" style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.15)'
                      }}>
                        {track.image ? (
                          <img src={track.image} className="w-full h-full object-cover" />
                        ) : (
                          <Disc3 className="w-5 h-5" style={{ color: 'rgba(232, 244, 248, 0.4)' }} />
                        )}
                        {track.nowplaying && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ 
                              background: '#22c55e',
                              boxShadow: '0 0 12px rgba(34, 197, 94, 0.8)'
                            }} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate" style={{ 
                          color: track.nowplaying ? '#22c55e' : '#e8f4f8' 
                        }}>
                          {track.name}
                        </div>
                        <div className="text-xs truncate" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>{track.artist}</div>
                      </div>
                      {!track.nowplaying && (
                        <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(232, 244, 248, 0.2)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Top Artists */}
              <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Users className="w-5 h-5" style={{ color: '#38bdf8' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#e8f4f8' }}>Top Artists</h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {user?.top_artists?.slice(0, 9).map((artist, idx) => (
                    <div 
                      key={idx} 
                      className="glass-card p-4 cursor-default transition-all"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="font-semibold text-sm truncate" style={{ color: '#e8f4f8' }}>
                        {artist.name}
                      </div>
                      <div className="text-xs mt-1 font-medium" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>
                        {formatNumber(artist.playcount)} plays
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Tracks */}
              <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <TrendingUp className="w-5 h-5" style={{ color: '#22d3ee' }} />
                  <h2 className="text-xl font-bold" style={{ color: '#e8f4f8' }}>Top Tracks</h2>
                </div>

                <div className="glass-card overflow-hidden">
                  {user?.top_tracks && user.top_tracks.length > 0 ? (
                    user.top_tracks.slice(0, 8).map((track, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 p-3.5 transition-all group"
                        style={{ borderBottom: idx < 7 ? '1px solid rgba(56, 189, 248, 0.08)' : 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="w-6 text-center font-mono text-sm font-bold" style={{ color: 'rgba(232, 244, 248, 0.3)' }}>
                          {idx + 1}
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.15)'
                        }}>
                          <Music className="w-4 h-4" style={{ color: 'rgba(232, 244, 248, 0.4)' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate" style={{ color: '#e8f4f8' }}>{track.name}</div>
                          <div className="text-xs truncate" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>{track.artist}</div>
                        </div>
                        <div className="text-xs font-mono font-medium px-2.5 py-1 rounded-md" style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8'
                        }}>
                          {formatNumber(track.playcount || 0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Loading tracks...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Matches Section */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6" style={{ color: '#38bdf8' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#e8f4f8' }}>Your Top Matches</h2>
              </div>
              
              {matches.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {matches.map((match, idx) => (
                    <MatchCard key={idx} match={match} rank={idx + 1} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <p style={{ color: 'rgba(232, 244, 248, 0.5)' }}>Finding your matches...</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}