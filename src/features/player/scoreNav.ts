import type { model } from '@coderline/alphatab';

export interface Section {
  name: string;
  /** First bar, 1-based. */
  from: number;
  /** Last bar, 1-based, inclusive. */
  to: number;
}

/** Sections as marked in the score; a section runs until the next one starts. */
export function sectionsOf(score: model.Score): Section[] {
  const starts = score.masterBars.flatMap((bar, i) =>
    bar.section ? [{ name: bar.section.text || bar.section.marker || `Sección ${i + 1}`, from: i + 1 }] : [],
  );
  return starts.map((s, k) => ({ ...s, to: k + 1 < starts.length ? starts[k + 1].from - 1 : score.masterBars.length }));
}

/** alphaTab's playback map: every bar in the order it plays, repeats unrolled, with MIDI tick spans. */
export interface PlaybackMap {
  masterBars: { start: number; masterBar: { index: number } }[];
}

/**
 * 1-based score bar playing at a MIDI tick. With the playback map, repeats count: the second pass
 * of bars 5–8 reads 5–8 again, not 9–12. Without it (before the first render), score order is used.
 */
export function barAtTick(score: model.Score, tick: number, playback?: PlaybackMap | null): number {
  const played = playback?.masterBars.length ? playback.masterBars : null;
  const starts = played ?? score.masterBars;
  if (!starts.length) return 1;
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid].start <= tick) lo = mid;
    else hi = mid - 1;
  }
  return played ? played[lo].masterBar.index + 1 : lo + 1;
}

export const clampBars = (score: model.Score, from: number, to: number): [number, number] => {
  const n = score.masterBars.length;
  const a = Math.max(1, Math.min(n, Math.trunc(from) || 1));
  const b = Math.max(a, Math.min(n, Math.trunc(to) || a));
  return [a, b];
};

/** First beat of bar `from` and last beat of bar `to` on a track, for alphaTab's range highlight. */
export function rangeBeats(track: model.Track, from: number, to: number): [model.Beat, model.Beat] {
  const beatsOf = (n: number) => {
    const bar = track.staves[0].bars[n - 1];
    return (bar.voices.find((v) => !v.isEmpty) ?? bar.voices[0]).beats;
  };
  const last = beatsOf(to);
  return [beatsOf(from)[0], last[last.length - 1]];
}

/** Notes per bar across every track: the shape of the song, drawn as its timeline. */
export function barDensity(score: model.Score): number[] {
  return score.masterBars.map((_, i) => {
    let notes = 0;
    for (const track of score.tracks)
      for (const staff of track.staves)
        for (const voice of staff.bars[i]?.voices ?? []) for (const beat of voice.beats) notes += beat.notes.length;
    return notes;
  });
}
