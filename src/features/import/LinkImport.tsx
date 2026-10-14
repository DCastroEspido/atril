import { useState, type FormEvent } from 'react';
import { useOnline } from '../library/useOnline';

interface Props {
  /** Resolves with an error message to show, or null when the tab was added. */
  onOpenLink: (link: string) => Promise<string | null>;
}

/** Opens a Guitar Pro or MusicXML file from a public link (GitHub, Dropbox or any site that allows it). */
export function LinkImport({ onOpenLink }: Props) {
  const online = useOnline();
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!link.trim() || busy) return;
    setBusy(true);
    setError(null);
    const problem = await onOpenLink(link);
    setBusy(false);
    setError(problem);
    if (!problem) setLink('');
  };

  return (
    <form className="link-import" onSubmit={submit}>
      <label className="side-label" htmlFor="scoreLink">
        Abrir desde un enlace
      </label>
      <div className="row">
        <input
          id="scoreLink"
          type="url"
          inputMode="url"
          placeholder="https://github.com/…/cancion.gp"
          autoComplete="off"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setError(null);
          }}
          aria-describedby="scoreLinkHelp"
        />
        <button className="btn" type="submit" disabled={!online || busy || !link.trim()}>
          {busy ? 'Abriendo…' : 'Abrir'}
        </button>
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : (
        <p id="scoreLinkHelp">
          {online
            ? 'Archivos públicos en GitHub, Dropbox o webs que permitan descargarlos. No sirve con Songsterr, Ultimate Guitar ni Google Drive.'
            : 'Necesita conexión.'}
        </p>
      )}
    </form>
  );
}
