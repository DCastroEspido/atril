import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { ThumbDownIcon, ThumbUpIcon } from '../../ui/icons';
import { useToast } from '../../ui/Toast';
import {
  clearAvatar,
  decideRequest,
  deleteSharedSong,
  fetchMyRequest,
  listRequests,
  listUsers,
  NickTakenError,
  requestAdvanced,
  setAvatar,
  setSongStatus,
  setUserRole,
  updateProfile,
} from '../community/api';
import {
  ROLE_LABEL,
  type AdvancedRequest,
  type Role,
  type SharedSong,
  type UserRow,
  type VotesState,
} from '../community/types';
import { useAccount } from './AccountContext';
import { Avatar } from './Avatar';

function SignIn() {
  const { sendMagicLink, signInWithGoogle } = useAccount();
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

  const google = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('No he podido abrir el acceso con Google. Inténtalo de nuevo.');
    }
  };

  return (
    <section className="card panel account-card">
      <h3>Entra en Atril</h3>
      <p className="hint">Con cuenta, tus favoritas te siguen a cualquier dispositivo y puedes votar las tablaturas.</p>
      <button className="google-btn" onClick={() => void google()}>
        <GoogleMark />
        Continuar con Google
      </button>
      <div className="or" aria-hidden="true">
        <span>o con un enlace en tu correo</span>
      </div>
      <form className="signin" onSubmit={submit}>
        <label className="visually-hidden" htmlFor="email">
          Correo electrónico
        </label>
        <div className="row">
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
          <button className="pill" type="submit" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </div>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** Google's "G", in its own colours as their branding guidelines ask. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="google-mark">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

/** Picture, nick and bio: what other people see next to the tabs you share. */
function ProfileEditor({ onSaved }: { onSaved: () => void }) {
  const { profile, refreshProfile } = useAccount();
  const toast = useToast();
  const picker = useRef<HTMLInputElement>(null);
  // What the user is typing; null shows the saved value.
  const [nick, setNick] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile || !supabase) return null;
  const db = supabase;
  const nickValue = nick ?? profile.display_name;
  const bioValue = bio ?? profile.bio;
  const dirty = nickValue.trim() !== profile.display_name || bioValue.trim() !== profile.bio;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const name = nickValue.trim();
    if (name.length < 2) {
      setError('El nick necesita al menos 2 caracteres.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateProfile(db, profile.id, { display_name: name, bio: bioValue.trim() });
      await refreshProfile();
      // Shared songs carry the nick: reload them so the library shows the new one.
      onSaved();
      setNick(null);
      setBio(null);
      toast('Perfil guardado');
    } catch (err) {
      setError(
        err instanceof NickTakenError
          ? 'Ese nick ya lo usa otra persona. Prueba con otro.'
          : 'No he podido guardar el perfil.',
      );
    }
    setBusy(false);
  };

  const changePicture = async (file: File) => {
    setBusy(true);
    try {
      await setAvatar(db, profile, file);
      await refreshProfile();
      toast('Imagen actualizada');
    } catch {
      toast('No he podido subir esa imagen. Prueba con un JPG o PNG.');
    }
    setBusy(false);
  };

  const removePicture = async () => {
    setBusy(true);
    await clearAvatar(db, profile).catch(() => toast('No he podido quitar la imagen'));
    await refreshProfile();
    setBusy(false);
  };

  return (
    <section className="card panel profile-card">
      <div className="profile-head">
        <button
          className="avatar-edit"
          onClick={() => picker.current?.click()}
          disabled={busy}
          aria-label="Cambiar imagen de perfil"
        >
          <Avatar profile={profile} size={96} />
          <span className="avatar-edit-label">Cambiar</span>
        </button>
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void changePicture(f);
            e.target.value = '';
          }}
        />
        <div className="profile-who">
          <h3>{profile.display_name}</h3>
          <span className="role-badge" data-role={profile.role}>
            {ROLE_LABEL[profile.role]}
          </span>
          {profile.avatar_url && (
            <button className="text-btn" onClick={() => void removePicture()} disabled={busy}>
              Quitar imagen
            </button>
          )}
        </div>
      </div>
      <form className="signin" onSubmit={save}>
        <label className="field-label" htmlFor="nick">
          <span className="eyebrow">Nick</span>
          <span className="fine">Es el nombre que aparece en las tablaturas que compartes.</span>
        </label>
        <input
          id="nick"
          className="text-input"
          maxLength={60}
          value={nickValue}
          onChange={(e) => {
            setNick(e.target.value);
            setError(null);
          }}
        />
        <label className="eyebrow" htmlFor="bio">
          Sobre ti
        </label>
        <textarea
          id="bio"
          className="text-input"
          rows={3}
          maxLength={280}
          placeholder="Qué tocas, qué estilos te gustan…"
          value={bioValue}
          onChange={(e) => setBio(e.target.value)}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="pill primary" type="submit" disabled={busy || !dirty}>
            Guardar perfil
          </button>
        </div>
      </form>
    </section>
  );
}

interface ContributionsProps {
  shared: SharedSong[];
  favoritesCount: number;
  votes: VotesState | null;
  onOpen: (id: string) => void;
  onSharedChange: () => void;
}

