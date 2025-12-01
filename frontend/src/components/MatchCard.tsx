'use client';

import type { MatchResult } from '@/types';
import { MapPin, Music2, ArrowUpRight } from 'lucide-react';

interface MatchCardProps {
  match: MatchResult;
  rank: number;
}

// ... (Tus constantes NOISE_PATTERN y NoiseOverlay se mantienen igual) ...
const NOISE_PATTERN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
  opacity: 0.15, 
  mixBlendMode: 'overlay' as const,
  pointerEvents: 'none' as const,
  zIndex: 20,
};

const NoiseOverlay = () => (
  <div className="absolute inset-0 z-0" style={NOISE_PATTERN} />
);

// ... (Tus funciones de Gradiente y Anillo se mantienen igual) ...
function getGradientStyle(score: number): React.CSSProperties {
  if (score >= 90) return { background: 'radial-gradient(140% 140% at 50% 0%, #0a84ff 0%, #007aff 15%, #0051d4 40%, #1a1a2e 100%)' };
  if (score >= 80) return { background: 'radial-gradient(140% 140% at 50% 0%, #0a84ff 0%, #0066ff 20%, #0040c0 50%, #16213e 100%)' };
  if (score >= 70) return { background: 'radial-gradient(140% 140% at 50% 0%, #0a84ff 0%, #005edc 30%, #0033a0 60%, #0f172a 100%)' };
  if (score >= 60) return { background: 'radial-gradient(140% 140% at 50% 0%, #0a84ff 0%, #0066cc 35%, #002966 70%, #0f172a 100%)' };
  return { background: 'radial-gradient(140% 140% at 50% 0%, #3b9eff 0%, #0a84ff 30%, #003366 80%, #0f172a 100%)' };
}

function getRingColor(score: number): string {
  if (score >= 85) return '#0a84ff';
  if (score >= 70) return '#329fff';
  return '#66b2ff';
}

function ProgressRing({ score, size = 120, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getRingColor(score);

  return (
    <svg width={size} height={size} className="absolute -inset-1 pointer-events-none">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const cleanUsername = match.username?.replace('lastfm_', '') || 'Anonymous';
  const isGhost = !match.is_real;
  const gradientStyle = getGradientStyle(match.compatibility_score);
  const sharedArtists = match.shared_artists || [];
  const sharedArtistsCount = sharedArtists.length;
  const hasSharedArtists = sharedArtistsCount > 0;
  const topGenres = match.top_genres?.slice(0, 4) || [];
  const hasLocation = match.country && match.country !== 'None' && match.country.trim() !== '';
  const hasMetadata = hasLocation || sharedArtistsCount > 0;

  return (
    <a
      href={`https://www.last.fm/user/${cleanUsername}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer active:scale-[0.98]"
    >
      <div className="absolute inset-0 transition-opacity duration-500" style={gradientStyle} />
      <NoiseOverlay />

      {/* Rank Badge */}
      <div className="absolute top-5 left-5 z-10">
        <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-sm ring-1 ring-black/5">
          {/* CAMBIO: Slate-900 en lugar de gray-800 para un negro más frío */}
          <span className="text-sm font-bold text-slate-900">#{rank}</span>
        </div>
      </div>

      {/* Suggested Badge */}
      {isGhost && (
        <div className="absolute top-5 right-5 z-10">
          <span className="text-xs px-3 py-1.5 rounded-full font-medium text-white border border-white/60 backdrop-blur-md bg-white/10 shadow-sm">
            Suggested
          </span>
        </div>
      )}

      <div className="relative pt-16 pb-4 px-4 h-full flex flex-col">
        <div
          className="relative rounded-[1.5rem] p-5 pb-10 shadow-xl border border-white/40 flex-grow flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.66)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.4)', // Borde un poco más visible para definir la carta
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className={`flex flex-col items-center text-center ${hasSharedArtists ? 'mb-5' : 'mb-2'}`}>
            
            {/* Avatar Section */}
            <div className="relative -mt-20 mb-3 group-hover:scale-105 transition-transform duration-300">
              <div className="relative w-[110px] h-[110px]">
                <ProgressRing score={match.compatibility_score} size={118} strokeWidth={4} />
                {match.profile_image ? (
                  <img
                    src={match.profile_image}
                    alt={cleanUsername}
                    className="w-[110px] h-[110px] rounded-full object-cover border-[4px] border-white shadow-md"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=1f2937&color=fff&size=220&bold=true`; }}
                  />
                ) : (
                  <div className="w-[110px] h-[110px] rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-4xl border-[4px] border-white shadow-md">
                    {cleanUsername.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full shadow-sm ring-4 ring-white">
                  {/* CAMBIO: Slate-900 para máximo contraste */}
                  <span className="text-sm font-extrabold text-slate-900">{match.compatibility_score}%</span>
                </div>
              </div>
            </div>

            {/* Username */}
            {/* CAMBIO: Slate-900 es más nítido que gray-900 */}
            <h3 className="text-xl font-bold text-slate-900 mb-1 truncate max-w-full">
              {cleanUsername}
            </h3>

            {/* Metadata Row */}
            {hasMetadata && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600 tracking-wide mt-1 font-medium">
                {/* CAMBIO: Text-slate-600 y font-medium para que se lea sobre el vidrio */}
                {hasLocation && (
                  <div className="flex items-center gap-1">
                    {/* Iconos en slate-400 para que no compitan */}
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{match.country}</span>
                  </div>
                )}
                {hasLocation && sharedArtistsCount > 0 && (
                  <span className="text-slate-300">•</span>
                )}
                {sharedArtistsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Music2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sharedArtistsCount} common</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shared Artists */}
          {hasSharedArtists && (
            <div className="mb-4">
              {/* CAMBIO: Slate-500 para el título pequeño, se perdía con gray-400 */}
              <div className="text-[10px] font-bold text-slate-500/80 mb-2 uppercase tracking-widest text-center">
                Shared Artists
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {sharedArtists.slice(0, 4).map((artist, idx) => (
                  <span
                    key={idx}
                    // CAMBIO IMPORTANTE: 
                    // bg-white/60 (Glassception: vidrio dentro de vidrio) en vez de gris plano.
                    // text-slate-700 para legibilidad.
                    className="bg-white/60 hover:bg-white text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-white/50 transition-colors"
                  >
                    {artist}
                  </span>
                ))}
                {sharedArtists.length > 4 && (
                  <span className="text-slate-500 text-xs px-2 py-1 font-medium">
                    +{sharedArtists.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Genres */}
          {topGenres.length > 0 && (
            <div className="mt-auto pt-1">
              <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                {topGenres.map((genre, idx) => (
                  <span key={idx} className="flex items-center">
                    {/* CAMBIO: Slate-500 y hover a Slate-800 */}
                    <span className="text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors cursor-default">
                      {genre.toLowerCase()}
                    </span>
                    {idx < topGenres.length - 1 && (
                      <span className="text-slate-300 text-[8px] mx-0.5">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Arrow CTA */}
          <div className="absolute bottom-3 right-4 p-1 rounded-full text-slate-400 group-hover:text-slate-800 group-hover:bg-white/50 transition-all duration-300">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </a>
  );
}