'use client';

import Image from 'next/image';

interface NavigationProps {
  onHowItWorksClick: () => void;
  onAboutClick: () => void;
}

export default function Navigation({ onHowItWorksClick, onAboutClick }: NavigationProps) {
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
        <Image
          src="/vibes.svg"
          alt="VibeMatch Logo"
          width={40}
          height={40}
          style={{ borderRadius: '12px' }}
        />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 400
        }}>VibeMatch</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={onHowItWorksClick} className="nav-link">How it Works</button>
        <button onClick={onAboutClick} className="nav-link">About</button>
      </div>
    </nav>
  );
}