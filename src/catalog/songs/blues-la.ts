import { bassNote, strum, together } from '../theory';
import { defineSong } from '../tex';

// Original exercise: 12-bar shuffle in A with the classic boogie pattern.
type Chord = 'A' | 'D' | 'E';
const progression: Chord[] = ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'];

/** Open string that carries each chord's root. */
const ROOT_STRING: Record<Chord, number> = { A: 5, D: 4, E: 6 };
const WALK: Record<Chord, string[]> = {
  A: ['A1', 'C#2', 'E2', 'F#2'], D: ['D2', 'F#2', 'A2', 'B2'], E: ['E1', 'G#1', 'B1', 'C#2'],
};
const SHELL: Record<Chord, string[]> = { A: ['G3', 'C#4', 'E4'], D: ['F#3', 'C4', 'D4'], E: ['G#3', 'D4', 'E4'] };

function boogie(chord: Chord, label: boolean): string {
  const r = ROOT_STRING[chord];
  const fifth = `(0.${r}{pm} 2.${r - 1})`;
  const sixth = `(0.${r}{pm} 4.${r - 1})`;
  const first = `${fifth}.8${label ? `{ch "${chord}7"}` : ''}`;
  return [first, `${fifth}.8`, `${sixth}.8`, `${sixth}.8`, `${fifth}.8`, `${fifth}.8`, `${sixth}.8`, `${sixth}.8`].join(' ');
}

export default defineSong({
  id: 'blues-la',
  title: 'Blues en La',
  artist: 'Ejercicio original',
  genre: 'Blues',
  level: 'Principiante',
  key: 'La mayor',
  timeLabel: '4/4 shuffle',
  tempo: 92,
  tags: ['12 compases', 'boogie', 'shuffle', 'palm mute'],
  timeSignature: [4, 4],
  shuffle: true,
  sections: { 0: 'Compases 1–4', 4: 'Compases 5–8', 8: 'Vuelta', 12: 'Final' },
  tracks: [
    {
      name: 'Guitarra rítmica',
      instrument: 'overdrivenguitar',
      staff: 'score tabs',
      bars: [...progression.map((c, i) => boogie(c, i === 0 || progression[i - 1] !== c)), strum('A7', '1')],
    },
    {
      name: 'Bajo',
      instrument: 'electricbassfinger',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...progression.map((c) => WALK[c].map((n) => `${bassNote(n)}.4`).join(' ')), `${bassNote('A1')}.1`],
    },
    {
      name: 'Piano',
      instrument: 'electricpiano1',
      staff: 'score',
      tuning: 'piano',
      bars: [
        ...progression.map((c) => `r.4 ${together(SHELL[c])}.4 r.4 ${together(SHELL[c])}.4`),
        `${together(['A3', 'C#4', 'G4'])}.1`,
      ],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...progression.map(() => '(K H).8 H.8 (S H).8 H.8 (K H).8 (K H).8 (S H).8 H.8'), '(K C).1'],
    },
  ],
});
