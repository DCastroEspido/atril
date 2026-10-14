import { StarIcon, StarOutlineIcon } from '../../ui/icons';
import type { LibraryEntry } from '../library/types';
import { usePlayer, usePlayerState } from './PlayerContext';

interface Props {
  entry: LibraryEntry | undefined;
  favorite: boolean;
  onToggleFavorite: () => void;
}

/** The record sleeve: label art, title and the song's facts. */
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
      <div className="label-art" data-genre={entry?.genre} aria-hidden="true" />
      <div className="titles">
        <p className="eyebrow">{entry ? `${entry.genre} · ${entry.level}` : ' '}</p>
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
      <button className="fav-btn" aria-pressed={favorite} onClick={onToggleFavorite} disabled={!entry}>
        {favorite ? <StarIcon /> : <StarOutlineIcon />}
        <span>{favorite ? 'En favoritas' : 'Favorita'}</span>
      </button>
    </section>
  );
}
