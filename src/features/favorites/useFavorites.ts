import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { readPref, writePref } from '../../storage/prefs';
import { useAccount } from '../account/AccountContext';
import { addFavorites, fetchFavorites, removeFavorite } from '../community/api';

/** Shown as favourites the first time the app opens, so the selector is not empty. */
const FIRST_RUN = ['sol-naciente', 'blues-la'];

/**
 * Favourites live in this browser, and also in the account when signed in. Signing in merges both
 * lists (nothing is lost on either side); after that every change goes to both.
 */
export function useFavorites() {
  const { session } = useAccount();
  const userId = session?.user.id ?? null;
  const [favorites, setFavorites] = useState<string[]>(() => readPref('favs', FIRST_RUN));

  const current = useRef(favorites);
  useEffect(() => {
    current.current = favorites;
    writePref('favs', favorites);
  }, [favorites]);

  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchFavorites(supabase);
        if (cancelled) return;
        const local = readPref<string[]>('favs', []);
        await addFavorites(
          supabase,
          local.filter((id) => !remote.includes(id)),
        );
        if (!cancelled) setFavorites([...remote, ...local.filter((id) => !remote.includes(id))]);
      } catch {
        /* offline: keep the local list; it merges next time */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(
    (id: string) => {
      const on = !current.current.includes(id);
      setFavorites((prev) => (on ? [...prev.filter((f) => f !== id), id] : prev.filter((f) => f !== id)));
      if (supabase && userId)
        void (on ? addFavorites(supabase, [id]) : removeFavorite(supabase, id)).catch(() => undefined);
    },
    [userId],
  );

  const remove = useCallback(
    (id: string) => {
      setFavorites((prev) => prev.filter((f) => f !== id));
      if (supabase && userId) void removeFavorite(supabase, id).catch(() => undefined);
    },
    [userId],
  );

  return { favorites, toggle, remove };
}
