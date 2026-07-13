#!/usr/bin/env bash
set -Eeuo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-nomoresh}"
REGION="${REGION:-ap-northeast-2}"
PROFILE="${PROFILE:-nomoresh}"
PORT="${PORT:-8080}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

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
    --auto-approve)
      AUTO_APPROVE="true"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/infra/terraform/eks"
PORT_FORWARD_SCRIPT="$PROJECT_ROOT/scripts/unix/argocd_port.sh"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

terraform_apply() {
  if [[ "$AUTO_APPROVE" == "true" ]]; then
    terraform apply -input=false -auto-approve "$@"
  else
    terraform apply "$@"
  fi
}

for command_name in aws terraform kubectl; do
  require_command "$command_name"
done

if [[ ! -d "$TERRAFORM_DIR" ]]; then
  echo "Terraform directory not found: $TERRAFORM_DIR" >&2
  exit 1
fi

if [[ ! -x "$PORT_FORWARD_SCRIPT" ]]; then
  echo "Port-forward script is not executable: $PORT_FORWARD_SCRIPT" >&2
  echo "Run: chmod +x \"$PORT_FORWARD_SCRIPT\"" >&2
  exit 1
fi

export AWS_PROFILE="$PROFILE"
export AWS_REGION="$REGION"
export AWS_DEFAULT_REGION="$REGION"

echo ""
echo "=== Terraform EKS Apply + Argo CD Open ==="
echo ""
echo "AWS_PROFILE=$AWS_PROFILE"
echo "AWS_REGION=$AWS_REGION"
echo "CLUSTER_NAME=$CLUSTER_NAME"

echo ""
echo "[1/8] Checking AWS credentials..."
aws sts get-caller-identity >/dev/null

echo ""
echo "[2/8] Moving to Terraform directory..."
cd "$TERRAFORM_DIR"
pwd

echo ""
echo "[3/8] Terraform init..."
terraform init -input=false

echo ""
echo "[4/8] Terraform validate..."
terraform validate

echo ""
echo "[5/8] Applying EKS infrastructure first..."
echo "This prevents the Kubernetes provider from connecting to localhost before EKS is ready."
terraform_apply -target=module.eks

echo ""
echo "[6/8] Waiting for EKS and updating kubeconfig..."
aws eks wait cluster-active \
  --name "$CLUSTER_NAME" \
  --region "$REGION"

aws eks update-kubeconfig \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --alias "$CLUSTER_NAME"

kubectl config use-context "$CLUSTER_NAME" >/dev/null
kubectl wait --for=condition=Ready nodes --all --timeout=10m
kubectl get nodes -o wide

echo ""
echo "[7/8] Applying Argo CD and remaining resources..."
terraform_apply

echo ""
echo "[8/8] Starting Argo CD port-forward..."
"$PORT_FORWARD_SCRIPT" \
  --port "$PORT" \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  --profile "$PROFILE"