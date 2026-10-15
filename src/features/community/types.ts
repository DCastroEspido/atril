export type Role = 'basic' | 'advanced' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
}

/** A song an advanced user published to everyone. */
export interface SharedSong {
  id: string;
  title: string;
  artist: string;
  genre: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  key: string;
  time_label: string;
  tempo: number | null;
  tags: string[];
  file_path: string;
  file_name: string;
  uploaded_by: string | null;
  uploader_name: string;
  status: 'published' | 'hidden';
  created_at: string;
}

export interface Score {
  up: number;
  down: number;
}

export interface AdvancedRequest {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  message: string;
  created_at: string;
}

export const ROLE_LABEL: Record<Role, string> = { basic: 'Básico', advanced: 'Avanzado', admin: 'Admin' };

/** What the UI needs to show and cast votes. */
export interface VotesState {
  scores: Record<string, Score>;
  mine: Record<string, 1 | -1>;
  vote: (songId: string, value: 1 | -1) => Promise<boolean>;
  canVote: boolean;
  onNeedAccount: () => void;
}
