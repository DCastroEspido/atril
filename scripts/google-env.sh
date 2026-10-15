#!/bin/sh
# Runs a command (usually `supabase config push`) with the Google OAuth client in its environment.
# The file is created by the owner in their own terminal and never committed:
#   ~/.config/atril-google-oauth.env
#     SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
#     SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
set -e
FILE="${ATRIL_GOOGLE_ENV:-$HOME/.config/atril-google-oauth.env}"
[ -r "$FILE" ] || { echo "Falta $FILE con el ID y el secreto de Google." >&2; exit 1; }
set -a
. "$FILE"
set +a
exec "$@"
