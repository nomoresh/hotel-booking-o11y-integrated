param(
  [int]$Port = 8081,
  [string]$ClusterName = "nomoresh",
  [string]$Region = "ap-northeast-2",
  [string]$Profile = "nomoresh"
)

$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$LogDir = Join-Path $ProjectRoot "logs"

New-Item -ItemType Directory -Force $LogDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = Join-Path $LogDir "argocd-portforward-$Timestamp.log"

Start-Transcript -Path $LogFile -Append | Out-Null

try {
  Write-Host ""
  Write-Host "=== Argo CD Port Forward Automation ==="
  Write-Host ""
  Write-Host "Log file: $LogFile"
  Write-Host ""

  Test-CommandExists "aws"
  Test-CommandExists "kubectl"

  Write-Host "[1/5] Updating kubeconfig..."
  aws eks update-kubeconfig `
    --region $Region `
    --name $ClusterName `
    --profile $Profile

  Write-Host ""
  Write-Host "[2/5] Checking Kubernetes connection..."
  kubectl get nodes | Out-Null

  Write-Host ""
  Write-Host "[3/5] Checking Argo CD server..."
  kubectl get ns argocd | Out-Null
  kubectl rollout status deploy/argocd-server -n argocd --timeout=180s

  Write-Host ""
  Write-Host "[4/5] Checking admin password..."

  try {
    $ARGO_PASS_B64 = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>$null

    if ($ARGO_PASS_B64) {
      $ARGO_PASS = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($ARGO_PASS_B64))

      Write-Host ""
      Write-Host "Argo CD Login"
      Write-Host "ID: admin"
      Write-Host "PW: $ARGO_PASS"
    } else {
      Write-Host "Initial admin password secret not found. It may have been changed or deleted."
    }
  } catch {
    Write-Host "Could not read initial admin password. It may have been changed or deleted."
  }

  Write-Host ""
  Write-Host "[5/5] Starting port-forward..."

  $Url = "http://127.0.0.1:$Port"

  $PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

  if ($PortInUse) {
    Write-Host ""
    Write-Host "Port $Port is already in use."
    Write-Host "Opening existing URL:"
    Write-Host $Url
    Start-Process $Url
    return
  }

  Write-Host ""
  Write-Host "Argo CD URL:"
  Write-Host $Url
  Write-Host ""
  Write-Host "Press Ctrl + C to stop port-forward."
  Write-Host ""

  Start-Job -ScriptBlock {
    param([string]$OpenUrl)
    Start-Sleep -Seconds 3
    Start-Process $OpenUrl
  } -ArgumentList $Url | Out-Null

  kubectl port-forward deploy/argocd-server -n argocd ${Port}:8080
}
catch {
  Write-Host ""
  Write-Host "ERROR:"
  Write-Host $_.Exception.Message
  Write-Host ""
  Write-Host "Check log file:"
  Write-Host $LogFile
  Write-Host ""
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
