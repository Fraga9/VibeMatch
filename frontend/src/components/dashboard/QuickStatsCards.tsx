'use client';

import { Headphones, BarChart2 } from 'lucide-react';

interface QuickStatsCardsProps {
  playcount: number;
  registered?: number;
}

export function QuickStatsCards({ playcount, registered }: QuickStatsCardsProps) {
  const listeningHours = Math.round(playcount * 3.5 / 60);
  const avgPerDay = registered 
    ? Math.round(playcount / ((Date.now() / 1000 - registered) / 86400)) 
    : 0;

  return (
    <div className="col-span-12 md:col-span-12 lg:col-span-3 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
      <div className="bento-card p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-4 h-4" style={{ color: '#0ea5e9' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Listening Time</span>
        </div>
        <div>
          <div className="stat-value gradient-text" style={{ fontSize: '2rem' }}>
            {listeningHours}h
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>~3.5 min avg per track</p>
        </div>
      </div>

      <div className="bento-card p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="w-4 h-4" style={{ color: '#22d3ee' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>Avg per Day</span>
        </div>
        <div>
          <div className="stat-value gradient-text" style={{ fontSize: '2rem' }}>
            {avgPerDay}
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>tracks scrobbled</p>
        </div>
      </div>
    </div>
  );
}
