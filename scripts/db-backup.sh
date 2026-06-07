#!/usr/bin/env bash
# Daily PostgreSQL backup for the Pomodoro app.
# Dumps the DB container to a gzip file and prunes backups older than N days.
#
# Install as a cron job (see DEPLOY.md / DEPLOY_AWS.md):
#   chmod +x ~/pomodoro-app/scripts/db-backup.sh
#   (crontab -l 2>/dev/null; echo "0 3 * * * $HOME/pomodoro-app/scripts/db-backup.sh >> $HOME/backups/backup.log 2>&1") | crontab -

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DB_CONTAINER="${DB_CONTAINER:-pomodoro-db}"
DB_USER="${POSTGRES_USER:-pomodoro}"
DB_NAME="${POSTGRES_DB:-pomodoro}"

mkdir -p "$BACKUP_DIR"
timestamp="$(date +%F_%H%M%S)"
outfile="$BACKUP_DIR/pomodoro-$timestamp.sql.gz"

echo "[$(date -Is)] dumping $DB_NAME from container $DB_CONTAINER ..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$outfile"
echo "[$(date -Is)] wrote $outfile ($(du -h "$outfile" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name 'pomodoro-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "[$(date -Is)] pruned backups older than ${RETENTION_DAYS} days"
