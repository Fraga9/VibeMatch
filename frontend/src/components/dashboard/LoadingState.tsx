'use client';

import { useState, useEffect } from 'react';
import './LoadingState.css';

const loadingWords = [
  'Thinking',
  'Analyzing',
  'Processing',
  'Loading',
  'Syncing',
  'Connecting',
  'Fetching',
  'Computing',
];

export function LoadingState() {
  const [currentWord, setCurrentWord] = useState(loadingWords[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentWord(prev => {
          const currentIndex = loadingWords.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingWords.length;
          return loadingWords[nextIndex];
        });
        setIsTransitioning(false);
      }, 150);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      <span className={`loading-text ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {currentWord}
        <span className="dots">...</span>
      </span>
    </div>
  );
}

export default LoadingState;