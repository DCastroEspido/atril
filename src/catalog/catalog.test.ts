import { describe, expect, it } from 'vitest';
import { importer, Settings, type model } from '@coderline/alphatab';
import { CATALOG } from './index';

function parse(tex: string): model.Score {
  const texImporter = new importer.AlphaTexImporter();
  texImporter.initFromString(tex, new Settings());
  return texImporter.readScore();
}

describe('catalog', () => {
  it('has unique ids', () => {
    const ids = CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(CATALOG.map((s) => [s.id, s] as const))('%s', (_id, song) => {
    const score = parse(song.tex);

    it('parses with the metadata it advertises', () => {
      expect(score.title).toBe(song.title);
      expect(score.tempo).toBe(song.tempo);
      expect(score.tracks.length).toBeGreaterThan(1);
    });

    it('gives every track the same number of bars', () => {
      for (const track of score.tracks) expect(track.staves[0].bars.length, track.name).toBe(score.masterBars.length);
    });

    it('fills every bar exactly', () => {
      for (const track of score.tracks) {
        for (const staff of track.staves) {
          staff.bars.forEach((bar, i) => {
            for (const voice of bar.voices) {
              if (voice.isEmpty) continue;
              const total = voice.beats.reduce((sum, beat) => sum + beat.playbackDuration, 0);
              expect(total, `${track.name}, compás ${i + 1}`).toBe(bar.masterBar.calculateDuration());
            }
          });
        }
      }
    });

    it('never asks for two notes on one string at once', () => {
      for (const track of score.tracks) {
        if (track.isPercussion) continue;
        track.staves[0].bars.forEach((bar, i) =>
          bar.voices[0].beats.forEach((beat) => {
            // Pitched staves (piano, strings) have no strings; only fretted notes count.
            const strings = beat.notes.map((n) => n.string).filter((s) => s > 0);
            expect(new Set(strings).size, `${track.name}, compás ${i + 1}`).toBe(strings.length);
          }),
        );
      }
    });

    it('marks sections, starting on bar one', () => {
      expect(score.masterBars[0].section?.text).toBeTruthy();
    });
  });
});
