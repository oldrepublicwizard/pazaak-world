#!/bin/sh
set -eu
if [ -z "${NAKAMA_DATABASE_ADDRESS:-}" ]; then
  echo "NAKAMA_DATABASE_ADDRESS is required (Postgres DSN without postgres:// prefix), e.g." >&2
  echo "  nakama:yourpassword@postgres:5432/nakama?sslmode=disable" >&2
  exit 1
fi
/nakama/nakama migrate up --config /nakama/data/cloud.yml --database.address "$NAKAMA_DATABASE_ADDRESS"
exec /nakama/nakama --config /nakama/data/cloud.yml --database.address "$NAKAMA_DATABASE_ADDRESS"
