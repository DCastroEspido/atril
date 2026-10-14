import { useEffect, type ReactNode } from 'react';
import { PauseIcon, PlayIcon, StopIcon } from '../../ui/icons';
import { Segmented } from '../../ui/Segmented';
import { Switch } from '../../ui/Switch';
import type { PlayerController, ScoreView as View } from './controller';
import { PlayerContext, usePlayer, usePlayerState, usePosition } from './PlayerContext';
import { ScoreView } from './ScoreView';
import { Timeline } from './Timeline';

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

function Toolbar({ onViewChange }: { onViewChange: (view: View) => void }) {
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

  // Space bar plays and pauses, except while typing or using a control.
  useEffect(() => {
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

interface Props {
  player: PlayerController | null;
  onPlayer: (player: PlayerController | null) => void;
  initialView: View;
  onViewChange: (view: View) => void;
}

/** The hero card: practice switches, the tab itself, and the transport under it. */
export function PlayerCard({ player, onPlayer, initialView, onViewChange }: Props) {
  const layout = usePlayerState(player)?.view.layout ?? initialView.layout;
  const provide = (node: ReactNode) =>
    player ? <PlayerContext.Provider value={player}>{node}</PlayerContext.Provider> : null;
  return (
    <section className="player card" aria-label="Tablatura" data-layout={layout}>
      {provide(<Toolbar onViewChange={onViewChange} />)}
      <ScoreView player={player} onPlayer={onPlayer} initialView={initialView} />
      {provide(<Footer />)}
    </section>
  );
}
