// Small music helpers used to write the catalog in alphaTex.
// Guitar positions are written fret.string, string 1 being the thinnest.

// prettier-ignore
const PITCH_CLASS: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** "A4" -> 69 */
export function midi(note: string): number {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Nota no válida: ${note}`);
  return 12 * (Number(m[2]) + 1) + PITCH_CLASS[m[1]];
}

/** Open-string pitches, string 1 first. */
export const GUITAR = [64, 59, 55, 50, 45, 40];
export const BASS = [43, 38, 33, 28];

/** Places a pitch on the lowest possible fret; ties go to the thinner string. */
export function place(note: string, tuning: number[], maxFret = 15): string {
  const pitch = midi(note);
  let best: { fret: number; string: number } | null = null;
  tuning.forEach((open, i) => {
    const fret = pitch - open;
    if (fret < 0 || fret > maxFret) return;
    if (!best || fret < best.fret) best = { fret, string: i + 1 };
  });
  if (!best) throw new Error(`No cabe ${note} en esta afinación`);
  const { fret, string } = best;
  return `${fret}.${string}`;
}

export const guitarNote = (note: string, maxFret = 15) => place(note, GUITAR, maxFret);
export const bassNote = (note: string) => place(note, BASS, 7);

/** Chord shapes as written on a chord chart: low E string first, x = not played. */
// prettier-ignore
export const SHAPES: Record<string, string> = {
  Am: 'x02210', C: 'x32010', D: 'xx0232', F: '133211', E: '022100', Em: '022000', G: '320003',
  A: 'x02220', Bm: 'x24432', 'F#m': '244222', B7: 'x21202', Dm: 'xx0231',
  A7: 'x02020', D7: 'xx0212', E7: '020100', G7: '320001',
};

/** { string number: fret } for the strings a shape plays. */
export function shapeFrets(chord: string): Record<number, number> {
  const shape = SHAPES[chord];
  if (!shape) throw new Error(`Acorde sin forma: ${chord}`);
  const out: Record<number, number> = {};
  [...shape].forEach((c, i) => {
    if (c !== 'x') out[6 - i] = Number(c);
  });
  return out;
}

const bassString = (chord: string) => Math.max(...Object.keys(shapeFrets(chord)).map(Number));

/**
 * Arpeggio over a chord shape. `order` lists strings to pick, 'b' being the chord's bass string.
 * The first note carries the chord name.
 */
export function arpeggio(chord: string, order: (number | 'b')[], duration: number): string {
  const frets = shapeFrets(chord);
  return order
    .map((s, i) => {
      const string = s === 'b' ? bassString(chord) : s;
      const fret = frets[string];
      if (fret === undefined) throw new Error(`La cuerda ${string} no suena en ${chord}`);
      return `${fret}.${string}.${duration}${i === 0 ? `{ch "${chord}"}` : ''}`;
    })
    .join(' ');
}

/** The whole shape struck at once. */
export function strum(chord: string, duration: string, label = true): string {
  const notes = Object.entries(shapeFrets(chord)).map(([s, f]) => `${f}.${s}`);
  return `(${notes.join(' ')}).${duration}${label ? `{ch "${chord}"}` : ''}`;
}

/** Notes sounding together on a pitched (non-fretted) staff. */
export const together = (notes: string[]) => `(${notes.join(' ')})`;
