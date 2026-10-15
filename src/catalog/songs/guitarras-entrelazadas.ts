import { bassNote, guitarNote } from '../theory';
import { defineSong } from '../tex';

// Original exercise: two guitars that split the job — one plays short chord stabs on the top strings,
// the other a running line in the low register.
const PROG = ['C', 'G', 'Am', 'F'] as const;
type Chord = (typeof PROG)[number];
const TRIAD: Record<Chord, string> = { C: '(0.3 1.2 0.1)', G: '(0.3 0.2 3.1)', Am: '(2.3 1.2 0.1)', F: '(2.3 1.2 1.1)' };
const stabs = (c: Chord) =>
  `${TRIAD[c]}.8{ch "${c}"} r.8 ${TRIAD[c]}.8 ${TRIAD[c]}.8 r.8 ${TRIAD[c]}.8 ${TRIAD[c]}.8 r.8`;
const LINE: Record<Chord, string[]> = {
  C: ['C3', 'E3', 'G3', 'E3', 'C3', 'E3', 'G3', 'B3'],
  G: ['B2', 'D3', 'G3', 'D3', 'B2', 'D3', 'G3', 'A3'],
  Am: ['A2', 'C3', 'E3', 'C3', 'A2', 'C3', 'E3', 'G3'],
  F: ['F2', 'A2', 'C3', 'A2', 'F2', 'A2', 'C3', 'E3'],
};
const line = (c: Chord) => LINE[c].map((n) => `${guitarNote(n, 5)}.8`).join(' ');
const ROOT: Record<Chord, string> = { C: 'C2', G: 'G1', Am: 'A1', F: 'F1' };
const bass = (c: Chord) => `${bassNote(ROOT[c])}.4 ${bassNote(ROOT[c])}.4 ${bassNote(ROOT[c])}.4 ${bassNote(ROOT[c])}.4`;
const silent = 'r.1';

const BEAT = '(K H).8 H.8 (S H).8 H.8 (K H).8 (K H).8 (S H).8 H.8';
const bars = <T,>(f: (c: Chord) => T) => [...PROG.map(f), ...PROG.map(f)];

export default defineSong({
  id: 'guitarras-entrelazadas',
  title: 'Guitarras entrelazadas',
  artist: 'Ejercicio original',
  genre: 'Indie',
  level: 'Intermedio',
  key: 'Do mayor',
  timeLabel: '4/4',
  tempo: 120,
  tags: ['dos guitarras', 'staccato', 'indie rock', 'acordes en las cuerdas agudas'],
  timeSignature: [4, 4],
  sections: { 0: 'Guitarra rítmica sola', 4: 'Entran las dos', 12: 'Final' },
  tracks: [
    {
      name: 'Guitarra rítmica',
      instrument: 'electricguitarclean',
      staff: 'score tabs',
      bars: [...PROG.map(stabs), ...bars(stabs), '(0.3 1.2 0.1).1{ch "C"}'],
    },
    {
      name: 'Guitarra melódica',
      instrument: 'overdrivenguitar',
      staff: 'score tabs',
      bars: [silent, silent, silent, silent, ...bars(line), `${guitarNote('C3', 5)}.1`],
    },
    {
      name: 'Bajo',
      instrument: 'electricbassfinger',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...PROG.map(bass), ...bars(bass), `${bassNote('C2')}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...Array(12).fill(BEAT), '(K C).1'],
    },
  ],
});
