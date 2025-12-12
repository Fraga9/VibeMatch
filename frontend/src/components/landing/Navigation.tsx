'use client';

import Image from 'next/image';

interface NavigationProps {
  onHowItWorksClick: () => void;
  onAboutClick: () => void;
}

export default function Navigation({ onHowItWorksClick, onAboutClick }: NavigationProps) {
  return (
    <nav className="flex items-center justify-between py-4 md:py-6 w-full">
      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        <Image
          src="/vibes.svg"
          alt="VibeMatch Logo"
          width={36}
          height={36}
          className="md:w-10 md:h-10"
          style={{ borderRadius: '12px' }}
        />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.125rem, 4vw, 1.5rem)',
          fontWeight: 400
        }}>VibeMatch</span>
      </div>

      {/* Navigation Links - Improved touch targets */}
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={onHowItWorksClick}
          className="nav-link"
          style={{
            minWidth: '48px',
            minHeight: '48px',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem'
          }}
        >
          How it Works
        </button>
        <button
          onClick={onAboutClick}
          className="nav-link"
          style={{
            minWidth: '48px',
            minHeight: '48px',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem'
          }}
        >
          About
        </button>
      </div>
    </nav>
  );
}