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
  /** Copies of songs kept in the signed-in account, so they open offline. Cleared on sign-out. */
  cloud: { key: string; value: { id: string; bytes: ArrayBuffer } };
}

let db: Promise<IDBPDatabase<AtrilDB>> | null = null;
const open = () =>
  (db ??= openDB<AtrilDB>('atril', 2, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) database.createObjectStore('files', { keyPath: 'id' });
      if (oldVersion < 2) database.createObjectStore('cloud', { keyPath: 'id' });
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

export async function getCloudCopy(id: string): Promise<ArrayBuffer | undefined> {
  return (await (await open()).get('cloud', id))?.bytes;
}

export async function putCloudCopy(id: string, bytes: ArrayBuffer): Promise<void> {
  await (await open()).put('cloud', { id, bytes });
}

export async function deleteCloudCopy(id: string): Promise<void> {
  await (await open()).delete('cloud', id);
}

export async function clearCloudCopies(): Promise<void> {
  await (await open()).clear('cloud');
}
