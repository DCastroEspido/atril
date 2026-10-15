/**
 * Tab sites Atril can hand a search to. They open in their own pages: Atril neither reads their
 * results nor loads their tabs. To practise one here, download its Guitar Pro file and import it.
 */
export interface OnlineSource {
  name: string;
  /** What the user gets there, in a few words. */
  note: string;
  url: (query: string) => string;
}

const q = (query: string) => encodeURIComponent(query.trim());

export const ONLINE_SOURCES: OnlineSource[] = [
  {
    name: 'Songsterr',
    note: 'tablaturas con reproductor',
    url: (query) => `https://www.songsterr.com/?pattern=${q(query)}`,
  },
  {
    name: 'Ultimate Guitar',
    note: 'tabs, acordes y archivos Guitar Pro',
    url: (query) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${q(query)}`,
  },
  {
    name: 'GProTab',
    note: 'archivos Guitar Pro para descargar',
    url: (query) => `https://gprotab.net/en/search?q=${q(query)}`,
  },
  {
    name: '911Tabs',
    note: 'buscador de varias webs de tabs',
    url: (query) => `https://www.911tabs.com/search.php?search=${q(query)}`,
  },
];
