import { bassNote } from '../theory';
import { defineSong } from '../tex';

// Original exercise: fast downstroked power chords, the I–V–vi–IV of punk, with a stop before the end.
type Power = 'G5' | 'D5' | 'E5' | 'C5';
const POWER: Record<Power, string> = { G5: '(3.6 5.5)', D5: '(5.5 7.4)', E5: '(0.6 2.5)', C5: '(3.5 5.4)' };
const ROOT: Record<Power, string> = { G5: 'G1', D5: 'D2', E5: 'E1', C5: 'C2' };
const PROG: Power[] = ['G5', 'D5', 'E5', 'C5'];
const strum = (c: Power) => `${POWER[c]}.8{sd ch "${c}"} ${Array(7).fill(`${POWER[c]}.8{sd}`).join(' ')}`;
const STOP = `${POWER.G5}.4{ch "G5"} r.4 r.2`;
const bass = (c: Power) => Array(8).fill(`${bassNote(ROOT[c])}.8`).join(' ');
const BEAT = '(K H).8 H.8 (S H).8 H.8 (K H).8 H.8 (S H).8 H.8';
const STOP_DRUMS = '(K C).4 r.4 r.2';

export default defineSong({
  id: 'punk-rapido',
  title: 'Punk a toda pastilla',
  artist: 'Ejercicio original',
  genre: 'Punk',
  level: 'Principiante',
  key: 'Sol mayor',
  timeLabel: '4/4',
  tempo: 176,
  tags: ['power chords', 'púa hacia abajo', 'velocidad', 'resistencia'],
  timeSignature: [4, 4],
  sections: { 0: 'Estrofa', 8: 'Parón', 9: 'Estribillo', 13: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'distortionguitar',
      staff: 'score tabs',
      bars: [...PROG.map(strum), ...PROG.map(strum), STOP, ...PROG.map(strum), '(3.6 5.5 5.4).1{ch "G5"}'],
    },
    {
      name: 'Bajo',
      instrument: 'electricbasspick',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...PROG.map(bass), ...PROG.map(bass), `${bassNote('G1')}.4 r.4 r.2`, ...PROG.map(bass), `${bassNote('G1')}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [...Array(8).fill(BEAT), STOP_DRUMS, ...Array(4).fill(BEAT), '(K C).1'],
    },
  ],
});
