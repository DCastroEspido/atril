import { AlphaTabApi, synth, type model } from '@coderline/alphatab';
import { barAtTick, clampBars, rangeBeats } from './scoreNav';

export interface TrackMix {
  visible: boolean;
  mute: boolean;
  solo: boolean;
  /** Percent, 100 = as written. */
  volume: number;
}

export interface PlayerState {
  /** Increases on every song load; handy as a React key to reset per-song UI. */
  loadId: number;
  score: model.Score | null;
  rendering: boolean;
  error: string | null;
  /** Soundfont download, 0..1. */
  soundProgress: number;
  ready: boolean;
  playing: boolean;
  /** Percent, 100 = written tempo. */
  speed: number;
  looping: boolean;
  /** Bars currently selected for playback, 1-based inclusive. */
  range: { from: number; to: number } | null;
  metronome: boolean;
  countIn: boolean;
  mix: TrackMix[];
}

export interface Position {
  current: number;
  end: number;
  bar: number;
}

const INITIAL: PlayerState = {
  loadId: 0,
  score: null,
  rendering: true,
  error: null,
  soundProgress: 0,
  ready: false,
  playing: false,
  speed: 100,
  looping: false,
  range: null,
  metronome: false,
  countIn: false,
  mix: [],
};

type Listener = () => void;

/**
 * Owns one alphaTab instance and exposes its state as plain snapshots,
 * so React (or anything else) can subscribe without touching alphaTab events.
 */
export class PlayerController {
  readonly api: AlphaTabApi;
  private state: PlayerState = INITIAL;
  private position: Position = { current: 0, end: 0, bar: 1 };
  private readonly listeners = new Set<Listener>();
  private readonly positionListeners = new Set<Listener>();
  /** Range to draw again once a re-render (track visibility change) finishes. */
  private rehighlight: { from: number; to: number } | null = null;

  constructor(container: HTMLElement, scrollElement: HTMLElement) {
    const base = import.meta.env.BASE_URL;
    this.api = new AlphaTabApi(container, {
      core: { fontDirectory: `${base}font/`, logLevel: 'warning' },
      display: { layoutMode: 'page', scale: 0.92 },
      player: {
        playerMode: 'enabledsynthesizer',
        soundFont: `${base}soundfont/sonivox.sf2`,
        scrollElement,
        scrollOffsetY: -40,
        enableUserInteraction: true,
        enableCursor: true,
        enableAnimatedBeatCursor: true,
      },
    });
    this.api.metronomeVolume = 0;
    this.api.countInVolume = 0;
    this.wire();
  }

  getState = (): PlayerState => this.state;
  getPosition = (): Position => this.position;

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  subscribePosition = (fn: Listener) => {
    this.positionListeners.add(fn);
    return () => this.positionListeners.delete(fn);
  };

