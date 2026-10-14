import type { LibraryEntry } from './types';

export interface SearchFilters {
  query: string;
  /** null = every genre */
  genre: string | null;
  level: string | null;
}

/** Lowercase and drop accents, so "cancion" finds "canción". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Every word of the query must appear somewhere in the entry's text. */
export function searchLibrary(entries: LibraryEntry[], { query, genre, level }: SearchFilters): LibraryEntry[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (genre && e.genre !== genre) return false;
    if (level && e.level !== level) return false;
    const haystack = normalize([e.title, e.artist, e.genre, e.level, e.key, e.timeLabel, ...e.tags].join(' '));
    return words.every((w) => haystack.includes(w));
  });
}
