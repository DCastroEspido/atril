import { useMemo, type KeyboardEvent, type MouseEvent } from 'react';
import { usePlayer, usePlayerState, usePosition } from './PlayerContext';
import { barDensity, sectionsOf } from './scoreNav';

/**
 * The song as a strip of bars, each as tall as it is busy. Shows what has played,
 * the loop and where sections start; click or use the arrow keys to jump to a bar.
 */
export function Timeline() {
  const player = usePlayer();
  const { score, range } = usePlayerState(player)!;
  const { bar } = usePosition(player);
  const density = useMemo(() => (score ? barDensity(score) : []), [score]);
  const starts = useMemo(() => new Set(score ? sectionsOf(score).map((s) => s.from) : []), [score]);
  const peak = Math.max(1, ...density);
  const count = density.length;
  if (!count) return <div className="timeline" />;

  const jump = (n: number) => player.seekToBar(Math.min(count, Math.max(1, n)));
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    jump(Math.floor(((e.clientX - box.left) / box.width) * count) + 1);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) jump(bar + step);
    else if (e.key === 'Home') jump(1);
    else if (e.key === 'End') jump(count);
    else return;
    e.preventDefault();
  };

  return (
    <div
      className="timeline"
      role="slider"
      tabIndex={0}
      aria-label="Compás"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={bar}
      aria-valuetext={`Compás ${bar} de ${count}`}
      onClick={onClick}
      onKeyDown={onKey}
    >
      {density.map((d, i) => {
        const n = i + 1;
        const state = n < bar ? 'played' : n === bar ? 'now' : undefined;
        const looped = range && n >= range.from && n <= range.to;
        return (
          <span
            key={i}
            className="tick"
            data-state={state}
            data-loop={looped || undefined}
            data-section={starts.has(n) || undefined}
            style={{ height: `${18 + (d / peak) * 82}%` }}
          />
        );
      })}
    </div>
  );
}
