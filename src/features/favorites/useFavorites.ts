import { useCallback, useEffect, useState } from 'react';
import { readPref, writePref } from '../../storage/prefs';

/** Shown as favourites the first time the app opens, so the selector is not empty. */
const FIRST_RUN = ['sol-naciente', 'blues-la'];

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readPref('favs', FIRST_RUN));

  useEffect(() => {
    writePref('favs', favorites);
  }, [favorites]);

  const toggle = useCallback(
    (id: string) => setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])),
    [],
  );
  const remove = useCallback((id: string) => setFavorites((prev) => prev.filter((f) => f !== id)), []);

  return { favorites, toggle, remove };
}
