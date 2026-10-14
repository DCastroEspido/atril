import { useEffect, useState } from 'react';
import { PauseIcon, PlayIcon, StopIcon } from '../../ui/icons';
import { usePlayer, usePlayerState, usePosition } from './PlayerContext';
import { LoopControls } from './LoopControls';

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Position() {
  const player = usePlayer();
  const { current, end, bar } = usePosition(player);
  const [dragging, setDragging] = useState<number | null>(null);
  const value = dragging ?? (end ? Math.round((current / end) * 1000) : 0);
  return (
    <>
      <div className="clock">
        <span>
          {clock(current)} / {clock(end)}
        </span>
        <small>Compás {bar}</small>
      </div>
      <input
        type="range"
        id="seek"
        min={0}
        max={1000}
        value={value}
        aria-label="Posición"
        onChange={(e) => setDragging(Number(e.target.value))}
        onPointerUp={() => {
          if (dragging !== null) player.seek(dragging / 1000);
          setDragging(null);
        }}
        onKeyUp={() => {
          if (dragging !== null) player.seek(dragging / 1000);
          setDragging(null);
        }}
      />
    </>
  );
}

function statusText(s: NonNullable<ReturnType<typeof usePlayerState>>) {
  if (!s.ready) return `Cargando sonidos ${Math.round(s.soundProgress * 100)}%`;
  if (s.playing) return s.looping && s.range ? `Repitiendo compases ${s.range.from}–${s.range.to}` : 'Reproduciendo';
  return 'Listo. Pulsa reproducir o la barra espaciadora.';
}

export function Transport() {
  const player = usePlayer();
  const state = usePlayerState(player)!;
  const { ready, playing, speed, score, metronome, countIn, loadId } = state;

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

  const bpm = score ? Math.round((score.tempo * speed) / 100) : null;

  return (
    <>
      <section className="transport" aria-label="Reproducción">
        <div className="row1">
          <button
            className="btn primary play"
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            disabled={!ready || !score}
            onClick={() => player.playPause()}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="btn" aria-label="Volver al inicio" disabled={!ready} onClick={() => player.stop()}>
            <StopIcon />
          </button>
          <Position />
          <div className="status" role="status">
            {statusText(state)}
          </div>
        </div>
      </section>
      {/* Practice controls: under the play bar on wide screens, above the score on phones. */}
      <section className="practice" aria-label="Práctica">
        <div className="group">
          <label className="side-label" htmlFor="speed">
            Velocidad
          </label>
          <input
            type="range"
            id="speed"
            min={25}
            max={150}
            step={5}
            value={speed}
            onChange={(e) => player.setSpeed(Number(e.target.value))}
          />
          <span className="speedval">
            {speed}%{bpm ? ` · ${bpm} bpm` : ''}
          </span>
          {[50, 75, 100].map((p) => (
            <button key={p} className="btn mini" aria-pressed={speed === p} onClick={() => player.setSpeed(p)}>
              {p}%
            </button>
          ))}
        </div>
        <LoopControls key={loadId} />
        <div className="group">
          <button className="btn mini" aria-pressed={metronome} onClick={() => player.toggleMetronome()}>
            Metrónomo
          </button>
          <button className="btn mini" aria-pressed={countIn} onClick={() => player.toggleCountIn()}>
            Cuenta atrás
          </button>
        </div>
      </section>
    </>
  );
}
