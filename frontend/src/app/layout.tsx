import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeMatch - Find Your Music Soulmate',
  description: 'Discover people who share your exact music taste using AI-powered matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body style={{ fontFamily: "'Outfit', -apple-system, sans-serif" }}>{children}</body>
    </html>
  );
}