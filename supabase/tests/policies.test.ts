/**
 * Row level security of the community library, checked against a real Supabase project.
 * `npm run test:db` runs it on Atril Staging (keys from the Supabase CLI). Not part of `npm run check`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Fallbacks are the well-known keys of a local `supabase start` stack; scripts/staging-env.sh sets the real ones.
const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(URL, SERVICE, opts);
const anon = createClient(URL, ANON, opts);
const run = Date.now().toString(36);
const users: Record<'basic' | 'advanced' | 'admin', { id: string; client: SupabaseClient }> = {} as never;

async function makeUser(kind: 'basic' | 'advanced' | 'admin') {
  const email = `${kind}-${run}@atril.test`;
  const password = 'contraseña-de-prueba';
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  if (kind !== 'basic') await service.from('profiles').update({ role: kind }).eq('id', data.user.id).throwOnError();
  const client = createClient(URL, ANON, opts);
  await client.auth.signInWithPassword({ email, password });
  users[kind] = { id: data.user.id, client };
}

const gp = new Blob([new Uint8Array([80, 75, 3, 4, 1, 2, 3])], { type: 'application/octet-stream' });
const song = (path: string) => ({
  title: `Prueba ${run}`,
  genre: 'Rock',
  level: 'Intermedio',
  file_path: path,
  file_name: 'prueba.gp',
});

beforeAll(async () => {
  await makeUser('basic');
  await makeUser('advanced');
  await makeUser('admin');
});

afterAll(async () => {
  const { data } = await service.storage.from('tabs').list(users.advanced.id);
  if (data?.length) await service.storage.from('tabs').remove(data.map((f) => `${users.advanced.id}/${f.name}`));
  await service.from('songs').delete().like('title', `%${run}%`);
  for (const u of Object.values(users)) await service.auth.admin.deleteUser(u.id);
});

describe('anyone', () => {
  it('cannot publish, and sees public profiles without e-mails', async () => {
    const { error } = await anon.from('songs').insert(song(`x/${run}.gp`));
    expect(error).not.toBeNull();
    const { data } = await anon.from('profiles').select('*').eq('id', users.basic.id).single();
    expect(data?.display_name).toBeTruthy();
    expect(data).not.toHaveProperty('email');
    const { data: changed } = await anon
      .from('profiles')
      .update({ display_name: 'hack' })
      .eq('id', users.basic.id)
      .select();
    expect(changed).toEqual([]);
  });

  it('cannot call admin or internal functions', async () => {
    expect((await anon.rpc('list_advanced_requests')).error).not.toBeNull();
    expect(
      (await anon.rpc('decide_advanced_request', { request_id: crypto.randomUUID(), approve: true })).error,
    ).not.toBeNull();
    expect((await anon.rpc('is_admin')).error).not.toBeNull();
  });

  it('reads vote tallies', async () => {
    const { error } = await anon.from('song_scores').select();
    expect(error).toBeNull();
  });
});

describe('basic user', () => {
  it('starts as basic with a neutral nick, can rename but not promote themselves', async () => {
    const c = users.basic.client;
    const { data } = await c.from('profiles').select('role,display_name').eq('id', users.basic.id).single();
    expect(data?.role).toBe('basic');
    expect(data?.display_name).toMatch(/^musico-/);
    expect(
      (
        await c
          .from('profiles')
          .update({ display_name: `Ana ${run}`, bio: 'Toco rumba' })
          .eq('id', users.basic.id)
      ).error,
    ).toBeNull();
    expect((await c.from('profiles').update({ role: 'admin' }).eq('id', users.basic.id)).error).not.toBeNull();
  });

  it('cannot take a nick someone already has, or edit other profiles', async () => {
    const taken = await users.advanced.client
      .from('profiles')
      .update({ display_name: `ANA ${run}` })
      .eq('id', users.advanced.id);
    expect(taken.error?.code).toBe('23505');
    const { data } = await users.basic.client
      .from('profiles')
      .update({ bio: 'x' })
      .eq('id', users.advanced.id)
      .select();
    expect(data).toEqual([]);
  });

  it('cannot publish songs or upload files', async () => {
    const c = users.basic.client;
    expect((await c.from('songs').insert(song(`${users.basic.id}/${run}.gp`))).error).not.toBeNull();
    expect((await c.storage.from('tabs').upload(`${users.basic.id}/${run}.gp`, gp)).error).not.toBeNull();
  });

  it('keeps favourites and one vote per song', async () => {
    const c = users.basic.client;
    expect((await c.from('favorites').insert({ song_id: 'sol-naciente' })).error).toBeNull();
    expect((await c.from('votes').upsert({ song_id: 'sol-naciente', value: 1 })).error).toBeNull();
    expect((await c.from('votes').upsert({ song_id: 'sol-naciente', value: -1 })).error).toBeNull();
    const { data } = await c.from('votes').select('value').eq('song_id', 'sol-naciente');
    expect(data).toEqual([{ value: -1 }]);
    // Other users' favourites stay private.
    const { data: theirs } = await users.advanced.client.from('favorites').select().eq('user_id', users.basic.id);
    expect(theirs).toEqual([]);
  });

  it('asks once to become advanced and cannot read the admin list', async () => {
    const c = users.basic.client;
    expect((await c.from('advanced_requests').insert({ message: 'Toco la guitarra' })).error).toBeNull();
    expect((await c.from('advanced_requests').insert({ message: 'otra vez' })).error).not.toBeNull();
    expect((await c.rpc('list_advanced_requests')).error).not.toBeNull();
  });
});

describe('advanced user', () => {
  let songId = '';

  it('uploads only Guitar Pro / MusicXML files into their own folder', async () => {
    const c = users.advanced.client;
    expect((await c.storage.from('tabs').upload(`${users.advanced.id}/${run}.gp`, gp)).error).toBeNull();
    expect((await c.storage.from('tabs').upload(`${users.basic.id}/${run}.gp`, gp)).error).not.toBeNull();
    expect((await c.storage.from('tabs').upload(`${users.advanced.id}/${run}.exe`, gp)).error).not.toBeNull();
  });

  it('publishes a song that everyone can see, signed with their nick', async () => {
    const c = users.advanced.client;
    const { data, error } = await c
      .from('songs')
      .insert({ ...song(`${users.advanced.id}/${run}.gp`), uploaded_by: users.basic.id })
      .select()
      .single();
    expect(error).toBeNull();
    songId = data!.id;
    expect(data!.uploaded_by).toBe(users.advanced.id);
    const { data: seen } = await anon.from('songs').select('id').eq('id', songId);
    expect(seen).toHaveLength(1);
  });

  it('renaming updates the nick on songs already shared', async () => {
    await users.advanced.client
      .from('profiles')
      .update({ display_name: `Lucía ${run}` })
      .eq('id', users.advanced.id);
    const { data } = await anon.from('songs').select('uploader_name').eq('id', songId).single();
    expect(data?.uploader_name).toBe(`Lucía ${run}`);
  });

  it("cannot change another user's song", async () => {
    const { data } = await users.basic.client.from('songs').update({ title: 'Mía' }).eq('id', songId).select();
    expect(data).toEqual([]);
  });

  it('hidden songs disappear for everyone else', async () => {
    expect((await users.admin.client.from('songs').update({ status: 'hidden' }).eq('id', songId)).error).toBeNull();
    const { data } = await anon.from('songs').select('id').eq('id', songId);
    expect(data).toEqual([]);
    const { data: own } = await users.advanced.client.from('songs').select('id').eq('id', songId);
    expect(own).toHaveLength(1);
  });
});

describe('admin', () => {
  it('lists users with e-mails, which nobody else can', async () => {
    const { data, error } = await users.admin.client.rpc('list_users');
    expect(error).toBeNull();
    expect(data!.some((u: { email: string }) => u.email === `advanced-${run}@atril.test`)).toBe(true);
    expect((await users.basic.client.rpc('list_users')).error).not.toBeNull();
    expect((await anon.rpc('list_users')).error).not.toBeNull();
  });

  it('sees pending requests with who asked, and approving makes them advanced', async () => {
    const a = users.admin.client;
    const { data, error } = await a.rpc('list_advanced_requests');
    expect(error).toBeNull();
    const mine = data!.find((r: { user_id: string }) => r.user_id === users.basic.id);
    expect(mine?.email).toBe(`basic-${run}@atril.test`);
    expect(mine?.message).toBe('Toco la guitarra');
    expect((await a.rpc('decide_advanced_request', { request_id: mine.id, approve: true })).error).toBeNull();
    const { data: profile } = await users.basic.client
      .from('profiles')
      .select('role')
      .eq('id', users.basic.id)
      .single();
    expect(profile?.role).toBe('advanced');
    // Deciding twice fails.
    expect((await a.rpc('decide_advanced_request', { request_id: mine.id, approve: false })).error).not.toBeNull();
  });
});
