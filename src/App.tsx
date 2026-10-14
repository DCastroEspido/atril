import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATALOG } from './catalog';
import { FavoritesSelect } from './features/favorites/FavoritesSelect';
import { useFavorites } from './features/favorites/useFavorites';
import { fetchScore, ScoreUrlError } from './features/import/fetchScore';
import { readScoreFile } from './features/import/readScoreFile';
import { useFileArrivals } from './features/import/useFileArrivals';
import { LibraryPanel } from './features/library/LibraryPanel';
import { useLibrary } from './features/library/useLibrary';
import type { PlayerController } from './features/player/controller';
import { Mixer } from './features/player/Mixer';
import { PlayerContext } from './features/player/PlayerContext';
import { ScoreView } from './features/player/ScoreView';
import { SongHeader } from './features/player/SongHeader';
import { Transport } from './features/player/Transport';
import { UpdateBanner } from './pwa/UpdateBanner';
import { useInstallPrompt } from './pwa/useInstallPrompt';
import { readPref, writePref } from './storage/prefs';
import type { StoredScore } from './storage/scoreFiles';
import { InstallIcon, ShelfIcon } from './ui/icons';
import { useToast } from './ui/Toast';

const narrow = () => window.matchMedia('(max-width: 860px)').matches;

export function App() {
  const toast = useToast();
  const library = useLibrary();
  const { favorites, toggle: toggleFavorite, remove: removeFavorite } = useFavorites();
  const install = useInstallPrompt();
  const [player, setPlayer] = useState<PlayerController | null>(null);
  const [libOpen, setLibOpen] = useState(false);
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
    if (narrow()) setLibOpen(false);
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

  return (
    <div className={`app${libOpen ? ' lib-open' : ''}`}>
      <header className="top">
        <button
          className="btn lib-toggle"
          aria-controls="lib"
          aria-expanded={libOpen}
          onClick={() => setLibOpen(!libOpen)}
        >
          <ShelfIcon />
          Biblioteca
        </button>
        <div className="brand">
          <h1>Atril</h1>
          <span>tablaturas para practicar con banda</span>
        </div>
        {install && (
          <button className="btn" onClick={install}>
            <InstallIcon />
            Instalar
          </button>
        )}
        <FavoritesSelect favorites={favoriteEntries} currentId={currentId} onOpen={open} />
      </header>

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

      <main className="stage">
        {player && (
          <PlayerContext.Provider value={player}>
            <SongHeader
              entry={current}
              favorite={favorites.includes(currentId)}
              onToggleFavorite={() => toggleFavorite(currentId)}
            />
            <Mixer />
          </PlayerContext.Provider>
        )}
        <ScoreView player={player} onPlayer={setPlayer} />
        {player && (
          <PlayerContext.Provider value={player}>
            <Transport />
          </PlayerContext.Provider>
        )}
      </main>
      <UpdateBanner />
    </div>
  );
}
