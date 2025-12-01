export interface Artist {
  name: string;
  playcount: number;
  mbid?: string;
}

export interface Track {
  name: string;
  artist: string;
  playcount: number;
  mbid?: string;
}

export interface UserProfile {
  username: string;
  real_name?: string;
  country?: string;
  playcount: number;
  url: string;
  image?: string;
  top_artists: Artist[];
  top_tracks: Track[];
}

export interface MatchResult {
  user_id?: string;
  username?: string;
  similarity: number;
  is_real: boolean;
  shared_artists: string[];
  shared_tracks: Array<{ name: string; artist: string }>;
  top_genres: string[];
  profile_image?: string;
  country?: string;
  compatibility_score: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface EmbeddingResponse {
  user_id: string;
  username: string;
  embedding_dim: number;
  top_artists: string[];
  created_at: string;
}
