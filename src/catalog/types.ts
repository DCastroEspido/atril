export type Level = 'Principiante' | 'Intermedio' | 'Avanzado';

export interface SongMeta {
  id: string;
  title: string;
  artist: string;
  genre: string;
  level: Level;
  key: string;
  /** Shown as written, e.g. "4/4 shuffle". */
  timeLabel: string;
  tempo: number;
  tags: string[];
}

export interface CatalogSong extends SongMeta {
  /** alphaTex source, rendered and played by alphaTab. */
  tex: string;
}
