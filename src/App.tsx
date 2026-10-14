import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CATALOG } from './catalog';
import { FavoritesCard } from './features/favorites/FavoritesCard';
import { useFavorites } from './features/favorites/useFavorites';
import { fetchScore, ScoreUrlError } from './features/import/fetchScore';
import { readScoreFile } from './features/import/readScoreFile';
import { useFileArrivals } from './features/import/useFileArrivals';
import { LibraryPanel } from './features/library/LibraryPanel';
import { useLibrary } from './features/library/useLibrary';
import type { PlayerController, ScoreView } from './features/player/controller';
import { NowPlaying } from './features/player/NowPlaying';
import { PlayerCard } from './features/player/PlayerCard';
import { PlayerContext } from './features/player/PlayerContext';
import { SectionsCard } from './features/player/SectionsCard';
import { Toolkit } from './features/player/Toolkit';
import { UpdateBanner } from './pwa/UpdateBanner';
import { useInstallPrompt } from './pwa/useInstallPrompt';
import { readPref, writePref } from './storage/prefs';
import type { StoredScore } from './storage/scoreFiles';
import { CloseIcon, InstallIcon, SearchIcon } from './ui/icons';
import { useToast } from './ui/Toast';

const DEFAULT_VIEW: ScoreView = { layout: 'line', notation: 'tab' };

export function App() {
  const toast = useToast();
  const library = useLibrary();
  const { favorites, toggle: toggleFavorite, remove: removeFavorite } = useFavorites();
  const install = useInstallPrompt();
  const [player, setPlayer] = useState<PlayerController | null>(null);
  const [libOpen, setLibOpen] = useState(false);
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

  const open = useCallback((id: string) => {
    setChosenId(id);
    writePref('last', id);
    setLibOpen(false);
  }, []);

  // Load the chosen song into the player. Imported files need their bytes read first.
  // Depends on plain values so re-listing the library does not reload the song.
  const tex = current?.source.kind === 'tex' ? current.source.tex : null;
  const isFile = current?.source.kind === 'file';
  const { getBytes } = library;
  useEffect(() => {
    if (!player) return;
    if (tex) {
      player.loadTex(tex);
      return;
    }
    if (!isFile) return;
    let cancelled = false;
    getBytes(currentId).then((bytes) => {
      if (cancelled) return;
      if (bytes) player.loadBytes(new Uint8Array(bytes));
      else toast('No encuentro ese archivo en este navegador.');
    });
    return () => {
      cancelled = true;
    };
  }, [player, tex, isFile, currentId, getBytes, toast]);

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

  // The drawer opens on the search field; Escape closes it.
  useEffect(() => {
    if (!libOpen) return;
    document.getElementById('q')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLibOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [libOpen]);

  const withPlayer = (node: ReactNode) =>
    player ? <PlayerContext.Provider value={player}>{node}</PlayerContext.Provider> : null;

  return (
    <div className={`app${libOpen ? ' lib-open' : ''}`}>
      <header className="top">
        <div className="brand">
          <span className="starburst" aria-hidden="true" />
          <h1>Atril</h1>
        </div>
        <button className="search-trigger" aria-controls="lib" aria-expanded={libOpen} onClick={() => setLibOpen(true)}>
          <SearchIcon />
          <span>Buscar tablaturas, importar archivos…</span>
        </button>
        {install && (
          <button className="pill ghost install" onClick={install} aria-label="Instalar Atril">
            <InstallIcon />
            <span>Instalar</span>
          </button>
        )}
      </header>

      {libOpen && <div className="scrim" onClick={() => setLibOpen(false)} aria-hidden="true" />}
      <div className="drawer" id="lib" hidden={!libOpen}>
        <button className="icon-btn drawer-close" aria-label="Cerrar biblioteca" onClick={() => setLibOpen(false)}>
          <CloseIcon />
        </button>
        <LibraryPanel
          entries={library.entries}
          currentId={currentId}
          favorites={favorites}
          onOpen={open}
          onToggleFavorite={toggleFavorite}
          onImport={importFile}
          onOpenLink={openLink}
          onDelete={deleteFile}
        />
      </div>

      <main className="dash">
        {withPlayer(
          <NowPlaying
            entry={current}
            favorite={favorites.includes(currentId)}
            onToggleFavorite={() => toggleFavorite(currentId)}
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
            onBrowse={() => setLibOpen(true)}
          />
        </div>
      </main>
      <UpdateBanner />
    </div>
  );
}
