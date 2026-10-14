import { arpeggio, bassNote, strum, together } from '../theory';
import { defineSong } from '../tex';

// Traditional. Classic 6/8 arpeggio over Am C D F / Am C E E.
const progression = [
  'Am', 'C', 'D', 'F', 'Am', 'C', 'E', 'E',
  'Am', 'C', 'D', 'F', 'Am', 'C', 'E', 'E', 'Am', 'C', 'D', 'F', 'Am', 'E', 'Am', 'E',
  'Am', 'C', 'D', 'F', 'Am', 'E', 'Am',
];
const last = progression.length - 1;
const INTRO_BARS = 8;
const rest = 'r.2{d}';

const BASS: Record<string, [string, string]> = {
  Am: ['A1', 'E2'], C: ['C2', 'G1'], D: ['D2', 'A1'], F: ['F1', 'C2'], E: ['E1', 'B1'],
};
const ORGAN: Record<string, string[]> = {
  Am: ['A3', 'C4', 'E4'], C: ['G3', 'C4', 'E4'], D: ['A3', 'D4', 'F#4'], F: ['A3', 'C4', 'F4'], E: ['G#3', 'B3', 'E4'],
};

export default defineSong({
  id: 'sol-naciente',
  title: 'La casa del sol naciente',
  artist: 'Tradicional',
  genre: 'Folk',
  level: 'Principiante',
  key: 'La menor',
  timeLabel: '6/8',
  tempo: 116,
  tags: ['arpegio', 'house of the rising sun', 'acordes abiertos'],
  timeSignature: [6, 8],
  sections: { 0: 'Intro', 8: 'Estrofa', 24: 'Final' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'acousticguitarsteel',
      staff: 'score tabs',
      bars: progression.map((c, i) =>
        i === last ? strum(c, '2{d}') : arpeggio(c, c === 'D' ? ['b', 3, 2, 1, 2, 3] : ['b', 4, 3, 2, 1, 2], 8),
      ),
    },
    {
      name: 'Bajo',
      instrument: 'electricbassfinger',
      staff: 'tabs',
      tuning: ['G2', 'D2', 'A1', 'E1'],
      bars: progression.map((c, i) => {
        if (i < INTRO_BARS) return rest;
        const [root, fifth] = BASS[c];
        return i === last ? `${bassNote(root)}.2{d}` : `${bassNote(root)}.4{d} ${bassNote(fifth)}.4{d}`;
      }),
    },
    {
      name: 'Órgano',
      instrument: 'drawbarorgan',
      staff: 'score',
      tuning: 'piano',
      bars: progression.map((c, i) => (i < INTRO_BARS ? rest : `${together(ORGAN[c])}.2{d}`)),
    },
    {
      name: 'Batería',
      instrument: 'percussion',
      staff: 'score',
      bars: progression.map((_, i) => {
        if (i < INTRO_BARS) return rest;
        return i === last ? '(K C).2{d}' : '(K H).8 H.8 H.8 (S H).8 H.8 H.8';
      }),
    },
  ],
});
