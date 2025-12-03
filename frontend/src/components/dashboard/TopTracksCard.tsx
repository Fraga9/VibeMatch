'use client';

import { TrendingUp, Disc3 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Track {
  name: string;
  artist: string;
  image?: string;
  playcount?: number;
}

interface TopTracksCardProps {
  tracks: Track[];
}

export function TopTracksCard({ tracks }: TopTracksCardProps) {
  return (
    <div className="col-span-12 lg:col-span-6 bento-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#22d3ee' }} />
          <h3 className="text-lg font-semibold">Top Tracks</h3>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{
          background: 'rgba(14, 165, 233, 0.08)',
          color: 'rgba(232, 244, 248, 0.5)'
        }}>All Time</span>
      </div>

      <div className="space-y-2">
        {tracks.slice(0, 5).map((track, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2.5 rounded-xl track-row"
          >
            <div className="relative w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden" style={{
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.15)'
            }}>
              {track.image ? (
                <>
                  <img src={track.image} className="w-full h-full object-cover" alt={track.name} />
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{
                    background: idx < 3
                      ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                      : 'rgba(5, 10, 14, 0.85)',
                    color: idx < 3 ? '#050a0e' : '#38bdf8',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {idx + 1}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full h-full flex items-center justify-center" style={{
                    background: idx < 3 ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'rgba(14, 165, 233, 0.1)'
                  }}>
                    <Disc3 className="w-5 h-5" style={{ color: 'rgba(232, 244, 248, 0.3)' }} />
                  </div>
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{
                    background: idx < 3 ? 'rgba(5, 10, 14, 0.85)' : 'rgba(14, 165, 233, 0.3)',
                    color: idx < 3 ? '#38bdf8' : 'rgba(232, 244, 248, 0.5)'
                  }}>
                    {idx + 1}
                  </div>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: '#e8f4f8' }}>{track.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(232, 244, 248, 0.5)' }}>{track.artist}</p>
            </div>
            <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg flex-shrink-0" style={{
              background: 'rgba(14, 165, 233, 0.08)',
              color: '#0ea5e9'
            }}>
              {formatNumber(track.playcount || 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
