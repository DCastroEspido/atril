import type { CatalogSong, Level } from '../../catalog';

/** One row of the library: a catalog song or a file the user imported. */
export interface LibraryEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  level: Level | 'Importado';
  key?: string;
  timeLabel?: string;
  tempo?: number;
  tags: string[];
  source: { kind: 'tex'; tex: string } | { kind: 'file'; fileName: string };
}

export const IMPORTED_GENRE = 'Mis archivos';

export const fromCatalog = (song: CatalogSong): LibraryEntry => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  genre: song.genre,
  level: song.level,
  key: song.key,
  timeLabel: song.timeLabel,
  tempo: song.tempo,
  tags: song.tags,
  source: { kind: 'tex', tex: song.tex },
});

export const fromFile = (file: { id: string; title: string; artist: string; fileName: string }): LibraryEntry => ({
  id: file.id,
  title: file.title,
  artist: file.artist,
  genre: IMPORTED_GENRE,
  level: 'Importado',
  tags: [file.fileName],
  source: { kind: 'file', fileName: file.fileName },
});
