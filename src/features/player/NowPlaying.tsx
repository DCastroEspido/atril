import { StarIcon, StarOutlineIcon } from '../../ui/icons';
import type { LibraryEntry } from '../library/types';
import { usePlayer, usePlayerState } from './PlayerContext';

interface Props {
  entry: LibraryEntry | undefined;
  favorite: boolean;
  onToggleFavorite: () => void;
}

/** What is on the stand: record label, title and the facts a player checks first. */
export function NowPlaying({ entry, favorite, onToggleFavorite }: Props) {
  const { score, playing } = usePlayerState(usePlayer())!;
  const first = score?.masterBars[0];
  const facts: [string, string][] = [
    ['Tonalidad', entry?.key ?? '—'],
    ['Compás', entry?.timeLabel ?? (first ? `${first.timeSignatureNumerator}/${first.timeSignatureDenominator}` : '—')],
    ['Tempo', score ? `${score.tempo} bpm` : '—'],
    ['Nivel', entry?.level ?? '—'],
  ];
  return (
    <section className="now" aria-label="Canción abierta">
      <div className="label-art" data-genre={entry?.genre} data-spinning={playing} aria-hidden="true" />
      <div className="titles">
        <p className="eyebrow">{playing ? 'Sonando ahora' : 'En el atril'}</p>
        <h2>{score?.title || entry?.title || 'Cargando…'}</h2>
        <p className="by">{score?.artist || entry?.artist || ' '}</p>
      </div>
      <dl className="facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <button
        className="icon-btn fav"
        aria-pressed={favorite}
        onClick={onToggleFavorite}
        disabled={!entry}
        aria-label={favorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}
        title={favorite ? 'En favoritas' : 'Añadir a favoritas'}
      >
        {favorite ? <StarIcon /> : <StarOutlineIcon />}
      </button>
    </section>
  );
}
