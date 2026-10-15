-- One update policy instead of two permissive ones (same rule: yourself, or an admin).
drop policy "profiles: edit own" on public.profiles;
drop policy "profiles: admins edit any" on public.profiles;
create policy "profiles: edit own, admins edit any" on public.profiles
for update using (id = (select auth.uid()) or private.is_admin())
with check (id = (select auth.uid()) or private.is_admin());
