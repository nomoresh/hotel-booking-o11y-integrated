param(
  [int]$Port = 8080,
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

function Invoke-NativeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command,

    [Parameter(Mandatory = $true)]
    [string]$ErrorMessage
  )

  & $Command

  if ($LASTEXITCODE -ne 0) {
    throw "$ErrorMessage Exit code: $LASTEXITCODE"
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
  Write-Host "=== Argo CD Port Forward ==="
  Write-Host ""
  Write-Host "Cluster: $ClusterName"
  Write-Host "Region: $Region"
  Write-Host "Profile: $Profile"
  Write-Host "Log file: $LogFile"
  Write-Host ""

  Test-CommandExists "aws"
  Test-CommandExists "kubectl"

  Write-Host "[1/5] Updating kubeconfig..."

  Invoke-NativeCommand `
    -Command {
      aws eks update-kubeconfig `
        --region $Region `
        --name $ClusterName `
        --profile $Profile
    } `
    -ErrorMessage "Failed to update kubeconfig."

  Write-Host ""
  Write-Host "[2/5] Checking Kubernetes connection..."

  Invoke-NativeCommand `
    -Command {
      kubectl get nodes --request-timeout=15s
    } `
    -ErrorMessage "Cannot connect to the EKS cluster."

  Write-Host ""
  Write-Host "[3/5] Checking Argo CD server..."

  Invoke-NativeCommand `
    -Command {
      kubectl get namespace argocd
    } `
    -ErrorMessage "Argo CD namespace does not exist."

  Invoke-NativeCommand `
    -Command {
      kubectl rollout status `
        deployment/argocd-server `
        -n argocd `
        --timeout=300s
    } `
    -ErrorMessage "Argo CD server is not ready."

  Write-Host ""
  Write-Host "[4/5] Checking admin password..."

  $ArgoPasswordBase64 = kubectl `
    -n argocd `
    get secret argocd-initial-admin-secret `
    -o jsonpath="{.data.password}" 2>$null

  if ($LASTEXITCODE -eq 0 -and $ArgoPasswordBase64) {
    $ArgoPassword = [System.Text.Encoding]::UTF8.GetString(
      [System.Convert]::FromBase64String($ArgoPasswordBase64)
    )

    Write-Host ""
    Write-Host "Argo CD Login"
    Write-Host "ID: admin"
    Write-Host "PW: $ArgoPassword"
  }
  else {
    Write-Host "Initial admin password secret was not found."
    Write-Host "The password may already have been changed."
  }

  Write-Host ""
  Write-Host "[5/5] Starting port-forward..."

  $Url = "http://127.0.0.1:$Port"

  $PortInUse = Get-NetTCPConnection `
    -LocalPort $Port `
    -ErrorAction SilentlyContinue

  if ($PortInUse) {
    Write-Host "Port $Port is already in use."
    Write-Host "Opening existing URL: $Url"

    Start-Process $Url
    return
  }

  Start-Job -ScriptBlock {
    param([string]$OpenUrl)

    Start-Sleep -Seconds 3
    Start-Process $OpenUrl
  } -ArgumentList $Url | Out-Null

  Write-Host ""
  Write-Host "Argo CD URL: $Url"
  Write-Host "Press Ctrl + C to stop port-forward."
  Write-Host ""

  kubectl port-forward `
    deployment/argocd-server `
    -n argocd `
    "${Port}:8080"

  if ($LASTEXITCODE -ne 0) {
    throw "Argo CD port-forward failed."
  }
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