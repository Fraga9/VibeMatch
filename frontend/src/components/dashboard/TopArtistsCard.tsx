'use client';

import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Artist {
  name: string;
  playcount: number;
  image?: string;
  mbid?: string;
}

interface TopArtistsCardProps {
  artists: Artist[];
}

export function TopArtistsCard({ artists }: TopArtistsCardProps) {
  return (
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

      <div className="space-y-2">
        {artists.slice(0, 5).map((artist, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2.5 rounded-xl track-row"
          >
            {/* Ranking Number */}
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{
              color: idx < 3 ? '#0ea5e9' : 'rgba(232, 244, 248, 0.5)',
              fontFamily: 'var(--font-display)'
            }}>
              {idx + 1}
            </div>

            {/* Artist Image - Clean */}
            <div className="relative w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden" style={{
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.15)'
            }}>
              {artist.image ? (
                <img src={artist.image} className="w-full h-full object-cover" alt={artist.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                }}>
                  <div className="text-sm font-bold" style={{ color: '#050a0e' }}>
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: '#e8f4f8' }}>
                {artist.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>
                {formatNumber(artist.playcount || 0)} plays
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
