'use client';

import { Heart, Sparkles, Music2, Users } from 'lucide-react';

export default function FloatingCards() {
  return (
    <div 
      style={{
        position: 'absolute',
        right: '5%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '300px'
      }}
      className="hidden lg:flex"
    >
      {/* AI Trained Card */}
      <div className="glass-card float-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <Sparkles size={24} color="#050a0e" />
        </div>
        <div className="stat-number" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>126K+</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          songs analyzed by our AI
        </div>
      </div>

      {/* Audio Wave Card */}
      <div className="glass-card float-card-delayed" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="audio-wave">
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>89% accuracy</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>finding your music twin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
