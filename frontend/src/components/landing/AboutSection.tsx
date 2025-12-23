'use client';

import { forwardRef } from 'react';
import { Music, Github, Linkedin, Mail, ExternalLink, Disc3, Code2, Database, Cpu } from 'lucide-react';

const AboutSection = forwardRef<HTMLElement>((_, ref) => {
  const techStack = [
    { icon: Cpu, label: 'LightGCN', description: 'Graph Neural Network' },
    { icon: Database, label: 'Last.fm API', description: 'Music Data Source' },
    { icon: Code2, label: 'Next.js', description: 'React Framework' },
    { icon: Disc3, label: 'FastAPI', description: 'Python Backend' },
  ];

  const socialLinks = [
    { icon: Music, label: 'Last.fm', href: 'https://www.last.fm/es/user/Fraga9', username: 'Fraga9' },
    { icon: Github, label: 'GitHub', href: 'https://github.com/Fraga9', username: 'Fraga9' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/in/osifraga', username: 'Connect' },
    { icon: Mail, label: 'Email', href: 'mailto:garzahector1013@gmail.com', username: 'Contact' },
  ];

  return (
    <section
      ref={ref}
      className="px-6 lg:px-10"
      style={{
        paddingTop: '6rem',
        paddingBottom: '3rem',
        maxWidth: '1400px',
        margin: '0 auto',
        borderTop: '1px solid var(--color-border)'
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <p style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1rem'
        }}>About</p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 400,
          marginBottom: '1rem'
        }}>
          Built with{' '}
          <span style={{
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #7dd3fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>passion</span>{' '}
          for music
        </h2>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '3rem',
        marginBottom: '4rem'
      }}>
        {/* Creator Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <img
              src="https://lastfm.freetls.fastly.net/i/u/avatar170s/29a353e4cad5024c03d8f8248567bdb3.png"
              alt="Fraga9"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                objectFit: 'cover',
                boxShadow: '0 8px 32px -8px rgba(56, 189, 248, 0.4)'
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Fraga9</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Creator & Developer</p>
            </div>
          </div>

          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
            marginBottom: '1.5rem'
          }}>
            Music enthusiast and developer passionate about connecting people through shared
            listening experiences. VibeMatch was born from the idea that music taste reveals
            something deeper about who we are.
          </p>

          {/* Social Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  borderRadius: '100px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.15)';
                }}
              >
                <social.icon size={14} />
                <span>{social.username}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Project Info Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>The Project</h3>
          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
            marginBottom: '1.5rem'
          }}>
            VibeMatch uses Graph Neural Networks trained on the Million Playlist Dataset
            combined with Last.fm listening data to create meaningful connections between
            music lovers. The AI learns not just what you listen to, but how your taste
            evolves over time.
          </p>

          {/* Tech Stack */}
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
            Tech Stack
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {techStack.map((tech, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(56, 189, 248, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.08)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <tech.icon size={16} color="var(--color-accent)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{tech.label}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Bottom Footer */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(56, 189, 248, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/vibes.svg"
            alt="VibeMatch Logo"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px'
            }}
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 400
          }}>VibeMatch</span>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          © 2025 VibeMatch · Made with love by{' '}
          <a
            href="https://www.last.fm/es/user/Fraga9"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Fraga9
          </a>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="#" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Privacy
          </a>
          <a href="#" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Terms
          </a>
          <a
            href="https://github.com/Fraga9/vibematch"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              color: 'var(--color-accent)',
              textDecoration: 'none'
            }}
          >
            <Github size={14} />
            <span>Source</span>
          </a>
        </div>
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';

export default AboutSection;