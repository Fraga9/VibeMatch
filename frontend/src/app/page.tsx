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