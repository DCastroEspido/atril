import { useEffect, useRef } from 'react';

interface LaunchParams {
  files: { getFile(): Promise<File> }[];
}
declare global {
  interface Window {
    launchQueue?: { setConsumer(consumer: (params: LaunchParams) => void): void };
  }
}

/**
 * Calls `onFile` for files dropped on the window and, in an installed app on Chromium,
 * for files opened with Atril from the operating system (manifest file_handlers).
 */
export function useFileArrivals(onFile: (file: File) => void) {
  const handler = useRef(onFile);
  useEffect(() => {
    handler.current = onFile;
  });

  useEffect(() => {
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file) handler.current(file);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    window.launchQueue?.setConsumer(async ({ files }) => {
      for (const f of files) handler.current(await f.getFile());
    });
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, []);
}
