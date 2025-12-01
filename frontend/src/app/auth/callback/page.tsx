'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authenticateLastFm, createUserEmbedding } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating...');
  const [error, setError] = useState('');
  const { setAuth } = useStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');

        if (!token) {
          throw new Error('No authentication token received');
        }

        // Authenticate with backend
        setStatus('Verifying credentials...');
        const authResponse = await authenticateLastFm(token);

        // Store auth token
        const username = JSON.parse(atob(authResponse.access_token.split('.')[1])).sub;
        setAuth(authResponse.access_token, username);

        // Create embedding
        setStatus('Analyzing your music taste...');
        await createUserEmbedding();

        // Redirect to dashboard
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } catch (err: any) {
        console.error('Authentication error:', err);
        setError(err.response?.data?.detail || err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900 flex items-center justify-center">
      <div className="glass-card p-12 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Failed</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-white mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-4">{status}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
