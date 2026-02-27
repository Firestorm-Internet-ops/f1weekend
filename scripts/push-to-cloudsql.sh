#!/usr/bin/env bash
# push-to-cloudsql.sh
#
# Dumps local pitlane MySQL database and imports it into Google Cloud SQL.
# Runs cloud-sql-proxy on localhost:3307 to avoid conflict with local MySQL on 3306.
#
# Prerequisites:
#   - cloud-sql-proxy v2 installed (brew install cloud-sql-proxy or binary in PATH)
#   - gcloud authenticated with access to the Cloud SQL instance
#   - mysql + mysqldump clients installed (MySQL 8.x)
#   - frontend/.env.cloudsql filled in (copy from .env.cloudsql.example)
#   - Local pitlane DB running and accessible
#
# Usage (run from frontend/ directory):
#   chmod +x scripts/push-to-cloudsql.sh
#   ./scripts/push-to-cloudsql.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CLOUDSQL_ENV="$FRONTEND_DIR/.env.cloudsql"
LOCAL_ENV="$FRONTEND_DIR/.env"
TS=$(date +%Y%m%d_%H%M%S)
DATA_FILE="/tmp/pitlane_data_${TS}.sql"

# ── Helpers ───────────────────────────────────────────────────────────────────

log()  { echo "[$(date +%H:%M:%S)] $*"; }
err()  { echo "[$(date +%H:%M:%S)] ERROR: $*" >&2; }
die()  { err "$*"; exit 1; }

# ── Load credentials ──────────────────────────────────────────────────────────

[[ -f "$CLOUDSQL_ENV" ]] || die ".env.cloudsql not found at $CLOUDSQL_ENV — copy .env.cloudsql.example and fill it in"
[[ -f "$LOCAL_ENV" ]]    || die ".env not found at $LOCAL_ENV"

# shellcheck disable=SC1090
source "$CLOUDSQL_ENV"
# shellcheck disable=SC1090
source "$LOCAL_ENV"

: "${CLOUDSQL_INSTANCE:?CLOUDSQL_INSTANCE is not set in .env.cloudsql}"
: "${CLOUDSQL_USER:?CLOUDSQL_USER is not set in .env.cloudsql}"
: "${CLOUDSQL_DB:?CLOUDSQL_DB is not set in .env.cloudsql}"
: "${CLOUDSQL_PROXY_PORT:=3307}"

# Local DB vars from .env
LOCAL_HOST="${DATABASE_HOST:-127.0.0.1}"
LOCAL_PORT="${DATABASE_PORT:-3306}"
LOCAL_USER="${DATABASE_USER:-root}"
LOCAL_PASS="${DATABASE_PASSWORD:-}"
LOCAL_DB="${DATABASE_NAME:-pitlane}"

# ── Check prerequisites ───────────────────────────────────────────────────────

for cmd in cloud-sql-proxy mysqldump mysql; do
  command -v "$cmd" &>/dev/null || die "'$cmd' not found in PATH. Install it and retry."
done

log "Prerequisites OK"

# ── Cleanup trap ──────────────────────────────────────────────────────────────

PROXY_PID=""
cleanup() {
  if [[ -n "$PROXY_PID" ]] && kill -0 "$PROXY_PID" 2>/dev/null; then
    log "Stopping cloud-sql-proxy (pid $PROXY_PID)..."
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
  local removed=0
  [[ -f "$DATA_FILE" ]]   && { rm -f "$DATA_FILE";   removed=1; }
  [[ $removed -eq 1 ]] && log "Removed temp dump files"
}
trap cleanup EXIT

# ── Start cloud-sql-proxy ─────────────────────────────────────────────────────

log "Starting cloud-sql-proxy for $CLOUDSQL_INSTANCE on port $CLOUDSQL_PROXY_PORT..."
cloud-sql-proxy \
  --port="$CLOUDSQL_PROXY_PORT" \
  "$CLOUDSQL_INSTANCE" \
  &>/tmp/cloud-sql-proxy.log &
PROXY_PID=$!

# ── Wait for proxy readiness ──────────────────────────────────────────────────

log "Waiting for proxy to be ready..."
PROXY_READY=0
for i in $(seq 1 15); do
  if MYSQL_PWD="${CLOUDSQL_PASSWORD:-}" mysql \
      --host=127.0.0.1 \
      --port="$CLOUDSQL_PROXY_PORT" \
      --user="$CLOUDSQL_USER" \
      --connect-timeout=2 \
      --execute="SELECT 1" &>/dev/null; then
    PROXY_READY=1
    log "Proxy ready after ${i}s"
    break
  fi
  sleep 1
done

if [[ $PROXY_READY -eq 0 ]]; then
  err "Proxy did not become ready within 15s. Last proxy log:"
  tail -20 /tmp/cloud-sql-proxy.log >&2
  die "Aborting"
fi

# ── Sync schema via drizzle-kit push (handles CREATE TABLE + ALTER TABLE) ─────

log "Running drizzle-kit push --force against Cloud SQL..."

(
  cd "$FRONTEND_DIR"
  DATABASE_HOST=127.0.0.1 \
  DATABASE_PORT="$CLOUDSQL_PROXY_PORT" \
  DATABASE_USER="$CLOUDSQL_USER" \
  DATABASE_PASSWORD="${CLOUDSQL_PASSWORD:-}" \
  DATABASE_NAME="$CLOUDSQL_DB" \
  npx drizzle-kit push --force
)

log "Schema sync complete"

# ── Dump local data with REPLACE INTO ────────────────────────────────────────

log "Dumping data from '$LOCAL_DB' to $DATA_FILE..."

MYSQL_PWD="$LOCAL_PASS" mysqldump \
  --host="$LOCAL_HOST" \
  --port="$LOCAL_PORT" \
  --user="$LOCAL_USER" \
  --no-create-info \
  --replace \
  --single-transaction \
  --no-tablespaces \
  --skip-triggers \
  "$LOCAL_DB" \
  > "$DATA_FILE"

log "Data dump complete ($(du -sh "$DATA_FILE" | cut -f1))"

# ── Upsert data (REPLACE INTO) ────────────────────────────────────────────────

log "Upserting data into '$CLOUDSQL_DB'..."

MYSQL_PWD="${CLOUDSQL_PASSWORD:-}" mysql \
  --host=127.0.0.1 \
  --port="$CLOUDSQL_PROXY_PORT" \
  --user="$CLOUDSQL_USER" \
  "$CLOUDSQL_DB" \
  < "$DATA_FILE"

log "Upsert complete"

# ── Sanity check — row counts ─────────────────────────────────────────────────

log "Row counts on Cloud SQL:"

for tbl in races sessions experiences schedule_entries; do
  count=$(MYSQL_PWD="${CLOUDSQL_PASSWORD:-}" mysql \
    --host=127.0.0.1 \
    --port="$CLOUDSQL_PROXY_PORT" \
    --user="$CLOUDSQL_USER" \
    "$CLOUDSQL_DB" \
    --skip-column-names \
    --execute="SELECT COUNT(*) FROM $tbl;" 2>/dev/null || echo "n/a")
  printf "  %-20s %s\n" "$tbl" "$count"
done

log ""
log "Done! Local '$LOCAL_DB' → Cloud SQL '$CLOUDSQL_DB' on $CLOUDSQL_INSTANCE"
