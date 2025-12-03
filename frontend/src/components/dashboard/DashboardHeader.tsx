'use client';

import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface DashboardHeaderProps {
  user: {
    image?: string;
    real_name?: string;
    playcount?: number;
  } | null;
  username: string;
  onLogout: () => void;
}

export function DashboardHeader({ user, username, onLogout }: DashboardHeaderProps) {
  return (
    <nav className="flex items-center justify-between px-6 lg:px-10 py-5 backdrop-blur-xl border-b sticky top-0 z-50" style={{
      background: 'rgba(5, 10, 14, 0.85)',
      borderColor: 'rgba(14, 165, 233, 0.1)'
    }}>
      <a href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <Image
            src="/vibes.svg"
            alt="VibeMatch Logo"
            width={40}
            height={40}
            className="rounded-xl transition-transform group-hover:scale-105"
          />
        </div>
        <span className="text-xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>VibeMatch</span>
      </a>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full" style={{
          background: 'rgba(14, 165, 233, 0.06)',
          border: '1px solid rgba(14, 165, 233, 0.1)'
        }}>
          <div className="w-8 h-8 rounded-full overflow-hidden" style={{
            background: 'rgba(14, 165, 233, 0.2)'
          }}>
            {user?.image ? (
              <img src={user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: '#0ea5e9' }}>
                {username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#e8f4f8' }}>{user?.real_name || username}</p>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(232, 244, 248, 0.4)' }}>{formatNumber(user?.playcount || 0)} scrobbles</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="p-2.5 rounded-xl transition-all"
          style={{ 
            color: 'rgba(232, 244, 248, 0.4)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(232, 244, 248, 0.4)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          }}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
