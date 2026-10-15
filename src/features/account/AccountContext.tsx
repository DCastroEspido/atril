import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../ui/Toast';
import { fetchProfile } from '../community/api';
import type { Profile } from '../community/types';

export interface Account {
  /** False when this build has no backend: no sign-in, no shared library. */
  enabled: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Ready to publish songs: advanced users and admins. */
  canPublish: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(null);
  // The fetched profile; only shown while it belongs to the signed-in user.
  const [stored, setStored] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) return;
    // A failed or expired sign-in link comes back with an error in the query string.
    const params = new URLSearchParams(window.location.search);
    const linkError = params.get('error_description');
    if (linkError) toast('Ese enlace para entrar ya no vale. Pide uno nuevo desde «Entrar».');
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || linkError) {
        // Drop ?code=… (or the error) from the address once Supabase has used it.
        const url = new URL(window.location.href);
        if (url.search) window.history.replaceState(null, '', url.pathname + url.hash);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [toast]);

  const userId = session?.user.id ?? null;
  const profile = stored && stored.id === userId ? stored : null;
  const refreshProfile = useCallback(async () => {
    if (!supabase || !userId) return;
    setStored(await fetchProfile(supabase, userId));
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    fetchProfile(supabase, userId).then((p) => {
      if (!cancelled) setStored(p);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setStored(null);
  }, []);

  const value = useMemo<Account>(
    () => ({
      enabled: supabase !== null,
      session,
      profile,
      canPublish: profile?.role === 'advanced' || profile?.role === 'admin',
      isAdmin: profile?.role === 'admin',
      refreshProfile,
      sendMagicLink,
      signOut,
    }),
    [session, profile, refreshProfile, sendMagicLink, signOut],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): Account {
  const account = useContext(AccountContext);
  if (!account) throw new Error('useAccount needs <AccountProvider>');
  return account;
}
