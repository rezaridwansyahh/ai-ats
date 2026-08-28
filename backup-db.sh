#!/bin/bash
# Dumps the app DB (connection string from .env's DATABASEURL) into
# BACKUP_DIR with a timestamped filename, then deletes dumps older than
# RETENTION_DAYS. Intended to run every 3 hours via cron.

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$BACKEND_DIR/backups"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

set -a
source "$BACKEND_DIR/.env"
set +a

if [ -z "${DATABASEURL:-}" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: DATABASEURL not set in .env" >&2
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="$BACKUP_DIR/ats_backup_${TIMESTAMP}.dump"

pg_dump -Fc "$DATABASEURL" -f "$DUMP_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') Backup created: $DUMP_FILE"

find "$BACKUP_DIR" -name "ats_backup_*.dump" -mtime "+$RETENTION_DAYS" -print -delete
