'use client';

import { Music } from 'lucide-react';

interface NavigationProps {
  onHowItWorksClick: () => void;
}

export default function Navigation({ onHowItWorksClick }: NavigationProps) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.5rem 2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Music size={20} color="#050a0e" />
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 400
        }}>VibeMatch</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={onHowItWorksClick} className="nav-link">How it Works</button>
        <a href="#" className="nav-link">About</a>
      </div>
    </nav>
  );
}
