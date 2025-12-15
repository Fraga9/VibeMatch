import axios from 'axios';
import type { AuthResponse, UserProfile, MatchResult, EmbeddingResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibematch_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const getLastFmAuthUrl = async () => {
  const response = await api.get('/auth/lastfm/authorize-url');
  return response.data;
};

export const authenticateLastFm = async (token: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/lastfm', { token });
  return response.data;
};

export const simpleAuthenticate = async (username: string): Promise<AuthResponse> => {
  const response = await api.post(`/auth/simple?username=${username}`);
  return response.data;
};

// User
export const getUserProfile = async (username: string): Promise<UserProfile> => {
  const response = await api.get(`/user/profile?username=${username}`);
  return response.data;
};

export const createUserEmbedding = async (): Promise<EmbeddingResponse> => {
  const response = await api.post('/user/embedding');
  return response.data;
};

export const getEmbeddingStatus = async () => {
  const response = await api.get('/user/embedding/status');
  return response.data;
};

// Matching
export const getTopMatches = async (limit: number = 20): Promise<MatchResult[]> => {
  const response = await api.get(`/match/top?limit=${limit}`);
  return response.data.matches;
};

export const getMatchingStats = async () => {
  const response = await api.get('/match/stats');
  return response.data;
};

export default api;
