import { guitarNote, together } from '../theory';
import { defineSong } from '../tex';

// Traditional English, arranged in E minor: melody on the top strings, bass on beat one.
type Bar = { chord?: string; bass?: string; melody: [string, string][] };

const BARS: Bar[] = [
  { melody: [['r', '2'], ['E4', '4']] },
  { chord: 'Em', bass: '0.6', melody: [['G4', '2'], ['A4', '4']] },
  { chord: 'G', bass: '3.6', melody: [['B4', '4{d}'], ['C#5', '8'], ['B4', '4']] },
  { chord: 'D', bass: '0.4', melody: [['A4', '2'], ['F#4', '4']] },
  { chord: 'Bm', bass: '2.5', melody: [['D4', '4{d}'], ['E4', '8'], ['F#4', '4']] },
  { chord: 'Em', bass: '0.6', melody: [['G4', '2'], ['E4', '4']] },
  { chord: 'C', bass: '3.5', melody: [['E4', '4{d}'], ['D#4', '8'], ['E4', '4']] },
  { chord: 'B7', bass: '2.5', melody: [['F#4', '2'], ['D#4', '4']] },
  { chord: 'B7', bass: '2.5', melody: [['B3', '2'], ['E4', '4']] },
  { chord: 'Em', bass: '0.6', melody: [['G4', '2'], ['A4', '4']] },
  { chord: 'G', bass: '3.6', melody: [['B4', '4{d}'], ['C#5', '8'], ['B4', '4']] },
  { chord: 'D', bass: '0.4', melody: [['A4', '2'], ['F#4', '4']] },
  { chord: 'Bm', bass: '2.5', melody: [['D4', '4{d}'], ['E4', '8'], ['F#4', '4']] },
  { chord: 'Em', bass: '0.6', melody: [['G4', '4{d}'], ['F#4', '8'], ['E4', '4']] },
  { chord: 'B7', bass: '2.5', melody: [['D#4', '4{d}'], ['C#4', '8'], ['D#4', '4']] },
  { chord: 'Em', bass: '0.6', melody: [['E4', '2{d}']] },
];

const PAD: Record<string, string[]> = {
  Em: ['E3', 'G3', 'B3'], G: ['D3', 'G3', 'B3'], D: ['D3', 'F#3', 'A3'],
  Bm: ['D3', 'F#3', 'B3'], C: ['C3', 'E3', 'G3'], B7: ['D#3', 'A3', 'B3'],
};

export default defineSong({
  id: 'greensleeves',
  title: 'Greensleeves',
  artist: 'Tradicional inglesa',
  genre: 'Clásica',
  level: 'Intermedio',
  key: 'Mi menor',
  timeLabel: '3/4',
  tempo: 96,
  tags: ['melodía', 'bajo alternado', 'renacimiento'],
  timeSignature: [3, 4],
  sections: { 0: 'Primera frase', 9: 'Segunda frase' },
  tracks: [
    {
      name: 'Guitarra',
      instrument: 'acousticguitarnylon',
      staff: 'score tabs',
      bars: BARS.map(({ chord, bass, melody }) =>
        melody
          .map(([note, dur], i) => {
            if (note === 'r') return `r.${dur}`;
            const pos = guitarNote(note, 9);
            return i === 0 && bass ? `(${pos} ${bass}).${dur}{ch "${chord}"}` : `${pos}.${dur}`;
          })
          .join(' '),
      ),
    },
    {
      name: 'Cuerdas',
      instrument: 'stringensemble1',
      staff: 'score',
      tuning: 'piano',
      bars: BARS.map(({ chord }) => (chord ? `${together(PAD[chord])}.2{d}` : 'r.2{d}')),
    },
  ],
});
