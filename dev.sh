#!/bin/bash
# Runs backend (Express) and frontend (Vite) dev servers together.
# Ctrl+C stops both.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[dev]${NC} $1"; }
info() { echo -e "${CYAN}[dev]${NC} $1"; }
err()  { echo -e "${RED}[dev]${NC} $1"; }

if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
  info "Installing backend dependencies..."
  (cd "$ROOT_DIR/backend" && npm install) || { err "Backend install failed."; exit 1; }
fi

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  info "Installing frontend dependencies..."
  (cd "$ROOT_DIR/frontend" && npm install) || { err "Frontend install failed."; exit 1; }
fi

cleanup() {
  echo ""
  log "Stopping backend and frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

log "Starting backend (http://localhost:3000)..."
(cd "$ROOT_DIR/backend" && NODE_ENV=development node app.js 2>&1 | sed -e "s/^/${CYAN}[backend]${NC} /") &
BACKEND_PID=$!

log "Starting frontend (http://localhost:5173)..."
(cd "$ROOT_DIR/frontend" && npm run dev 2>&1 | sed -e "s/^/${GREEN}[frontend]${NC} /") &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
