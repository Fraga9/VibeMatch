'use client';

export function DashboardBackground() {
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse 100% 80% at 0% 0%, rgba(14, 165, 233, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 80% 60% at 100% 100%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
          linear-gradient(180deg, #050a0e 0%, #071015 100%)
        `
      }} />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.015]" style={{
        backgroundImage: `
          linear-gradient(rgba(14, 165, 233, 1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(14, 165, 233, 1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />
    </>
  );
}
