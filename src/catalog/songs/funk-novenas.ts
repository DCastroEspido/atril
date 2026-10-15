import { defineSong } from '../tex';

// Original exercise: ninth chords cut short against muted "chk" strums, sixteenth by sixteenth.
const E9 = '(7.5 6.4 7.3 7.2)';
const D9 = '(5.5 4.4 5.3 5.2)';
const MUTE = '(x.5 x.4 x.3 x.2)';
const groove = (chord: string, name: string) =>
  [
    `${chord}.16{ch "${name}"} ${MUTE}.16 ${MUTE}.16 ${chord}.16`,
    `r.16 ${MUTE}.16 ${chord}.16 ${MUTE}.16`,
    `${chord}.16 ${MUTE}.16 ${MUTE}.16 ${chord}.16`,
    `r.16 ${chord}.16 ${MUTE}.16 ${MUTE}.16`,
  ].join(' ');
const GUITAR = [groove(E9, 'E9'), groove(E9, 'E9'), groove(D9, 'D9'), groove(E9, 'E9')];

// Bass: root and octave, funk style (bass strings G D A E, fret.string).
const E_BASS = '0.4.8 12.4.16 0.4.16 r.8 0.4.16 2.3.16 0.4.8 12.4.16 0.4.16 2.2.8 0.4.8';
const D_BASS = '5.3.8 7.2.16 5.3.16 r.8 5.3.16 7.3.16 5.3.8 7.2.16 5.3.16 3.3.8 5.3.8';
const BASS = [E_BASS, E_BASS, D_BASS, E_BASS];

const BEAT = '(K H).16 H.16 H.16 H.16 (S H).16 H.16 H.16 (K H).16 H.16 (K H).16 H.16 H.16 (S H).16 H.16 H.16 H.16';

export default defineSong({
  id: 'funk-novenas',
  title: 'Funk de novenas',
  artist: 'Ejercicio original',
  genre: 'Funk',
  level: 'Intermedio',
  key: 'Mi',
  timeLabel: '4/4',
  tempo: 96,
  tags: ['acordes de novena', 'notas muertas', 'semicorcheas', 'rasgueo funk'],
  timeSignature: [4, 4],
  sections: { 0: 'Groove', 4: 'Groove', 8: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'electricguitarclean',
      staff: 'score tabs',
      bars: [...GUITAR, ...GUITAR, `${E9}.1{ch "E9"}`],
    },
    {
      name: 'Bajo',
      instrument: 'slapbass1',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...BASS, ...BASS, '0.4.1'],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...Array(8).fill(BEAT), '(K C).1'],
    },
  ],
});
