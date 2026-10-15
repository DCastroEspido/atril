-- Fixes from the Supabase security and performance advisors. Same rules, smaller API surface:
--   * Role helpers and trigger functions move to a "private" schema that the REST API does not expose,
--     so nobody can call them as /rpc/... (policies keep working: they refer to functions by id).
--   * The admin RPCs are callable only by signed-in users (they still check for admin inside).
--   * Vote tallies no longer come from a security-definer view: the view runs as the caller and reads a
--     private function that returns only counts, never who voted.
--   * Policies wrap auth.uid() in a sub-select so Postgres evaluates it once per query, not per row.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------- helpers and triggers out of the API

alter function public.my_role() set schema private;
alter function public.is_admin() set schema private;
alter function public.can_publish() set schema private;
alter function public.handle_new_user() set schema private;
alter function public.songs_set_uploader() set schema private;
alter function public.guard_role_change() set schema private;

-- Bodies that named the helpers by their old schema.
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(private.my_role() = 'admin', false) $$;

create or replace function private.can_publish() returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(private.my_role() in ('advanced', 'admin'), false) $$;

create or replace function private.guard_role_change() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin')
     and coalesce(auth.role(), '') <> 'service_role'
     and not private.is_admin() then
    raise exception 'Solo un administrador puede cambiar el tipo de usuario';
  end if;
  return new;
end;
$$;

create or replace function public.list_advanced_requests()
returns table (id uuid, user_id uuid, display_name text, email text, message text, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not private.is_admin() then
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

create or replace function public.decide_advanced_request(request_id uuid, approve boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  requester uuid;
begin
  if not private.is_admin() then
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

-- Admin RPCs: signed-in users only.
revoke execute on function public.list_advanced_requests() from public, anon;
revoke execute on function public.decide_advanced_request(uuid, boolean) from public, anon;
grant execute on function public.list_advanced_requests() to authenticated;
grant execute on function public.decide_advanced_request(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------- vote tallies

create function private.song_tallies()
returns table (song_id text, up integer, down integer)
language sql stable security definer set search_path = public
as $$
  select song_id,
         count(*) filter (where value = 1)::integer,
         count(*) filter (where value = -1)::integer
  from public.votes
  group by song_id
$$;

drop view public.song_scores;
create view public.song_scores with (security_invoker = true) as
select song_id, up, down from private.song_tallies();
grant select on public.song_scores to anon, authenticated;

-- ---------------------------------------------------------------- policies: auth.uid() once per query

drop policy "profiles: see own, admins see all" on public.profiles;
create policy "profiles: see own, admins see all" on public.profiles
for select using (id = (select auth.uid()) or private.is_admin());

drop policy "profiles: edit own" on public.profiles;
create policy "profiles: edit own" on public.profiles
for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "songs: anyone reads published; owners and admins read all" on public.songs;
create policy "songs: anyone reads published; owners and admins read all" on public.songs
for select using (status = 'published' or uploaded_by = (select auth.uid()) or private.is_admin());

drop policy "songs: owners and admins edit" on public.songs;
create policy "songs: owners and admins edit" on public.songs
for update using (uploaded_by = (select auth.uid()) or private.is_admin())
with check (uploaded_by = (select auth.uid()) or private.is_admin());

drop policy "songs: owners and admins delete" on public.songs;
create policy "songs: owners and admins delete" on public.songs
for delete using (uploaded_by = (select auth.uid()) or private.is_admin());

drop policy "favorites: own only" on public.favorites;
create policy "favorites: own only" on public.favorites
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "votes: own only" on public.votes;
create policy "votes: own only" on public.votes
for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "requests: basic users ask for themselves" on public.advanced_requests;
create policy "requests: basic users ask for themselves" on public.advanced_requests
for insert with check (user_id = (select auth.uid()) and status = 'pending' and private.my_role() = 'basic');

drop policy "requests: see own, admins see all" on public.advanced_requests;
create policy "requests: see own, admins see all" on public.advanced_requests
for select using (user_id = (select auth.uid()) or private.is_admin());
