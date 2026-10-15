import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../ui/Toast';
import {
  decideRequest,
  deleteSharedSong,
  fetchMyRequest,
  listRequests,
  renameProfile,
  requestAdvanced,
  setSongStatus,
} from '../community/api';
import { ROLE_LABEL, type AdvancedRequest, type SharedSong } from '../community/types';
import { useAccount } from './AccountContext';

function SignIn() {
  const { sendMagicLink } = useAccount();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(email.trim());
    } catch {
      setError('No he podido enviar el enlace. Revisa el correo o inténtalo en unos minutos.');
    }
    setBusy(false);
  };

  if (sent)
    return (
      <section className="card panel account-card">
        <h3>Mira tu correo</h3>
        <p>
          Te he enviado un enlace a <strong>{sent}</strong>. Ábrelo en este dispositivo y entrarás directamente.
        </p>
        <button className="text-btn" onClick={() => setSent(null)}>
          Usar otro correo
        </button>
      </section>
    );

  return (
    <section className="card panel account-card">
      <h3>Entra en Atril</h3>
      <p className="hint">
        Sin contraseña: te mandamos un enlace al correo. Con cuenta, tus favoritas te siguen a cualquier dispositivo y
        puedes votar las tablaturas.
      </p>
      <form className="signin" onSubmit={submit}>
        <label className="visually-hidden" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          className="text-input"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="pill primary" type="submit" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviarme el enlace'}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function Profile() {
  const { profile, session, signOut, refreshProfile } = useAccount();
  const toast = useToast();
  // What the user is typing; null shows the saved name.
  const [draft, setDraft] = useState<string | null>(null);
  if (!profile || !supabase) return null;
  const name = draft ?? profile.display_name;
  const db = supabase;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await renameProfile(db, profile.id, name);
      await refreshProfile();
      setDraft(null);
      toast('Nombre guardado');
    } catch {
      toast('No he podido guardar el nombre');
    }
  };

  return (
    <section className="card panel account-card">
      <header className="panel-head">
        <h3>Tu cuenta</h3>
        <span className="role-badge" data-role={profile.role}>
          {ROLE_LABEL[profile.role]}
        </span>
      </header>
      <p className="hint">{session?.user.email}</p>
      <form className="signin" onSubmit={save}>
        <label className="eyebrow" htmlFor="displayName">
          Nombre que verán los demás
        </label>
        <div className="row">
          <input
            id="displayName"
            className="text-input"
            maxLength={60}
            value={name}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="pill" type="submit" disabled={name.trim() === profile.display_name}>
            Guardar
          </button>
        </div>
      </form>
      <button className="text-btn" onClick={() => void signOut()}>
        Cerrar sesión
      </button>
    </section>
  );
}

/** Basic users ask to become advanced (publish songs); shows where their request stands. */
function AskAdvanced() {
  const toast = useToast();
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'loading'>('loading');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!supabase) return;
    fetchMyRequest(supabase).then((r) => setStatus(r?.status ?? 'none'));
  }, []);
  if (!supabase || status === 'loading') return null;
  const db = supabase;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await requestAdvanced(db, message);
      setStatus('pending');
      toast('Solicitud enviada');
    } catch {
      toast('No he podido enviar la solicitud');
    }
  };

  return (
    <section className="card panel account-card">
      <h3>¿Quieres subir tablaturas?</h3>
      {status === 'pending' ? (
        <p>Tu solicitud está pendiente. Un administrador la revisará pronto.</p>
      ) : (
        <form className="signin" onSubmit={send}>
          {status === 'rejected' && <p className="hint">La última solicitud no se aprobó. Puedes volver a pedirlo.</p>}
          <label className="eyebrow" htmlFor="askMessage">
            Cuéntanos qué te gustaría compartir
          </label>
          <textarea
            id="askMessage"
            className="text-input"
            rows={3}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Por ejemplo: transcripciones propias de flamenco"
          />
          <button className="pill primary" type="submit">
            Solicitar ser avanzado
          </button>
        </form>
      )}
    </section>
  );
}

