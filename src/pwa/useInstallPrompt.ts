import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** The browser's install offer (Chromium). Null where the browser has its own menu, like Safari. */
export function useInstallPrompt() {
  const [offer, setOffer] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const keep = (e: Event) => {
      e.preventDefault();
      setOffer(e as BeforeInstallPromptEvent);
    };
    const installed = () => setOffer(null);
    window.addEventListener('beforeinstallprompt', keep);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', keep);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  if (!offer) return null;
  return async () => {
    await offer.prompt();
    await offer.userChoice;
    setOffer(null);
  };
}
