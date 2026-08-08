#!/bin/bash
# ── Git helper script for hamteam-talent ──
# Usage:
#   ./git-push.sh              # add + commit + push (auto message)
#   ./git-push.sh "message"    # add + commit + push with custom message
#   ./git-push.sh pull          # pull latest
#
# Credentials are stored securely via git credential store (~/.git-credentials).
# Do NOT put the token in this file.

set -e
cd "$(dirname "$0")"

REPO_URL="https://github.com/AbstractAxisX/hamteam-talent.git"

# Ensure remote is set
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REPO_URL"
  echo "✓ Remote 'origin' added: $REPO_URL"
fi

case "${1:-push}" in
  pull)
    echo "⬇ Pulling from origin..."
    git pull origin main || git pull origin master
    ;;
  push)
    MSG="${2:-update: $(date '+%Y-%m-%d %H:%M')}"
    echo "📦 Staging files..."
    git add -A
    echo "📝 Committing: $MSG"
    git commit -m "$MSG" || { echo "Nothing to commit."; exit 0; }
    echo "⬆ Pushing to origin..."
    BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    git push -u origin "$BRANCH"
    echo "✓ Done!"
    ;;
  status)
    git status
    ;;
  *)
    echo "Usage: ./git-push.sh [push|pull|status] [commit-message]"
    ;;
esac