function AdminPanel({ shared, onSharedChange }: { shared: SharedSong[]; onSharedChange: () => void }) {
  const toast = useToast();
  const [requests, setRequests] = useState<AdvancedRequest[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const load = () => {
    if (supabase)
      listRequests(supabase)
        .then(setRequests)
        .catch(() => setRequests([]));
  };
  useEffect(load, []);
  if (!supabase) return null;
  const db = supabase;

  const decide = async (r: AdvancedRequest, approve: boolean) => {
    try {
      await decideRequest(db, r.id, approve);
      toast(approve ? `${r.display_name || r.email} ya es avanzado` : 'Solicitud rechazada');
      load();
    } catch {
      toast('No he podido guardar la decisión');
    }
  };

  const changeStatus = async (s: SharedSong) => {
    await setSongStatus(db, s.id, s.status === 'published' ? 'hidden' : 'published').catch(() =>
      toast('No he podido cambiarla'),
    );
    onSharedChange();
  };

  const remove = async (s: SharedSong) => {
    await deleteSharedSong(db, s).catch(() => toast('No he podido borrarla'));
    setConfirming(null);
    onSharedChange();
  };

  return (
    <>
      <section className="card panel account-card">
        <h3>Solicitudes para ser avanzado</h3>
        {requests === null ? (
          <p className="hint">Cargando…</p>
        ) : requests.length === 0 ? (
          <p className="hint">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="rows">
            {requests.map((r) => (
              <li key={r.id}>
                <span className="row-text">
                  <strong>{r.display_name || r.email}</strong>
                  <small>{r.email}</small>
                  {r.message && <small className="request-msg">«{r.message}»</small>}
                </span>
                <button className="text-btn" onClick={() => void decide(r, false)}>
                  Rechazar
                </button>
                <button className="pill primary" onClick={() => void decide(r, true)}>
                  Aprobar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card panel account-card">
        <h3>Canciones compartidas</h3>
        {shared.length === 0 ? (
          <p className="hint">Aún nadie ha compartido canciones.</p>
        ) : (
          <ul className="rows">
            {shared.map((s) => (
              <li key={s.id} data-hidden={s.status === 'hidden' || undefined}>
                <span className="row-text">
                  <strong>{s.title}</strong>
                  <small>
                    {s.artist || 'Sin autor'} · subida por {s.uploader_name || 'alguien'}
                    {s.status === 'hidden' ? ' · oculta' : ''}
                  </small>
                </span>
                <button className="text-btn" onClick={() => void changeStatus(s)}>
                  {s.status === 'published' ? 'Ocultar' : 'Mostrar'}
                </button>
                {confirming === s.id ? (
                  <button className="text-btn danger" onClick={() => void remove(s)} onBlur={() => setConfirming(null)}>
                    Sí, borrar
                  </button>
                ) : (
                  <button className="text-btn" onClick={() => setConfirming(s.id)}>
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

interface Props {
  active: boolean;
  shared: SharedSong[];
  onSharedChange: () => void;
}

export function AccountPage({ active, shared, onSharedChange }: Props) {
  const { enabled, session, profile, isAdmin, refreshProfile } = useAccount();
  // The role can change elsewhere (an admin approves a request): read it again on every visit.
  useEffect(() => {
    if (active) void refreshProfile();
  }, [active, refreshProfile]);
  return (
    <main className="account-page" hidden={!active} aria-label="Cuenta">
      <header className="lib-hero">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h2>{session ? `Hola, ${profile?.display_name || 'músico'}` : 'Tu cuenta'}</h2>
        </div>
      </header>
      {!enabled ? (
        <p className="empty">Esta versión de Atril funciona sin cuentas.</p>
      ) : !session ? (
        <SignIn />
      ) : (
        <div className="account-grid">
          <Profile />
          {profile?.role === 'basic' && <AskAdvanced />}
          {isAdmin && <AdminPanel shared={shared} onSharedChange={onSharedChange} />}
        </div>
      )}
    </main>
  );
}
