import { arpeggio, strum, together } from '../theory';
import { defineSong } from '../tex';

// Pachelbel. Eight chords, two per bar, repeated three times over the ground bass.
const CHORDS = ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'];
const pairs = <T,>(list: T[]) => [0, 1, 2, 3].map((b) => list.slice(b * 2, b * 2 + 2));

const cycle = pairs(CHORDS).map((pair) => pair.map((c) => arpeggio(c, ['b', 3, 2, 1], 8)).join(' '));
const GROUND = ['D3', 'A2', 'B2', 'F#2', 'G2', 'D2', 'G2', 'A2'];
const ground = pairs(GROUND).map(([a, b]) => `${a}.2 ${b}.2`);
const THEME = ['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5'];
/** Two chord tones per chord, falling. */
const VARIATION = [
  ['F#5', 'D5'], ['E5', 'C#5'], ['D5', 'B4'], ['C#5', 'A4'], ['B4', 'G4'], ['A4', 'F#4'], ['G4', 'B4'], ['A4', 'C#5'],
];

export default defineSong({
  id: 'canon-re',
  title: 'Canon en Re',
  artist: 'Johann Pachelbel',
  genre: 'Clásica',
  level: 'Intermedio',
  key: 'Re mayor',
  timeLabel: '4/4',
  tempo: 72,
  tags: ['arpegio', 'progresión', 'barroco', 'cejilla'],
  timeSignature: [4, 4],
  sections: { 0: 'Bajo continuo', 4: 'Tema', 8: 'Variación', 12: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'acousticguitarnylon',
      staff: 'score tabs',
      bars: [...cycle, ...cycle, ...cycle, strum('D', '1')],
    },
    {
      name: 'Violín',
      instrument: 'violin',
      staff: 'score',
      tuning: 'piano',
      bars: [
        'r.1', 'r.1', 'r.1', 'r.1',
        ...pairs(THEME).map(([a, b]) => `${a}.2 ${b}.2`),
        ...pairs(VARIATION).map((pair) => pair.flat().map((x) => `${x}.4`).join(' ')),
        `${together(['D5', 'F#5'])}.1`,
      ],
    },
    {
      name: 'Violonchelo',
      instrument: 'cello',
      staff: 'score',
      tuning: 'piano',
      bars: [...ground, ...ground, ...ground, 'D2.1'],
    },
  ],
});
