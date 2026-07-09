param(
  [string]$ClusterName = "nomoresh",
  [string]$Region = "ap-northeast-2",
  [string]$Profile = "nomoresh",
  [int]$Port = 8080,
  [switch]$AutoApprove
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
$TerraformDir = Join-Path $ProjectRoot "infra\terraform\eks"
$PortForwardScript = Join-Path $ScriptDir "argocd_portforward.ps1"
$LogDir = Join-Path $ProjectRoot "logs"

New-Item -ItemType Directory -Force $LogDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = Join-Path $LogDir "argocd-apply-$Timestamp.log"

Start-Transcript -Path $LogFile -Append | Out-Null

try {
  Write-Host ""
  Write-Host "=== Terraform Apply + Argo CD Open Automation ==="
  Write-Host ""
  Write-Host "Project root: $ProjectRoot"
  Write-Host "Terraform dir: $TerraformDir"
  Write-Host "Log file: $LogFile"
  Write-Host ""

  Test-CommandExists "aws"
  Test-CommandExists "kubectl"
  Test-CommandExists "terraform"

  if (-not (Test-Path $TerraformDir)) {
    throw "Terraform directory not found: $TerraformDir"
  }

  if (-not (Test-Path $PortForwardScript)) {
    throw "Port-forward script not found: $PortForwardScript"
  }

  Write-Host "[1/6] Setting AWS profile..."
  $env:AWS_PROFILE = $Profile
  $env:AWS_REGION = $Region

  Write-Host "AWS_PROFILE=$env:AWS_PROFILE"
  Write-Host "AWS_REGION=$env:AWS_REGION"

  Write-Host ""
  Write-Host "[2/6] Moving to Terraform directory..."
  Set-Location $TerraformDir

  Write-Host ""
  Write-Host "[3/6] Terraform init..."
  terraform init

  Write-Host ""
  Write-Host "[4/6] Terraform validate..."
  terraform validate

  Write-Host ""
  Write-Host "[5/6] Terraform apply..."

  if ($AutoApprove) {
    terraform apply -auto-approve
  } else {
    terraform apply
  }

  Write-Host ""
  Write-Host "[6/6] Starting Argo CD port-forward in a new PowerShell window..."
  Write-Host ""

  $ArgumentList = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-NoExit",
    "-File", "`"$PortForwardScript`"",
    "-Port", "$Port",
    "-ClusterName", "$ClusterName",
    "-Region", "$Region",
    "-Profile", "$Profile"
  )

  Start-Process -FilePath "powershell.exe" -ArgumentList $ArgumentList

  Write-Host ""
  Write-Host "Argo CD will open at:"
  Write-Host "http://127.0.0.1:$Port"
  Write-Host ""
  Write-Host "If the browser does not open, open the URL above manually."
  Write-Host ""
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
