import { defineSong } from '../tex';

// Original exercise: Drop D tuning (low string down to D) so power chords are one finger across the
// three low strings, played against the beat.
const P = (fret: number) => `(${fret}.6 ${fret}.5 ${fret}.4)`;
const RIFF_A = `${P(0)}.8{ch "D5"} ${P(0)}.16 r.16 r.8 ${P(3)}.8{ch "F5"} ${P(0)}.16 r.16 ${P(5)}.8{ch "G5"} r.8 ${P(3)}.8`;
const RIFF_B = `0.6{pm}.16 0.6{pm}.16 r.8 0.6{pm}.16 0.6{pm}.16 r.8 ${P(5)}.4{ch "G5"} ${P(3)}.4{ch "F5"}`;
const RIFF_C = `${P(0)}.8{ch "D5"} ${P(0)}.16 r.16 r.8 ${P(3)}.8{ch "F5"} ${P(0)}.16 r.16 ${P(8)}.8{ch "A#5"} r.8 ${P(7)}.8{ch "A5"}`;
const RIFF_D = `0.6{pm}.16 0.6{pm}.16 r.8 0.6{pm}.16 0.6{pm}.16 r.8 ${P(3)}.4{ch "F5"} ${P(1)}.4{ch "D#5"}`;
const RIFF = [RIFF_A, RIFF_B, RIFF_C, RIFF_D];
const BIG = [`${P(0)}.2{ch "D5"} ${P(3)}.2{ch "F5"}`, `${P(5)}.2{ch "G5"} ${P(3)}.2{ch "F5"}`];

// Bass in Drop D as well (D A D G from low to high): fret.string with string 4 the low D.
const b = (fret: number) => `${fret}.4`;
const BASS_A = `${b(0)}.8 ${b(0)}.16 r.16 r.8 ${b(3)}.8 ${b(0)}.16 r.16 ${b(5)}.8 r.8 ${b(3)}.8`;
const BASS_B = `${b(0)}.16 ${b(0)}.16 r.8 ${b(0)}.16 ${b(0)}.16 r.8 ${b(5)}.4 ${b(3)}.4`;
const BASS_C = `${b(0)}.8 ${b(0)}.16 r.16 r.8 ${b(3)}.8 ${b(0)}.16 r.16 ${b(8)}.8 r.8 ${b(7)}.8`;
const BASS_D = `${b(0)}.16 ${b(0)}.16 r.8 ${b(0)}.16 ${b(0)}.16 r.8 ${b(3)}.4 ${b(1)}.4`;
const BASS = [BASS_A, BASS_B, BASS_C, BASS_D];
const BIG_BASS = [`${b(0)}.2 ${b(3)}.2`, `${b(5)}.2 ${b(3)}.2`];

// Half-time feel: snare on beat 3, kick following the riff.
const DRUMS_A = '(K H).8 K.16 r.16 H.8 (K H).8 (S H).8 H.8 (K H).8 H.8';
const DRUMS_B = '(K H).16 K.16 H.8 (K H).16 K.16 H.8 (S H).4 (K H).4';
const DRUMS = [DRUMS_A, DRUMS_B, DRUMS_A, DRUMS_B];
const BIG_DRUMS = '(K C).4 H.4 (S H).4 H.4';

export default defineSong({
  id: 'dropd-sincopado',
  title: 'Drop D sincopado',
  artist: 'Ejercicio original',
  genre: 'Metal',
  level: 'Intermedio',
  key: 'Re menor',
  timeLabel: '4/4',
  tempo: 96,
  tags: ['drop d', 'síncopa', 'power chords con un dedo', 'palm mute'],
  timeSignature: [4, 4],
  sections: { 0: 'Riff', 4: 'Estribillo', 8: 'Riff', 12: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'distortionguitar',
      staff: 'score tabs',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'],
      bars: [...RIFF, ...BIG, ...BIG, ...RIFF, `${P(0)}.1{ch "D5"}`],
    },
    {
      name: 'Bajo',
      instrument: 'electricbasspick',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'D1'],
      bars: [...BASS, ...BIG_BASS, ...BIG_BASS, ...BASS, `${b(0)}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...DRUMS, BIG_DRUMS, BIG_DRUMS, BIG_DRUMS, BIG_DRUMS, ...DRUMS, '(K C).1'],
    },
  ],
});
