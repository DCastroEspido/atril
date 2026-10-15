import { describe, expect, it } from 'vitest';
import { hrefFor, pageFromHash } from './routes';

describe('routes', () => {
  it('maps hashes to pages and back', () => {
    expect(pageFromHash(hrefFor('library'))).toBe('library');
    expect(pageFromHash(hrefFor('practice'))).toBe('practice');
    expect(pageFromHash(hrefFor('account'))).toBe('account');
  });

  it('tolerates a trailing slash and falls back to the player', () => {
    expect(pageFromHash('#/biblioteca/')).toBe('library');
    expect(pageFromHash('')).toBe('practice');
    expect(pageFromHash('#/nada')).toBe('practice');
  });
});
