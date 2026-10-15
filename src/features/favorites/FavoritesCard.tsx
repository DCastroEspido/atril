import { PlayIcon } from '../../ui/icons';
import type { LibraryEntry } from '../library/types';

interface Props {
  favorites: LibraryEntry[];
  currentId: string | null;
  onOpen: (id: string) => void;
  onBrowse: () => void;
}

export function FavoritesCard({ favorites, currentId, onOpen, onBrowse }: Props) {
  return (
    <section className="card panel favorites" aria-label="Favoritas">
      <header className="panel-head">
        <h3>Favoritas</h3>
        <button className="pill primary" onClick={onBrowse}>
          + Añadir canciones
        </button>
      </header>
      {favorites.length ? (
        <ul className="rows">
          {favorites.map((f) => (
            <li key={f.id} data-here={f.id === currentId || undefined}>
              <span className="disc" data-level={f.level} aria-hidden="true" />
              <span className="row-text">
                <strong>{f.title}</strong>
                <small>{f.artist || f.tags[0]}</small>
              </span>
              <span className="lvl" data-l={f.level}>
                {f.level}
              </span>
              <button
                className="play-mini"
                aria-label={`Abrir ${f.title}`}
                aria-current={f.id === currentId}
                onClick={() => onOpen(f.id)}
              >
                <PlayIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Marca canciones con ★ en la biblioteca y aparecerán aquí.</p>
      )}
    </section>
  );
}
