-- "Mis canciones privadas": files a person imports while signed in, kept in their account so they
-- show up on every device. Only the owner sees them: not other users, not admins, not anonymous visitors.

create table public.private_songs (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- The id the browser gave the file when it was imported, so favourites keep pointing at it.
  id text not null check (char_length(id) between 1 and 80),
  title text not null check (char_length(title) between 1 and 200),
  artist text not null default '' check (char_length(artist) <= 200),
  file_name text not null check (char_length(file_name) <= 200),
  file_path text not null unique check (char_length(file_path) <= 300),
  created_at timestamptz not null default now(),
  primary key (owner, id)
);

alter table public.private_songs enable row level security;

create policy "private songs: owner reads" on public.private_songs
for select to authenticated using (owner = (select auth.uid()));

-- Up to 300 songs each, so the bucket cannot be used as free storage.
create policy "private songs: owner adds, up to 300" on public.private_songs
for insert to authenticated
with check (
  owner = (select auth.uid())
  and (select count(*) from public.private_songs p where p.owner = (select auth.uid())) < 300
);

create policy "private songs: owner renames" on public.private_songs
for update to authenticated
using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

create policy "private songs: owner deletes" on public.private_songs
for delete to authenticated using (owner = (select auth.uid()));

-- ---------------------------------------------------------------- files, in a private bucket

insert into storage.buckets (id, name, public, file_size_limit)
values ('private-tabs', 'private-tabs', false, 5242880);

-- Files live under <owner id>/..., with a Guitar Pro or MusicXML extension.
create policy "private-tabs: owner reads" on storage.objects
for select to authenticated
using (bucket_id = 'private-tabs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "private-tabs: owner uploads" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'private-tabs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('gp', 'gp3', 'gp4', 'gp5', 'gpx', 'xml', 'musicxml', 'mxl')
);

create policy "private-tabs: owner deletes" on storage.objects
for delete to authenticated
using (bucket_id = 'private-tabs' and (storage.foldername(name))[1] = (select auth.uid())::text);
