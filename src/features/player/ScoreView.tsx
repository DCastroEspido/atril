import { useEffect, useRef } from 'react';
import { PlayerController } from './controller';
import { usePlayerState } from './PlayerContext';

interface Props {
  player: PlayerController | null;
  onPlayer: (player: PlayerController | null) => void;
}

/** The paper the score is drawn on. Owns the alphaTab instance for its lifetime. */
export function ScoreView({ player, onPlayer }: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const state = usePlayerState(player);

  useEffect(() => {
    const controller = new PlayerController(surface.current!, scroll.current!);
    onPlayer(controller);
    return () => {
      onPlayer(null);
      controller.destroy();
    };
  }, [onPlayer]);

  const message = state?.error ?? (state?.rendering !== false ? 'Preparando partitura…' : null);
  return (
    <div className="desk">
      <div className="score-scroll" ref={scroll}>
        <div className="at-surface" ref={surface} />
        {message && <div className="score-msg">{message}</div>}
      </div>
    </div>
  );
}
