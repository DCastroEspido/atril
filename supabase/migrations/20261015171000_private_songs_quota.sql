-- The quota in the insert policy read private_songs under its own RLS, which Postgres rejects as recursion.
-- Count through a helper that bypasses RLS instead (it only ever counts the caller's rows).

create function private.my_private_song_count() returns bigint
language sql stable security definer set search_path = public
as $$ select count(*) from public.private_songs where owner = auth.uid() $$;

drop policy "private songs: owner adds, up to 300" on public.private_songs;
create policy "private songs: owner adds, up to 300" on public.private_songs
for insert to authenticated
with check (owner = (select auth.uid()) and (select private.my_private_song_count()) < 300);
