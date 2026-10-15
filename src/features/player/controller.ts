import { AlphaTabApi, importer, LayoutMode, StaveProfile, synth, type model } from '@coderline/alphatab';
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
  view: ScoreView;
  /** Full-screen practice: only the tab and play/stop, drawn larger. */
  focus: boolean;
}

/** How the score is drawn: one scrolling line or pages; tab only or tab with standard notation. */
export interface ScoreView {
  layout: 'line' | 'page';
  notation: 'tab' | 'both';
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
  view: { layout: 'line', notation: 'tab' },
  focus: false,
};

type Listener = () => void;

/** Whether a track has a tablature staff to draw (vocals and piano parts usually do not). */
const hasTab = (track: model.Track) => track.staves.some((s) => s.isStringed && s.showTablature);

// alphaTab draws to SVG with its own colours; these match --paper-ink and the palette in tokens.css.
const SCORE_INK = '#4a1f1c';
const SCORE_INK_SOFT = '#6a2e2a';
const SCORE_LINES = '#8c6a5c';
const SCORE_ACCENT = '#a2242f';
/** The single line is the focus of the screen, so it is drawn larger than pages; full screen larger still. */
const scaleFor = (view: ScoreView, focus = false) => {
  if (!focus) return view.layout === 'line' ? 1.15 : 0.92;
  // A phone held upright fits few bars, so it gets a smaller step up than a wide screen.
  const narrow = window.innerWidth < 700;
  return view.layout === 'line' ? (narrow ? 1.3 : 1.6) : narrow ? 1 : 1.15;
};
const SCORE_FONT = '"Jost Variable", Jost, Futura, sans-serif';

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
  /** Track shown first for the song being loaded. */
  private firstTrack = 0;

  constructor(container: HTMLElement, scrollElement: HTMLElement, view: ScoreView = INITIAL.view) {
    const base = import.meta.env.BASE_URL;
    this.state = { ...INITIAL, view };
    this.api = new AlphaTabApi(container, {
      core: { fontDirectory: `${base}font/`, logLevel: 'warning' },
      display: {
        layoutMode: view.layout === 'line' ? LayoutMode.Horizontal : LayoutMode.Page,
        staveProfile: view.notation === 'tab' ? StaveProfile.Tab : StaveProfile.Default,
        scale: scaleFor(view),
        // Printed in chocolate ink on the paper the page draws behind it.
        resources: {
          mainGlyphColor: SCORE_INK,
          secondaryGlyphColor: SCORE_INK_SOFT,
          staffLineColor: SCORE_LINES,
          barSeparatorColor: SCORE_LINES,
          barNumberColor: SCORE_ACCENT,
          scoreInfoColor: SCORE_INK,
          effectFont: `italic 12px ${SCORE_FONT}`,
          fingeringFont: `14px ${SCORE_FONT}`,
          tablatureFont: `13px ${SCORE_FONT}`,
          graceFont: `11px ${SCORE_FONT}`,
        },
      },
      // The song header above the paper already shows title and artist.
      notation: {
        elements: new Map(
          (
            [
              'ScoreTitle',
              'ScoreSubTitle',
              'ScoreArtist',
              'ScoreAlbum',
              'ScoreWords',
              'ScoreMusic',
              'ScoreWordsAndMusic',
              'ScoreCopyright',
            ] as const
          ).map((k) => [k, false] as const),
        ),
      },
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
        mix: score.tracks.map((_, i) => ({ visible: i === this.firstTrack, mute: false, solo: false, volume: 100 })),
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

  /** "Tab" only works when every track on screen has a tablature staff; otherwise draw notation too. */
  private profileFor(visible: model.Track[]) {
    return this.state.view.notation === 'tab' && visible.length > 0 && visible.every(hasTab)
      ? StaveProfile.Tab
      : StaveProfile.Default;
  }

  private setProfile(visible: model.Track[]) {
    this.api.settings.display.staveProfile = this.profileFor(visible);
    this.api.updateSettings();
  }

  /** Catalog songs: the first track is always the guitar. */
  loadTex(tex: string) {
    this.resetForNewSong();
    this.firstTrack = 0;
    this.api.settings.display.staveProfile =
      this.state.view.notation === 'tab' ? StaveProfile.Tab : StaveProfile.Default;
    this.api.updateSettings();
    this.api.tex(tex, [0]);
  }

  /** Imported and shared files: parse here to start on the first track that has tablature. */
  loadBytes(bytes: Uint8Array) {
    this.resetForNewSong();
    let score: model.Score;
    try {
      score = importer.ScoreLoader.loadScoreFromBytes(bytes, this.api.settings);
    } catch {
      this.set({ rendering: false, error: 'Ese archivo no es una tablatura que sepa abrir.' });
      return;
    }
    this.firstTrack = Math.max(0, score.tracks.findIndex(hasTab));
    this.setProfile([score.tracks[this.firstTrack]]);
    this.api.renderScore(score, [this.firstTrack]);
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

  /** Jump to the start of a bar, 1-based. Ignores repeats, like the position read-out. */
  seekToBar(bar: number) {
    const master = this.state.score?.masterBars[bar - 1];
    if (master) this.api.tickPosition = master.start;
  }

  setView(patch: Partial<ScoreView>) {
    this.set({ view: { ...this.state.view, ...patch } });
    this.relayout();
  }

  /** Enter or leave full-screen practice. */
  setFocus(focus: boolean) {
    if (focus === this.state.focus) return;
    this.set({ focus });
    this.relayout();
  }

  /** Applies view and focus to alphaTab's settings and draws the score again. */
  private relayout() {
    const { view, focus, range } = this.state;
    const { display } = this.api.settings;
    display.layoutMode = view.layout === 'line' ? LayoutMode.Horizontal : LayoutMode.Page;
    const { score, mix } = this.state;
    display.staveProfile = score
      ? this.profileFor(score.tracks.filter((_, i) => mix[i]?.visible))
      : view.notation === 'tab'
        ? StaveProfile.Tab
        : StaveProfile.Default;
    display.scale = scaleFor(view, focus);
    // The highlight belongs to beats drawn now; draw it again after the new layout.
    if (range) {
      this.rehighlight = range;
      this.dropSelection(range.from);
    }
    this.api.updateSettings();
    this.api.render();
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
    const tracks = score.tracks.filter((_, i) => visible[i]);
    this.setProfile(tracks);
    this.api.renderTracks(tracks);
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
