import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon, ExpandIcon, PauseIcon, PlayIcon, StopIcon } from '../../ui/icons';
import { Segmented } from '../../ui/Segmented';
import { Switch } from '../../ui/Switch';
import type { PlayerController, ScoreView as View } from './controller';
import { PlayerContext, usePlayer, usePlayerState, usePosition } from './PlayerContext';
import { ScoreView } from './ScoreView';
import { Timeline } from './Timeline';
import { useFocusMode } from './useFocusMode';

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const LAYOUTS = [
  { value: 'line' as const, label: 'Línea', title: 'Una línea que avanza con la música' },
  { value: 'page' as const, label: 'Página', title: 'Páginas completas' },
];
const NOTATIONS = [
  { value: 'tab' as const, label: 'Tab' },
  { value: 'both' as const, label: 'Tab + partitura' },
];

function Toolbar({ onViewChange, onFocus }: { onViewChange: (view: View) => void; onFocus: () => void }) {
  const player = usePlayer();
  const { metronome, countIn, looping, range, mix, view, score } = usePlayerState(player)!;
  // "My track" is the first one on screen: mute it to play it yourself over the band.
  const mine = mix.findIndex((m) => m.visible);
  const setView = (patch: Partial<View>) => {
    player.setView(patch);
    onViewChange({ ...view, ...patch });
  };
  return (
    <div className="toolbar">
      <div className="toggles">
        <Switch label="Metrónomo" checked={metronome} onChange={() => player.toggleMetronome()} />
        <Switch label="Cuenta atrás" checked={countIn} onChange={() => player.toggleCountIn()} />
        <Switch
          label="Bucle"
          checked={looping}
          onChange={(on) => player.setLooping(on)}
          disabled={!range && !looping}
        />
        <Switch
          label={score && mine >= 0 ? `Silenciar ${score.tracks[mine].name.toLowerCase()}` : 'Silenciar mi pista'}
          checked={mine >= 0 && mix[mine].mute}
          onChange={() => mine >= 0 && player.toggleMute(mine)}
          disabled={mine < 0}
        />
      </div>
      <div className="view-options">
        <button className="pill full-btn" onClick={onFocus} title="Solo la tablatura y play, a pantalla completa">
          <ExpandIcon />
          <span>Pantalla completa</span>
        </button>
        <Segmented
          label="Vista"
          options={LAYOUTS}
          selected={[view.layout]}
          onSelect={(layout) => setView({ layout })}
        />
        <Segmented
          label="Notación"
          options={NOTATIONS}
          selected={[view.notation]}
          onSelect={(notation) => setView({ notation })}
        />
      </div>
    </div>
  );
}

function Footer() {
  const player = usePlayer();
  const { ready, playing, score, speed, looping, range } = usePlayerState(player)!;
  const { current, end, bar } = usePosition(player);

  return (
    <div className="player-foot">
      <button
        className="play"
        data-playing={playing}
        aria-label={playing ? 'Pausar' : 'Reproducir'}
        disabled={!ready || !score}
        onClick={() => player.playPause()}
      >
        <span className="record" aria-hidden="true" />
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="round" aria-label="Volver al inicio" disabled={!ready} onClick={() => player.stop()}>
        <StopIcon />
      </button>
      <Timeline />
      <div className="readouts">
        <span className="time">
          {clock(current)} <span>/ {clock(end)}</span>
        </span>
        <span className="eyebrow" role="status">
          {!ready
            ? 'Cargando sonidos…'
            : looping && range
              ? `Bucle ${range.from}–${range.to} · c. ${bar}`
              : `Compás ${bar}${speed !== 100 ? ` · ${speed}%` : ''}`}
        </span>
      </div>
    </div>
  );
}

/** Full-screen controls: play, stop, where you are, and the way out. */
function FocusBar({ onExit }: { onExit: () => void }) {
  const player = usePlayer();
  const { ready, playing, score, looping, range } = usePlayerState(player)!;
  const { bar } = usePosition(player);
  return (
    <div className="focus-bar">
      <button className="round" aria-label="Volver al inicio" disabled={!ready} onClick={() => player.stop()}>
        <StopIcon />
      </button>
      <button
        className="play"
        data-playing={playing}
        aria-label={playing ? 'Pausar' : 'Reproducir'}
        disabled={!ready || !score}
        onClick={() => player.playPause()}
      >
        <span className="record" aria-hidden="true" />
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="focus-where">
        <span className="eyebrow">
          {looping && range ? `Bucle ${range.from}–${range.to} · ` : ''}c. {bar}
        </span>
        <span className="rotate-hint">Gira el móvil para ver más compases</span>
      </span>
      <button className="round focus-exit" aria-label="Salir de pantalla completa" onClick={onExit}>
        <CloseIcon />
      </button>
    </div>
  );
}

/** Space bar plays and pauses, except while typing or using a control. */
function useSpaceToPlay(player: PlayerController | null) {
  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea, button, [contenteditable], [role="slider"]')) return;
      e.preventDefault();
      player.playPause();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [player]);
}

interface Props {
  player: PlayerController | null;
  onPlayer: (player: PlayerController | null) => void;
  initialView: View;
  onViewChange: (view: View) => void;
}

/** The hero card: practice switches, the tab itself, and the transport under it. */
export function PlayerCard({ player, onPlayer, initialView, onViewChange }: Props) {
  const card = useRef<HTMLElement>(null);
  const layout = usePlayerState(player)?.view.layout ?? initialView.layout;
  const { focus, enter, exit } = useFocusMode(player, card);
  useSpaceToPlay(player);
  const provide = (node: ReactNode) =>
    player ? <PlayerContext.Provider value={player}>{node}</PlayerContext.Provider> : null;
  return (
    <section
      ref={card}
      className="player card"
      aria-label="Tablatura"
      data-layout={layout}
      data-focus={focus || undefined}
    >
      {!focus && provide(<Toolbar onViewChange={onViewChange} onFocus={enter} />)}
      <ScoreView player={player} onPlayer={onPlayer} initialView={initialView} />
      {provide(focus ? <FocusBar onExit={exit} /> : <Footer />)}
    </section>
  );
}
