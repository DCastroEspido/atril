#!/bin/sh
# Runs a command with the staging project's URL and keys in its environment.
# The keys come from the Supabase CLI (logged in to the owner's account) and are never printed.
set -e
REF=xorkxbpswzifxfzsxmaz
KEYS=$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null)
# Classic JWT keys: the auth admin API used by the tests accepts them.
pick() { printf '%s' "$KEYS" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s).find(k=>k.name==='$1').api_key))"; }
export SUPABASE_URL="https://$REF.supabase.co"
export SUPABASE_ANON_KEY="$(pick anon)"
export SUPABASE_SERVICE_ROLE_KEY="$(pick service_role)"
exec "$@"
