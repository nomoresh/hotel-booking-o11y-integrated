#!/usr/bin/env bash
set -Eeuo pipefail

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
      echo "Unknown option: $1" >&2
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
    echo "Open manually: $url"
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

export AWS_PROFILE="$PROFILE"
export AWS_REGION="$REGION"
export AWS_DEFAULT_REGION="$REGION"

URL="http://127.0.0.1:${PORT}"

echo ""
echo "=== Argo CD Port Forward ==="

echo ""
echo "[1/5] Updating kubeconfig..."
aws eks update-kubeconfig \
  --region "$REGION" \
  --name "$CLUSTER_NAME" \
  --profile "$PROFILE" \
  --alias "$CLUSTER_NAME"

kubectl config use-context "$CLUSTER_NAME" >/dev/null

echo ""
echo "[2/5] Checking Kubernetes connection..."
kubectl get nodes >/dev/null

echo ""
echo "[3/5] Checking Argo CD server..."
kubectl get namespace argocd >/dev/null
kubectl rollout status deployment/argocd-server -n argocd --timeout=180s
kubectl get service argocd-server -n argocd >/dev/null

echo ""
echo "[4/5] Reading initial admin password..."
ARGO_PASS_B64="$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>/dev/null || true)"

if [[ -n "$ARGO_PASS_B64" ]]; then
  ARGO_PASS="$(decode_base64 "$ARGO_PASS_B64")"
  echo "ID: admin"
  echo "PW: $ARGO_PASS"
else
  echo "Initial admin password secret not found."
  echo "The password may already have been changed."
fi

echo ""
echo "[5/5] Starting port-forward..."

if command -v lsof >/dev/null 2>&1; then
  EXISTING_PID="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"

  if [[ -n "$EXISTING_PID" ]]; then
    EXISTING_COMMAND="$(ps -p "$EXISTING_PID" -o command= 2>/dev/null || true)"

    if [[ "$EXISTING_COMMAND" == *"kubectl"* && "$EXISTING_COMMAND" == *"port-forward"* ]]; then
      echo "An existing kubectl port-forward is using port $PORT."
      echo "Opening: $URL"
      open_url "$URL"
      exit 0
    fi

    echo "Port $PORT is already used by another process." >&2
    echo "Process: ${EXISTING_COMMAND:-unknown}" >&2
    echo "Use another port, for example: --port 8081" >&2
    exit 1
  fi
fi

echo "Argo CD URL: $URL"
echo "Press Ctrl+C to stop port-forward."

kubectl port-forward service/argocd-server -n argocd "${PORT}:80" &
PF_PID=$!

cleanup() {
  kill "$PF_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 3

if ! kill -0 "$PF_PID" 2>/dev/null; then
  echo "Port-forward failed to start." >&2
  wait "$PF_PID"
fi

open_url "$URL"
wait "$PF_PID"