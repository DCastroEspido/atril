-- The role guard runs as the caller, so the roles that manage users (dashboard, service key, auth server)
-- also need to reach the private schema.
grant usage on schema private to service_role, supabase_auth_admin;
