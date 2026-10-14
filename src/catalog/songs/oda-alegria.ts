import { bassNote, guitarNote, together } from '../theory';
import { defineSong } from '../tex';

// Beethoven, 9th symphony theme, in C in first position.
const n = (note: string, dur: number | string) => `${guitarNote(note, 4)}.${dur}`;
const quarters = (notes: string[]) => notes.map((x) => n(x, 4)).join(' ');

const A1 = quarters(['E4', 'E4', 'F4', 'G4']);
const A2 = quarters(['G4', 'F4', 'E4', 'D4']);
const A3 = quarters(['C4', 'C4', 'D4', 'E4']);
const HALF_CADENCE = `${n('E4', '4{d}')} ${n('D4', 8)} ${n('D4', 2)}`;
const FULL_CADENCE = `${n('D4', '4{d}')} ${n('C4', 8)} ${n('C4', 2)}`;
const BRIDGE = [
  quarters(['D4', 'D4', 'E4', 'C4']),
  `${n('D4', 4)} ${n('E4', 8)} ${n('F4', 8)} ${n('E4', 4)} ${n('C4', 4)}`,
  `${n('D4', 4)} ${n('E4', 8)} ${n('F4', 8)} ${n('E4', 4)} ${n('D4', 4)}`,
  `${n('C4', 4)} ${n('D4', 4)} ${n('G3', 2)}`,
];
const melody = [A1, A2, A3, HALF_CADENCE, A1, A2, A3, FULL_CADENCE, ...BRIDGE, A1, A2, A3, FULL_CADENCE];

/** One or two chords per bar (two = half a bar each). */
const CHORDS: ('C' | 'G')[][] = [
  ['C'], ['G'], ['C'], ['G'], ['C'], ['G'], ['C'], ['G', 'C'],
  ['G'], ['G', 'C'], ['G'], ['C', 'G'], ['C'], ['G'], ['C'], ['G', 'C'],
];
const VOICING = { C: ['E3', 'G3', 'C4'], G: ['D3', 'G3', 'B3'] };
const BASS_LINE = { C: ['C2', 'G1'], G: ['G1', 'D2'] };

export default defineSong({
  id: 'oda-alegria',
  title: 'Oda a la alegría',
  artist: 'Ludwig van Beethoven',
  genre: 'Clásica',
  level: 'Principiante',
  key: 'Do mayor',
  timeLabel: '4/4',
  tempo: 100,
  tags: ['melodía', 'primera posición', 'novena sinfonía', 'ode to joy'],
  timeSignature: [4, 4],
  sections: { 0: 'Tema', 8: 'Puente', 12: 'Tema final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'acousticguitarnylon',
      staff: 'score tabs',
      bars: melody.map((bar, i) => bar.replace(/^(\S+)/, `$1{ch "${CHORDS[i][0]}"}`)),
    },
    {
      name: 'Piano',
      instrument: 'acousticgrandpiano',
      staff: 'score',
      tuning: 'piano',
      bars: CHORDS.map((cs) => (cs.length === 1 ? [cs[0], cs[0]] : cs).map((c) => `${together(VOICING[c])}.2`).join(' ')),
    },
    {
      name: 'Bajo',
      instrument: 'acousticbass',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: CHORDS.map((cs) =>
        (cs.length === 1 ? BASS_LINE[cs[0]] : cs.map((c) => BASS_LINE[c][0])).map((x) => `${bassNote(x)}.2`).join(' '),
      ),
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: CHORDS.map((_, i) => (i === CHORDS.length - 1 ? '(K C).2 r.2' : '(K H).4 (X H).4 (K H).4 (X H).4')),
    },
  ],
});
