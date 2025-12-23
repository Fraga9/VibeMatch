'use client';

import { useEffect, useState, useRef } from 'react';
import {
  BackgroundEffects,
  HeroSection,
  HowItWorks,
  AboutSection
} from '@/components/landing';
import { Header } from '@/components/shared';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const howItWorksRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToHowItWorks = () => {
    const headerOffset = 80;
    const element = howItWorksRef.current;
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const headerOffset = 80;
    const element = aboutRef.current;
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  if (!mounted) return null;

  return (
    <>
      <div className="background-wrapper">
        <div className="hero-gradient" />
        <BackgroundEffects />
        <div className="noise" />
      </div>

      <Header
        variant="landing"
        rightContent={
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={scrollToHowItWorks}
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
              onClick={scrollToAbout}
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
        }
      />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <HeroSection onScrollToHowItWorks={scrollToHowItWorks} />
        <HowItWorks ref={howItWorksRef} />
        <AboutSection ref={aboutRef} />
      </div>
    </>
  );
}