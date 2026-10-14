import { describe, expect, it } from 'vitest';
import { ONLINE_SOURCES } from './onlineSources';

describe('ONLINE_SOURCES', () => {
  it('puts the trimmed, encoded query in every search URL', () => {
    for (const source of ONLINE_SOURCES) {
      const url = new URL(source.url('  Entre dos aguas & más '));
      expect(url.protocol, source.name).toBe('https:');
      expect([...url.searchParams.values()], source.name).toContain('Entre dos aguas & más');
    }
  });
});
