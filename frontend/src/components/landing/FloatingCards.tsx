'use client';

import { Heart } from 'lucide-react';

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
        maxWidth: '280px'
      }}
      className="hidden lg:flex"
    >
      {/* Stats Card */}
      <div className="glass-card float-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div className="stat-number">50,000+</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Perfect matches made
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
            <p style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Analyzing vibes...</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>AI-powered matching</p>
          </div>
        </div>
      </div>

      {/* Testimonial Card */}
      <div className="glass-card float-card" style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          "Found my concert buddy through VibeMatch. We've been to 5 shows together already!"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Heart size={16} color="#050a0e" />
          </div>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Sarah K.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@sarahbeats</p>
          </div>
        </div>
      </div>
    </div>
  );
}
