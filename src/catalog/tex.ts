import type { CatalogSong, SongMeta } from './types';

export type Staff = 'score tabs' | 'tabs' | 'score';

export interface TrackSpec {
  name: string;
  /** General MIDI instrument name as alphaTex knows it, or 'percussion'. */
  instrument: string;
  staff: Staff;
  /** 'piano' for pitched staves written with note names; open strings for a fretted instrument. */
  tuning?: 'piano' | string[];
  /** One entry per bar, in alphaTex. */
  bars: string[];
}

export interface SongSpec extends SongMeta {
  timeSignature: [number, number];
  /** Swing the eighth notes (shuffle). */
  shuffle?: boolean;
  /** Bar index (0-based) where each section starts. */
  sections: Record<number, string>;
  tracks: TrackSpec[];
}

/**
 * Drum voices used by the catalog: K kick, S snare, X side stick, H closed hi-hat,
 * O open hi-hat, C crash, T1/T2 toms.
 */
// prettier-ignore
const DRUM_KIT = [['K', 36], ['S', 38], ['X', 37], ['H', 42], ['O', 46], ['C', 49], ['T1', 48], ['T2', 45]]
  .map(([name, key]) => `\\articulation (${name} ${key})`)
  .join('\n');

const quote = (s: string) => `"${s.replace(/"/g, "'")}"`;

function trackTex(song: SongSpec, track: TrackSpec): string {
  const head = [`\\track ${quote(track.name)}`, `\\staff {${track.staff}}`, `\\instrument ${track.instrument}`];
  if (track.instrument === 'percussion') head.push(DRUM_KIT);
  else if (track.tuning === 'piano') head.push('\\tuning piano');
  else if (track.tuning) head.push(`\\tuning (${track.tuning.join(' ')})`);

  const bars = track.bars.map((bar, i) => {
    const prefix: string[] = [];
    if (i === 0) {
      prefix.push(`\\ts (${song.timeSignature.join(' ')})`);
      if (song.shuffle) prefix.push('\\tf triplet8th');
    }
    const section = song.sections[i];
    if (section) prefix.push(`\\section (${quote(section)})`);
    // alphaTex wants all beat effects inside one pair of braces.
    return [...prefix, bar.replace(/\}\{/g, ' ')].join(' ');
  });
  return `${head.join('\n')}\n${bars.join(' |\n')} |`;
}

export function defineSong(spec: SongSpec): CatalogSong {
  const { id, title, artist, genre, level, key, timeLabel, tempo, tags, tracks } = spec;
  const meta: SongMeta = { id, title, artist, genre, level, key, timeLabel, tempo, tags };
  const header = [`\\title ${quote(spec.title)}`, `\\artist ${quote(spec.artist)}`, `\\tempo ${spec.tempo}`];
  const tex = [header.join('\n'), ...tracks.map((t) => trackTex(spec, t))].join('\n');
  return { ...meta, tex };
}
