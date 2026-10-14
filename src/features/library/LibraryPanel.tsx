import { useMemo, useRef, useState } from 'react';
import { ImportIcon, StarIcon, StarOutlineIcon, TrashIcon } from '../../ui/icons';
import { ACCEPTED_FILES } from '../import/readScoreFile';
import { searchLibrary } from './search';
import { IMPORTED_GENRE, type LibraryEntry } from './types';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];

interface Props {
  entries: LibraryEntry[];
  currentId: string | null;
  favorites: string[];
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onImport: (file: File) => void;
  onDelete: (id: string) => void;
}

export function LibraryPanel({ entries, currentId, favorites, onOpen, onToggleFavorite, onImport, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const genres = useMemo(
    () => [...new Set(entries.filter((e) => e.genre !== IMPORTED_GENRE).map((e) => e.genre)), IMPORTED_GENRE],
    [entries],
  );
  const results = searchLibrary(entries, { query, genre, level });
  const importedCount = entries.filter((e) => e.genre === IMPORTED_GENRE).length;

  return (
    <aside className="lib" id="lib" aria-label="Biblioteca">
      <div className="lib-head">
        <h2 className="side-label">Buscar tablaturas</h2>
        <input
          type="search"
          id="q"
          placeholder="Título, autor, estilo, técnica…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Filtrar por estilo">
          {[null, ...genres].map((g) => (
            <button key={g ?? 'all'} className="chip" aria-pressed={genre === g} onClick={() => setGenre(g)}>
              {g ?? 'Todos'}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Filtrar por nivel">
          {LEVELS.map((l) => (
            <button
              key={l}
              className="chip"
              aria-pressed={level === l}
              onClick={() => setLevel(level === l ? null : l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <ul className="results">
        {results.length === 0 && (
          <li className="empty">
            {genre === IMPORTED_GENRE && importedCount === 0
              ? 'Aún no has importado archivos. Usa «Importar Guitar Pro» o arrastra un .gp a la ventana.'
              : 'Nada coincide con esa búsqueda. Prueba con otro estilo o técnica.'}
          </li>
        )}
        {results.map((e) => {
          const fav = favorites.includes(e.id);
          const imported = e.source.kind === 'file';
          return (
            <li key={e.id} className={e.id === currentId ? 'active' : undefined}>
              <button className="item" onClick={() => onOpen(e.id)}>
                <span className="t">{e.title}</span>
                <span className="a">{imported ? e.artist || e.tags[0] : `${e.artist} · ${e.genre}`}</span>
                <span className="m">
                  <span className="lvl" data-l={e.level}>
                    {e.level}
                  </span>
                  {!imported && <span>{`${e.key} · ${e.timeLabel} · ${e.tempo} bpm`}</span>}
                </span>
              </button>
              <button
                className="star"
                aria-pressed={fav}
                aria-label={fav ? `Quitar ${e.title} de favoritas` : `Añadir ${e.title} a favoritas`}
                onClick={() => onToggleFavorite(e.id)}
              >
                {fav ? <StarIcon /> : <StarOutlineIcon />}
              </button>
              {imported &&
                (confirming === e.id ? (
                  <button
                    className="del confirm"
                    onClick={() => {
                      setConfirming(null);
                      onDelete(e.id);
                    }}
                    onBlur={() => setConfirming(null)}
                  >
                    Borrar
                  </button>
                ) : (
                  <button className="del" aria-label={`Borrar ${e.title}`} onClick={() => setConfirming(e.id)}>
                    <TrashIcon />
                  </button>
                ))}
            </li>
          );
        })}
      </ul>

      <div className="lib-foot">
        <button className="btn" onClick={() => fileInput.current?.click()}>
          <ImportIcon />
          Importar Guitar Pro
        </button>
        <input
          ref={fileInput}
          type="file"
          className="visually-hidden"
          accept={ACCEPTED_FILES}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
        <p>
          Abre .gp, .gpx, .gp5, .gp4, .gp3 y MusicXML. Las canciones del catálogo son tradicionales o ejercicios
          propios; para otras, consigue su archivo Guitar Pro y arrástralo a la ventana.
        </p>
      </div>
    </aside>
  );
}
