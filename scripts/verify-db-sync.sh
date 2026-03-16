#!/usr/bin/env bash
# Usage:
#   ./verify-db-sync.sh                     # starts its own proxy
#   ./verify-db-sync.sh --proxy-pid <PID>   # reuse an already-running proxy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.cloudsql"

# ---------- Parse args ----------
EXTERNAL_PROXY_PID=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --proxy-pid) EXTERNAL_PROXY_PID="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ---------- Load config ----------
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌  $ENV_FILE not found."
  exit 1
fi
source "$ENV_FILE"

PROXY_BIN="/opt/homebrew/bin/cloud-sql-proxy"
PROXY_PORT="${CLOUDSQL_PROXY_PORT:-3307}"
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="3306"
LOCAL_USER="root"
LOCAL_PASS="12345678"
LOCAL_DB="pitlane"
OWN_PROXY=false

# ---------- Start proxy if needed ----------
if [[ -z "$EXTERNAL_PROXY_PID" ]]; then
  echo ""
  echo "🔌  Starting Cloud SQL Auth Proxy on port $PROXY_PORT..."
  "$PROXY_BIN" --port="$PROXY_PORT" "$CLOUDSQL_INSTANCE" &>/tmp/cloudsql-proxy.log &
  PROXY_PID=$!
  OWN_PROXY=true

  for i in $(seq 1 15); do
    if mysql -h "$LOCAL_HOST" -P "$PROXY_PORT" -u "$CLOUDSQL_USER" -p"$CLOUDSQL_PASSWORD" \
        -e "SELECT 1;" "$CLOUDSQL_DB" &>/dev/null; then
      break
    fi
    if [[ $i -eq 15 ]]; then
      echo "❌  Proxy didn't respond in 15s. Check /tmp/cloudsql-proxy.log"
      kill "$PROXY_PID" 2>/dev/null || true
      exit 1
    fi
    sleep 1
  done
else
  PROXY_PID="$EXTERNAL_PROXY_PID"
fi

# ---------- Helper: run query on a DB ----------
local_query()  { mysql -h "$LOCAL_HOST"  -P "$LOCAL_PORT"  -u "$LOCAL_USER"  -p"$LOCAL_PASS"         -sN -e "$1" "$LOCAL_DB"  2>/dev/null; }
remote_query() { mysql -h "$LOCAL_HOST"  -P "$PROXY_PORT"  -u "$CLOUDSQL_USER" -p"$CLOUDSQL_PASSWORD" -sN -e "$1" "$CLOUDSQL_DB" 2>/dev/null; }

# ---------- Get table lists ----------
LOCAL_TABLES=$(local_query  "SHOW TABLES;" | sort)
REMOTE_TABLES=$(remote_query "SHOW TABLES;" | sort)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DB Sync Verification: localhost/$LOCAL_DB → Cloud SQL/$CLOUDSQL_DB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ---------- Table presence check ----------
ONLY_LOCAL=$(comm -23 <(echo "$LOCAL_TABLES") <(echo "$REMOTE_TABLES"))
ONLY_REMOTE=$(comm -13 <(echo "$LOCAL_TABLES") <(echo "$REMOTE_TABLES"))
COMMON_TABLES=$(comm -12 <(echo "$LOCAL_TABLES") <(echo "$REMOTE_TABLES"))

if [[ -n "$ONLY_LOCAL" ]]; then
  echo ""
  echo "⚠️   Tables only in LOCAL ($LOCAL_DB):"
  echo "$ONLY_LOCAL" | sed 's/^/      - /'
fi

if [[ -n "$ONLY_REMOTE" ]]; then
  echo ""
  echo "⚠️   Tables only in REMOTE ($CLOUDSQL_DB):"
  echo "$ONLY_REMOTE" | sed 's/^/      - /'
fi

# ---------- Row count comparison ----------
echo ""
printf "  %-35s %12s %12s %8s\n" "TABLE" "LOCAL" "CLOUD SQL" "STATUS"
printf "  %-35s %12s %12s %8s\n" "-----" "-----" "---------" "------"

PASS=0
FAIL=0

while IFS= read -r table; do
  [[ -z "$table" ]] && continue
  local_count=$(local_query  "SELECT COUNT(*) FROM \`$table\`;")
  remote_count=$(remote_query "SELECT COUNT(*) FROM \`$table\`;")

  if [[ "$local_count" == "$remote_count" ]]; then
    status="✅"
    ((PASS++)) || true
  else
    status="❌"
    ((FAIL++)) || true
  fi

  printf "  %-35s %12s %12s %8s\n" "$table" "$local_count" "$remote_count" "$status"
done <<< "$COMMON_TABLES"

# ---------- Summary ----------
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS + FAIL))
if [[ $FAIL -eq 0 && -z "$ONLY_LOCAL" && -z "$ONLY_REMOTE" ]]; then
  echo "  ✅  All $TOTAL tables match — sync verified."
else
  echo "  ❌  $FAIL/$TOTAL tables have mismatched row counts."
  [[ -n "$ONLY_LOCAL"  ]] && echo "  ⚠️   $(echo "$ONLY_LOCAL"  | wc -l | tr -d ' ') table(s) missing from Cloud SQL."
  [[ -n "$ONLY_REMOTE" ]] && echo "  ⚠️   $(echo "$ONLY_REMOTE" | wc -l | tr -d ' ') table(s) missing from local."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ---------- Cleanup ----------
if [[ "$OWN_PROXY" == true ]]; then
  kill "$PROXY_PID" 2>/dev/null || true
fi

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
