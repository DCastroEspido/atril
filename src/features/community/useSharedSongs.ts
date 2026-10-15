import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { readPref, writePref } from '../../storage/prefs';
import { useAccount } from '../account/AccountContext';
import { listSharedSongs } from './api';
import type { SharedSong } from './types';

/**
 * Songs published by the community. The last list is kept locally so the library opens
 * with them offline; it refreshes on start and whenever the signed-in user changes.
 */
export function useSharedSongs() {
  const { session } = useAccount();
  const [songs, setSongs] = useState<SharedSong[]>(() => (supabase ? readPref<SharedSong[]>('shared', []) : []));
  const userId = session?.user.id ?? null;

  const apply = useCallback((list: SharedSong[]) => {
    setSongs(list);
    // Only the public list is cached; an admin's view of hidden songs stays online.
    writePref(
      'shared',
      list.filter((s) => s.status === 'published'),
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      apply(await listSharedSongs(supabase));
    } catch {
      /* offline: keep the cached list */
    }
  }, [apply]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    listSharedSongs(supabase)
      .then((list) => !cancelled && apply(list))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [apply, userId]);

  return { songs, refresh };
}
