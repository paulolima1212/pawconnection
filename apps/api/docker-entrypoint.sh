#!/bin/sh
set -eu

# Reach Supabase/PostgreSQL on the Docker host (pooler :54321, Kong :8000).
if [ "${DOCKER_DB_HOST_REPLACE:-true}" = "true" ]; then
  export DATABASE_URL="${DATABASE_URL//localhost/host.docker.internal}"
  export SUPABASE_URL="${SUPABASE_URL//localhost/host.docker.internal}"
fi

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Starting Paw Connection API..."
exec node dist/src/main.js
