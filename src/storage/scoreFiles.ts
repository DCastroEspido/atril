import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/** A Guitar Pro / MusicXML file the user imported, kept in this browser. */
export interface StoredScore {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  addedAt: number;
  bytes: ArrayBuffer;
}

export type StoredScoreInfo = Omit<StoredScore, 'bytes'>;

interface AtrilDB extends DBSchema {
  files: { key: string; value: StoredScore };
}

let db: Promise<IDBPDatabase<AtrilDB>> | null = null;
const open = () =>
  (db ??= openDB<AtrilDB>('atril', 1, {
    upgrade(database) {
      database.createObjectStore('files', { keyPath: 'id' });
    },
  }));

export async function listScores(): Promise<StoredScoreInfo[]> {
  const all = await (await open()).getAll('files');
  return all.map(({ bytes: _bytes, ...info }) => info).sort((a, b) => b.addedAt - a.addedAt);
}

export async function getScoreBytes(id: string): Promise<ArrayBuffer | undefined> {
  return (await (await open()).get('files', id))?.bytes;
}

export async function saveScore(score: StoredScore): Promise<void> {
  await (await open()).put('files', score);
}

export async function deleteScore(id: string): Promise<void> {
  await (await open()).delete('files', id);
}
