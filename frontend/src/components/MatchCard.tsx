'use client';

import type { MatchResult } from '@/types';
import { MapPin, Music2, ArrowUpRight } from 'lucide-react';

interface MatchCardProps {
  match: MatchResult;
  rank: number;
}

// Noise pattern for texture
const NOISE_PATTERN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
  opacity: 0.08,
  mixBlendMode: 'overlay' as const,
  pointerEvents: 'none' as const,
  zIndex: 5,
};

const NoiseOverlay = () => (
  <div className="absolute inset-0 z-0 rounded-[2rem]" style={NOISE_PATTERN} />
);

// Arctic blue gradient based on score
function getGradientStyle(score: number): React.CSSProperties {
  if (score >= 90) return { 
    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 70%, #0369a1 100%)' 
  };
  if (score >= 70) return { 
    background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 30%, #0891b2 70%, #0e7490 100%)' 
  };
  if (score >= 50) return { 
    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #0284c7 80%, #075985 100%)' 
  };
  if (score >= 30) return { 
    background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 40%, #0ea5e9 80%, #0284c7 100%)' 
  };
  return { 
    background: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 30%, #38bdf8 70%, #0ea5e9 100%)' 
  };
}

// Ring color based on score
function getRingColor(score: number): string {
  if (score >= 85) return '#0ea5e9';
  if (score >= 70) return '#0891b2';
  return '#0284c7';
}

// Progress ring component
function ProgressRing({ score, size = 120, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getRingColor(score);

  return (
    <svg width={size} height={size} className="absolute -inset-1 pointer-events-none">
      <circle 
        cx={size / 2} 
        cy={size / 2} 
        r={radius} 
        fill="none" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth={strokeWidth} 
      />
      <circle
        cx={size / 2} 
        cy={size / 2} 
        r={radius} 
        fill="none" 
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round" 
        strokeDasharray={circumference} 
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
        style={{
          filter: `drop-shadow(0 0 6px ${color})`
        }}
      />
    </svg>
  );
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const cleanUsername = match.username?.replace('lastfm_', '') || 'Anonymous';
  const isGhost = !match.is_real;
  const gradientStyle = getGradientStyle(match.compatibility_score);
  const sharedArtists = match.shared_artists || [];
  const sharedArtistsCount = sharedArtists.length;
  const hasSharedArtists = sharedArtistsCount > 0;
  const topGenres = match.top_genres?.slice(0, 4) || [];
  const hasLocation = match.country && match.country !== 'None' && match.country.trim() !== '';
  const hasMetadata = hasLocation || sharedArtistsCount > 0;

  return (
    <a
      href={`https://www.last.fm/user/${cleanUsername}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer active:scale-[0.98]"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(56, 189, 248, 0.15)'
      }}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 transition-opacity duration-500" style={gradientStyle} />
      <NoiseOverlay />

      {/* Rank Badge */}
      <div className="absolute top-5 left-5 z-20">
        <div className="px-3.5 py-1.5 rounded-full shadow-lg" style={{
          background: 'rgba(5, 10, 14, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span className="text-sm font-bold" style={{ color: '#38bdf8' }}>#{rank}</span>
        </div>
      </div>

      {/* Suggested Badge */}
      {isGhost && (
        <div className="absolute top-5 right-5 z-20">
          <span className="text-xs px-3 py-1.5 rounded-full font-medium shadow-lg" style={{
            color: 'rgba(5, 10, 14, 0.8)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)'
          }}>
            Suggested
          </span>
        </div>
      )}

      <div className="relative pt-16 pb-4 px-4 h-full flex flex-col z-10">
        {/* WHITE FROSTED GLASS INNER CARD */}
        <div
          className="relative rounded-[1.5rem] p-5 pb-8 flex-grow flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}
        >
          <div className={`flex flex-col items-center text-center ${hasSharedArtists ? 'mb-4' : 'mb-2'}`}>
            
            {/* Avatar Section */}
            <div className="relative -mt-20 mb-3 group-hover:scale-105 transition-transform duration-300">
              <div className="relative w-[110px] h-[110px]">
                <ProgressRing score={match.compatibility_score} size={120} strokeWidth={5} />
                {match.profile_image ? (
                  <img
                    src={match.profile_image}
                    alt={cleanUsername}
                    className="w-[110px] h-[110px] rounded-full object-cover"
                    style={{
                      border: '4px solid rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                    onError={(e) => { 
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=0f172a&color=38bdf8&size=220&bold=true`; 
                    }}
                  />
                ) : (
                  <div 
                    className="w-[110px] h-[110px] rounded-full flex items-center justify-center font-bold text-4xl"
                    style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      border: '4px solid rgba(255, 255, 255, 0.9)',
                      color: '#38bdf8',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {cleanUsername.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Score Badge */}
                <div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
                  style={{
                    background: '#0ea5e9',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)'
                  }}
                >
                  <span className="text-sm font-extrabold" style={{ color: '#ffffff' }}>{match.compatibility_score}%</span>
                </div>
              </div>
            </div>

            {/* Username */}
            <h3 className="text-xl font-bold mb-1 truncate max-w-full" style={{ color: '#0f172a' }}>
              {cleanUsername}
            </h3>

            {/* Metadata Row */}
            {hasMetadata && (
              <div className="flex items-center justify-center gap-2 text-sm tracking-wide mt-1 font-medium" style={{ color: '#475569' }}>
                {hasLocation && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
                    <span>{match.country}</span>
                  </div>
                )}
                {hasLocation && sharedArtistsCount > 0 && (
                  <span style={{ color: '#94a3b8' }}>·</span>
                )}
                {sharedArtistsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Music2 className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
                    <span>{sharedArtistsCount} in common</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shared Artists */}
          {hasSharedArtists && (
            <div className="mb-4">
              <div className="text-[10px] font-bold mb-2 uppercase tracking-widest text-center" style={{ color: '#64748b' }}>
                Shared Artists
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {sharedArtists.slice(0, 4).map((artist, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors"
                    style={{
                      background: 'rgba(14, 165, 233, 0.12)',
                      border: '1px solid rgba(14, 165, 233, 0.25)',
                      color: '#0369a1'
                    }}
                  >
                    {artist}
                  </span>
                ))}
                {sharedArtists.length > 4 && (
                  <span className="text-xs px-2 py-1 font-medium" style={{ color: '#64748b' }}>
                    +{sharedArtists.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Genres */}
          {topGenres.length > 0 && (
            <div className="mt-auto pt-2">
              <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                {topGenres.map((genre, idx) => (
                  <span key={idx} className="flex items-center">
                    <span 
                      className="text-xs font-medium cursor-default transition-colors hover:text-[#0369a1]"
                      style={{ color: '#64748b' }}
                    >
                      {genre.toLowerCase()}
                    </span>
                    {idx < topGenres.length - 1 && (
                      <span className="text-[8px] mx-1" style={{ color: '#cbd5e1' }}>·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Arrow CTA */}
          <div 
            className="absolute bottom-3 right-4 p-1.5 rounded-full transition-all duration-300 group-hover:bg-[rgba(14,165,233,0.1)]"
            style={{ color: '#94a3b8' }}
          >
            <ArrowUpRight className="w-5 h-5 group-hover:text-[#0ea5e9] transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}