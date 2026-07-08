#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

"$PROJECT_ROOT/scripts/unix/argocd_apply.sh"

echo ""
read -n 1 -s -r -p "Press any key to close..."