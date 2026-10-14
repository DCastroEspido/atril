import { useState } from 'react';
import { Range } from '../../ui/Range';
import { Segmented } from '../../ui/Segmented';
import { Mixer } from './Mixer';
import { usePlayer, usePlayerState } from './PlayerContext';

const PRESETS = [50, 75, 100].map((p) => ({ value: p, label: `${p}%` }));
type Tab = 'tempo' | 'tracks';

function Tempo() {
  const player = usePlayer();
  const { speed, score } = usePlayerState(player)!;
  const bpm = score ? Math.round((score.tempo * speed) / 100) : null;
  const nudge = (d: number) => player.setSpeed(Math.min(150, Math.max(25, speed + d)));
  return (
    <div className="tempo">
      <div className="dial">
        <button className="round" onClick={() => nudge(-5)} aria-label="Más lento" disabled={speed <= 25}>
          −
        </button>
        <div className="dial-read">
          <span className="bpm">{bpm ?? '—'}</span>
          <span className="eyebrow">bpm · {speed}% del original</span>
        </div>
        <button className="round" onClick={() => nudge(5)} aria-label="Más rápido" disabled={speed >= 150}>
          +
        </button>
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
        options={PRESETS}
        selected={[speed]}
        onSelect={(p) => player.setSpeed(p)}
      />
      <p className="hint">Empieza lento y sube de 5 en 5 cuando el bucle te salga limpio.</p>
    </div>
  );
}

/** The side console: tempo and the band's tracks. */
export function Toolkit() {
  const [tab, setTab] = useState<Tab>('tempo');
  return (
    <aside className="card toolkit" aria-label="Consola">
      <header className="panel-head">
        <h3>Consola</h3>
      </header>
      <div className="tabs" role="tablist" aria-label="Herramientas">
        {(
          [
            ['tempo', 'Tempo'],
            ['tracks', 'Pistas'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tabpanel">
        {tab === 'tempo' ? <Tempo /> : <Mixer />}
      </div>
    </aside>
  );
}
