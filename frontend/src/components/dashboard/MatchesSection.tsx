'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';

interface MatchesSectionProps {
  matches: any[];
}

export function MatchesSection({ matches }: MatchesSectionProps) {
  return (
    <div className="col-span-12 mt-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.2)'
        }}>
          <Sparkles className="w-5 h-5" style={{ color: '#0ea5e9' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Your Top <span className="gradient-text">Matches</span>
        </h2>
      </div>
      
      {matches.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {matches.slice(0, 8).map((match, idx) => (
            <MatchCard key={idx} match={match} rank={idx + 1} />
          ))}
        </div>
      ) : (
        <div className="bento-card p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: '#0ea5e9' }} />
          <p style={{ color: 'rgba(232, 244, 248, 0.5)' }}>Finding your matches...</p>
        </div>
      )}
    </div>
  );
}
