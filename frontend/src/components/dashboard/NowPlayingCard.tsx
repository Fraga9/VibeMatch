'use client';

import { Radio, Disc3, Clock } from 'lucide-react';

interface Track {
  name: string;
  artist: string;
  image?: string;
  nowplaying?: boolean;
}

interface NowPlayingCardProps {
  recentTracks: Track[];
}

export function NowPlayingCard({ recentTracks }: NowPlayingCardProps) {
  const nowPlaying = recentTracks.find(t => t.nowplaying);
  const filteredTracks = recentTracks.filter(t => !t.nowplaying).slice(0, 5);

  return (
    <div className="col-span-12 lg:col-span-5 bento-card p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio 
            className="w-4 h-4" 
            style={{ color: nowPlaying ? '#22c55e' : 'rgba(232, 244, 248, 0.4)' }} 
          />
          <h3 className="text-sm font-medium" style={{ color: 'rgba(232, 244, 248, 0.7)' }}>
            {nowPlaying ? 'Now Playing' : 'Recently Played'}
          </h3>
        </div>
        {nowPlaying && (
          <div className="flex items-center gap-1.5">
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse" 
              style={{ background: '#22c55e' }} 
            />
            <span 
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: '#22c55e' }}
            >
              Live
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {nowPlaying ? (
          /* Now Playing State - Horizontal layout */
          <div className="flex gap-4 items-center h-full">
            {/* Album Art - Left side, 1:1 ratio, height matches content */}
            <div 
              className="relative aspect-square h-48 flex-shrink-0 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.1)'
              }}
            >
              {nowPlaying.image ? (
                <img 
                  src={nowPlaying.image} 
                  className="w-full h-full object-cover" 
                  alt={nowPlaying.name} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 
                    className="w-10 h-10 animate-[spin_3s_linear_infinite]" 
                    style={{ color: 'rgba(232, 244, 248, 0.15)' }} 
                  />
                </div>
              )}
            </div>
            
            {/* Track Info - Right side */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p 
                className="text-lg font-semibold truncate mb-1" 
                style={{ color: '#e8f4f8' }}
              >
                {nowPlaying.name}
              </p>
              <p 
                className="text-sm truncate mb-4" 
                style={{ color: 'rgba(232, 244, 248, 0.5)' }}
              >
                {nowPlaying.artist}
              </p>
              
              {/* Minimal Audio Visualizer */}
              <div className="flex items-end gap-[3px] h-4">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-[3px] rounded-full animate-pulse"
                    style={{ 
                      background: '#22c55e',
                      height: `${6 + Math.random() * 10}px`,
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Recent Tracks List */
          <div className="flex flex-col gap-1">
            {filteredTracks.slice(0, 4).map((track, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/[0.02]"
              >
                {/* Album Thumbnail */}
                <div 
                  className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{
                    background: 'rgba(14, 165, 233, 0.05)',
                    border: '1px solid rgba(232, 244, 248, 0.05)'
                  }}
                >
                  {track.image ? (
                    <img 
                      src={track.image} 
                      className="w-full h-full object-cover" 
                      alt={track.name} 
                    />
                  ) : (
                    <Disc3 
                      className="w-4 h-4" 
                      style={{ color: 'rgba(232, 244, 248, 0.2)' }} 
                    />
                  )}
                </div>
                
                {/* Track Info */}
                <div className="min-w-0 flex-1">
                  <p 
                    className="text-sm font-medium truncate" 
                    style={{ color: '#e8f4f8' }}
                  >
                    {track.name}
                  </p>
                  <p 
                    className="text-xs truncate" 
                    style={{ color: 'rgba(232, 244, 248, 0.4)' }}
                  >
                    {track.artist}
                  </p>
                </div>
                
                {/* Time indicator */}
                <Clock 
                  className="w-3 h-3 flex-shrink-0" 
                  style={{ color: 'rgba(232, 244, 248, 0.15)' }} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}