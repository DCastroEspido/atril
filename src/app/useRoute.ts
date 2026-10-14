import { useCallback, useSyncExternalStore } from 'react';
import { hrefFor, pageFromHash, type Page } from './routes';

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

/** The page in the URL, and a way to go to another one (adds a history entry). */
export function useRoute() {
  const page = useSyncExternalStore(subscribe, () => pageFromHash(window.location.hash));
  const go = useCallback((to: Page) => {
    if (pageFromHash(window.location.hash) !== to) window.location.hash = hrefFor(to);
  }, []);
  return { page, go };
}
