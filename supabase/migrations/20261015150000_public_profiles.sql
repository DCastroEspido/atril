-- Public profiles: nick, avatar and a short bio, shown on the songs each person shares.
-- The e-mail never lives here (it stays in auth.users), so every column of profiles is safe to show.

alter table public.profiles
  add column avatar_url text check (char_length(avatar_url) <= 500),
  add column bio text not null default '' check (char_length(bio) <= 280);

-- Nicks are unique regardless of case, so nobody can pass for someone else.
create unique index profiles_display_name_unique on public.profiles (lower(display_name)) where display_name <> '';

-- New accounts get a neutral nick instead of the start of their e-mail address.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'musico-' || substr(replace(new.id::text, '-', ''), 1, 6));
  return new;
end;
$$;

-- Anyone can see profiles; people edit their own; admins can change anyone's (the role guard still applies).
drop policy "profiles: see own, admins see all" on public.profiles;
create policy "profiles: anyone reads" on public.profiles for select using (true);

create policy "profiles: admins edit any" on public.profiles
for update using (private.is_admin()) with check (private.is_admin());

-- Shared songs show the uploader's current nick.
create function private.sync_uploader_name() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name then
    update public.songs set uploader_name = new.display_name where uploaded_by = new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_sync_uploader_name
after update of display_name on public.profiles
for each row execute function private.sync_uploader_name();

-- Everyone with an account, for the admin panel.
create function public.list_users()
returns table (id uuid, display_name text, avatar_url text, role public.user_role, email text, created_at timestamptz, songs bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo para administradores';
  end if;
  return query
    select p.id, p.display_name, p.avatar_url, p.role, u.email::text, p.created_at,
           (select count(*) from public.songs s where s.uploaded_by = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

revoke execute on function public.list_users() from public, anon;
grant execute on function public.list_users() to authenticated;

-- ---------------------------------------------------------------- avatar images

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp']);

create policy "avatars: upload to own folder" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: replace own" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: delete own" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
