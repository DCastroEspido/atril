import { bassNote } from '../theory';
import { defineSong } from '../tex';

// Original exercise: octave shapes (root on the 5th string, octave two frets up on the 3rd) with fuzz.
const OCT: Record<string, string> = { D: '(5.5 7.3)', F: '(8.5 10.3)', G: '(10.5 12.3)', C: '(3.5 5.3)', A: '(0.5 2.3)', Bb: '(1.5 3.3)' };
const RIFF = [
  `${OCT.D}.8 ${OCT.D}.8 r.8 ${OCT.F}.8 ${OCT.G}.4 ${OCT.F}.8 ${OCT.D}.8`,
  `${OCT.D}.8 ${OCT.D}.8 r.8 ${OCT.C}.8 ${OCT.A}.2`,
  `${OCT.D}.8 ${OCT.D}.8 r.8 ${OCT.F}.8 ${OCT.G}.4 ${OCT.F}.8 ${OCT.G}.8`,
  `${OCT.Bb}.4 ${OCT.A}.4 ${OCT.C}.8 ${OCT.A}.8 ${OCT.D}.4`,
];
const CHORUS = [`${OCT.D}.2 ${OCT.F}.2`, `${OCT.G}.2 ${OCT.C}.2`, `${OCT.D}.2 ${OCT.F}.2`, `${OCT.G}.2 ${OCT.A}.2`];

const ROOT: Record<string, string> = { D: 'D2', F: 'F1', G: 'G1', C: 'C2', A: 'A1', Bb: 'A#1' };
const eighths = (n: string, k = 8) => Array(k).fill(`${bassNote(ROOT[n])}.8`).join(' ');
const riffBass = [
  `${eighths('D', 4)} ${bassNote(ROOT.G)}.4 ${bassNote(ROOT.F)}.8 ${bassNote(ROOT.D)}.8`,
  `${eighths('D', 4)} ${bassNote(ROOT.A)}.2`,
  `${eighths('D', 4)} ${bassNote(ROOT.G)}.4 ${bassNote(ROOT.F)}.8 ${bassNote(ROOT.G)}.8`,
  `${bassNote(ROOT.Bb)}.4 ${bassNote(ROOT.A)}.4 ${bassNote(ROOT.C)}.8 ${bassNote(ROOT.A)}.8 ${bassNote(ROOT.D)}.4`,
];
const chorusBass = [['D', 'F'], ['G', 'C'], ['D', 'F'], ['G', 'A']].map(([a, b]) => `${eighths(a, 4)} ${eighths(b, 4)}`);

const ROCK = '(K H).8 H.8 (S H).8 H.8 (K H).8 (K H).8 (S H).8 H.8';
const OPEN = '(K C).8 O.8 (S O).8 O.8 (K O).8 (K O).8 (S O).8 O.8';

export default defineSong({
  id: 'octavas-fuzz',
  title: 'Riff de octavas',
  artist: 'Ejercicio original',
  genre: 'Rock',
  level: 'Intermedio',
  key: 'Re menor',
  timeLabel: '4/4',
  tempo: 100,
  tags: ['octavas', 'fuzz', 'rock alternativo', 'silenciar cuerdas'],
  timeSignature: [4, 4],
  sections: { 0: 'Riff', 4: 'Estribillo', 8: 'Riff', 12: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'overdrivenguitar',
      staff: 'score tabs',
      bars: [...RIFF, ...CHORUS, ...RIFF, `${OCT.D}.1`],
    },
    {
      name: 'Bajo',
      instrument: 'electricbasspick',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...riffBass, ...chorusBass, ...riffBass, `${bassNote('D2')}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [ROCK, ROCK, ROCK, ROCK, OPEN, OPEN, OPEN, OPEN, ROCK, ROCK, ROCK, ROCK, '(K C).1'],
    },
  ],
});
