import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdvancedRequest, Profile, Score, SharedSong } from './types';

/** Thin, typed calls to the community backend. Every rule is enforced server-side by RLS. */

const SONG_FIELDS =
  'id,title,artist,genre,level,key,time_label,tempo,tags,file_path,file_name,uploaded_by,uploader_name,status,created_at';

export async function fetchProfile(db: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await db.from('profiles').select('id,display_name,role').eq('id', userId).maybeSingle();
  return data as Profile | null;
}

export async function renameProfile(db: SupabaseClient, userId: string, displayName: string) {
  const { error } = await db
    .from('profiles')
    .update({ display_name: displayName.trim().slice(0, 60) })
    .eq('id', userId);
  if (error) throw error;
}

/** Published songs for everyone; also the caller's own hidden ones, and all of them for admins. */
export async function listSharedSongs(db: SupabaseClient): Promise<SharedSong[]> {
  const { data, error } = await db.from('songs').select(SONG_FIELDS).order('created_at', { ascending: false });
  if (error) throw error;
  return data as SharedSong[];
}

export const fileUrl = (db: SupabaseClient, path: string) => db.storage.from('tabs').getPublicUrl(path).data.publicUrl;

export async function publishSong(
  db: SupabaseClient,
  userId: string,
  file: { bytes: ArrayBuffer; name: string },
  meta: Pick<SharedSong, 'title' | 'artist' | 'genre' | 'level' | 'key' | 'time_label' | 'tempo' | 'tags'>,
): Promise<SharedSong> {
  const safe = file.name
    .normalize('NFD')
    .replace(/[^\w.-]+/g, '-')
    .slice(-80);
  const path = `${userId}/${crypto.randomUUID()}-${safe}`;
  const upload = await db.storage
    .from('tabs')
    .upload(path, new Blob([file.bytes]), { contentType: 'application/octet-stream' });
  if (upload.error) throw upload.error;
  const { data, error } = await db
    .from('songs')
    .insert({ ...meta, file_path: path, file_name: file.name })
    .select(SONG_FIELDS)
    .single();
  if (error) {
    await db.storage.from('tabs').remove([path]);
    throw error;
  }
  return data as SharedSong;
}

export async function setSongStatus(db: SupabaseClient, id: string, status: SharedSong['status']) {
  const { error } = await db.from('songs').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteSharedSong(db: SupabaseClient, song: SharedSong) {
  const { error } = await db.from('songs').delete().eq('id', song.id);
  if (error) throw error;
  await db.storage.from('tabs').remove([song.file_path]);
}

export async function fetchScores(db: SupabaseClient): Promise<Record<string, Score>> {
  const { data, error } = await db.from('song_scores').select('song_id,up,down');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.song_id, { up: r.up, down: r.down }]));
}

export async function fetchMyVotes(db: SupabaseClient): Promise<Record<string, 1 | -1>> {
  const { data, error } = await db.from('votes').select('song_id,value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.song_id, r.value]));
}

/** value 0 removes the vote. */
export async function vote(db: SupabaseClient, songId: string, value: 1 | -1 | 0) {
  const { error } =
    value === 0
      ? await db.from('votes').delete().eq('song_id', songId)
      : await db.from('votes').upsert({ song_id: songId, value });
  if (error) throw error;
}

export async function fetchFavorites(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from('favorites').select('song_id').order('created_at');
  if (error) throw error;
  return (data ?? []).map((r) => r.song_id);
}

export async function addFavorites(db: SupabaseClient, songIds: string[]) {
  if (!songIds.length) return;
  const { error } = await db.from('favorites').upsert(
    songIds.map((song_id) => ({ song_id })),
    { ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function removeFavorite(db: SupabaseClient, songId: string) {
  const { error } = await db.from('favorites').delete().eq('song_id', songId);
  if (error) throw error;
}

export async function fetchMyRequest(db: SupabaseClient) {
  const { data } = await db
    .from('advanced_requests')
    .select('id,status,created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { id: string; status: 'pending' | 'approved' | 'rejected'; created_at: string } | null;
}

export async function requestAdvanced(db: SupabaseClient, message: string) {
  const { error } = await db.from('advanced_requests').insert({ message: message.trim().slice(0, 500) });
  if (error) throw error;
}

export async function listRequests(db: SupabaseClient): Promise<AdvancedRequest[]> {
  const { data, error } = await db.rpc('list_advanced_requests');
  if (error) throw error;
  return data as AdvancedRequest[];
}

export async function decideRequest(db: SupabaseClient, requestId: string, approve: boolean) {
  const { error } = await db.rpc('decide_advanced_request', { request_id: requestId, approve });
  if (error) throw error;
}
