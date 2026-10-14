/**
 * Two pages, addressed by the URL hash so links, the back button and offline reloads all work on a
 * static host (GitHub Pages) without server rewrites.
 */
export type Page = 'practice' | 'library';

const HASH: Record<Page, string> = { practice: '#/', library: '#/biblioteca' };

export const hrefFor = (page: Page) => HASH[page];

/** Any unknown or empty hash shows the player. */
export const pageFromHash = (hash: string): Page =>
  hash.replace(/\/+$/, '') === '#/biblioteca' ? 'library' : 'practice';
