import { describe, expect, it } from 'vitest';
import { toDownloadUrl } from './scoreUrl';

describe('toDownloadUrl', () => {
  it('turns a GitHub file page into its raw file', () => {
    expect(toDownloadUrl('https://github.com/ana/tabs/blob/main/rock/Mi%20riff.gp5')).toEqual({
      ok: true,
      url: 'https://raw.githubusercontent.com/ana/tabs/main/rock/Mi%20riff.gp5',
      fileName: 'Mi riff.gp5',
    });
    expect(toDownloadUrl('https://github.com/ana/tabs/raw/main/a.gp')).toMatchObject({
      url: 'https://raw.githubusercontent.com/ana/tabs/main/a.gp',
    });
  });

  it('turns a Dropbox share link into a direct download', () => {
    expect(toDownloadUrl('https://www.dropbox.com/scl/fi/abc123/cancion.gpx?rlkey=k9&dl=0')).toEqual({
      ok: true,
      url: 'https://dl.dropboxusercontent.com/scl/fi/abc123/cancion.gpx?rlkey=k9',
      fileName: 'cancion.gpx',
    });
  });

  it('keeps any other address as it is', () => {
    expect(toDownloadUrl('  https://example.com/files/tema.gp?v=2 ')).toEqual({
      ok: true,
      url: 'https://example.com/files/tema.gp?v=2',
      fileName: 'tema.gp',
    });
  });

  it('refuses Google Drive and anything that is not a web address', () => {
    expect(toDownloadUrl('https://drive.google.com/file/d/1abc/view')).toEqual({ ok: false, reason: 'drive' });
    expect(toDownloadUrl('tema.gp')).toEqual({ ok: false, reason: 'invalid' });
    expect(toDownloadUrl('ftp://example.com/tema.gp')).toEqual({ ok: false, reason: 'invalid' });
  });
});
