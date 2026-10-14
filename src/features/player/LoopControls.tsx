import { useMemo, useState } from 'react';
import { Switch } from '../../ui/Switch';
import { usePlayer, usePlayerState } from './PlayerContext';
import { sectionsOf } from './scoreNav';

export function LoopControls() {
  const player = usePlayer();
  const { score, looping, range } = usePlayerState(player)!;
  const sections = useMemo(() => (score ? sectionsOf(score) : []), [score]);
  // Typed bars; null means "show what is selected on the score".
  const [draft, setDraft] = useState<{ from: string; to: string } | null>(null);

  const bars = score?.masterBars.length ?? 1;
  const from = draft?.from ?? String(range?.from ?? 1);
  const to = draft?.to ?? String(range?.to ?? Math.min(4, bars));
  const sectionIndex = range ? sections.findIndex((s) => s.from === range.from && s.to === range.to) : -1;

  const apply = () => {
    player.loopBars(Number(from), Number(to));
    setDraft(null);
  };

  return (
    <div className="module loop" data-on={looping}>
      <div className="module-head">
        <h3 className="eyebrow">Bucle</h3>
        <Switch label={looping ? 'Activo' : 'Apagado'} checked={looping} onChange={(on) => player.setLooping(on)} />
      </div>
      <label className="visually-hidden" htmlFor="sectionSel">
        Sección
      </label>
      <select
        id="sectionSel"
        className="select"
        disabled={!sections.length}
        value={sectionIndex >= 0 ? String(sectionIndex) : ''}
        onChange={(e) => {
          const s = sections[Number(e.target.value)];
          if (s) {
            setDraft(null);
            player.loopBars(s.from, s.to);
          }
        }}
      >
        <option value="">{sections.length ? 'Repetir una sección…' : 'Sin secciones'}</option>
        {sections.map((s, i) => (
          <option key={i} value={i}>
            {`${s.name} · c. ${s.from}–${s.to}`}
          </option>
        ))}
      </select>
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
          Fijar
        </button>
      </div>
      <div className="loop-foot">
        <span className="hint">o arrastra sobre la partitura</span>
        <button
          className="text-btn"
          onClick={() => {
            setDraft(null);
            player.clearLoop();
          }}
          disabled={!range}
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
