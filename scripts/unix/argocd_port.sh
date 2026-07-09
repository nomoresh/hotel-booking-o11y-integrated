#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"
CLUSTER_NAME="${CLUSTER_NAME:-nomoresh}"
REGION="${REGION:-ap-northeast-2}"
PROFILE="${PROFILE:-nomoresh}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port|-p)
      PORT="$2"
      shift 2
      ;;
    --cluster-name)
      CLUSTER_NAME="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

open_url() {
  local url="$1"

  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  else
    echo "Browser auto-open is not available."
    echo "Open this URL manually:"
    echo "$url"
  fi
}

decode_base64() {
  local value="$1"

  if printf "" | base64 --decode >/dev/null 2>&1; then
    printf "%s" "$value" | base64 --decode
  elif printf "" | base64 -d >/dev/null 2>&1; then
    printf "%s" "$value" | base64 -d
  else
    printf "%s" "$value" | base64 -D
  fi
}

echo ""
echo "=== Argo CD Port Forward Automation ==="
echo ""

echo "[1/5] Updating kubeconfig..."
aws eks update-kubeconfig \
  --region "$REGION" \
  --name "$CLUSTER_NAME" \
  --profile "$PROFILE"

echo ""
echo "[2/5] Checking Kubernetes connection..."
kubectl get nodes > /dev/null

echo ""
echo "[3/5] Checking Argo CD server..."
kubectl get ns argocd > /dev/null
kubectl rollout status deploy/argocd-server -n argocd --timeout=180s

echo ""
echo "[4/5] Checking admin password..."

ARGO_PASS_B64="$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>/dev/null || true)"

if [[ -n "$ARGO_PASS_B64" ]]; then
  ARGO_PASS="$(decode_base64 "$ARGO_PASS_B64")"

  echo ""
  echo "Argo CD Login"
  echo "ID: admin"
  echo "PW: $ARGO_PASS"
else
  echo "Initial admin password secret not found."
  echo "It may have been changed or deleted."
fi

echo ""
echo "[5/5] Starting port-forward..."

URL="http://127.0.0.1:${PORT}"

if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN -Pn >/dev/null 2>&1; then
    echo ""
    echo "Port $PORT is already in use."
    echo "Opening existing URL:"
    echo "$URL"
    open_url "$URL"
    exit 0
  fi
fi

echo ""
echo "Argo CD URL:"
echo "$URL"
echo ""
echo "Press Ctrl + C to stop port-forward."
echo ""

kubectl port-forward deploy/argocd-server -n argocd "${PORT}:8080" &
PF_PID=$!

trap 'kill "$PF_PID" 2>/dev/null || true' EXIT INT TERM

sleep 3
open_url "$URL"

wait "$PF_PID"