import { together } from '../theory';
import { defineSong } from '../tex';

// Anonymous "Romance": triplet arpeggios, melody on string 1 over open B and G.
type Bar = { chord: 'Em' | 'Am' | 'B7'; bass: string; inner: [number, number]; melody: [number, number, number] };

const BARS: Bar[] = [
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [7, 7, 7] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [7, 5, 3] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [3, 2, 0] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [0, 3, 7] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [12, 12, 12] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [12, 10, 8] },
  { chord: 'Am', bass: '0.5', inner: [5, 5], melody: [8, 7, 5] },
  { chord: 'Am', bass: '0.5', inner: [5, 5], melody: [5, 7, 8] },
  { chord: 'B7', bass: '7.6', inner: [8, 7], melody: [7, 8, 7] },
  { chord: 'B7', bass: '7.6', inner: [8, 7], melody: [11, 8, 7] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [7, 5, 3] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [3, 2, 0] },
  { chord: 'B7', bass: '2.5', inner: [2, 0], melody: [2, 2, 2] },
  { chord: 'B7', bass: '2.5', inner: [2, 0], melody: [2, 3, 2] },
  { chord: 'Em', bass: '0.6', inner: [0, 0], melody: [0, 0, 0] },
];

const T = '{tu 3}';
const PAD = { Em: ['E3', 'G3', 'B3'], Am: ['E3', 'A3', 'C4'], B7: ['D#3', 'F#3', 'A3'] };
const ROOT = { Em: 'E2', Am: 'A1', B7: 'B1' };

const guitar = BARS.map(({ chord, bass, inner: [s3, s2], melody }) =>
  melody
    .map((fret, beat) => {
      const top = beat === 0 ? `(${fret}.1 ${bass}).8${T}{ch "${chord}"}` : `${fret}.1.8${T}`;
      return `${top} ${s2}.2.8${T} ${s3}.3.8${T}`;
    })
    .join(' '),
);

export default defineSong({
  id: 'romance',
  title: 'Romance anónimo',
  artist: 'Anónimo',
  genre: 'Clásica',
  level: 'Intermedio',
  key: 'Mi menor',
  timeLabel: '3/4',
  tempo: 66,
  tags: ['tresillos', 'fingerstyle', 'juegos prohibidos', 'spanish romance'],
  timeSignature: [3, 4],
  sections: { 0: 'Tema', 8: 'Respuesta' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'acousticguitarnylon',
      staff: 'score tabs',
      bars: [...guitar, '(0.6 2.5 2.4 0.3 0.2 0.1).2{d}{ch "Em"}'],
    },
    {
      name: 'Cuerdas',
      instrument: 'stringensemble2',
      staff: 'score',
      tuning: 'piano',
      bars: [...BARS.map(({ chord }) => `${together(PAD[chord])}.2{d}`), `${together(PAD.Em)}.2{d}`],
    },
    {
      name: 'Contrabajo',
      instrument: 'contrabass',
      staff: 'score',
      tuning: 'piano',
      bars: [...BARS.map(({ chord }) => `${ROOT[chord]}.2{d}`), 'E2.2{d}'],
    },
  ],
});
