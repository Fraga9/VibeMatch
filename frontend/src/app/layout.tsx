import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Instrument_Serif, Outfit } from 'next/font/google';
import './globals.css';

// Font optimization with next/font
const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const outfit = Outfit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VibeMatch - AI-Powered Music Compatibility Matching',
  description: 'Find your musical soulmate using Graph Neural Networks and vector similarity search. Connect with users who share your exact music taste through deep learning analysis.',
  keywords: ['music', 'matching', 'Last.fm', 'AI', 'machine learning', 'GNN', 'music compatibility', 'taste matching'],
  authors: [{ name: 'VibeMatch' }],
  creator: 'VibeMatch',
  publisher: 'VibeMatch',
  metadataBase: new URL('https://vibematch-sigma.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vibematch-sigma.vercel.app',
    title: 'VibeMatch - AI-Powered Music Compatibility Matching',
    description: 'Find your musical soulmate using Graph Neural Networks. Connect with users who share your exact music taste.',
    siteName: 'VibeMatch',
    images: [
      {
        url: '/images/vibematch-banner.png',
        width: 1200,
        height: 630,
        alt: 'VibeMatch - AI-Powered Music Matching',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeMatch - AI-Powered Music Compatibility Matching',
    description: 'Find your musical soulmate using Graph Neural Networks and vector similarity search.',
    images: ['/images/vibematch-banner.png'],
    creator: '@vibematch',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/vibes.svg',
    shortcut: '/vibes.svg',
    apple: '/vibes.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${outfit.variable}`}>
      <body className={outfit.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}