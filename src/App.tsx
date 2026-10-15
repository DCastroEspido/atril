import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { hrefFor, type Page } from './app/routes';
import { useRoute } from './app/useRoute';
import { CATALOG } from './catalog';
import { useAccount } from './features/account/AccountContext';
import { AccountPage } from './features/account/AccountPage';
import { publishSong } from './features/community/api';
import { useSharedSongs } from './features/community/useSharedSongs';
import { useVotes } from './features/community/useVotes';
import { FavoritesCard } from './features/favorites/FavoritesCard';
import { useFavorites } from './features/favorites/useFavorites';
import { fetchScore, ScoreUrlError } from './features/import/fetchScore';
import { readScoreFile } from './features/import/readScoreFile';
import { useFileArrivals } from './features/import/useFileArrivals';
import { LibraryPage } from './features/library/LibraryPage';
import { useLibrary } from './features/library/useLibrary';
import type { PlayerController, ScoreView } from './features/player/controller';
import { NowPlaying } from './features/player/NowPlaying';
import { PlayerCard } from './features/player/PlayerCard';
import { PlayerContext } from './features/player/PlayerContext';
import { SectionsCard } from './features/player/SectionsCard';
import { Toolkit } from './features/player/Toolkit';
import { UpdateBanner } from './pwa/UpdateBanner';
import { useInstallPrompt } from './pwa/useInstallPrompt';
import { supabase } from './lib/supabase';
import { readPref, writePref } from './storage/prefs';
import type { StoredScore } from './storage/scoreFiles';
import { InstallIcon, NoteIcon, ShelfIcon, UserIcon } from './ui/icons';
import { ThemePicker } from './ui/ThemePicker';
import { useToast } from './ui/Toast';

const DEFAULT_VIEW: ScoreView = { layout: 'line', notation: 'tab' };

