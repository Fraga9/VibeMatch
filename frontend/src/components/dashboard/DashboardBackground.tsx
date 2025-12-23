'use client';

import Aurora from '../shared/Aurora';

export function DashboardBackground() {
  return (
    <>
      {/* Base dark gradient */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, #030709 0%, #050a0e 50%, #040810 100%)`
      }} />

      {/* Aurora effect */}
      <Aurora
        colorStops={['#0ea5e9', '#22d3ee', '#06b6d4']}
        blend={0.6}
        amplitude={1.2}
        speed={0.3}
      />

      {/* Subtle noise texture for depth */}
      <div className="fixed inset-0 z-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }} />
    </>
  );
}
