#!/bin/sh
# Revert to backup commit made at 2025-07-20 15:35:20
# Usage: sh scripts/revert-to-backup-20250720-153520.sh

git reset --hard 5dd26b1

echo "Project reverted to backup commit 5dd26b1 (2025-07-20 15:35:20)"
