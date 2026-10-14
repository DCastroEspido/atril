import { useEffect, useState } from 'react';
import { PauseIcon, PlayIcon, StopIcon } from '../../ui/icons';
import { Range } from '../../ui/Range';
import { Segmented } from '../../ui/Segmented';
import { Switch } from '../../ui/Switch';
import type { PlayerState } from './controller';
import { LoopControls } from './LoopControls';
import { usePlayer, usePlayerState, usePosition } from './PlayerContext';

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Position() {
  const player = usePlayer();
  const { current, end, bar } = usePosition(player);
  const [dragging, setDragging] = useState<number | null>(null);
  const value = dragging ?? (end ? Math.round((current / end) * 1000) : 0);
  const commit = () => {
    if (dragging !== null) player.seek(dragging / 1000);
    setDragging(null);
  };
  return (
    <div className="position">
      <div className="clock">
        <span>{clock(current)}</span>
        <span className="bar-now">Compás {bar}</span>
        <span>{clock(end)}</span>
      </div>
      <Range
        id="seek"
        min={0}
        max={1000}
        value={value}
        aria-label="Posición"
        onChange={(e) => setDragging(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
      />
    </div>
  );
}

function statusText(s: PlayerState) {
  if (!s.ready) return `Cargando sonidos ${Math.round(s.soundProgress * 100)}%`;
  if (s.playing) return s.looping && s.range ? `Repitiendo compases ${s.range.from}–${s.range.to}` : 'Sonando';
  return 'Listo · espacio para tocar';
}

const SPEEDS = [50, 75, 100].map((p) => ({ value: p, label: `${p}%` }));

export function Transport() {
  const player = usePlayer();
  const state = usePlayerState(player)!;
  const { ready, playing, score } = state;

  // Space bar plays and pauses, except while typing or using a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea, button, [contenteditable]')) return;
      e.preventDefault();
      player.playPause();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [player]);

  return (
    <>
      <section className="transport" aria-label="Reproducción">
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
        <Position />
        <p className="status" role="status" data-ready={ready}>
          {statusText(state)}
        </p>
      </section>
    </>
  );
}

/** Tempo, loop and practice aids, shown in the practice rail. */
export function PracticePanel() {
  const player = usePlayer();
  const { speed, score, metronome, countIn, loadId } = usePlayerState(player)!;
  const bpm = score ? Math.round((score.tempo * speed) / 100) : null;
  return (
    <section className="practice" aria-label="Práctica">
      <div className="module">
        <div className="module-head">
          <h3 className="eyebrow">Tempo</h3>
          <span className="readout">
            {speed}%{bpm ? ` · ${bpm} bpm` : ''}
          </span>
        </div>
        <Range
          id="speed"
          min={25}
          max={150}
          step={5}
          value={speed}
          aria-label="Velocidad de reproducción"
          onChange={(e) => player.setSpeed(Number(e.target.value))}
        />
        <Segmented
          label="Velocidades rápidas"
          options={SPEEDS}
          selected={[speed]}
          onSelect={(p) => player.setSpeed(p)}
        />
      </div>
      <LoopControls key={loadId} />
      <div className="module">
        <div className="module-head">
          <h3 className="eyebrow">Ayudas</h3>
        </div>
        <Switch label="Metrónomo" checked={metronome} onChange={() => player.toggleMetronome()} />
        <Switch label="Cuenta atrás" checked={countIn} onChange={() => player.toggleCountIn()} />
      </div>
    </section>
  );
}
