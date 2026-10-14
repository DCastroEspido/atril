import { Range } from '../../ui/Range';
import { Segmented } from '../../ui/Segmented';
import { Mixer } from './Mixer';
import { usePlayer, usePlayerState } from './PlayerContext';

const PRESETS = [50, 75, 100].map((p) => ({ value: p, label: `${p}%` }));

function Tempo() {
  const player = usePlayer();
  const { speed, score } = usePlayerState(player)!;
  const bpm = score ? Math.round((score.tempo * speed) / 100) : null;
  const nudge = (d: number) => player.setSpeed(Math.min(150, Math.max(25, speed + d)));
  return (
    <section className="kit-section" aria-labelledby="kit-tempo">
      <h4 className="eyebrow" id="kit-tempo">
        Tempo
      </h4>
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
    </section>
  );
}

/** The side console: tempo on top, then every instrument of the band. */
export function Toolkit() {
  const { score } = usePlayerState(usePlayer())!;
  return (
    <aside className="card toolkit" aria-label="Consola">
      <Tempo />
      <section className="kit-section" aria-labelledby="kit-instruments">
        <div className="kit-head">
          <h4 className="eyebrow" id="kit-instruments">
            Instrumentos
          </h4>
          {score && <span className="hint">{score.tracks.length}</span>}
        </div>
        <Mixer />
      </section>
    </aside>
  );
}
