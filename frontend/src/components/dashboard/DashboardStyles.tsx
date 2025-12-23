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
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        transition: background 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .bento-card:hover {
        background: rgba(255, 255, 255, 0.05);
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
        transition: background 0.2s ease;
      }

      .track-row:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .artist-card {
        position: relative;
        padding: 1rem;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .artist-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
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
