#!/bin/bash
# Usage: ./scripts/create-user.sh "Name" "email@example.com" "password"
#
# Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
# or pass them as env vars.

set -e

NAME="$1"
EMAIL="$2"
PASSWORD="$3"

if [ -z "$NAME" ] || [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <name> <email> <password>"
  exit 1
fi

# Load from .env.local if vars not set
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2-)
fi
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2-)
fi

curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"email_confirm\":true,\"user_metadata\":{\"name\":\"${NAME}\"}}"

echo ""
echo "Done."
