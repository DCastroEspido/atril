import { useState } from 'react';
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

export function Mixer() {
  const player = usePlayer();
  const { score, mix } = usePlayerState(player)!;
  const toast = useToast();
  // Folded on phones, where the score needs the room.
  const [open, setOpen] = useState(() => !window.matchMedia('(max-width: 860px)').matches);
  if (!score) return null;

  return (
    <details className="mixer" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        Pistas <span className="hint">· V la muestra en la partitura, M la silencia, S la deja sola</span>
      </summary>
      <div className="tracks">
        {score.tracks.map((t, i) => {
          const m = mix[i];
          if (!m) return null;
          const instrument = t.isPercussion
            ? 'batería'
            : (GM[t.playbackInfo.program] ?? `programa ${t.playbackInfo.program}`);
          return (
            <div className="trk" key={i}>
              <div className="nm">
                {t.name || `Pista ${i + 1}`}
                <small>{instrument}</small>
              </div>
              <button
                className="tog v"
                aria-pressed={m.visible}
                title="Ver en la partitura"
                onClick={() => player.toggleVisible(i) || toast('Deja al menos una pista visible')}
              >
                V
              </button>
              <button className="tog m" aria-pressed={m.mute} title="Silenciar" onClick={() => player.toggleMute(i)}>
                M
              </button>
              <button className="tog s" aria-pressed={m.solo} title="Solo" onClick={() => player.toggleSolo(i)}>
                S
              </button>
              <input
                type="range"
                id={`vol-${i}`}
                min={0}
                max={200}
                step={5}
                value={m.volume}
                aria-label={`Volumen de ${t.name}`}
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
