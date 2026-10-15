-- A request stops being pending once its author is no longer basic (an admin may promote them from the
-- user list instead of approving): close those, and only list requests whose author is still basic.
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
    where r.status = 'pending' and p.role = 'basic'
    order by r.created_at;
end;
$$;

create function private.close_requests_on_promotion() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.role = 'basic' and new.role <> 'basic' then
    update public.advanced_requests
    set status = 'approved', decided_at = now(), decided_by = auth.uid()
    where user_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger profiles_close_requests
after update of role on public.profiles
for each row execute function private.close_requests_on_promotion();
