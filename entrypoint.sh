#!/bin/sh

set -e

echo "Waiting for database..."
max_retries=30
count=0
until pg_isready -h db -p 5432; do
  count=$((count + 1))

  if [ "$count" -ge "$max_retries" ]; then
    echo "Database connection timeout"
    exit 1
  fi

  sleep 1
done
echo "Database ready"

echo "Running Prisma migrations..."
pnpm prisma migrate deploy
if [ "$RUN_SEED" = "true" ]; then
  echo "Filling database basic data..."
  node dist/prisma/seed.js
fi

echo "Starting app..."
exec node dist/src/main.js