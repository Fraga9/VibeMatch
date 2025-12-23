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
    <div className="col-span-12 md:col-span-6 lg:col-span-6 bento-card p-5 flex flex-col">
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
          <div className="flex flex-col sm:flex-row gap-4 items-center h-full">
            {/* Album Art - Responsive sizing */}
            <div 
              className="relative aspect-square w-32 sm:w-40 md:w-48 lg:w-52 flex-shrink-0 rounded-xl overflow-hidden"
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
            <div className="flex-1 min-w-0 flex flex-col justify-center w-full sm:w-auto">
              <p 
                className="text-lg font-semibold truncate mb-1 text-center sm:text-left" 
                style={{ color: '#e8f4f8' }}
              >
                {nowPlaying.name}
              </p>
              <p 
                className="text-sm truncate mb-4 text-center sm:text-left" 
                style={{ color: 'rgba(232, 244, 248, 0.5)' }}
              >
                {nowPlaying.artist}
              </p>
              
              {/* Wave Audio Visualizer - Snake-like animation */}
              <div className="relative w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #22c55e 50%, transparent 100%)',
                    animation: 'wave 2s ease-in-out infinite',
                    width: '50%'
                  }}
                />
                <style jsx>{`
                  @keyframes wave {
                    0% {
                      transform: translateX(-100%);
                    }
                    100% {
                      transform: translateX(300%);
                    }
                  }
                `}</style>
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