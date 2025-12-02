'use client';

export default function Footer() {
  return (
    <footer style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      borderTop: '1px solid var(--color-border)'
    }}>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        © 2025 VibeMatch · Made by{' '}
        <a
          href="https://www.last.fm/es/user/Fraga9"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          Fraga9
        </a>
      </p>
    </footer>
  );
}