export function App() {
  const toast = useToast();
  const account = useAccount();
  const { songs: shared, refresh: refreshShared } = useSharedSongs();
  const library = useLibrary(shared);
  const votes = useVotes();
  const { favorites, toggle: toggleFavorite, remove: removeFavorite } = useFavorites();
  const install = useInstallPrompt();
  const [player, setPlayer] = useState<PlayerController | null>(null);
  const { page, go } = useRoute();
  const [initialView] = useState<ScoreView>(() => ({ ...DEFAULT_VIEW, ...readPref<Partial<ScoreView>>('view', {}) }));
  const [chosenId, setChosenId] = useState<string>(() => readPref('last', favorites[0] ?? CATALOG[0].id));

  // A remembered imported file that is gone (cleared storage) falls back to the first catalog song.
  const chosenExists = library.entries.some((e) => e.id === chosenId);
  const currentId = chosenExists || !library.filesLoaded ? chosenId : CATALOG[0].id;
  const current = library.entries.find((e) => e.id === currentId);
  const favoriteEntries = useMemo(
    () => favorites.map((id) => library.entries.find((e) => e.id === id)).filter((e) => e !== undefined),
    [favorites, library.entries],
  );

  /** Puts a song on the stand and goes to the player. */
  const open = useCallback(
    (id: string) => {
      setChosenId(id);
      writePref('last', id);
      go('practice');
    },
    [go],
  );

  // Load the chosen song into the player. Imported files need their bytes read first.
  // Depends on plain values so re-listing the library does not reload the song.
  const tex = current?.source.kind === 'tex' ? current.source.tex : null;
  const isFile = current?.source.kind === 'file';
  const remoteUrl = current?.source.kind === 'remote' ? current.source.url : null;
  const { getBytes, fetchRemote } = library;
  useEffect(() => {
    if (!player) return;
    if (tex) {
      player.loadTex(tex);
      return;
    }
    if (!isFile && !remoteUrl) return;
    let cancelled = false;
    const bytes = remoteUrl ? fetchRemote(remoteUrl).catch(() => undefined) : getBytes(currentId);
    bytes.then((data) => {
      if (cancelled) return;
      if (data) player.loadBytes(new Uint8Array(data));
      else
        toast(
          remoteUrl
            ? 'No he podido descargar esa canción. ¿Tienes conexión?'
            : 'No encuentro ese archivo en este navegador.',
        );
    });
    return () => {
      cancelled = true;
    };
  }, [player, tex, isFile, remoteUrl, currentId, getBytes, fetchRemote, toast]);

  const addScore = useCallback(
    async (score: StoredScore) => {
      const saved = await library.addFile(score);
      toast(
        saved ? `«${score.title}» añadida a Mis archivos` : `«${score.title}» abierta; este navegador no la guardará`,
      );
      open(score.id);
    },
    [library, open, toast],
  );

  const importFile = useCallback(
    async (file: File) => {
      let score;
      try {
        score = await readScoreFile(file);
      } catch {
        toast('Ese archivo no parece una tablatura de Guitar Pro o MusicXML.');
        return;
      }
      await addScore(score);
    },
    [addScore, toast],
  );

  const openLink = useCallback(
    async (link: string) => {
      try {
        await addScore(await fetchScore(link));
        return null;
      } catch (e) {
        return e instanceof ScoreUrlError ? e.message : 'No he podido abrir ese enlace.';
      }
    },
    [addScore],
  );

  const publish = useCallback(
    async (file: { bytes: ArrayBuffer; name: string }, meta: Parameters<typeof publishSong>[3]) => {
      const userId = account.session?.user.id;
      if (!supabase || !userId) return 'Entra con tu cuenta para compartir.';
      try {
        const song = await publishSong(supabase, userId, file, meta);
        await refreshShared();
        toast(`«${song.title}» ya está en la biblioteca para todos`);
        open(song.id);
        return null;
      } catch {
        return 'No he podido publicarla. Revisa la conexión e inténtalo de nuevo.';
      }
    },
    [account.session, refreshShared, toast, open],
  );

  const needAccount = useCallback(() => {
    toast('Entra con tu cuenta para votar');
    go('account');
  }, [toast, go]);

  useFileArrivals(importFile);

  const deleteFile = useCallback(
    async (id: string) => {
      await library.removeFile(id);
      removeFavorite(id);
      toast('Archivo borrado');
      if (id === currentId) open(CATALOG[0].id);
    },
    [library, removeFavorite, toast, currentId, open],
  );

  // Each page starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const withPlayer = (node: ReactNode) =>
    player ? <PlayerContext.Provider value={player}>{node}</PlayerContext.Provider> : null;

  const nav = (where: string) => (
    <nav className={`menu ${where}`} aria-label="Secciones de Atril">
      {(
        [
          ['practice', 'Practicar', NoteIcon],
          ['library', 'Biblioteca', ShelfIcon],
          ...(account.enabled ? [['account', account.session ? 'Cuenta' : 'Entrar', UserIcon]] : []),
        ] as [Page, string, typeof NoteIcon][]
      ).map(([to, label, Icon]) => (
        <a key={to} href={hrefFor(to)} aria-current={page === to ? 'page' : undefined}>
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );

  return (
    <div className="app" data-page={page}>
      <header className="top">
        <a className="brand" href={hrefFor('practice')} aria-label="Atril, ir a practicar">
          <span className="starburst" aria-hidden="true" />
          <h1>Atril</h1>
        </a>
        {nav('menu-top')}
        <ThemePicker />
        {install && (
          <button className="pill ghost install" onClick={install} aria-label="Instalar Atril">
            <InstallIcon />
            <span>Instalar</span>
          </button>
        )}
      </header>

      <main className="dash" hidden={page !== 'practice'} aria-label="Practicar">
        {withPlayer(
          <NowPlaying
            entry={current}
            favorite={favorites.includes(currentId)}
            onToggleFavorite={() => toggleFavorite(currentId)}
            votes={account.enabled ? { ...votes, onNeedAccount: needAccount } : null}
          />,
        )}
        <PlayerCard
          player={player}
          onPlayer={setPlayer}
          initialView={initialView}
          onViewChange={(view) => writePref('view', view)}
        />
        {withPlayer(<Toolkit />)}
        <div className="below">
          {withPlayer(<SectionsCard />)}
          <FavoritesCard
            favorites={favoriteEntries}
            currentId={currentId}
            onOpen={open}
            onBrowse={() => go('library')}
          />
        </div>
      </main>

      <LibraryPage
        active={page === 'library'}
        entries={library.entries}
        currentId={currentId}
        favorites={favorites}
        onOpen={open}
        onToggleFavorite={toggleFavorite}
        onImport={importFile}
        onOpenLink={openLink}
        onDelete={deleteFile}
        votes={account.enabled ? { ...votes, onNeedAccount: needAccount } : null}
        onPublish={account.canPublish ? publish : null}
        canAskToPublish={account.enabled && account.profile?.role === 'basic'}
      />

      <AccountPage active={page === 'account'} shared={shared} onSharedChange={() => void refreshShared()} />

      {nav('menu-bottom')}
      <UpdateBanner />
    </div>
  );
}
