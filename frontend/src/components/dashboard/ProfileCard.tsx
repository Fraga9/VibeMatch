'use client';

import { MapPin, Calendar, ExternalLink } from 'lucide-react';
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

  return (
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
            <div className="stat-value gradient-text">{matchesCount}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Matches</div>
          </div>
        </div>
      </div>
    </div>
  );
}
