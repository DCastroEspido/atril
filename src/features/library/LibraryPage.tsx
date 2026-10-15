import { useEffect, useMemo, useRef, useState } from 'react';
import { ImportIcon, SearchIcon, StarIcon, StarOutlineIcon, TrashIcon } from '../../ui/icons';
import { PublishForm } from '../community/PublishForm';
import type { SharedSong, VotesState } from '../community/types';
import { VoteButtons } from '../community/VoteButtons';
import { LinkImport } from '../import/LinkImport';
import { ACCEPTED_FILES } from '../import/readScoreFile';
import { OnlineSearch } from './OnlineSearch';
import { searchLibrary } from './search';
import { IMPORTED_GENRE, type LibraryEntry } from './types';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];

interface Props {
  active: boolean;
  entries: LibraryEntry[];
  currentId: string | null;
  favorites: string[];
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onImport: (file: File) => void;
  onOpenLink: (link: string) => Promise<string | null>;
  onDelete: (id: string) => void;
  /** Null when this build has no backend. */
  votes: VotesState | null;
  /** Only for advanced users and admins. */
  onPublish: ((file: { bytes: ArrayBuffer; name: string }, meta: PublishMeta) => Promise<string | null>) | null;
  /** Signed-in basic users can ask to become advanced. */
  canAskToPublish: boolean;
}

type PublishMeta = Pick<SharedSong, 'title' | 'artist' | 'genre' | 'level' | 'key' | 'time_label' | 'tempo' | 'tags'>;

/** The library as its own page: search, filters, every song as a card, and ways to add more. */
export function LibraryPage(props: Props) {
  const { active, entries, currentId, favorites, onOpen, onToggleFavorite, onImport, onOpenLink, onDelete } = props;
  const { votes, onPublish, canAskToPublish } = props;
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  // Arriving on the page puts the cursor in the search box, except on touch screens,
  // where that would pop the keyboard up every time.
  useEffect(() => {
    if (active && window.matchMedia('(pointer: fine)').matches) searchInput.current?.focus({ preventScroll: true });
  }, [active]);

  const genres = useMemo(
    () => [...new Set(entries.filter((e) => e.genre !== IMPORTED_GENRE).map((e) => e.genre)), IMPORTED_GENRE],
    [entries],
  );
  const results = searchLibrary(entries, { query, genre, level });
  const importedCount = entries.filter((e) => e.genre === IMPORTED_GENRE).length;

  return (
    <main className="library-page" hidden={!active} aria-label="Biblioteca">
      <header className="lib-hero">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h2>Encuentra algo que tocar</h2>
          <p className="hint">
            {entries.length} canciones · {favorites.length} favoritas
            {importedCount ? ` · ${importedCount} importadas` : ''}
          </p>
        </div>
        <div className="search big">
          <SearchIcon />
          <input
            ref={searchInput}
            type="search"
            id="q"
            placeholder="Título, autor, estilo o técnica: «palm mute», «arpegio»…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar canciones"
          />
        </div>
        <div className="lib-filters">
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
                data-l={l}
                aria-pressed={level === l}
                onClick={() => setLevel(level === l ? null : l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="lib-layout">
        <section className="lib-results" aria-label="Resultados">
          {results.length > 0 ? (
            <ul className="song-grid">
              {results.map((e) => {
                const fav = favorites.includes(e.id);
                const imported = e.source.kind === 'file';
                const open = e.id === currentId;
                return (
                  <li key={e.id} className="card song-card" data-open={open || undefined}>
                    <div className="song-top">
                      <span className="disc" data-level={e.level} aria-hidden="true" />
                      <div className="song-text">
                        <h3>{e.title}</h3>
                        <p>{imported ? e.artist || e.tags[0] : e.artist}</p>
                        {e.uploader && (
                          <p className="uploader">
                            Compartida por {e.uploader}
                            {e.hidden ? ' · oculta' : ''}
                          </p>
                        )}
                      </div>
                      <button
                        className="icon-btn star"
                        aria-pressed={fav}
                        aria-label={fav ? `Quitar ${e.title} de favoritas` : `Añadir ${e.title} a favoritas`}
                        onClick={() => onToggleFavorite(e.id)}
                      >
                        {fav ? <StarIcon /> : <StarOutlineIcon />}
                      </button>
                    </div>
                    <div className="song-meta">
                      <span className="lvl" data-l={e.level}>
                        {e.level}
                      </span>
                      {!imported && (
                        <span>{[e.key, e.timeLabel, e.tempo && `${e.tempo} bpm`].filter(Boolean).join(' · ')}</span>
                      )}
                    </div>
                    {!imported && (
                      <div className="song-tags">
                        <span>{e.genre}</span>
                        {e.tags.slice(0, 2).map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="song-actions">
                      {votes && !imported && (
                        <VoteButtons
                          songId={e.id}
                          score={votes.scores[e.id]}
                          mine={votes.mine[e.id]}
                          canVote={votes.canVote}
                          onVote={(id, v) => void votes.vote(id, v)}
                          onNeedAccount={votes.onNeedAccount}
                        />
                      )}
                      {imported &&
                        (confirming === e.id ? (
                          <button
                            className="text-btn danger"
                            onClick={() => {
                              setConfirming(null);
                              onDelete(e.id);
                            }}
                            onBlur={() => setConfirming(null)}
                          >
                            ¿Borrar? Sí, borrar
                          </button>
                        ) : (
                          <button
                            className="icon-btn"
                            aria-label={`Borrar ${e.title}`}
                            onClick={() => setConfirming(e.id)}
                          >
                            <TrashIcon />
                          </button>
                        ))}
                      <button className="pill primary" onClick={() => onOpen(e.id)} aria-current={open}>
                        {open ? 'Abierta · Practicar' : 'Practicar'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty">
              {genre === IMPORTED_GENRE && importedCount === 0
                ? 'Aún no has importado archivos. Usa «Importar archivo» o pega un enlace.'
                : query.trim()
                  ? `«${query.trim()}» no está en tu biblioteca. Búscala en internet:`
                  : 'Nada coincide con estos filtros.'}
            </p>
          )}
          <OnlineSearch query={query} prominent={results.length === 0} />
        </section>

        <aside className="lib-side">
          {onPublish && <PublishForm genres={genres.filter((g) => g !== IMPORTED_GENRE)} onPublish={onPublish} />}
          {canAskToPublish && (
            <p className="fine side-note">
              ¿Quieres compartir tablaturas con todos? <a href="#/cuenta">Pídelo desde tu cuenta</a>.
            </p>
          )}
          <section className="card panel">
            <header className="panel-head">
              <h3>Añadir canciones</h3>
            </header>
            <button className="pill primary wide" onClick={() => fileInput.current?.click()}>
              <ImportIcon />
              Importar archivo
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
            <LinkImport onOpenLink={onOpenLink} />
            <p className="fine">Guitar Pro o MusicXML. También puedes arrastrarlo aquí.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
