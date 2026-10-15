-- Atril community library.
--
-- Who can do what (enforced here with row level security, not in the app):
--   anyone          read published songs and vote counts
--   basic user      + own favourites, own votes, ask to become advanced
--   advanced user   + publish songs (row + file in the "tabs" bucket)
--   admin           + approve or reject requests, hide or delete any song
--
-- The first admin is set by hand after signing up:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = '...');

create type public.user_role as enum ('basic', 'advanced', 'admin');

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  role public.user_role not null default 'basic',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Role helpers. Security definer so policies can read the caller's role without recursing into RLS.
create function public.my_role() returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.my_role() = 'admin', false) $$;

create function public.can_publish() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.my_role() in ('advanced', 'admin'), false) $$;

-- Every new account gets a basic profile named after its e-mail.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(split_part(new.email, '@', 1), ''), 60));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Only admins (or SQL run by the database owner) may change a role; users can rename themselves.
-- Runs as the caller (not security definer), so current_user tells API requests from owner SQL.
create function public.guard_role_change() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin')
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar el tipo de usuario';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
before update on public.profiles
for each row execute function public.guard_role_change();

create policy "profiles: see own, admins see all" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles: edit own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------- songs

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  artist text not null default '' check (char_length(artist) <= 120),
  genre text not null check (char_length(genre) between 1 and 40),
  level text not null check (level in ('Principiante', 'Intermedio', 'Avanzado')),
  key text not null default '' check (char_length(key) <= 40),
  time_label text not null default '' check (char_length(time_label) <= 40),
  tempo integer check (tempo between 20 and 400),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  file_path text not null unique check (char_length(file_path) <= 300),
  file_name text not null check (char_length(file_name) <= 200),
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  uploader_name text not null default '',
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;

-- The uploader's name is copied in, so the public list never needs to read profiles.
create function public.songs_set_uploader() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.uploaded_by := auth.uid();
  new.uploader_name := coalesce((select display_name from public.profiles where id = auth.uid()), '');
  return new;
end;
$$;

create trigger songs_uploader
before insert on public.songs
for each row execute function public.songs_set_uploader();

create policy "songs: anyone reads published; owners and admins read all" on public.songs
for select using (status = 'published' or uploaded_by = auth.uid() or public.is_admin());

create policy "songs: advanced users and admins publish" on public.songs
for insert with check (public.can_publish());

create policy "songs: owners and admins edit" on public.songs
for update using (uploaded_by = auth.uid() or public.is_admin())
with check (uploaded_by = auth.uid() or public.is_admin());

create policy "songs: owners and admins delete" on public.songs
for delete using (uploaded_by = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------- favourites and votes
-- song_id is text so catalog songs ("sol-naciente") and shared songs (uuids) share one table.

create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  song_id text not null check (char_length(song_id) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

alter table public.favorites enable row level security;

create policy "favorites: own only" on public.favorites
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.votes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  song_id text not null check (char_length(song_id) <= 80),
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

alter table public.votes enable row level security;

create policy "votes: own only" on public.votes
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public tallies; the view runs as its owner so anyone can read counts but not who voted.
create view public.song_scores as
select song_id,
       count(*) filter (where value = 1)::integer as up,
       count(*) filter (where value = -1)::integer as down
from public.votes
group by song_id;

grant select on public.song_scores to anon, authenticated;

-- ---------------------------------------------------------------- requests to become advanced

create table public.advanced_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null
);

create unique index advanced_requests_one_pending on public.advanced_requests (user_id) where status = 'pending';

alter table public.advanced_requests enable row level security;

create policy "requests: basic users ask for themselves" on public.advanced_requests
for insert with check (user_id = auth.uid() and status = 'pending' and public.my_role() = 'basic');

create policy "requests: see own, admins see all" on public.advanced_requests
for select using (user_id = auth.uid() or public.is_admin());

-- Pending requests with who asked, for the admin panel.
create function public.list_advanced_requests()
returns table (id uuid, user_id uuid, display_name text, email text, message text, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo para administradores';
  end if;
  return query
    select r.id, r.user_id, p.display_name, u.email::text, r.message, r.created_at
    from public.advanced_requests r
    join public.profiles p on p.id = r.user_id
    join auth.users u on u.id = r.user_id
    where r.status = 'pending'
    order by r.created_at;
end;
$$;

-- Approve or reject in one step; approving makes the user advanced.
create function public.decide_advanced_request(request_id uuid, approve boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  requester uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo para administradores';
  end if;
  update public.advanced_requests
  set status = case when approve then 'approved' else 'rejected' end,
      decided_at = now(),
      decided_by = auth.uid()
  where id = request_id and status = 'pending'
  returning user_id into requester;
  if requester is null then
    raise exception 'Esa solicitud ya no está pendiente';
  end if;
  if approve then
    update public.profiles set role = 'advanced' where id = requester and role = 'basic';
  end if;
end;
$$;

revoke execute on function public.list_advanced_requests() from anon;
revoke execute on function public.decide_advanced_request(uuid, boolean) from anon;

-- ---------------------------------------------------------------- tab files

insert into storage.buckets (id, name, public, file_size_limit)
values ('tabs', 'tabs', true, 5242880);

-- Files live under <uploader id>/..., with a Guitar Pro or MusicXML extension.
create policy "tabs: advanced users and admins upload to their folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'tabs'
  and public.can_publish()
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('gp', 'gp3', 'gp4', 'gp5', 'gpx', 'xml', 'musicxml', 'mxl')
);

create policy "tabs: owners and admins delete" on storage.objects
for delete to authenticated
using (bucket_id = 'tabs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
