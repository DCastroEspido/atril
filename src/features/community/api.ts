import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdvancedRequest, PrivateSong, Profile, Role, Score, SharedSong, UserRow } from './types';

/** Thin, typed calls to the community backend. Every rule is enforced server-side by RLS. */

const SONG_FIELDS =
  'id,title,artist,genre,level,key,time_label,tempo,tags,file_path,file_name,uploaded_by,uploader_name,status,created_at';

export async function fetchProfile(db: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await db
    .from('profiles')
    .select('id,display_name,role,avatar_url,bio')
    .eq('id', userId)
    .maybeSingle();
  return data as Profile | null;
}

export class NickTakenError extends Error {}

export async function updateProfile(
  db: SupabaseClient,
  userId: string,
  patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url'>>,
) {
  const { error } = await db.from('profiles').update(patch).eq('id', userId);
  if (error?.code === '23505') throw new NickTakenError();
  if (error) throw error;
}

/** Square-crops and shrinks a picture to 256 px WebP before upload, so avatars stay tiny. */
async function squareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
}

/** Uploads a new avatar, points the profile at it and removes the previous file. Returns the new URL. */
export async function setAvatar(db: SupabaseClient, profile: Profile, file: File): Promise<string> {
  const blob = await squareAvatar(file);
  const path = `${profile.id}/avatar-${Date.now()}.webp`;
  const up = await db.storage
    .from('avatars')
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
  if (up.error) throw up.error;
  const url = db.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  await updateProfile(db, profile.id, { avatar_url: url });
  await removeAvatarFile(db, profile.avatar_url);
  return url;
}

export async function clearAvatar(db: SupabaseClient, profile: Profile) {
  await updateProfile(db, profile.id, { avatar_url: null });
  await removeAvatarFile(db, profile.avatar_url);
}

async function removeAvatarFile(db: SupabaseClient, url: string | null) {
  const path = url?.split('/storage/v1/object/public/avatars/')[1];
  if (path) await db.storage.from('avatars').remove([decodeURIComponent(path)]);
}

/** Published songs for everyone; also the caller's own hidden ones, and all of them for admins. */
export async function listSharedSongs(db: SupabaseClient): Promise<SharedSong[]> {
  const { data, error } = await db.from('songs').select(SONG_FIELDS).order('created_at', { ascending: false });
  if (error) throw error;
  return data as SharedSong[];
}

export const fileUrl = (db: SupabaseClient, path: string) => db.storage.from('tabs').getPublicUrl(path).data.publicUrl;

/** A storage-safe version of a file name, keeping its extension (the bucket policies check it). */
const safeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[^\w.-]+/g, '-')
    .slice(-80);

export async function publishSong(
  db: SupabaseClient,
  userId: string,
  file: { bytes: ArrayBuffer; name: string },
  meta: Pick<SharedSong, 'title' | 'artist' | 'genre' | 'level' | 'key' | 'time_label' | 'tempo' | 'tags'>,
): Promise<SharedSong> {
  const path = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;
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

// ---------------------------------------------------------------- private songs

const PRIVATE_FIELDS = 'id,title,artist,file_name,file_path,created_at';

export async function listPrivateSongs(db: SupabaseClient): Promise<PrivateSong[]> {
  const { data, error } = await db
    .from('private_songs')
    .select(PRIVATE_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as PrivateSong[];
}

/** Uploads an imported file to the owner's private folder and records it, keeping the browser's id. */
export async function savePrivateSong(
  db: SupabaseClient,
  userId: string,
  score: { id: string; title: string; artist: string; fileName: string; bytes: ArrayBuffer },
): Promise<PrivateSong> {
  const path = `${userId}/${crypto.randomUUID()}-${safeName(score.fileName)}`;
  const upload = await db.storage
    .from('private-tabs')
    .upload(path, new Blob([score.bytes]), { contentType: 'application/octet-stream' });
  if (upload.error) throw upload.error;
  const { data, error } = await db
    .from('private_songs')
    .insert({
      id: score.id,
      title: score.title.slice(0, 200),
      artist: score.artist.slice(0, 200),
      file_name: score.fileName.slice(0, 200),
      file_path: path,
    })
    .select(PRIVATE_FIELDS)
    .single();
  if (error) {
    await db.storage.from('private-tabs').remove([path]);
    throw error;
  }
  return data as PrivateSong;
}

export async function downloadPrivateSong(db: SupabaseClient, song: PrivateSong): Promise<ArrayBuffer> {
  const { data, error } = await db.storage.from('private-tabs').download(song.file_path);
  if (error) throw error;
  return data.arrayBuffer();
}

export async function deletePrivateSong(db: SupabaseClient, song: PrivateSong) {
  const { error } = await db.from('private_songs').delete().eq('id', song.id);
  if (error) throw error;
  await db.storage.from('private-tabs').remove([song.file_path]);
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

export async function listUsers(db: SupabaseClient): Promise<UserRow[]> {
  const { data, error } = await db.rpc('list_users');
  if (error) throw error;
  return data as UserRow[];
}

export async function setUserRole(db: SupabaseClient, userId: string, role: Role) {
  const { error } = await db.from('profiles').update({ role }).eq('id', userId);
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
