'use client';

export function DashboardStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');

      :root {
        --color-bg: #050a0e;
        --color-surface: rgba(14, 165, 233, 0.04);
        --color-border: rgba(14, 165, 233, 0.12);
        --color-text: #e8f4f8;
        --color-text-muted: rgba(232, 244, 248, 0.5);
        --color-accent: #0ea5e9;
        --color-accent-light: #38bdf8;
        --font-display: 'Instrument Serif', Georgia, serif;
        --font-body: 'Outfit', -apple-system, sans-serif;
      }

      * { box-sizing: border-box; }
      
      body {
        font-family: var(--font-body);
        background: var(--color-bg);
        color: var(--color-text);
        margin: 0;
      }

      .bento-card {
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(6, 182, 212, 0.02) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(14, 165, 233, 0.1);
        border-radius: 24px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .bento-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 24px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, transparent 50%, rgba(6, 182, 212, 0.1) 100%);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      .bento-card:hover::before {
        opacity: 1;
      }

      .bento-card:hover {
        transform: translateY(-2px);
        border-color: rgba(14, 165, 233, 0.2);
        box-shadow: 0 20px 40px -20px rgba(14, 165, 233, 0.15);
      }

      .gradient-text {
        background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #a5f3fc 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-value {
        font-family: var(--font-display);
        font-size: 2.5rem;
        font-weight: 400;
        letter-spacing: -0.02em;
      }

      .now-playing-pulse {
        animation: nowPlayingPulse 2s ease-in-out infinite;
      }

      @keyframes nowPlayingPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
        50% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
      }

      .audio-visualizer {
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: 32px;
      }

      .audio-bar {
        width: 4px;
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        border-radius: 2px;
        animation: audioBar 1s ease-in-out infinite;
      }

      @keyframes audioBar {
        0%, 100% { height: 8px; }
        50% { height: 100%; }
      }

      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

      .track-row {
        transition: all 0.3s ease;
      }
      
      .track-row:hover {
        background: rgba(14, 165, 233, 0.06);
      }

      .artist-card {
        position: relative;
        padding: 1rem;
        border-radius: 16px;
        background: rgba(14, 165, 233, 0.04);
        border: 1px solid rgba(14, 165, 233, 0.08);
        transition: all 0.3s ease;
      }

      .artist-card:hover {
        background: rgba(14, 165, 233, 0.08);
        border-color: rgba(14, 165, 233, 0.15);
        transform: translateY(-2px);
      }

      .rank-badge {
        position: absolute;
        top: -8px;
        left: -8px;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        color: #050a0e;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }
    `}</style>
  );
}
