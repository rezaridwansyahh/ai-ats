#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LANDING_BACKEND_DIR="$ROOT_DIR/landing/backend"
LANDING_FRONTEND_DIR="$ROOT_DIR/landing/frontend"
LANDING_LOG="/tmp/landing-backend.log"
PORTAL_WEBROOT="/var/www/html/portal"
LANDING_WEBROOT="/var/www/html/landing"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[deploy]${NC} $1"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $1"; }
error() { echo -e "${RED}[deploy]${NC} $1"; exit 1; }
info()  { echo -e "${CYAN}[deploy]${NC} $1"; }

usage() {
  echo "Usage: ./deploy.sh [option]"
  echo ""
  echo "Options:"
  echo "  all              Deploy everything (default)"
  echo "  backend          Deploy ATS backend only (pm2)"
  echo "  frontend         Deploy ATS frontend only (build)"
  echo "  landing          Deploy landing backend + frontend"
  echo "  landing-backend  Deploy landing backend only"
  echo "  landing-frontend Deploy landing frontend only (build)"
  echo "  status           Show all running services"
  echo "  logs [service]   Tail logs (backend|landing, default: all)"
  echo ""
  exit 0
}

# ── ATS Backend (pm2) ──
deploy_backend() {
  info "=== ATS Backend ==="
  log "Installing dependencies..."
  cd "$BACKEND_DIR"
  npm install --production

  log "Restarting backend (pm2)..."
  pm2 restart ats-backend
  pm2 save

  log "ATS backend deployed."
}

# ── ATS Frontend (vite build) ──
deploy_frontend() {
  info "=== ATS Frontend ==="
  log "Installing dependencies..."
  cd "$FRONTEND_DIR"
  npm install

  log "Building frontend..."
  npm run build

  log "Deploying to $PORTAL_WEBROOT..."
  sudo rsync -a --delete "$FRONTEND_DIR/dist/" "$PORTAL_WEBROOT/"

  log "ATS frontend deployed."
}

# ── Landing Backend (nohup node) ──
deploy_landing_backend() {
  info "=== Landing Backend ==="
  log "Installing dependencies..."
  cd "$LANDING_BACKEND_DIR"
  npm install --production

  # Kill existing landing backend process
  local pid
  pid=$(pgrep -f "node $LANDING_BACKEND_DIR/app.js" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    log "Stopping existing landing backend (PID: $pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi

  log "Starting landing backend..."
  nohup node app.js > "$LANDING_LOG" 2>&1 &
  local new_pid=$!
  log "Landing backend started (PID: $new_pid, log: $LANDING_LOG)"
}

# ── Landing Frontend (vite build) ──
deploy_landing_frontend() {
  info "=== Landing Frontend ==="
  log "Installing dependencies..."
  cd "$LANDING_FRONTEND_DIR"
  npm install

  log "Building frontend..."
  npm run build

  log "Deploying to $LANDING_WEBROOT..."
  sudo rsync -a --delete "$LANDING_FRONTEND_DIR/dist/" "$LANDING_WEBROOT/"

  log "Landing frontend deployed."
}

# ── Status ──
show_status() {
  echo ""
  info "=== PM2 Services ==="
  pm2 status

  echo ""
  info "=== Landing Backend ==="
  local pid
  pid=$(pgrep -f "node $LANDING_BACKEND_DIR/app.js" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    log "Running (PID: $pid)"
  else
    warn "Not running"
  fi
}

# ── Logs ──
show_logs() {
  local service="${1:-all}"
  case "$service" in
    backend)
      pm2 logs ats-backend --lines 50
      ;;
    landing)
      tail -f "$LANDING_LOG"
      ;;
    all|*)
      echo ""
      info "=== ATS Backend (last 20 lines) ==="
      pm2 logs ats-backend --lines 20 --nostream
      echo ""
      info "=== Landing Backend (last 20 lines) ==="
      tail -20 "$LANDING_LOG" 2>/dev/null || warn "No landing log found"
      ;;
  esac
}

# ── Parse argument ──
COMMAND="${1:-all}"

case "$COMMAND" in
  all)
    deploy_backend
    deploy_frontend
    deploy_landing_backend
    deploy_landing_frontend
    echo ""
    log "All services deployed!"
    show_status
    ;;
  backend)
    deploy_backend
    show_status
    ;;
  frontend)
    deploy_frontend
    ;;
  landing)
    deploy_landing_backend
    deploy_landing_frontend
    echo ""
    log "Landing deployed!"
    show_status
    ;;
  landing-backend)
    deploy_landing_backend
    show_status
    ;;
  landing-frontend)
    deploy_landing_frontend
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs "$2"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    error "Unknown option: $COMMAND. Run ./deploy.sh help"
    ;;
esac
