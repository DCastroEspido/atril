import { describe, expect, it } from 'vitest';
import { CATALOG } from '../../catalog';
import { searchLibrary } from './search';
import { fromCatalog, fromFile } from './types';

const entries = [
  ...CATALOG.map(fromCatalog),
  fromFile({ id: 'file-1', title: 'Mi canción', artist: '', fileName: 'mia.gp5' }),
];
const ids = (query: string, genre: string | null = null, level: string | null = null) =>
  searchLibrary(entries, { query, genre, level }).map((e) => e.id);

describe('searchLibrary', () => {
  it('returns everything for an empty query', () => {
    expect(ids('')).toHaveLength(entries.length);
  });

  it('ignores accents and case', () => {
    expect(ids('ODA ALEGRIA')).toEqual(['oda-alegria']);
    expect(ids('cancion')).toEqual(['file-1']);
  });

  it('matches tags and requires every word', () => {
    expect(ids('palm mute')).toEqual(['blues-la', 'rock-mi']);
    expect(ids('palm mute shuffle')).toEqual(['blues-la']);
  });

  it('filters by genre and level', () => {
    expect(ids('', 'Rock')).toEqual(['rock-mi']);
    expect(ids('', 'Clásica', 'Principiante')).toEqual(['oda-alegria']);
    expect(ids('', 'Mis archivos')).toEqual(['file-1']);
  });
});
