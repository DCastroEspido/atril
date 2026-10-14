import { useState } from 'react';
import { Range } from '../../ui/Range';
import { Segmented } from '../../ui/Segmented';
import { useToast } from '../../ui/Toast';
import { usePlayer, usePlayerState } from './PlayerContext';

const GM: Record<number, string> = {
  0: 'piano',
  4: 'piano eléctrico',
  16: 'órgano',
  24: 'guitarra nylon',
  25: 'guitarra acero',
  26: 'guitarra jazz',
  27: 'guitarra limpia',
  29: 'guitarra overdrive',
  30: 'guitarra distorsión',
  32: 'bajo acústico',
  33: 'bajo eléctrico',
  34: 'bajo púa',
  40: 'violín',
  42: 'violonchelo',
  43: 'contrabajo',
  48: 'cuerdas',
  49: 'cuerdas',
};

type Toggle = 'v' | 'm' | 's';
const TOGGLES = [
  { value: 'v' as const, label: 'Ver', title: 'Mostrar en la partitura' },
  { value: 'm' as const, label: 'Mute', title: 'Silenciar' },
  { value: 's' as const, label: 'Solo', title: 'Dejarla sola' },
];

export function Mixer() {
  const player = usePlayer();
  const { score, mix } = usePlayerState(player)!;
  const toast = useToast();
  // Folded on phones, where the score needs the room.
  const [open, setOpen] = useState(() => !window.matchMedia('(max-width: 860px)').matches);
  if (!score) return null;

  const toggle = (i: number, t: Toggle) => {
    if (t === 'v' && !player.toggleVisible(i)) toast('Deja al menos una pista visible');
    if (t === 'm') player.toggleMute(i);
    if (t === 's') player.toggleSolo(i);
  };

  return (
    <details className="mixer card" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <span className="eyebrow">Pistas</span>
        <span className="hint">{score.tracks.length} instrumentos · elige qué ver y qué suena</span>
      </summary>
      <div className="tracks">
        {score.tracks.map((t, i) => {
          const m = mix[i];
          if (!m) return null;
          const instrument = t.isPercussion
            ? 'batería'
            : (GM[t.playbackInfo.program] ?? `programa ${t.playbackInfo.program}`);
          const on: Toggle[] = [
            ...(m.visible ? ['v' as const] : []),
            ...(m.mute ? ['m' as const] : []),
            ...(m.solo ? ['s' as const] : []),
          ];
          return (
            <div className="trk" key={i} data-muted={m.mute}>
              <div className="nm">
                <strong>{t.name || `Pista ${i + 1}`}</strong>
                <small>{instrument}</small>
              </div>
              <Segmented
                label={`Opciones de ${t.name}`}
                className="vms"
                options={TOGGLES}
                selected={on}
                onSelect={(v) => toggle(i, v)}
              />
              <Range
                id={`vol-${i}`}
                min={0}
                max={200}
                step={5}
                value={m.volume}
                aria-label={`Volumen de ${t.name}`}
                title={`Volumen ${m.volume}%`}
                onChange={(e) => player.setVolume(i, Number(e.target.value))}
              />
              <output htmlFor={`vol-${i}`}>{m.volume}%</output>
            </div>
          );
        })}
      </div>
    </details>
  );
}
