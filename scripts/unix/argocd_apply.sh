#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-nomoresh}"
REGION="${REGION:-ap-northeast-2}"
PROFILE="${PROFILE:-nomoresh}"
PORT="${PORT:-8080}"

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
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

AUTO_APPROVE="${AUTO_APPROVE:-false}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/infra/terraform/eks"
PORT_FORWARD_SCRIPT="$PROJECT_ROOT/scripts/unix/argocd_port.sh"

echo ""
echo "=== Terraform Apply + Argo CD Open Automation ==="
echo ""

echo "[1/6] Setting AWS profile..."
export AWS_PROFILE="$PROFILE"
export AWS_REGION="$REGION"

echo "AWS_PROFILE=$AWS_PROFILE"
echo "AWS_REGION=$AWS_REGION"

echo ""
echo "[2/6] Moving to Terraform directory..."
cd "$TERRAFORM_DIR"

echo "Terraform directory:"
pwd

echo ""
echo "[3/6] Terraform init..."
terraform init

echo ""
echo "[4/6] Terraform validate..."
terraform validate

echo ""
echo "[5/6] Terraform apply..."

if [[ "$AUTO_APPROVE" == "true" ]]; then
  terraform apply -auto-approve
else
  terraform apply
fi

echo ""
echo "[6/6] Starting Argo CD port-forward..."
echo ""

"$PORT_FORWARD_SCRIPT" \
  --port "$PORT" \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  --profile "$PROFILE"