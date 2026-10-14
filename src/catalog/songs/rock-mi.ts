import { bassNote } from '../theory';
import { defineSong } from '../tex';

// Original exercise: palm-muted riff, power-chord chorus and an E minor pentatonic solo.
const RIFF_A = '0.6{pm}.8{ch "E5"} 0.6{pm}.8 (3.6 5.5).8 0.6{pm}.8 0.6{pm}.8 (5.6 7.5).8 (3.6 5.5).8 0.6{pm}.8';
const RIFF_B = '0.6{pm}.8 0.6{pm}.8 (3.6 5.5).8 0.6{pm}.8 (5.6 7.5).4 (7.6 9.5).4';
const RIFF = [RIFF_A, RIFF_B, RIFF_A, RIFF_B];

type Power = 'E5' | 'G5' | 'A5' | 'C5' | 'B5';
const POWER: Record<Power, string> = {
  E5: '(0.6 2.5 2.4)', G5: '(3.6 5.5 5.4)', A5: '(5.6 7.5 7.4)', C5: '(3.5 5.4 5.3)', B5: '(2.5 4.4 4.3)',
};
const ROOT: Record<Power, string> = { E5: 'E1', G5: 'G1', A5: 'A1', C5: 'C2', B5: 'B1' };
const CHORUS: [Power, Power][] = [['E5', 'G5'], ['A5', 'C5'], ['E5', 'G5'], ['A5', 'B5']];

const chorusGuitar = CHORUS.map((pair) =>
  pair.map((c) => `${POWER[c]}.8{ch "${c}"} ${POWER[c]}.8 ${POWER[c]}.8 ${POWER[c]}.8`).join(' '),
);
const chorusBass = CHORUS.map((pair) => pair.map((c) => Array(4).fill(`${bassNote(ROOT[c])}.8`).join(' ')).join(' '));
const eighths = (notes: string[]) => notes.map((x) => `${bassNote(x)}.8`).join(' ');
const RIFF_BASS_A = eighths(['E1', 'E1', 'G1', 'E1', 'E1', 'A1', 'G1', 'E1']);
const RIFF_BASS_B = `${eighths(['E1', 'E1', 'G1', 'E1'])} ${bassNote('A1')}.4 ${bassNote('B1')}.4`;
const riffBass = [RIFF_BASS_A, RIFF_BASS_B, RIFF_BASS_A, RIFF_BASS_B];

const SOLO = [
  '12.2.8 15.2.8 12.1.4 15.2.8 12.2.8 14.3.4',
  '14.3{b (0 4)}.4 12.3.8 14.4.8 12.4.2',
  '15.1.8 12.1.8 15.2.8 12.2.8 14.3.8 12.3.8 14.4.8 12.4.8',
  '14.4.4 12.4.8 14.5.8 14.3{b (0 4)}.2',
];
const silent = ['r.1', 'r.1', 'r.1', 'r.1'];

const BEAT = '(K H).8 H.8 (S H).8 H.8 (K H).8 (K H).8 (S H).8 H.8';
const OPEN_BEAT = '(K C).8 O.8 (S O).8 O.8 (K O).8 (K O).8 (S O).8 O.8';
const FILL = '(K H).8 H.8 (S H).8 H.8 S.16 S.16 S.16 S.16 (T1).16 (T1).16 (T2).16 (T2).16';
const verseDrums = [BEAT, BEAT, BEAT, FILL];
const chorusDrums = [OPEN_BEAT, OPEN_BEAT, OPEN_BEAT, FILL];

export default defineSong({
  id: 'rock-mi',
  title: 'Riff de rock en Mi',
  artist: 'Ejercicio original',
  genre: 'Rock',
  level: 'Avanzado',
  key: 'Mi menor',
  timeLabel: '4/4',
  tempo: 120,
  tags: ['power chords', 'palm mute', 'pentatónica', 'bends', 'solo'],
  timeSignature: [4, 4],
  sections: { 0: 'Riff', 4: 'Estribillo', 8: 'Riff 2', 12: 'Solo', 16: 'Final' },
  tracks: [
    {
      name: 'Guitarra rítmica',
      instrument: 'distortionguitar',
      staff: 'score tabs',
      bars: [...RIFF, ...chorusGuitar, ...RIFF, ...chorusGuitar, '(0.6 2.5 2.4).1{ch "E5"}'],
    },
    {
      name: 'Guitarra solista',
      instrument: 'overdrivenguitar',
      staff: 'score tabs',
      bars: [...silent, ...silent, ...silent, ...SOLO, '12.1.1'],
    },
    {
      name: 'Bajo',
      instrument: 'electricbasspick',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...riffBass, ...chorusBass, ...riffBass, ...chorusBass, `${bassNote('E1')}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...verseDrums, ...chorusDrums, ...verseDrums, ...chorusDrums, '(K C).1'],
    },
  ],
});
