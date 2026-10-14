import { createContext, useContext, useSyncExternalStore } from 'react';
import type { PlayerController, PlayerState, Position } from './controller';

export const PlayerContext = createContext<PlayerController | null>(null);

export function usePlayer(): PlayerController {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer needs a <PlayerContext> provider');
  return player;
}

const NO_STATE = null;
const noop = () => () => {};

/** Player state snapshot; re-renders when the player changes. Null until the score view has mounted. */
export function usePlayerState(player: PlayerController | null): PlayerState | null {
  return useSyncExternalStore(player?.subscribe ?? noop, player?.getState ?? (() => NO_STATE));
}

/** Playback position; kept apart because it changes many times per second. */
export function usePosition(player: PlayerController): Position {
  return useSyncExternalStore(player.subscribePosition, player.getPosition);
}
