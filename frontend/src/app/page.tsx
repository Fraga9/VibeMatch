'use client';

import { useEffect, useState, useRef } from 'react';
import {
  BackgroundEffects,
  Navigation,
  HeroSection,
  HowItWorks,
  AboutSection
} from '@/components/landing';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const howItWorksRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');

        :root {
          --color-bg: #050a0e;
          --color-bg-secondary: #0a1218;
          --color-surface: rgba(56, 189, 248, 0.03);
          --color-surface-elevated: rgba(56, 189, 248, 0.06);
          --color-border: rgba(56, 189, 248, 0.1);
          --color-text: #e8f4f8;
          --color-text-muted: rgba(232, 244, 248, 0.5);
          --color-accent: #38bdf8;
          --color-accent-secondary: #06b6d4;
          --color-accent-tertiary: #22d3ee;
          --color-ice: #7dd3fc;
          --color-frost: #bae6fd;
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-body: 'Outfit', -apple-system, sans-serif;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          overflow-x: hidden; /* Critical for mobile */
          width: 100%;
        }

        body {
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
          overflow-x: hidden; /* Double safety */
          width: 100%;
          position: relative;
        }

        .background-wrapper {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .hero-gradient {
          position: absolute; /* Changed from fixed to absolute inside wrapper */
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(56, 189, 248, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, #050a0e 0%, #0a1218 100%);
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          animation: float 25s ease-in-out infinite;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          top: -250px;
          right: -150px;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #22d3ee 0%, #38bdf8 100%);
          bottom: -200px;
          left: -150px;
          animation-delay: -8s;
        }

        .orb-3 {
          width: 350px;
          height: 350px;
          background: linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%);
          top: 40%;
          left: 40%;
          transform: translate(-50%, -50%);
          animation-delay: -16s;
          opacity: 0.25;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -40px) scale(1.05); }
          50% { transform: translate(-30px, 30px) scale(0.95); }
          75% { transform: translate(30px, 40px) scale(1.02); }
        }

        .noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 1;
        }

        .glass-card {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.12);
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%);
          border-color: rgba(56, 189, 248, 0.2);
          transform: translateY(-4px);
        }

        .headline {
          font-family: var(--font-display);
          font-size: clamp(3.5rem, 10vw, 7rem);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        .headline-italic {
          font-style: italic;
          background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          padding: 0.75rem 1rem;
          min-width: 48px;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 100px;
          transition: all 0.3s ease;
          text-decoration: none;
          cursor: pointer;
          background: transparent;
          border: none;
        }

        .nav-link:hover {
          color: var(--color-text);
          background: rgba(56, 189, 248, 0.08);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.75rem;
          font-family: var(--font-body);
          font-size: 0.9375rem;
          font-weight: 500;
          color: #050a0e;
          background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2), 0 8px 32px -8px rgba(56, 189, 248, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3), 0 12px 40px -8px rgba(56, 189, 248, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-field {
          flex: 1;
          padding: 1rem 1.5rem;
          font-family: var(--font-body);
          font-size: 0.9375rem;
          color: var(--color-text);
          background: rgba(56, 189, 248, 0.05);
          border: 1px solid rgba(56, 189, 248, 0.12);
          border-radius: 100px;
          outline: none;
          transition: all 0.3s ease;
        }

        .input-field::placeholder { color: var(--color-text-muted); }
        .input-field:focus {
          background: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
        }
        .input-field:disabled { opacity: 0.5; cursor: not-allowed; }

        .stat-number {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 400;
          background: linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .audio-wave { display: flex; align-items: center; gap: 3px; height: 24px; }
        .audio-bar {
          width: 3px;
          background: linear-gradient(180deg, #38bdf8 0%, #06b6d4 100%);
          border-radius: 2px;
          animation: audioWave 1s ease-in-out infinite;
        }
        .audio-bar:nth-child(1) { animation-delay: 0s; }
        .audio-bar:nth-child(2) { animation-delay: 0.1s; }
        .audio-bar:nth-child(3) { animation-delay: 0.2s; }
        .audio-bar:nth-child(4) { animation-delay: 0.3s; }
        .audio-bar:nth-child(5) { animation-delay: 0.4s; }

        @keyframes audioWave {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-accent);
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.15);
          border-radius: 100px;
        }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          margin-top: 1rem;
        }
        .error-text { font-size: 0.875rem; color: #fca5a5; }

        .link {
          color: var(--color-accent);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .link:hover { opacity: 0.8; }

        .match-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--color-bg);
          margin-left: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .match-avatar:first-child { margin-left: 0; }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .float-card { animation: floatCard 6s ease-in-out infinite; }
        .float-card-delayed { animation: floatCard 6s ease-in-out infinite; animation-delay: -3s; }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .section-title {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 400;
          text-align: center;
          margin-bottom: 1rem;
        }

        .step-card {
          position: relative;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.06) 0%, rgba(6, 182, 212, 0.02) 100%);
          border: 1px solid rgba(56, 189, 248, 0.1);
          border-radius: 24px;
          transition: all 0.4s ease;
        }
        .step-card:hover {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(6, 182, 212, 0.04) 100%);
          border-color: rgba(56, 189, 248, 0.2);
          transform: translateY(-4px);
        }

        .step-number {
          position: absolute;
          top: -12px;
          left: 24px;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-style: italic;
          color: var(--color-accent);
          background: var(--color-bg);
          padding: 0 0.75rem;
        }

        .step-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .step-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; }
        .step-description { font-size: 0.9375rem; color: var(--color-text-muted); line-height: 1.6; }

        .gnn-visual { position: relative; width: 100%; max-width: 500px; height: 300px; margin: 0 auto; }
        .gnn-node {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          animation: nodeFloat 4s ease-in-out infinite;
        }
        .gnn-node-user {
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
          color: #050a0e;
          width: 64px;
          height: 64px;
          font-size: 0.875rem;
          z-index: 10;
          box-shadow: 0 0 40px rgba(56, 189, 248, 0.4);
        }
        .gnn-node-track {
          background: rgba(34, 211, 238, 0.2);
          border: 1px solid rgba(34, 211, 238, 0.3);
          color: var(--color-frost);
        }
        .gnn-node-artist {
          background: rgba(125, 211, 252, 0.2);
          border: 1px solid rgba(125, 211, 252, 0.3);
          color: var(--color-frost);
        }
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .embedding-bar {
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-tertiary) 100%);
          animation: embedPulse 2s ease-in-out infinite;
        }
        @keyframes embedPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .scroll-indicator { animation: bounce 2s ease-in-out infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .headline { 
            font-size: clamp(2.25rem, 11vw, 3.5rem);
            line-height: 1.1;
          }
          
          .nav-link {
            font-size: 0.8125rem;
            padding: 0.625rem 0.875rem;
          }
          
          .gnn-visual { height: 220px; }
          .gnn-node { width: 36px; height: 36px; font-size: 0.625rem; }
          .gnn-node-user { width: 48px; height: 48px; }
        }
      `}</style>

      <div className="background-wrapper">
        <div className="hero-gradient" />
        <BackgroundEffects />
        <div className="noise" />
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div className="w-full max-w-[1400px] mx-auto px-5 md:px-8">
          <Navigation 
            onHowItWorksClick={scrollToHowItWorks} 
            onAboutClick={scrollToAbout}
          />
        </div>
        <HeroSection onScrollToHowItWorks={scrollToHowItWorks} />
        <HowItWorks ref={howItWorksRef} />
        <AboutSection ref={aboutRef} />
      </div>
    </>
  );
}