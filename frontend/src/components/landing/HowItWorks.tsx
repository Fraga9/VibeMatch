'use client';

import { forwardRef } from 'react';
import { ArrowRight, GitBranch, Cpu, Users, Waves, Heart } from 'lucide-react';
import StepCard from './StepCard';

const HowItWorks = forwardRef<HTMLElement>((_, ref) => {
  const timePeriods = [
    { label: 'All Time', weight: '15%' },
    { label: '6 Months', weight: '25%' },
    { label: '3 Months', weight: '35%' },
    { label: 'Recent', weight: '25%' }
  ];

  return (
    <section
      ref={ref}
      className="px-6 lg:px-10"
      style={{
        paddingTop: '6rem',
        paddingBottom: '6rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <p style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1rem'
        }}>How It Works</p>
        <h2 className="section-title">
          The science behind your{' '}
          <span className="headline-italic">perfect</span> match
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--color-text-muted)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.7
        }}>
          We use Graph Neural Networks to understand your music taste at a deep level,
          creating a unique fingerprint of your listening habits.
        </p>
      </div>

      {/* Steps 1 & 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        <StepCard
          number="01"
          icon={<Waves size={28} color="var(--color-accent)" />}
          title="Capture Your Listening DNA"
          description="We pull your Last.fm history across multiple time periods: your all-time favorites, 6-month trends, 3-month patterns, and recent plays. Each period reveals different aspects of your taste."
        >
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            {timePeriods.map((period, i) => (
              <div key={i} style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                background: `rgba(56, 189, 248, ${0.05 + i * 0.05})`,
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid rgba(56, 189, 248, 0.1)'
              }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{period.label}</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-accent)' }}>{period.weight}</p>
              </div>
            ))}
          </div>
        </StepCard>

        <StepCard
          number="02"
          icon={<GitBranch size={28} color="var(--color-accent)" />}
          title="Graph Neural Network"
          description="Our LightGCN model treats music as a connected graph: users, tracks, and artists are nodes, listens are edges. The network learns by propagating information between connected nodes."
        >
          <div className="gnn-visual" style={{ marginTop: '1rem', height: '180px' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
                  <stop offset="50%" stopColor="rgba(56, 189, 248, 0.4)" />
                  <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                </linearGradient>
              </defs>
              <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="url(#edgeGrad)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="url(#edgeGrad)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="url(#edgeGrad)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="url(#edgeGrad)" strokeWidth="1" />
            </svg>
            <div className="gnn-node gnn-node-user" style={{ left: 'calc(50% - 32px)', top: 'calc(50% - 32px)' }}>YOU</div>
            <div className="gnn-node gnn-node-track" style={{ left: '15%', top: '10%', animationDelay: '-1s' }}>Track</div>
            <div className="gnn-node gnn-node-track" style={{ right: '15%', top: '15%', animationDelay: '-2s' }}>Track</div>
            <div className="gnn-node gnn-node-artist" style={{ left: '18%', bottom: '10%', animationDelay: '-0.5s' }}>Artist</div>
            <div className="gnn-node gnn-node-artist" style={{ right: '20%', bottom: '15%', animationDelay: '-1.5s' }}>Artist</div>
          </div>
        </StepCard>
      </div>

      {/* Steps 3 & 4 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        <StepCard
          number="03"
          icon={<Cpu size={28} color="var(--color-accent)" />}
          title="Embedding Generation"
          description="The GNN compresses each track and artist into a 128-dimensional vector. Your user embedding is a weighted combination of these vectors, capturing both breadth and depth of your taste."
        >
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              128-dimensional embedding vector
            </p>
            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="embedding-bar"
                  style={{
                    width: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)'
            }}>
              <span>Artists: 40%</span>
              <span>Tracks: 60%</span>
            </div>
          </div>
        </StepCard>

        <StepCard
          number="04"
          icon={<Users size={28} color="var(--color-accent)" />}
          title="Similarity Matching"
          description="Using cosine similarity, we compare your embedding against all users in our database. The closer two vectors are in the 128D space, the more aligned your musical souls are."
        >
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(56, 189, 248, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.1)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#050a0e'
              }}>YOU</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  height: '4px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '87%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #22d3ee 100%)',
                    borderRadius: '2px'
                  }} />
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>87% match</p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22d3ee 0%, #7dd3fc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={16} color="#050a0e" />
              </div>
            </div>
          </div>
        </StepCard>
      </div>

      {/* Technical Details */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GitBranch size={14} color="var(--color-accent)" />
              </span>
              LightGCN Architecture
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              A simplified graph convolution that removes feature transformation and nonlinear
              activation, focusing purely on neighborhood aggregation for collaborative filtering.
            </p>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Waves size={14} color="var(--color-accent)" />
              </span>
              Temporal Decay
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Recent listens are weighted higher using exponential decay with a 30-day half-life,
              ensuring your current mood influences matches more than old habits.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Ready to find your music soulmate?
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-primary"
          style={{ fontSize: '1rem', padding: '1.125rem 2rem' }}
        >
          <span>Get Started Now</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
});

HowItWorks.displayName = 'HowItWorks';

export default HowItWorks;
