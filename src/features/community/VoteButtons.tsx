import { ThumbDownIcon, ThumbUpIcon } from '../../ui/icons';
import type { Score } from './types';

interface Props {
  songId: string;
  score: Score | undefined;
  mine: 1 | -1 | undefined;
  canVote: boolean;
  onVote: (songId: string, value: 1 | -1) => void;
  /** Called instead of voting when nobody is signed in. */
  onNeedAccount: () => void;
  compact?: boolean;
}

/** «¿Es buena esta tablatura?» Thumbs up or down with the public tally. */
export function VoteButtons({ songId, score, mine, canVote, onVote, onNeedAccount, compact }: Props) {
  const click = (value: 1 | -1) => (canVote ? onVote(songId, value) : onNeedAccount());
  return (
    <div className={`votes${compact ? ' compact' : ''}`} role="group" aria-label="¿Es buena esta tablatura?">
      <button
        className="vote-btn"
        aria-pressed={mine === 1}
        title={canVote ? 'La tablatura está bien' : 'Entra para votar'}
        onClick={() => click(1)}
      >
        <ThumbUpIcon />
        <span>{score?.up ?? 0}</span>
      </button>
      <button
        className="vote-btn down"
        aria-pressed={mine === -1}
        title={canVote ? 'La tablatura tiene errores' : 'Entra para votar'}
        onClick={() => click(-1)}
      >
        <ThumbDownIcon />
        <span>{score?.down ?? 0}</span>
      </button>
    </div>
  );
}
