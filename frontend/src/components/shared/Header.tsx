'use client';

import Image from 'next/image';

interface HeaderProps {
  variant?: 'landing' | 'dashboard';
  rightContent?: React.ReactNode;
}

export default function Header({ variant = 'landing', rightContent }: HeaderProps) {
  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: 'transparent',
        borderColor: 'transparent'
      }}
    >
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image
              src="/vibes.svg"
              alt="VibeMatch Logo"
              width={45}
              height={45}
              className="rounded-xl transition-transform group-hover:scale-105"
            />
          </div>
          <span
            className="text-xl font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VibeMatch
          </span>
        </a>

        {/* Right Content Slot */}
        {rightContent}
      </div>
    </nav>
  );
}
