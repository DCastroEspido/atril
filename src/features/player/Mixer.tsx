import { EyeIcon, HeadphonesIcon, SpeakerIcon, SpeakerOffIcon } from '../../ui/icons';
import { Range } from '../../ui/Range';
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

/** Every instrument of the song: whether it is drawn, whether it sounds, solo and volume. */
export function Mixer() {
  const player = usePlayer();
  const { score, mix } = usePlayerState(player)!;
  const toast = useToast();
  if (!score) return null;

  return (
    <ul className="instruments">
      {score.tracks.map((t, i) => {
        const m = mix[i];
        if (!m) return null;
        const name = t.name || `Pista ${i + 1}`;
        const instrument = t.isPercussion
          ? 'batería'
          : (GM[t.playbackInfo.program] ?? `programa ${t.playbackInfo.program}`);
        return (
          <li key={i} className="instrument" data-muted={m.mute}>
            <div className="nm">
              <strong>{name}</strong>
              <small>{instrument}</small>
            </div>
            <div className="inst-toggles">
              <button
                className="inst-btn"
                aria-pressed={m.visible}
                title={m.visible ? 'Se ve en la tablatura' : 'No se ve en la tablatura'}
                onClick={() => player.toggleVisible(i) || toast('Deja al menos un instrumento a la vista')}
              >
                <EyeIcon />
                <span>Ver</span>
              </button>
              <button
                className="inst-btn"
                aria-pressed={!m.mute}
                title={m.mute ? 'Silenciado' : 'Suena'}
                onClick={() => player.toggleMute(i)}
              >
                {m.mute ? <SpeakerOffIcon /> : <SpeakerIcon />}
                <span>Suena</span>
              </button>
              <button
                className="inst-btn solo"
                aria-pressed={m.solo}
                title="Escuchar solo este instrumento"
                onClick={() => player.toggleSolo(i)}
              >
                <HeadphonesIcon />
                <span>Solo</span>
              </button>
            </div>
            <Range
              id={`vol-${i}`}
              min={0}
              max={200}
              step={5}
              value={m.volume}
              disabled={m.mute}
              aria-label={`Volumen de ${name}`}
              title={`Volumen ${m.volume}%`}
              onChange={(e) => player.setVolume(i, Number(e.target.value))}
            />
          </li>
        );
      })}
    </ul>
  );
}
