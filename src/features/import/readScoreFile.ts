import { importer, Settings } from '@coderline/alphatab';
import type { StoredScore } from '../../storage/scoreFiles';

export const ACCEPTED_FILES = '.gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.xml,.mxl';

/** Reads a Guitar Pro or MusicXML file and checks alphaTab can open it before it is stored. */
export async function readScoreFile(file: File): Promise<StoredScore> {
  const bytes = await file.arrayBuffer();
  const score = importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(bytes), new Settings());
  return {
    id: `file-${Date.now().toString(36)}`,
    title: score.title || file.name.replace(/\.[^.]+$/, ''),
    artist: score.artist || '',
    fileName: file.name,
    addedAt: Date.now(),
    bytes,
  };
}
