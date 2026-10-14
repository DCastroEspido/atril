import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { PlayerController } from './controller';
import { usePlayerState } from './PlayerContext';

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/**
 * Full-screen practice for the tab card. Atril's own full-window layout works everywhere (iPhone Safari
 * included); where the browser allows it, the card also goes native full screen to hide the browser's
 * bars, and the screen is kept awake while practising.
 */
export function useFocusMode(player: PlayerController | null, card: RefObject<HTMLElement | null>) {
  const focus = usePlayerState(player)?.focus ?? false;
  const wakeLock = useRef<WakeLockSentinelLike | null>(null);

  const lockScreen = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } };
      wakeLock.current = (await nav.wakeLock?.request('screen')) ?? null;
    } catch {
      /* not allowed here: the screen may dim, nothing else changes */
    }
  }, []);

  const enter = useCallback(() => {
    if (!player) return;
    player.setFocus(true);
    card.current?.requestFullscreen?.().catch(() => undefined);
    void lockScreen();
  }, [player, card, lockScreen]);

  const exit = useCallback(() => {
    player?.setFocus(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
  }, [player]);

  useEffect(() => {
    if (!focus) return;
    document.documentElement.classList.add('focus-mode');
    // Leaving native full screen (Esc, the system back gesture) also leaves focus mode.
    const onFullscreen = () => {
      if (!document.fullscreenElement) exit();
    };
    // Without native full screen (iPhone), Escape still works on a keyboard.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) exit();
    };
    // The browser drops the wake lock when the tab is hidden; take it again on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void lockScreen();
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.documentElement.classList.remove('focus-mode');
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [focus, exit, lockScreen]);

  return { focus, enter, exit };
}
