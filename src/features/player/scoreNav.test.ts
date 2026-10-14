import { describe, expect, it } from 'vitest';
import { importer, Settings } from '@coderline/alphatab';
import { CATALOG } from '../../catalog';
import { barAtTick, barDensity, clampBars, rangeBeats, sectionsOf } from './scoreNav';

const load = (id: string) => {
  const imp = new importer.AlphaTexImporter();
  imp.initFromString(CATALOG.find((s) => s.id === id)!.tex, new Settings());
  return imp.readScore();
};

describe('scoreNav', () => {
  const score = load('rock-mi');

  it('splits the score into sections that cover every bar', () => {
    expect(sectionsOf(score)).toEqual([
      { name: 'Riff', from: 1, to: 4 },
      { name: 'Estribillo', from: 5, to: 8 },
      { name: 'Riff 2', from: 9, to: 12 },
      { name: 'Solo', from: 13, to: 16 },
      { name: 'Final', from: 17, to: 17 },
    ]);
  });

  it('finds the bar for a tick', () => {
    const bars = score.masterBars;
    expect(barAtTick(score, 0)).toBe(1);
    expect(barAtTick(score, bars[4].start)).toBe(5);
    expect(barAtTick(score, bars[4].start - 1)).toBe(4);
    expect(barAtTick(score, Number.MAX_SAFE_INTEGER)).toBe(bars.length);
  });

  it('keeps bar ranges inside the song and in order', () => {
    expect(clampBars(score, 0, 99)).toEqual([1, 17]);
    expect(clampBars(score, 9, 3)).toEqual([9, 9]);
  });

  it('returns the edge beats of a range', () => {
    const [first, last] = rangeBeats(score.tracks[0], 5, 8);
    expect(first.voice.bar.index).toBe(4);
    expect(last.voice.bar.index).toBe(7);
    expect(last.nextBeat?.voice.bar.index).toBe(8);
  });

  it('counts the notes of every track in each bar', () => {
    const density = barDensity(score);
    expect(density).toHaveLength(score.masterBars.length);
    // The solo (bars 13-16) adds the lead guitar on top of the band.
    expect(density[12]).toBeGreaterThan(density[8]);
    // The last bar is one chord, a bass note and a crash.
    expect(density[16]).toBe(3 + 1 + 1 + 2);
  });
});
