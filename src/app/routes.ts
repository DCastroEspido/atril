/**
 * Two pages, addressed by the URL hash so links, the back button and offline reloads all work on a
 * static host (GitHub Pages) without server rewrites.
 */
export type Page = 'practice' | 'library' | 'account';

const HASH: Record<Page, string> = { practice: '#/', library: '#/biblioteca', account: '#/cuenta' };

export const hrefFor = (page: Page) => HASH[page];

/** Any unknown or empty hash shows the player. */
export const pageFromHash = (hash: string): Page => {
  const clean = hash.replace(/\/+$/, '');
  return clean === '#/biblioteca' ? 'library' : clean === '#/cuenta' ? 'account' : 'practice';
};
