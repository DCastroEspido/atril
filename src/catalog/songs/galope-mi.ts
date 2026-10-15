import { bassNote } from '../theory';
import { defineSong } from '../tex';

// Original exercise: the metal gallop (an eighth and two sixteenths) palm-muted on the low E.
const G = '0.6{pm}.8 0.6{pm}.16 0.6{pm}.16';
const RIFF = [
  `${G} ${G} ${G} (3.6 5.5).8{ch "G5"} (5.6 7.5).8{ch "A5"}`,
  `${G} ${G} (7.6 9.5).8{ch "B5"} (5.6 7.5).8 (3.6 5.5).8 (2.6 4.5).8{ch "F#5"}`,
  `${G} ${G} ${G} (3.6 5.5).8{ch "G5"} (5.6 7.5).8{ch "A5"}`,
  `${G} ${G} (5.6 7.5).4{ch "A5"} (7.6 9.5).4{ch "B5"}`,
];
type Power = 'E5' | 'C5' | 'D5' | 'B5';
const POWER: Record<Power, string> = { E5: '(0.6 2.5)', C5: '(3.5 5.4)', D5: '(5.5 7.4)', B5: '(2.5 4.4)' };
const ROOT: Record<Power, string> = { E5: 'E1', C5: 'C2', D5: 'D2', B5: 'B1' };
// Palm mute is a note effect, so it goes on every note of the chord.
const muted = (c: Power) => POWER[c].replace(/(\d+\.\d+)/g, '$1{pm}');
const gallop = (c: Power, label = false) =>
  `${muted(c)}.8${label ? `{ch "${c}"}` : ''} ${muted(c)}.16 ${muted(c)}.16`;
const ACCENTS: [Power, Power][] = [['E5', 'C5'], ['D5', 'B5'], ['E5', 'C5'], ['D5', 'E5']];
const accentBars = ACCENTS.map(([a, b]) => `${gallop(a, true)} ${gallop(a)} ${gallop(b, true)} ${gallop(b)}`);

const bassGallop = (n: string) => `${bassNote(n)}.8 ${bassNote(n)}.16 ${bassNote(n)}.16`;
const riffBass = [
  `${bassGallop('E1')} ${bassGallop('E1')} ${bassGallop('E1')} ${bassNote('G1')}.8 ${bassNote('A1')}.8`,
  `${bassGallop('E1')} ${bassGallop('E1')} ${bassNote('B1')}.8 ${bassNote('A1')}.8 ${bassNote('G1')}.8 ${bassNote('F#1')}.8`,
  `${bassGallop('E1')} ${bassGallop('E1')} ${bassGallop('E1')} ${bassNote('G1')}.8 ${bassNote('A1')}.8`,
  `${bassGallop('E1')} ${bassGallop('E1')} ${bassNote('A1')}.4 ${bassNote('B1')}.4`,
];
const accentBass = ACCENTS.map(([a, b]) => `${bassGallop(ROOT[a])} ${bassGallop(ROOT[a])} ${bassGallop(ROOT[b])} ${bassGallop(ROOT[b])}`);

// Double kick on the gallop, snare on 2 and 4.
const beat = (snare: boolean, crash = false) => `(K ${snare ? 'S ' : ''}${crash ? 'C' : 'H'}).8 K.16 K.16`;
const DRUMS = `${beat(false, false)} ${beat(true)} ${beat(false)} ${beat(true)}`;
const DRUMS_CRASH = `${beat(false, true)} ${beat(true)} ${beat(false)} ${beat(true)}`;

export default defineSong({
  id: 'galope-mi',
  title: 'Galope en Mi',
  artist: 'Ejercicio original',
  genre: 'Metal',
  level: 'Avanzado',
  key: 'Mi menor',
  timeLabel: '4/4',
  tempo: 150,
  tags: ['galope', 'palm mute', 'power chords', 'púa alterna'],
  timeSignature: [4, 4],
  sections: { 0: 'Riff', 4: 'Acentos', 8: 'Riff', 12: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'distortionguitar',
      staff: 'score tabs',
      bars: [...RIFF, ...accentBars, ...RIFF, '(0.6 2.5 2.4).1{ch "E5"}'],
    },
    {
      name: 'Bajo',
      instrument: 'electricbasspick',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: [...riffBass, ...accentBass, ...riffBass, `${bassNote('E1')}.1`],
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: [DRUMS_CRASH, DRUMS, DRUMS, DRUMS, DRUMS_CRASH, DRUMS, DRUMS, DRUMS, DRUMS_CRASH, DRUMS, DRUMS, DRUMS, '(K C).1'],
    },
  ],
});
