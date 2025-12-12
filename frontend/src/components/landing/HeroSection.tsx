'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Headphones, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import axios from 'axios';
import FloatingCards from './FloatingCards';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface HeroSectionProps {
  onScrollToHowItWorks: () => void;
}

export default function HeroSection({ onScrollToHowItWorks }: HeroSectionProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/simple?username=${username}`);
      const { access_token } = response.data;

      localStorage.setItem('vibematch_token', access_token);
      localStorage.setItem('vibematch_username', username);

      await axios.post(
        `${API_URL}/user/embedding`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.response?.status === 404) {
        setError(`User "${username}" not found on Last.fm. Please check the username.`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to login. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <section 
      className="px-5 py-8 md:p-8"
      style={{
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
      <div style={{ maxWidth: '720px', position: 'relative', zIndex: 10, width: '100%' }}>
        {/* Badge */}
        <div className="badge mb-6 md:mb-8">
          <span className="pulse-dot" />
          <span>1,337 matches made today</span>
        </div>

        {/* Headline */}
        <h1 className="headline mb-4 md:mb-6">
          Find your{' '}
          <span className="headline-italic">music</span>
          <br />
          soulmate
        </h1>

        {/* Description */}
        <p 
          className="text-lg md:text-xl mb-8 md:mb-10"
          style={{
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            maxWidth: '540px'
          }}
        >
          Connect through the music you love. Our AI analyzes your listening history
          and matches you with people who share your exact vibe.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ maxWidth: '480px', width: '100%' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Last.fm username"
              disabled={loading}
              className="input-field w-full"
              required
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-box">
              <AlertCircle size={18} color="#fca5a5" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p className="error-text">{error}</p>
            </div>
          )}

          <p style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)'
          }}>
            Don't have a Last.fm account?{' '}
            <a
              href="https://www.last.fm/join"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Create one here
            </a>
          </p>
        </form>

        {/* Social Proof */}
        <div 
          className="mt-8 md:mt-12 pt-8 border-t flex flex-wrap items-center gap-4"
          style={{
            borderColor: 'var(--color-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="match-avatar"
                style={{
                  background: `linear-gradient(135deg, hsl(${190 + i * 10}, 80%, ${50 + i * 5}%) 0%, hsl(${180 + i * 10}, 70%, ${40 + i * 5}%) 100%)`
                }}
              >
                <Headphones size={14} color="white" />
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Join 12,000+ music lovers</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Finding connections through sound</p>
          </div>
        </div>
      </div>

      <FloatingCards />

      {/* Scroll indicator - Wrapper Strategy for proper centering + animation */}
      <div 
        role="button"
        tabIndex={0}
        aria-label="Scroll to how it works section"
        className="absolute z-20 cursor-pointer"
        style={{
          bottom: '-1rem', // Changed from 1.5rem to move it down
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'max-content',
          padding: '1rem'
        }}
        onClick={onScrollToHowItWorks}
        onKeyDown={(e) => e.key === 'Enter' && onScrollToHowItWorks()}
      >
        {/* Child handles the bounce animation */}
        <div className="scroll-indicator flex flex-col items-center gap-2">
          <span 
            className="text-xs md:text-sm"
            style={{ 
              color: 'var(--color-text-muted)', 
              whiteSpace: 'nowrap',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            See how it works
          </span>
          <ChevronDown size={20} color="var(--color-accent)" />
        </div>
      </div>
    </section>
  );
}
