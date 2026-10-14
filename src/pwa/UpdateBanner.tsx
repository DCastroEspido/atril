import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '../ui/Toast';

/** Tells the user when Atril works offline, and offers new versions instead of swapping them mid-song. */
export function UpdateBanner() {
  const toast = useToast();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    toast('Atril ya funciona sin conexión');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, toast]);

  if (!needRefresh) return null;
  return (
    <div className="update" role="alert">
      <span>Hay una versión nueva de Atril.</span>
      <button className="btn mini primary" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </button>
      <button className="btn mini" onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
    </div>
  );
}
