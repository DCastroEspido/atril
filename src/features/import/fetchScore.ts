import type { StoredScore } from '../../storage/scoreFiles';
import { scoreFromBytes } from './readScoreFile';
import { toDownloadUrl } from './scoreUrl';

/** Guitar Pro files are a few hundred KB; anything far bigger is not a tab. */
const MAX_BYTES = 20 * 1024 * 1024;

export class ScoreUrlError extends Error {}

/** Downloads a tab from a pasted link. Errors carry a message ready to show to the user. */
export async function fetchScore(link: string): Promise<StoredScore> {
  const target = toDownloadUrl(link);
  if (!target.ok) {
    throw new ScoreUrlError(
      target.reason === 'drive'
        ? 'Google Drive no deja descargar archivos desde otras webs. Descárgalo y usa «Importar Guitar Pro».'
        : 'Eso no es un enlace web. Pega una dirección que empiece por https://',
    );
  }

  let response: Response;
  try {
    response = await fetch(target.url, { credentials: 'omit', redirect: 'follow' });
  } catch {
    // The browser hides the cause; almost always the site refusing downloads from other pages (CORS).
    throw new ScoreUrlError(
      navigator.onLine
        ? 'Esa web no deja descargar archivos desde otras páginas. Descárgalo y usa «Importar Guitar Pro».'
        : 'Sin conexión. Vuelve a intentarlo cuando tengas internet.',
    );
  }
  if (!response.ok) {
    throw new ScoreUrlError(
      response.status === 404
        ? 'No hay ningún archivo en ese enlace. Comprueba que esté bien copiado y que sea público.'
        : `La web respondió con un error (${response.status}). Comprueba que el archivo sea público.`,
    );
  }
  const size = Number(response.headers.get('content-length') ?? 0);
  if (size > MAX_BYTES) throw new ScoreUrlError('Ese archivo es demasiado grande para ser una tablatura.');

  const bytes = await response.arrayBuffer();
  try {
    return scoreFromBytes(bytes, target.fileName);
  } catch {
    throw new ScoreUrlError(
      'Lo he descargado, pero no es un archivo Guitar Pro ni MusicXML. Si es una página web, busca el enlace al archivo.',
    );
  }
}
