'use client';

import type { MatchResult } from '@/types';
import { MapPin, Music2, ArrowUpRight } from 'lucide-react';

interface MatchCardProps {
  match: MatchResult;
  rank: number;
}

// Subtle noise texture overlay
const NoiseOverlay = () => (
  <div 
    className="absolute inset-0 rounded-2xl pointer-events-none z-[1] opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'overlay',
    }} 
  />
);

// Glow effect behind avatar
const AvatarGlow = ({ score }: { score: number }) => {
  const intensity = Math.min(0.6, score / 100);
  return (
    <div 
      className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background: `radial-gradient(circle, rgba(14, 165, 233, ${intensity}) 0%, rgba(6, 182, 212, ${intensity * 0.5}) 50%, transparent 70%)`,
        opacity: 0.7,
        transform: 'scale(1.5)',
      }}
    />
  );
};

// Progress ring around avatar
function ProgressRing({ score, size = 100, strokeWidth = 3 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      {/* Background ring */}
      <circle 
        cx={size / 2} 
        cy={size / 2} 
        r={radius} 
        fill="none" 
        stroke="rgba(255, 255, 255, 0.1)" 
        strokeWidth={strokeWidth} 
      />
      {/* Progress ring */}
      <circle
        cx={size / 2} 
        cy={size / 2} 
        r={radius} 
        fill="none" 
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round" 
        strokeDasharray={circumference} 
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
        style={{ filter: 'drop-shadow(0 0 6px rgba(14, 165, 233, 0.6))' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const cleanUsername = match.username?.replace('lastfm_', '') || 'Anonymous';
  const isGhost = !match.is_real;
  const sharedArtists = match.shared_artists || [];
  const sharedArtistsCount = sharedArtists.length;
  const topGenres = match.top_genres?.slice(0, 4) || [];
  const hasLocation = match.country && match.country !== 'None' && match.country.trim() !== '';

  return (
    <a
      href={`https://www.last.fm/user/${cleanUsername}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(8, 145, 178, 0.06) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `
          0 0 0 1px rgba(14, 165, 233, 0.15),
          0 4px 24px -4px rgba(0, 0, 0, 0.3),
          0 0 40px -10px rgba(14, 165, 233, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Gradient border effect */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, transparent 40%, transparent 60%, rgba(14, 165, 233, 0.2) 100%)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      
      <NoiseOverlay />

      {/* Card Content */}
      <div className="relative z-10 p-5">
        
        {/* Top Row: Rank + Suggested Badge */}
        <div className="flex items-center justify-between mb-5">
          <div 
            className="px-3 py-1 rounded-lg text-sm font-bold"
            style={{
              background: 'rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              color: '#38bdf8',
              textShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
            }}
          >
            #{rank}
          </div>
          
          {isGhost && (
            <span 
              className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Suggested
            </span>
          )}
        </div>

        {/* Main Content: Avatar + Score + Info */}
        <div className="flex items-start gap-5">
          
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            <AvatarGlow score={match.compatibility_score} />
            
            <div className="relative w-[100px] h-[100px]">
              <ProgressRing score={match.compatibility_score} size={100} strokeWidth={3} />
              
              {match.profile_image ? (
                <img
                  src={match.profile_image}
                  alt={cleanUsername}
                  className="absolute inset-[6px] w-[88px] h-[88px] rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    border: '2px solid rgba(14, 165, 233, 0.3)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=0c1820&color=38bdf8&size=176&bold=true`; 
                  }}
                />
              ) : (
                <div 
                  className="absolute inset-[6px] w-[88px] h-[88px] rounded-full flex items-center justify-center font-bold text-3xl transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(8, 145, 178, 0.3) 100%)',
                    border: '2px solid rgba(14, 165, 233, 0.3)',
                    color: '#38bdf8',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {cleanUsername.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0 pt-1">
            
            {/* Score - Large & Bold */}
            <div className="mb-2">
              <span 
                className="text-4xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #0ea5e9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3))',
                }}
              >
                {match.compatibility_score}%
              </span>
              <span 
                className="text-[10px] font-semibold uppercase tracking-widest ml-2"
                style={{ color: 'rgba(56, 189, 248, 0.6)' }}
              >
                Match
              </span>
            </div>

            {/* Username */}
            <h3 
              className="text-lg font-bold truncate mb-1.5 group-hover:text-cyan-300 transition-colors"
              style={{ color: '#f0f9ff' }}
            >
              {cleanUsername}
            </h3>

            {/* Location & Common Count */}
            <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
              {hasLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" style={{ color: 'rgba(14, 165, 233, 0.6)' }} />
                  <span>{match.country}</span>
                </div>
              )}
              {sharedArtistsCount > 0 && (
                <div className="flex items-center gap-1">
                  <Music2 className="w-3 h-3" style={{ color: 'rgba(14, 165, 233, 0.6)' }} />
                  <span>{sharedArtistsCount} in common</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shared Artists - Glass Pills */}
        {sharedArtistsCount > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(14, 165, 233, 0.1)' }}>
            <div 
              className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2.5"
              style={{ color: 'rgba(148, 163, 184, 0.5)' }}
            >
              Shared Artists
            </div>
            <div className="flex flex-wrap gap-2">
              {sharedArtists.slice(0, 4).map((artist, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 hover:border-cyan-400/50"
                  style={{
                    background: 'rgba(14, 165, 233, 0.08)',
                    border: '1px solid rgba(14, 165, 233, 0.15)',
                    color: 'rgba(224, 242, 254, 0.9)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {artist}
                </span>
              ))}
              {sharedArtists.length > 4 && (
                <span 
                  className="text-xs px-2 py-1.5 font-medium"
                  style={{ color: 'rgba(148, 163, 184, 0.5)' }}
                >
                  +{sharedArtists.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Genres */}
        {topGenres.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
            {topGenres.map((genre, idx) => (
              <span key={idx} className="flex items-center">
                <span 
                  className="text-[11px] font-medium"
                  style={{ color: 'rgba(100, 116, 139, 0.7)' }}
                >
                  {genre.toLowerCase()}
                </span>
                {idx < topGenres.length - 1 && (
                  <span className="text-[8px] mx-1.5" style={{ color: 'rgba(100, 116, 139, 0.3)' }}>•</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Arrow CTA */}
        <div 
          className="absolute top-5 right-5 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:bg-cyan-500/10"
          style={{ color: 'rgba(56, 189, 248, 0.4)' }}
        >
          <ArrowUpRight className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>

      {/* Bottom Glow Line */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] w-0 group-hover:w-3/4 transition-all duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.5), transparent)',
        }}
      />
    </a>
  );
}