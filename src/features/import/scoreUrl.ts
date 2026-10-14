/**
 * Turns a link the user pasted into one the browser may download from another site (CORS).
 * Share pages of GitHub and Dropbox become their direct-download hosts; anything else is kept.
 */
export type ScoreUrl = { ok: true; url: string; fileName: string } | { ok: false; reason: 'invalid' | 'drive' };

export function toDownloadUrl(input: string): ScoreUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, reason: 'invalid' };

  const host = url.hostname.replace(/^www\./, '');

  // Google Drive does not allow downloads from other sites.
  if (host === 'drive.google.com' || host === 'docs.google.com' || host.endsWith('.googleusercontent.com')) {
    return { ok: false, reason: 'drive' };
  }

  // github.com/<owner>/<repo>/blob|raw/<ref>/<path> -> raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>
  if (host === 'github.com') {
    const m = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(url.pathname);
    if (m) url = new URL(`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`);
  }

  // dropbox.com/... share page -> dl.dropboxusercontent.com/... file (the dl flag is not needed there)
  if (host === 'dropbox.com') {
    url.hostname = 'dl.dropboxusercontent.com';
    url.searchParams.delete('dl');
  }

  url.protocol = 'https:';
  const raw = url.pathname.split('/').filter(Boolean).pop() ?? '';
  let last = raw;
  try {
    last = decodeURIComponent(raw);
  } catch {
    /* keep the encoded name */
  }
  return { ok: true, url: url.href, fileName: last || 'partitura.gp' };
}
