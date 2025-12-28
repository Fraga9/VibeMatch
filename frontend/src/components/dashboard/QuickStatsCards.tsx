'use client';

import { Headphones, BarChart2 } from 'lucide-react';

interface QuickStatsCardsProps {
  playcount: number;
  registered?: number;
}

const NoiseOverlay = () => (
  <div 
    className="absolute inset-0 rounded-2xl pointer-events-none z-[1] opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'overlay',
    }} 
  />
);

export function QuickStatsCards({ playcount, registered }: QuickStatsCardsProps) {
  const listeningHours = Math.round(playcount * 3.5 / 60);
  const avgPerDay = registered 
    ? Math.round(playcount / ((Date.now() / 1000 - registered) / 86400)) 
    : 0;

  return (
    <div className="col-span-12 md:col-span-12 lg:col-span-3 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
      {/* Listening Time Card */}
      <div 
        className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(8, 145, 178, 0.06) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
          boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.15), 0 4px 24px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
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
        
        <div className="relative z-10 p-5 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl" style={{
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              <Headphones className="w-4 h-4" style={{ color: '#0ea5e9' }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>
              Listening Time
            </span>
          </div>
          <div>
            <div 
              className="text-4xl font-bold leading-none mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {listeningHours}h
            </div>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(232, 244, 248, 0.3)' }}>
              ~3.5 min avg per track
            </p>
          </div>
        </div>
      </div>

      {/* Avg per Day Card */}
      <div 
        className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(8, 145, 178, 0.06) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid transparent',
          backgroundClip: 'padding-box',
          boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.15), 0 4px 24px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
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
        
        <div className="relative z-10 p-5 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl" style={{
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              <BarChart2 className="w-4 h-4" style={{ color: '#22d3ee' }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>
              Avg per Day
            </span>
          </div>
          <div>
            <div 
              className="text-4xl font-bold leading-none mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(135deg, #ffffff 0%, #22d3ee 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {avgPerDay}
            </div>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(232, 244, 248, 0.3)' }}>
              tracks scrobbled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
