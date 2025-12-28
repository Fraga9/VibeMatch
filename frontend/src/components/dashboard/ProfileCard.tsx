'use client';

import { MapPin, Calendar, ExternalLink, Music2, Users, Disc } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface ProfileCardProps {
  user: {
    username?: string;
    real_name?: string;
    country?: string;
    image?: string;
    registered?: number;
    url?: string;
    playcount?: number;
    top_artists?: any[];
  } | null;
  storedUsername: string;
  matchesCount: number;
}

export function ProfileCard({ user, storedUsername, matchesCount }: ProfileCardProps) {
  const joinDate = user?.registered 
    ? new Date(user.registered * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : null;

  const profileImg = user?.image || `https://ui-avatars.com/api/?name=${storedUsername}&background=0a1218&color=0ea5e9`;

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3 bento-card overflow-hidden group">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 opacity-20 blur-[60px] saturate-200 pointer-events-none transition-transform duration-700 group-hover:scale-110">
        <img src={profileImg} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative z-10 p-6 flex flex-col h-full items-center text-center">
        {/* Large Avatar Section */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse" style={{ background: '#0ea5e9' }} />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-white/10 backdrop-blur-md border border-white/20">
            <img 
              src={profileImg} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full shadow-2xl"
            />
            <a 
              href={user?.url || `https://last.fm/user/${storedUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-1 right-1 p-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white hover:scale-110 transition-transform"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {user?.real_name || user?.username}
          </h1>
          <p className="text-sm font-medium text-cyan-400/80">@{user?.username}</p>
        </div>

        {/* Minimal Meta Info */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {user?.country && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <MapPin className="w-3 h-3 text-cyan-500/60" /> {user.country}
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <Calendar className="w-3 h-3 text-cyan-500/60" /> {joinDate}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <Disc className="w-3 h-3 text-cyan-500/60" /> {formatNumber(user?.playcount || 0)} Scrobbles
          </div>
        </div>
      </div>
    </div>
  );
}
