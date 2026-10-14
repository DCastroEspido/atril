import { StarIcon } from '../../ui/icons';
import type { LibraryEntry } from '../library/types';
import { usePlayer, usePlayerState } from './PlayerContext';

interface Props {
  entry: LibraryEntry | undefined;
  favorite: boolean;
  onToggleFavorite: () => void;
}

export function SongHeader({ entry, favorite, onToggleFavorite }: Props) {
  const { score } = usePlayerState(usePlayer())!;
  const first = score?.masterBars[0];
  const facts: [string, string][] = [
    ['Tonalidad', entry?.key ?? '—'],
    ['Compás', entry?.timeLabel ?? (first ? `${first.timeSignatureNumerator}/${first.timeSignatureDenominator}` : '—')],
    ['Tempo', score ? `${score.tempo} bpm` : '—'],
    ['Compases', score ? String(score.masterBars.length) : '—'],
  ];
  return (
    <section className="songhead">
      <div className="titles">
        <h2>{score?.title || entry?.title || 'Cargando…'}</h2>
        <div className="by">{score?.artist || entry?.artist || ' '}</div>
      </div>
      <dl className="facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <button className="btn" aria-pressed={favorite} onClick={onToggleFavorite} disabled={!entry}>
        <StarIcon />
        <span>{favorite ? 'En favoritas' : 'Añadir a favoritas'}</span>
      </button>
    </section>
  );
}
