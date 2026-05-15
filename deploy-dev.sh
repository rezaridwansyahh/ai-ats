#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LANDING_LOG="/tmp/landing-backend.log"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy-dev]${NC} $1"; }
info() { echo -e "${CYAN}[deploy-dev]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy-dev]${NC} $1"; }
err()  { echo -e "${RED}[deploy-dev]${NC} $1"; exit 1; }

# ── Helpers ──
install_and_build() {
  local dir="$1" label="$2"
  log "$label — installing dependencies..."
  cd "$dir" && npm install
  log "$label — building..."
  npm run build
}

deploy_to_webroot() {
  local src="$1" dest="$2" label="$3"
  log "$label — syncing to $dest..."
  sudo rsync -a --delete "$src/" "$dest/"
}

restart_node_process() {
  local dir="$1" label="$2" logfile="$3"
  local pid
  pid=$(pgrep -f "node $dir/app.js" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    log "$label — stopping (PID: $pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
  cd "$dir"
  log "$label — starting..."
  nohup node app.js > "$logfile" 2>&1 &
  log "$label — running (PID: $!)"
}

# ══════════════════════════════════════
#  DEPLOY DEV (with database reseed)
# ══════════════════════════════════════

echo ""
warn "========================================="
warn " WARNING: This will RESET the database."
warn " setup.sql will drop & recreate schema,"
warn " then re-run seeders. All data lost."
warn "========================================="
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  err "Aborted by user."
fi

echo ""
info "========== PULLING LATEST CODE =========="
cd "$ROOT_DIR"
log "Running git pull origin master..."
git pull origin master
log "Code updated."

echo ""
info "========== PORTAL BACKEND =========="
log "Installing dependencies..."
cd "$ROOT_DIR/backend" && npm install

echo ""
info "========== RESEEDING DATABASE =========="
log "Running setup.sql → run-seed.js → sync-seq.sql..."
cd "$ROOT_DIR/backend" && node src/db/run-script.js
log "Database reseed complete."

echo ""
info "========== RESTARTING PORTAL BACKEND =========="
log "Restarting pm2..."
pm2 restart ats-backend
pm2 save
log "Portal backend deployed."

echo ""
info "========== PORTAL FRONTEND =========="
install_and_build "$ROOT_DIR/frontend" "Portal frontend"
deploy_to_webroot "$ROOT_DIR/frontend/dist" "/var/www/html/portal" "Portal frontend"
log "Portal frontend deployed."

echo ""
info "========== LANDING BACKEND =========="
cd "$ROOT_DIR/landing/backend" && npm install --production
restart_node_process "$ROOT_DIR/landing/backend" "Landing backend" "$LANDING_LOG"
log "Landing backend deployed."

echo ""
info "========== LANDING FRONTEND =========="
install_and_build "$ROOT_DIR/landing/frontend" "Landing frontend"
deploy_to_webroot "$ROOT_DIR/landing/frontend/dist" "/var/www/html/landing" "Landing frontend"
log "Landing frontend deployed."

# ── Summary ──
echo ""
info "========== DEPLOY-DEV COMPLETE =========="
pm2 status
echo ""
pid=$(pgrep -f "node $ROOT_DIR/landing/backend/app.js" 2>/dev/null || true)
if [ -n "$pid" ]; then
  log "Landing backend: running (PID: $pid)"
else
  echo -e "${RED}[deploy-dev]${NC} Landing backend: not running"
fi
echo ""
