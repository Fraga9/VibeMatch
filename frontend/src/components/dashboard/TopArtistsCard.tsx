'use client';

import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Artist {
  name: string;
  playcount: number;
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {artists.slice(0, 6).map((artist, idx) => (
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
  );
}
