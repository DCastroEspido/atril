import { useRef, useState, type FormEvent } from 'react';
import { UploadIcon } from '../../ui/icons';
import { ACCEPTED_FILES, scoreMeta } from '../import/readScoreFile';
import type { SharedSong } from './types';

type Meta = Pick<SharedSong, 'title' | 'artist' | 'genre' | 'level' | 'key' | 'time_label' | 'tempo' | 'tags'>;

interface Props {
  genres: string[];
  /** Resolves with an error message, or null once published. */
  onPublish: (file: { bytes: ArrayBuffer; name: string }, meta: Meta) => Promise<string | null>;
}

const LEVELS: Meta['level'][] = ['Principiante', 'Intermedio', 'Avanzado'];

/** For advanced users: share a Guitar Pro / MusicXML file with everyone. */
export function PublishForm({ genres, onPublish }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ bytes: ArrayBuffer; name: string } | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [tags, setTags] = useState('');
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (f: File) => {
    setError(null);
    const bytes = await f.arrayBuffer();
    try {
      const m = scoreMeta(bytes);
      setFile({ bytes, name: f.name });
      setMeta({
        title: m.title || f.name.replace(/\.[^.]+$/, ''),
        artist: m.artist,
        genre: genres[0] ?? 'Rock',
        level: 'Intermedio',
        key: '',
        time_label: m.timeLabel,
        tempo: m.tempo || null,
        tags: [],
      });
    } catch {
      setError('Ese archivo no parece una tablatura de Guitar Pro o MusicXML.');
    }
  };

  const reset = () => {
    setFile(null);
    setMeta(null);
    setTags('');
    setRights(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !meta) return;
    setBusy(true);
    const problem = await onPublish(file, {
      ...meta,
      title: meta.title.trim(),
      artist: meta.artist.trim(),
      genre: meta.genre.trim() || 'Otros',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    });
    setBusy(false);
    setError(problem);
    if (!problem) reset();
  };

  const set = (patch: Partial<Meta>) => setMeta((m) => (m ? { ...m, ...patch } : m));

  return (
    <section className="card panel publish">
      <header className="panel-head">
        <h3>Compartir con todos</h3>
      </header>
      {!file || !meta ? (
        <>
          <button className="pill wide" onClick={() => input.current?.click()}>
            <UploadIcon />
            Elegir tablatura para compartir
          </button>
          <input
            ref={input}
            type="file"
            className="visually-hidden"
            accept={ACCEPTED_FILES}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f);
              e.target.value = '';
            }}
          />
        </>
      ) : (
        <form className="publish-form" onSubmit={submit}>
          <p className="fine">{file.name}</p>
          <label>
            <span className="eyebrow">Título</span>
            <input
              className="text-input"
              required
              maxLength={120}
              value={meta.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </label>
          <label>
            <span className="eyebrow">Autor</span>
            <input
              className="text-input"
              maxLength={120}
              value={meta.artist}
              onChange={(e) => set({ artist: e.target.value })}
            />
          </label>
          <div className="two">
            <label>
              <span className="eyebrow">Estilo</span>
              <input
                className="text-input"
                list="publish-genres"
                maxLength={40}
                value={meta.genre}
                onChange={(e) => set({ genre: e.target.value })}
              />
              <datalist id="publish-genres">
                {genres.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
            <label>
              <span className="eyebrow">Nivel</span>
              <select
                className="select"
                value={meta.level}
                onChange={(e) => set({ level: e.target.value as Meta['level'] })}
              >
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="two">
            <label>
              <span className="eyebrow">Tonalidad</span>
              <input
                className="text-input"
                maxLength={40}
                placeholder="La menor"
                value={meta.key}
                onChange={(e) => set({ key: e.target.value })}
              />
            </label>
            <label>
              <span className="eyebrow">Técnicas</span>
              <input
                className="text-input"
                placeholder="arpegio, palm mute"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} required />
            <span>Es mía, es de dominio público o tengo permiso para compartirla.</span>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="text-btn" onClick={reset}>
              Cancelar
            </button>
            <button type="submit" className="pill primary" disabled={busy || !rights}>
              {busy ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>
      )}
      {!file && error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
