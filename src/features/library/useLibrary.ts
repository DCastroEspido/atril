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
import { fromCatalog, fromFile, type LibraryEntry } from './types';

const CATALOG_ENTRIES = CATALOG.map(fromCatalog);

/** Catalog songs plus the files imported into this browser. */
export function useLibrary() {
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

  const entries: LibraryEntry[] = useMemo(() => [...CATALOG_ENTRIES, ...files.map(fromFile)], [files]);

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

  return { entries, filesLoaded, addFile, removeFile, getBytes };
}
