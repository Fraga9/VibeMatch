'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getTopMatches, getMatchingStats, getUserProfile } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { 
  Music, LogOut, Loader2, Users, Sparkles, 
  MapPin, Calendar, Activity, Disc3, 
  ExternalLink, BarChart3, Clock, TrendingUp
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

// --- Tipos (Mismos que antes) ---
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

  // Helper fechas
  const joinDate = user?.registered 
    ? new Date(user.registered * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0a84ff] mx-auto mb-4 animate-spin" />
          <p className="text-slate-500 font-medium">Syncing profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      
      {/* --- HEADER (Restaurado con SVG) --- */}
      <nav className="flex items-center justify-between px-8 md:px-16 lg:px-24 py-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img
              src="/VibeMatch.svg"
              alt="VibeMatch Logo"
              className="h-8 w-auto"
              // Filtro para colorear el SVG a tu azul #0a84ff si es negro, o dejarlo tal cual
              style={{ filter: 'invert(39%) sepia(90%) saturate(1842%) hue-rotate(196deg) brightness(102%) contrast(101%)' }}
            />
          </div>

          {/* User Controls Right (Reemplazando el spacer vacío para funcionalidad) */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
               <p className="text-sm font-bold text-slate-900">{user?.real_name || storedUsername}</p>
               <p className="text-xs text-slate-500 font-medium">{formatNumber(user?.playcount || 0)} scrobbles</p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                    {user?.image ? (
                        <img src={user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{storedUsername[0]?.toUpperCase()}</div>
                    )}
                </div>
                <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
          </div>
      </nav>

      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-10 space-y-8">
        
        {/* --- HERO SECTION --- */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* 1. Profile Card (White & Clean) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
             {/* Gradient sutil en el fondo del header de la tarjeta */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-50 to-indigo-50/50" />
             
             <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-end">
                {/* Avatar */}
                <div className="relative -mt-4">
                  <div className="w-32 h-32 rounded-full p-1 bg-white shadow-xl ring-1 ring-slate-100">
                     <img 
                       src={user?.image || `https://ui-avatars.com/api/?name=${storedUsername}`} 
                       alt="Profile" 
                       className="w-full h-full object-cover rounded-full"
                     />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 rounded-full ring-4 ring-white shadow-sm">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left mb-2">
                   <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                     {user?.real_name || user?.username}
                   </h1>
                   
                   {/* Info Badges (Sin Emojis) */}
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                         @{user?.username}
                      </span>
                      {user?.country && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" /> {user.country}
                        </span>
                      )}
                      {joinDate && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Since {joinDate}
                        </span>
                      )}
                   </div>
                </div>
             </div>

             {/* Quick Stats Grid */}
             <div className="grid grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-100">
                <div>
                   <div className="text-3xl font-bold text-slate-900">{formatNumber(user?.playcount || 0)}</div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Scrobbles</div>
                </div>
                <div>
                   <div className="text-3xl font-bold text-slate-900">{user?.top_artists?.length || 50}</div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Top Artists</div>
                </div>
                <div>
                   <div className="text-3xl font-bold text-slate-900">{matches.length}</div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Matches Found</div>
                </div>
             </div>
          </div>

          {/* 2. Recent Vibe (List Style) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" /> Recent Vibe
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 ring-1 ring-green-200">LIVE</span>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                {(user?.recent_tracks || []).slice(0,8).map((track, i) => (
                   <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                         {track.image ? (
                             <img src={track.image} className="w-full h-full object-cover" />
                         ) : (
                             <Disc3 className="w-5 h-5 text-slate-400" />
                         )}
                         {track.nowplaying && (
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                             </div>
                         )}
                      </div>
                      <div className="min-w-0">
                         <div className={`text-sm font-semibold truncate ${track.nowplaying ? 'text-green-600' : 'text-slate-900'}`}>
                             {track.name}
                         </div>
                         <div className="text-xs text-slate-500 truncate group-hover:text-slate-700">{track.artist}</div>
                      </div>
                      {/* Timestamp opcional a la derecha */}
                      {!track.nowplaying && (
                          <div className="ml-auto text-[10px] text-slate-300 font-medium">
                              <Clock className="w-3 h-3" />
                          </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left: Top Artists (Grid Cards) */}
            <div>
               <div className="flex items-center gap-2 mb-4 px-1">
                 <Users className="w-5 h-5 text-blue-500" />
                 <h2 className="text-xl font-bold text-slate-900">Top Artists</h2>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {user?.top_artists?.slice(0, 9).map((artist, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group cursor-default">
                       <div className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                           {artist.name}
                       </div>
                       <div className="text-slate-500 text-xs mt-1 font-medium">
                           {formatNumber(artist.playcount)} plays
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Right: Top Tracks (List View) */}
            <div>
               <div className="flex items-center gap-2 mb-4 px-1">
                 <TrendingUp className="w-5 h-5 text-indigo-500" />
                 <h2 className="text-xl font-bold text-slate-900">Top Tracks</h2>
               </div>

               <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {user?.top_tracks && user.top_tracks.length > 0 ? (
                      user.top_tracks.slice(0, 8).map((track, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
                           <div className="w-6 text-center text-slate-400 font-mono text-sm font-bold">{idx + 1}</div>
                           <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                               <Music className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-slate-900 truncate">{track.name}</div>
                              <div className="text-xs text-slate-500 truncate">{track.artist}</div>
                           </div>
                           <div className="text-xs font-mono font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                               {formatNumber(track.playcount || 0)}
                           </div>
                        </div>
                      ))
                  ) : (
                      <div className="p-8 text-center text-slate-400">Loading tracks...</div>
                  )}
               </div>
            </div>
        </div>

        {/* --- MATCHES SECTION --- */}
        <div className="pt-4">
             <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-[#0a84ff]" />
                <h2 className="text-2xl font-bold text-slate-900">Your Top Matches</h2>
             </div>
             
             {matches.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {matches.map((match, idx) => (
                        <MatchCard key={idx} match={match} rank={idx + 1} />
                    ))}
                </div>
             ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                    <p className="text-slate-500">Finding matches...</p>
                </div>
             )}
        </div>

      </div>
    </div>
  );
}