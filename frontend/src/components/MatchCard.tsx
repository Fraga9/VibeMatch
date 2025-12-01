'use client';

import type { MatchResult } from '@/types';
import { getCompatibilityEmoji, formatNumber } from '@/lib/utils';
import { Music2, MapPin, Sparkles } from 'lucide-react';

interface MatchCardProps {
  match: MatchResult;
  rank: number;
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const displayName = match.username || `Anonymous User`;
  const isGhost = !match.is_real;

  return (
    <div className="glass-card p-6 hover:bg-white/80 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div className="bg-[#0a84ff] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <span className="text-xl font-bold text-white">#{rank}</span>
          </div>

          {/* Profile Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
              {isGhost && (
                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full border border-blue-200/50">
                  Suggested
                </span>
              )}
            </div>
            {match.country && (
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-3 h-3" />
                <span>{match.country}</span>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility Score */}
        <div className="text-right">
          <div className="text-3xl mb-1">{getCompatibilityEmoji(match.compatibility_score)}</div>
          <div className="text-2xl font-bold text-gray-900">{match.compatibility_score}%</div>
          <div className="text-xs text-gray-500">Match</div>
        </div>
      </div>

      {/* Shared Artists */}
      {match.shared_artists.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-gray-700 text-sm mb-2">
            <Music2 className="w-4 h-4" />
            <span className="font-semibold">Shared Artists</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {match.shared_artists.slice(0, 5).map((artist, idx) => (
              <span
                key={idx}
                className="bg-white/60 backdrop-blur-sm text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-200/50"
              >
                {artist}
              </span>
            ))}
            {match.shared_artists.length > 5 && (
              <span className="text-gray-500 text-xs px-3 py-1">
                +{match.shared_artists.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Genres */}
      {match.top_genres.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-gray-700 text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">Top Genres</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {match.top_genres.slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className="bg-blue-500/10 text-blue-600 text-xs px-3 py-1 rounded-full border border-blue-200/50"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {match.is_real && match.username && (
          <a
            href={`https://www.last.fm/user/${match.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 bg-white/80 hover:bg-white text-gray-700 text-sm font-medium rounded-full transition-all border border-gray-200/50"
          >
            View Profile
          </a>
        )}
        <button className="flex-1 px-4 py-2 bg-[#0a84ff] hover:bg-[#0066cc] text-white text-sm font-medium rounded-full transition-all shadow-lg shadow-blue-500/25">
          Create Playlist
        </button>
      </div>
    </div>
  );
}
