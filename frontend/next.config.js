/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lastfm.freetls.fastly.net', 'i.scdn.co'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_LASTFM_API_KEY: process.env.NEXT_PUBLIC_LASTFM_API_KEY,
  },
}

module.exports = nextConfig