  private set(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  private wire() {
    const { api } = this;
    api.scoreLoaded.on((score) => {
      this.set({
        score,
        error: null,
        mix: score.tracks.map((_, i) => ({ visible: i === 0, mute: false, solo: false, volume: 100 })),
      });
    });
    api.renderStarted.on(() => this.set({ rendering: true }));
    api.renderFinished.on(() => {
      this.set({ rendering: false });
      const pending = this.rehighlight;
      this.rehighlight = null;
      if (pending) this.loopBars(pending.from, pending.to);
    });
    api.error.on((e) => {
      console.warn('[alphaTab]', e);
      this.set({ rendering: false, error: 'No se ha podido leer esta tablatura.' });
    });
    api.soundFontLoad.on((e) => {
      if (e.total) this.set({ soundProgress: e.loaded / e.total });
    });
    api.playerReady.on(() => this.set({ ready: true, soundProgress: 1 }));
    api.playerStateChanged.on((e) => this.set({ playing: e.state === synth.PlayerState.Playing }));
    api.playerPositionChanged.on((e) => {
      const score = this.state.score;
      this.position = { current: e.currentTime, end: e.endTime, bar: score ? barAtTick(score, e.currentTick) : 1 };
      this.positionListeners.forEach((fn) => fn());
    });
    api.playbackRangeChanged.on((e) => {
      const score = this.state.score;
      const r = e.playbackRange;
      if (!score || !r) {
        // A plain click on the score drops the selection: stop looping a range that no longer exists.
        this.api.isLooping = false;
        this.set({ range: null, looping: false });
        return;
      }
      const range = { from: barAtTick(score, r.startTick), to: barAtTick(score, Math.max(r.startTick, r.endTick - 1)) };
      this.api.isLooping = true;
      this.set({ range, looping: true });
    });
  }

  /**
   * Forgets the selected range. clearPlaybackRangeHighlight() only erases the drawing: alphaTab keeps
   * the beats and redraws them after the next render, which fails once those beats are gone (another
   * song, a hidden track). Applying a one-beat range is alphaTab's own way to drop the selection.
   */
  private dropSelection(atBar = 1) {
    const bar = this.api.tracks[0]?.staves[0]?.bars[atBar - 1];
    const beat = bar?.voices[0]?.beats[0];
    if (beat) {
      this.api.highlightPlaybackRange(beat, beat);
      this.api.applyPlaybackRangeFromHighlight();
    }
    this.api.clearPlaybackRangeHighlight();
    this.api.playbackRange = null;
  }

  private resetForNewSong() {
    this.api.stop();
    this.dropSelection();
    this.api.isLooping = false;
    this.rehighlight = null;
    this.position = { current: 0, end: 0, bar: 1 };
    this.positionListeners.forEach((fn) => fn());
    this.set({
      loadId: this.state.loadId + 1,
      score: null,
      rendering: true,
      error: null,
      looping: false,
      range: null,
      mix: [],
    });
  }

  loadTex(tex: string) {
    this.resetForNewSong();
    this.api.tex(tex, [0]);
  }

  loadBytes(bytes: Uint8Array) {
    this.resetForNewSong();
    if (!this.api.load(bytes, [0]))
      this.set({ rendering: false, error: 'Ese archivo no es una tablatura que sepa abrir.' });
  }

  playPause() {
    if (this.state.ready) this.api.playPause();
  }

  stop() {
    this.api.stop();
  }

  /** Jump to a point of the song, 0..1. */
  seek(fraction: number) {
    if (this.position.end) this.api.timePosition = fraction * this.position.end;
  }

  setSpeed(percent: number) {
    this.api.playbackSpeed = percent / 100;
    this.set({ speed: percent });
  }

  toggleMetronome() {
    const on = !this.state.metronome;
    this.api.metronomeVolume = on ? 1 : 0;
    this.set({ metronome: on });
  }

  toggleCountIn() {
    const on = !this.state.countIn;
    this.api.countInVolume = on ? 1 : 0;
    this.set({ countIn: on });
  }

  setLooping(on: boolean) {
    this.api.isLooping = on;
    this.set({ looping: on });
  }

  /** Select bars `from`..`to` for playback and loop them. */
  loopBars(from: number, to: number) {
    const { score } = this.state;
    const track = this.api.tracks[0];
    if (!score || !track) return;
    const [a, b] = clampBars(score, from, to);
    const [start, end] = rangeBeats(track, a, b);
    this.api.highlightPlaybackRange(start, end);
    this.api.applyPlaybackRangeFromHighlight();
    this.setLooping(true);
    this.set({ range: { from: a, to: b } });
  }

  clearLoop() {
    // Leaves the cursor where the loop started.
    this.dropSelection(this.state.range?.from);
    this.api.isLooping = false;
    this.set({ range: null, looping: false });
  }

  private updateMix(index: number, patch: Partial<TrackMix>) {
    this.set({ mix: this.state.mix.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  }

  /** Show or hide a track in the score. At least one track stays visible. */
  toggleVisible(index: number): boolean {
    const { score, mix, range } = this.state;
    if (!score) return false;
    const visible = mix.map((m, i) => (i === index ? !m.visible : m.visible));
    if (!visible.some(Boolean)) return false;
    // The highlight belongs to beats of the tracks drawn now; draw it again on the new ones.
    if (range) {
      this.dropSelection(range.from);
      this.rehighlight = range;
    }
    this.updateMix(index, { visible: visible[index] });
    this.api.renderTracks(score.tracks.filter((_, i) => visible[i]));
    return true;
  }

  toggleMute(index: number) {
    const track = this.state.score?.tracks[index];
    if (!track) return;
    const mute = !this.state.mix[index].mute;
    this.api.changeTrackMute([track], mute);
    this.updateMix(index, { mute });
  }

  toggleSolo(index: number) {
    const track = this.state.score?.tracks[index];
    if (!track) return;
    const solo = !this.state.mix[index].solo;
    this.api.changeTrackSolo([track], solo);
    this.updateMix(index, { solo });
  }

  setVolume(index: number, percent: number) {
    const track = this.state.score?.tracks[index];
    if (!track) return;
    this.api.changeTrackVolume([track], percent / 100);
    this.updateMix(index, { volume: percent });
  }

  destroy() {
    this.api.destroy();
    this.listeners.clear();
    this.positionListeners.clear();
  }
}
