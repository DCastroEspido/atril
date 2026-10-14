import { ExternalIcon } from '../../ui/icons';
import { ONLINE_SOURCES } from './onlineSources';
import { useOnline } from './useOnline';

/** Hands the current search to tab sites on the web, each in a new tab. */
export function OnlineSearch({ query, prominent }: { query: string; prominent: boolean }) {
  const online = useOnline();
  const text = query.trim();
  if (!text) return null;

  return (
    <section className={`online${prominent ? ' prominent' : ''}`} aria-label="Buscar en internet">
      <h3 className="side-label">Buscar «{text}» en internet</h3>
      {online ? (
        <ul>
          {ONLINE_SOURCES.map((s) => (
            <li key={s.name}>
              <a href={s.url(text)} target="_blank" rel="noopener noreferrer">
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.note}</small>
                </span>
                <ExternalIcon />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>Sin conexión. Cuando vuelvas a tenerla podrás buscar en Songsterr, Ultimate Guitar y 911Tabs.</p>
      )}
      <p>Se abre en su web. Para practicarla aquí, descarga su archivo Guitar Pro e impórtalo.</p>
    </section>
  );
}
