import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAccount } from '../account/AccountContext';
import { fetchMyVotes, fetchScores, vote as sendVote } from './api';
import type { Score } from './types';

/** Thumbs up/down on tabs: public tallies for everyone, voting for signed-in users. */
export function useVotes() {
  const { session } = useAccount();
  const userId = session?.user.id ?? null;
  const [scores, setScores] = useState<Record<string, Score>>({});
  // The signed-in user's votes, tagged with whose they are so a new user never sees the last one's.
  const [stored, setStored] = useState<{ user: string | null; votes: Record<string, 1 | -1> }>({
    user: null,
    votes: {},
  });
  const mine = useMemo(() => (stored.user === userId ? stored.votes : {}), [stored, userId]);
  const setMine = useCallback(
    (update: (m: Record<string, 1 | -1>) => Record<string, 1 | -1>) =>
      setStored((s) => ({ user: userId, votes: update(s.user === userId ? s.votes : {}) })),
    [userId],
  );

  useEffect(() => {
    if (!supabase) return;
    fetchScores(supabase)
      .then(setScores)
      .catch(() => undefined);
    if (userId)
      fetchMyVotes(supabase)
        .then((votes) => setStored({ user: userId, votes }))
        .catch(() => undefined);
  }, [userId]);

  /** Same vote again removes it. Updates the tallies at once and rolls back if the server refuses. */
  const vote = useCallback(
    async (songId: string, value: 1 | -1) => {
      if (!supabase || !userId) return false;
      const before = mine[songId] ?? 0;
      const next = before === value ? 0 : value;
      const bump = (s: Score | undefined, v: number, d: number): Score => {
        const base = s ?? { up: 0, down: 0 };
        return v === 1 ? { ...base, up: base.up + d } : v === -1 ? { ...base, down: base.down + d } : base;
      };
      const apply = (from: number, to: number) => {
        setMine((m) => {
          const copy = { ...m };
          if (to === 0) delete copy[songId];
          else copy[songId] = to as 1 | -1;
          return copy;
        });
        setScores((s) => ({ ...s, [songId]: bump(bump(s[songId], from, -1), to, 1) }));
      };
      apply(before, next);
      try {
        await sendVote(supabase, songId, next as 1 | -1 | 0);
      } catch {
        apply(next, before);
        return false;
      }
      return true;
    },
    [mine, userId, setMine],
  );

  return { scores, mine, vote, canVote: userId !== null };
}
