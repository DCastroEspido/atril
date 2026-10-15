import { bassNote, strum } from '../theory';
import { defineSong } from '../tex';

// Original exercise: a down-down-up-up-down-up strumming pattern over barre chords.
const PROG = ['D', 'F#m', 'Bm', 'G'] as const;
type Chord = (typeof PROG)[number];
const pattern = (c: Chord) =>
  [
    `${strum(c, '4')}{sd}`,
    `${strum(c, '8', false)}{sd}`,
    `${strum(c, '8', false)}{su}`,
    `${strum(c, '8', false)}{su}`,
    `${strum(c, '8', false)}{sd}`,
    `${strum(c, '4', false)}{su}`,
  ].join(' ');
const ROOT: Record<Chord, string> = { D: 'D2', 'F#m': 'F#1', Bm: 'B1', G: 'G1' };
const bass = (c: Chord) => `${bassNote(ROOT[c])}.2 ${bassNote(ROOT[c])}.4 ${bassNote(ROOT[c])}.4`;
const BEAT = '(K H).8 H.8 (S H).8 H.8 (K H).8 (K H).8 (S H).8 O.8';

export default defineSong({
  id: 'rasgueo-cejilla',
  title: 'Rasgueo con cejilla',
  artist: 'Ejercicio original',
  genre: 'Pop',
  level: 'Intermedio',
  key: 'Re mayor',
  timeLabel: '4/4',
  tempo: 84,
  tags: ['rasgueo', 'cejilla', 'acústica', 'patrón abajo-arriba'],
  timeSignature: [4, 4],
  sections: { 0: 'Estrofa', 4: 'Estrofa', 8: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'acousticguitarsteel',
      staff: 'score tabs',
      bars: [...PROG.map(pattern), ...PROG.map(pattern), strum('D', '1')],
    },
    {
      name: 'Bajo',
      instrument: 'acousticbass',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...PROG.map(bass), ...PROG.map(bass), `${bassNote('D2')}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...Array(8).fill(BEAT), '(K C).1'],
    },
  ],
});