/** What you have given to the library, with your shared tabs. */
function Contributions({ shared, favoritesCount, votes, onOpen, onSharedChange }: ContributionsProps) {
  const { profile } = useAccount();
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);
  if (!profile || !supabase) return null;
  const db = supabase;
  const mine = shared.filter((s) => s.uploaded_by === profile.id);
  const received = mine.reduce((sum, s) => sum + (votes?.scores[s.id]?.up ?? 0), 0);
  const stats: [string, number][] = [
    ['Tablaturas compartidas', mine.length],
    ['Votos positivos recibidos', received],
    ['Favoritas', favoritesCount],
    ['Votos dados', Object.keys(votes?.mine ?? {}).length],
  ];

  const toggleHidden = async (s: SharedSong) => {
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
    <section className="card panel contributions">
      <h3>Mis aportaciones</h3>
      <dl className="stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dd>{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>
      {mine.length > 0 ? (
        <ul className="rows">
          {mine.map((s) => (
            <li key={s.id} data-hidden={s.status === 'hidden' || undefined}>
              <span className="row-text">
                <strong>{s.title}</strong>
                <small>
                  {s.artist || 'Sin autor'} · {s.genre}
                  {s.status === 'hidden' ? ' · oculta' : ''}
                </small>
              </span>
              <span className="mini-votes" aria-label="Votos">
                <ThumbUpIcon /> {votes?.scores[s.id]?.up ?? 0}
                <ThumbDownIcon /> {votes?.scores[s.id]?.down ?? 0}
              </span>
              <button className="text-btn" onClick={() => onOpen(s.id)}>
                Abrir
              </button>
              <button className="text-btn" onClick={() => void toggleHidden(s)}>
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
      ) : (
        <p className="hint">
          {profile.role === 'basic'
            ? 'Cuando seas avanzado, las tablaturas que compartas aparecerán aquí.'
            : 'Aún no has compartido tablaturas. Hazlo desde «Compartir con todos» en la Biblioteca.'}
        </p>
      )}
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

const ROLES: Role[] = ['basic', 'advanced', 'admin'];

function AdminPanel({ shared, onSharedChange }: { shared: SharedSong[]; onSharedChange: () => void }) {
  const { profile } = useAccount();
  const toast = useToast();
  const [requests, setRequests] = useState<AdvancedRequest[] | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const load = () => {
    if (!supabase) return;
    listRequests(supabase)
      .then(setRequests)
      .catch(() => setRequests([]));
    listUsers(supabase)
      .then(setUsers)
      .catch(() => setUsers([]));
  };
  // Reload when the admin's own nick or picture changes, so the user list shows it.
  useEffect(load, [profile?.display_name, profile?.avatar_url]);
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

  const changeRole = async (u: UserRow, role: Role) => {
    try {
      await setUserRole(db, u.id, role);
      toast(`${u.display_name} ahora es ${ROLE_LABEL[role].toLowerCase()}`);
      load();
    } catch {
      toast('No he podido cambiar el tipo de usuario');
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
      <h3 className="section-title">Administración</h3>
      <div className="account-grid">
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
          <h3>Usuarios</h3>
          {users === null ? (
            <p className="hint">Cargando…</p>
          ) : (
            <ul className="rows">
              {users.map((u) => (
                <li key={u.id}>
                  <Avatar profile={u} size={34} />
                  <span className="row-text">
                    <strong>{u.display_name}</strong>
                    <small>
                      {u.email} · {u.songs} {u.songs === 1 ? 'tablatura' : 'tablaturas'}
                    </small>
                  </span>
                  <label className="visually-hidden" htmlFor={`role-${u.id}`}>
                    Tipo de usuario de {u.display_name}
                  </label>
                  <select
                    id={`role-${u.id}`}
                    className="select small"
                    value={u.role}
                    // Admins cannot demote themselves by accident; another admin can.
                    disabled={u.id === profile?.id}
                    onChange={(e) => void changeRole(u, e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
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
                    <button
                      className="text-btn danger"
                      onClick={() => void remove(s)}
                      onBlur={() => setConfirming(null)}
                    >
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
      </div>
    </>
  );
}

interface Props {
  active: boolean;
  shared: SharedSong[];
  onSharedChange: () => void;
  favoritesCount: number;
  votes: VotesState | null;
  onOpen: (id: string) => void;
}

export function AccountPage({ active, shared, onSharedChange, favoritesCount, votes, onOpen }: Props) {
  const { enabled, session, profile, isAdmin, refreshProfile, signOut } = useAccount();
  // The role can change elsewhere (an admin approves a request): read it again on every visit.
  useEffect(() => {
    if (active) void refreshProfile();
  }, [active, refreshProfile]);

  return (
    <main className="account-page" hidden={!active} aria-label="Perfil">
      <header className="lib-hero account-hero">
        <div>
          <p className="eyebrow">{session ? 'Tu perfil' : 'Cuenta'}</p>
          <h2>{session ? `Hola, ${profile?.display_name || 'músico'}` : 'Entra en Atril'}</h2>
        </div>
        {session && (
          <div className="account-meta">
            <span className="fine">{session.user.email}</span>
            <button className="text-btn" onClick={() => void signOut()}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      {!enabled ? (
        <p className="empty">Esta versión de Atril funciona sin cuentas.</p>
      ) : !session ? (
        <SignIn />
      ) : (
        <>
          <div className="profile-grid">
            <ProfileEditor onSaved={onSharedChange} />
            <Contributions
              shared={shared}
              favoritesCount={favoritesCount}
              votes={votes}
              onOpen={onOpen}
              onSharedChange={onSharedChange}
            />
            {profile?.role === 'basic' && <AskAdvanced />}
          </div>
          {isAdmin && <AdminPanel shared={shared} onSharedChange={onSharedChange} />}
        </>
      )}
    </main>
  );
}
