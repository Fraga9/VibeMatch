'use client';

import type { MatchResult } from '@/types';
import { Music2, MapPin, Users } from 'lucide-react';

interface MatchCardProps {
  match: MatchResult;
  rank: number;
}

// Generate radial gradient colors based on compatibility score
function getGradientStyle(score: number): React.CSSProperties {
  if (score >= 90) {
    // Perfect match - vibrant pink/orange/blue
    return {
      background: 'radial-gradient(circle at 30% 70%, #f472b6 0%, #fb923c 30%, #fde68a 50%, #93c5fd 80%, #c4b5fd 100%)'
    };
  } else if (score >= 75) {
    // Great match - warm orange/pink/purple
    return {
      background: 'radial-gradient(circle at 40% 60%, #fb923c 0%, #f472b6 35%, #a78bfa 70%, #93c5fd 100%)'
    };
  } else if (score >= 60) {
    // Good match - blue/purple/pink
    return {
      background: 'radial-gradient(circle at 50% 50%, #818cf8 0%, #c084fc 30%, #f0abfc 60%, #fecdd3 100%)'
    };
  } else if (score >= 45) {
    // Moderate match - teal/blue/purple
    return {
      background: 'radial-gradient(circle at 60% 40%, #5eead4 0%, #7dd3fc 35%, #a5b4fc 70%, #ddd6fe 100%)'
    };
  } else {
    // Low match - gray/blue soft
    return {
      background: 'radial-gradient(circle at 50% 50%, #cbd5e1 0%, #bfdbfe 40%, #ddd6fe 80%, #e2e8f0 100%)'
    };
  }
}

function getMatchLabel(score: number): { text: string; color: string } {
  if (score >= 90) return { text: 'Perfect Match', color: 'bg-pink-100 text-pink-700' };
  if (score >= 75) return { text: 'Great Match', color: 'bg-orange-100 text-orange-700' };
  if (score >= 60) return { text: 'Good Match', color: 'bg-blue-100 text-blue-700' };
  if (score >= 45) return { text: 'Moderate', color: 'bg-teal-100 text-teal-700' };
  return { text: 'Exploring', color: 'bg-gray-100 text-gray-600' };
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const cleanUsername = match.username?.replace('lastfm_', '') || 'Anonymous';
  const isGhost = !match.is_real;
  const gradientStyle = getGradientStyle(match.compatibility_score);
  const matchLabel = getMatchLabel(match.compatibility_score);
  
  // Stats
  const sharedArtistsCount = match.shared_artists?.length || 0;
  const topGenres = match.top_genres?.slice(0, 4) || [];

  return (
    <div 
      className="relative rounded-[2rem] overflow-hidden shadow-xl transition-shadow duration-300 hover:shadow-2xl"
      style={{ minHeight: '420px' }}
    >
      {/* Radial Gradient Background */}
      <div 
        className="absolute inset-0"
        style={gradientStyle}
      />
      
      {/* Rank Badge - Top Left */}
      <div className="absolute top-5 left-5 z-10">
        <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md">
          <span className="text-sm font-bold text-gray-800">#{rank}</span>
        </div>
      </div>

      {/* Compatibility Score - Top Right */}
      <div className="absolute top-5 right-5 z-10">
        <div className="text-right">
          <div className="text-4xl font-bold text-gray-800">{match.compatibility_score}%</div>
          <div className="text-xs text-gray-600 uppercase tracking-wider font-medium">Match</div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative pt-20 pb-5 px-4">
        {/* White Card Section */}
        <div 
          className="bg-white rounded-[1.5rem] p-6 shadow-lg"
          style={{ minHeight: '320px' }}
        >
          {/* Profile Section */}
          <div className="flex items-start gap-4 mb-5">
            {/* Profile Picture - Overlapping the gradient */}
            <div className="-mt-16">
              {match.profile_image ? (
                <img
                  src={match.profile_image}
                  alt={cleanUsername}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=1f2937&color=fff&size=192&bold=true`;
                  }}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-xl">
                  {cleanUsername.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name and Badges */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{cleanUsername}</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${matchLabel.color}`}>
                  {matchLabel.text}
                </span>
                {isGhost && (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold border border-orange-300 bg-orange-50 text-orange-600">
                    Suggested
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-5 mb-5 text-sm text-gray-500">
            {match.country && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{match.country}</span>
              </div>
            )}
            {!match.country && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>None</span>
              </div>
            )}
            {sharedArtistsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{sharedArtistsCount} artists</span>
              </div>
            )}
          </div>

          {/* Shared Artists */}
          {match.shared_artists && match.shared_artists.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wider">
                <Music2 className="w-3.5 h-3.5" />
                <span>Shared Artists</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.shared_artists.slice(0, 5).map((artist, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium"
                  >
                    {artist}
                  </span>
                ))}
                {match.shared_artists.length > 5 && (
                  <span className="text-gray-400 text-xs px-2 py-1.5 font-medium">
                    +{match.shared_artists.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Genres */}
          {topGenres.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {topGenres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-900 text-white text-xs px-3.5 py-1.5 rounded-full font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <a
            href={`https://www.last.fm/user/${cleanUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full px-6 py-3.5 bg-[#0a84ff]  hover:bg-[#0066cc] text-white text-sm font-semibold rounded-full transition-colors shadow-lg"
          >
            View Profile
          </a>
        </div>
      </div>
    </div>
  );
}