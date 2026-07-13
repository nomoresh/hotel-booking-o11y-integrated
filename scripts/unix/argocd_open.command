#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APPLY_SCRIPT="$PROJECT_ROOT/scripts/unix/argocd_apply.sh"

EXIT_CODE=0

if [[ ! -x "$APPLY_SCRIPT" ]]; then
  echo "Apply script is not executable: $APPLY_SCRIPT"
  echo "Run: chmod +x \"$APPLY_SCRIPT\""
  EXIT_CODE=1
else
  "$APPLY_SCRIPT" --auto-approve "$@" || EXIT_CODE=$?
fi

echo ""
if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo "Script finished."
else
  echo "Script failed with exit code: $EXIT_CODE"
fi

read -n 1 -s -r -p "Press any key to close..."
echo ""
exit "$EXIT_CODE"
