import { importer, Settings } from '@coderline/alphatab';
import type { StoredScore } from '../../storage/scoreFiles';

export const ACCEPTED_FILES = '.gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.xml,.mxl';

/** Checks alphaTab can open the bytes and builds the record to store. Throws when it cannot. */
export function scoreFromBytes(bytes: ArrayBuffer, fileName: string): StoredScore {
  const score = importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(bytes), new Settings());
  return {
    id: `file-${Date.now().toString(36)}`,
    title: score.title || fileName.replace(/\.[^.]+$/, ''),
    artist: score.artist || '',
    fileName,
    addedAt: Date.now(),
    bytes,
  };
}

/** Reads a Guitar Pro or MusicXML file chosen or dropped by the user. */
export async function readScoreFile(file: File): Promise<StoredScore> {
  return scoreFromBytes(await file.arrayBuffer(), file.name);
}

/** What a file says about itself, to prefill the publish form. */
export function scoreMeta(bytes: ArrayBuffer) {
  const score = importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(bytes), new Settings());
  const first = score.masterBars[0];
  return {
    title: score.title,
    artist: score.artist,
    tempo: score.tempo,
    timeLabel: first ? `${first.timeSignatureNumerator}/${first.timeSignatureDenominator}` : '',
  };
}
