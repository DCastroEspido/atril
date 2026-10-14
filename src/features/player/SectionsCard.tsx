import { useMemo, useState } from 'react';
import { LoopIcon } from '../../ui/icons';
import { usePlayer, usePlayerState, usePosition } from './PlayerContext';
import { sectionsOf } from './scoreNav';

/** The song's sections, each one a tap away from looping, plus a free bar range. */
export function SectionsCard() {
  // A fresh card per song, so typed bars never leak into the next one.
  const { loadId } = usePlayerState(usePlayer())!;
  return <Sections key={loadId} />;
}

function Sections() {
  const player = usePlayer();
  const { score, range, looping } = usePlayerState(player)!;
  const { bar } = usePosition(player);
  const sections = useMemo(() => (score ? sectionsOf(score) : []), [score]);
  const bars = score?.masterBars.length ?? 1;
  // Typed bars; null means "show what is selected".
  const [draft, setDraft] = useState<{ from: string; to: string } | null>(null);
  const from = draft?.from ?? String(range?.from ?? 1);
  const to = draft?.to ?? String(range?.to ?? Math.min(4, bars));
  const apply = () => {
    player.loopBars(Number(from), Number(to));
    setDraft(null);
  };

  return (
    <section className="card panel sections" aria-label="Secciones">
      <header className="panel-head">
        <h3>Secciones</h3>
        <button
          className="text-btn"
          disabled={!range}
          onClick={() => {
            setDraft(null);
            player.clearLoop();
          }}
        >
          Quitar bucle
        </button>
      </header>
      {sections.length ? (
        <ul className="rows">
          {sections.map((s) => {
            const active = looping && range?.from === s.from && range?.to === s.to;
            const here = bar >= s.from && bar <= s.to;
            return (
              <li key={s.from} data-here={here || undefined}>
                <span className="row-text">
                  <strong>{s.name}</strong>
                  <small>
                    compases {s.from}–{s.to}
                  </small>
                </span>
                <button
                  className="chip-btn"
                  aria-pressed={active}
                  onClick={() => {
                    setDraft(null);
                    if (active) player.clearLoop();
                    else player.loopBars(s.from, s.to);
                  }}
                >
                  <LoopIcon />
                  {active ? 'En bucle' : 'Repetir'}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hint">Esta partitura no marca secciones. Elige compases o arrastra sobre la tablatura.</p>
      )}
      <div className="bars-row">
        <span className="eyebrow">Compases</span>
        <input
          type="number"
          id="barFrom"
          className="num"
          min={1}
          max={bars}
          value={from}
          aria-label="Desde el compás"
          onChange={(e) => setDraft({ from: e.target.value, to })}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
        <span aria-hidden="true">–</span>
        <input
          type="number"
          id="barTo"
          className="num"
          min={1}
          max={bars}
          value={to}
          aria-label="Hasta el compás"
          onChange={(e) => setDraft({ from, to: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
        <button className="pill" onClick={apply} disabled={!score}>
          Repetir
        </button>
      </div>
    </section>
  );
}
