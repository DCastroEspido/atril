import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG } from '../../catalog';
import {
  clearCloudCopies,
  deleteCloudCopy,
  deleteScore,
  getCloudCopy,
  getScoreBytes,
  listScores,
  putCloudCopy,
  saveScore,
  type StoredScore,
  type StoredScoreInfo,
} from '../../storage/scoreFiles';
import { readPref, writePref } from '../../storage/prefs';
import { supabase } from '../../lib/supabase';
import { useAccount } from '../account/AccountContext';
import { deletePrivateSong, downloadPrivateSong, fileUrl, listPrivateSongs, savePrivateSong } from '../community/api';
import type { PrivateSong, SharedSong } from '../community/types';
import { fromCatalog, fromFile, fromShared, type LibraryEntry } from './types';

const CATALOG_ENTRIES = CATALOG.map(fromCatalog);

/** The signed-in user's private songs, remembered so the library opens with them offline. */
type SyncedList = { user: string; songs: PrivateSong[] } | null;

/** Where an imported file ended up. */
export type Saved = 'account' | 'browser' | 'session';

const toInfo = (s: PrivateSong) => ({ id: s.id, title: s.title, artist: s.artist, fileName: s.file_name });

/**
 * Catalog songs, songs shared by the community, the signed-in user's private songs,
 * and the files imported into this browser only.
 */
export function useLibrary(shared: SharedSong[] = []) {
  const { ready, session } = useAccount();
  const userId = session?.user.id ?? null;
  const [files, setFiles] = useState<StoredScoreInfo[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [synced, setSynced] = useState<SyncedList>(() => readPref<SyncedList>('mine', null));
  /** Bytes of files imported this session, so they open even if the browser refuses to store them. */
  const inMemory = useRef(new Map<string, ArrayBuffer>());

  useEffect(() => {
    listScores()
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLocalLoaded(true));
  }, []);

  const mine = useMemo(() => (synced && synced.user === userId ? synced.songs : []), [synced, userId]);
  const mineRef = useRef(mine);
  useEffect(() => {
    mineRef.current = mine;
  }, [mine]);

  const applySynced = useCallback((next: SyncedList) => {
    setSynced(next);
    writePref('mine', next);
  }, []);

  // Fetch the private list for whoever signs in; forget it, and its offline copies, when they sign out.
  const lastUser = useRef<string | null>(null);
  useEffect(() => {
    const previous = lastUser.current;
    lastUser.current = userId;
    if (!supabase || !ready) return;
    if (!userId) {
      if (previous || readPref<SyncedList>('mine', null)) {
        applySynced(null);
        void clearCloudCopies().catch(() => undefined);
      }
      return;
    }
    let cancelled = false;
    listPrivateSongs(supabase)
      .then((songs) => !cancelled && applySynced({ user: userId, songs }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ready, userId, applySynced]);

  const entries: LibraryEntry[] = useMemo(() => {
    const db = supabase;
    const community = db ? shared.map((song) => fromShared(song, fileUrl(db, song.file_path))) : [];
    const syncedIds = new Set(mine.map((s) => s.id));
    const local = files.filter((f) => !syncedIds.has(f.id));
    return [
      ...CATALOG_ENTRIES,
      ...community,
      ...mine.map((s) => fromFile(toInfo(s), true)),
      ...local.map((f) => fromFile(f)),
    ];
  }, [files, shared, mine]);

  const storeLocally = useCallback(async (score: StoredScore): Promise<Saved> => {
    const { bytes: _bytes, ...info } = score;
    setFiles((prev) => [info, ...prev.filter((f) => f.id !== score.id)]);
    try {
      await saveScore(score);
      return 'browser';
    } catch {
      return 'session';
    }
  }, []);

  /** Keeps a private song in the account; resolves false when that failed (offline, quota…). */
  const upload = useCallback(
    async (score: StoredScore) => {
      if (!supabase || !userId) return false;
      try {
        const song = await savePrivateSong(supabase, userId, score);
        await putCloudCopy(song.id, score.bytes).catch(() => undefined);
        setSynced((prev) => {
          const next = { user: userId, songs: [song, ...(prev?.user === userId ? prev.songs : [])] };
          writePref('mine', next);
          return next;
        });
        return true;
      } catch {
        return false;
      }
    },
    [userId],
  );

  /** Saves an import: into the account when signed in, else (or if that fails) into this browser. */
  const addFile = useCallback(
    async (score: StoredScore): Promise<Saved> => {
      inMemory.current.set(score.id, score.bytes);
      if (await upload(score)) return 'account';
      return storeLocally(score);
    },
    [upload, storeLocally],
  );

  /** Moves a file imported before signing in into the account. */
  const syncFile = useCallback(
    async (id: string) => {
      const info = files.find((f) => f.id === id);
      const bytes = inMemory.current.get(id) ?? (await getScoreBytes(id).catch(() => undefined));
      if (!info || !bytes) return false;
      if (!(await upload({ ...info, bytes }))) return false;
      setFiles((prev) => prev.filter((f) => f.id !== id));
      await deleteScore(id).catch(() => undefined);
      return true;
    },
    [files, upload],
  );

  const removeFile = useCallback(
    async (id: string) => {
      inMemory.current.delete(id);
      const song = mineRef.current.find((s) => s.id === id);
      if (song && supabase && userId) {
        await deletePrivateSong(supabase, song);
        await deleteCloudCopy(id).catch(() => undefined);
        setSynced((prev) => {
          const next = prev && { ...prev, songs: prev.songs.filter((s) => s.id !== id) };
          writePref('mine', next);
          return next;
        });
        return;
      }
      setFiles((prev) => prev.filter((f) => f.id !== id));
      await deleteScore(id).catch(() => undefined);
    },
    [userId],
  );

  const getBytes = useCallback(async (id: string) => {
    const kept = inMemory.current.get(id) ?? (await getScoreBytes(id).catch(() => undefined));
    if (kept) return kept;
    const song = mineRef.current.find((s) => s.id === id);
    if (!song || !supabase) return undefined;
    const copy = await getCloudCopy(id).catch(() => undefined);
    if (copy) return copy;
    const bytes = await downloadPrivateSong(supabase, song).catch(() => undefined);
    if (bytes) await putCloudCopy(id, bytes).catch(() => undefined);
    return bytes;
  }, []);

  /** Downloads a shared song's file (the service worker keeps a copy for offline use). */
  const fetchRemote = useCallback(async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    return response.arrayBuffer();
  }, []);

  // Private songs are only known once the session is restored, so wait for it before judging what exists.
  const filesLoaded = localLoaded && ready;

  return { entries, filesLoaded, addFile, syncFile, removeFile, getBytes, fetchRemote };
}
