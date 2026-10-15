import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG } from '../../catalog';
import {
  deleteScore,
  getScoreBytes,
  listScores,
  saveScore,
  type StoredScore,
  type StoredScoreInfo,
} from '../../storage/scoreFiles';
import { supabase } from '../../lib/supabase';
import { fileUrl } from '../community/api';
import type { SharedSong } from '../community/types';
import { fromCatalog, fromFile, fromShared, type LibraryEntry } from './types';

const CATALOG_ENTRIES = CATALOG.map(fromCatalog);

/** Catalog songs, songs shared by the community, and the files imported into this browser. */
export function useLibrary(shared: SharedSong[] = []) {
  const [files, setFiles] = useState<StoredScoreInfo[]>([]);
  const [filesLoaded, setFilesLoaded] = useState(false);
  /** Bytes of files imported this session, so they open even if the browser refuses to store them. */
  const session = useRef(new Map<string, ArrayBuffer>());

  useEffect(() => {
    listScores()
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setFilesLoaded(true));
  }, []);

  const entries: LibraryEntry[] = useMemo(() => {
    const db = supabase;
    const community = db ? shared.map((song) => fromShared(song, fileUrl(db, song.file_path))) : [];
    return [...CATALOG_ENTRIES, ...community, ...files.map(fromFile)];
  }, [files, shared]);

  /** Stores the file; resolves false when this browser cannot keep it (it still opens this session). */
  const addFile = useCallback(async (score: StoredScore) => {
    const { bytes: _bytes, ...info } = score;
    session.current.set(score.id, score.bytes);
    setFiles((prev) => [info, ...prev]);
    try {
      await saveScore(score);
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeFile = useCallback(async (id: string) => {
    session.current.delete(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    await deleteScore(id).catch(() => undefined);
  }, []);

  const getBytes = useCallback(
    async (id: string) => session.current.get(id) ?? (await getScoreBytes(id).catch(() => undefined)),
    [],
  );

  /** Downloads a shared song's file (the service worker keeps a copy for offline use). */
  const fetchRemote = useCallback(async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    return response.arrayBuffer();
  }, []);

  return { entries, filesLoaded, addFile, removeFile, getBytes, fetchRemote };
}
