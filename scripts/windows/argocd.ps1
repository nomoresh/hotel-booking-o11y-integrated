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

function Test-EksClusterExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$AwsRegion,

    [Parameter(Mandatory = $true)]
    [string]$AwsProfile
  )

  # 클러스터가 없는 것은 오류가 아니라 정상적인 분기 조건입니다.
  # 따라서 이 명령을 실행하는 동안만 오류 중단을 비활성화합니다.
  $PreviousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $null = & aws eks describe-cluster `
      --name $Name `
      --region $AwsRegion `
      --profile $AwsProfile `
      --query "cluster.status" `
      --output text 2>$null

    $ExitCode = $LASTEXITCODE

    return $ExitCode -eq 0
  }
  finally {
    $ErrorActionPreference = $PreviousErrorActionPreference
  }
}

$ScriptDir = $PSScriptRoot
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$TerraformDir = Join-Path $ProjectRoot "infra\terraform\eks"
$PortForwardScript = Join-Path $ScriptDir "argocd_portforward.ps1"
$LogDir = Join-Path $ProjectRoot "logs"

New-Item -ItemType Directory -Force $LogDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = Join-Path $LogDir "argocd-bootstrap-$Timestamp.log"

Start-Transcript -Path $LogFile -Append | Out-Null

try {
  Write-Host ""
  Write-Host "=== EKS + Argo CD Bootstrap ==="
  Write-Host ""
  Write-Host "Cluster: $ClusterName"
  Write-Host "Region: $Region"
  Write-Host "Profile: $Profile"
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

  Write-Host "[1/9] Setting AWS environment..."

  $env:AWS_PROFILE = $Profile
  $env:AWS_REGION = $Region
  $env:AWS_DEFAULT_REGION = $Region

  Invoke-NativeCommand `
    -Command {
      aws sts get-caller-identity --profile $Profile
    } `
    -ErrorMessage "AWS authentication failed."

  Write-Host ""
  Write-Host "[2/9] Moving to Terraform directory..."

  Set-Location $TerraformDir

  Write-Host ""
  Write-Host "[3/9] Terraform init..."

  Invoke-NativeCommand `
    -Command {
      terraform init
    } `
    -ErrorMessage "Terraform init failed."

  Write-Host ""
  Write-Host "[4/9] Terraform validate..."

  Invoke-NativeCommand `
    -Command {
      terraform validate
    } `
    -ErrorMessage "Terraform validate failed."

  $ClusterExists = Test-EksClusterExists `
    -Name $ClusterName `
    -AwsRegion $Region `
    -AwsProfile $Profile

  if (-not $ClusterExists) {
    Write-Host ""
    Write-Host "[5/9] EKS cluster does not exist."
    Write-Host "Creating AWS infrastructure first..."
    Write-Host ""

    if ($AutoApprove) {
      Invoke-NativeCommand `
        -Command {
          terraform apply "-target=module.eks" -auto-approve
        } `
        -ErrorMessage "EKS bootstrap apply failed."
    }
    else {
      Invoke-NativeCommand `
        -Command {
          terraform apply "-target=module.eks"
        } `
        -ErrorMessage "EKS bootstrap apply failed."
    }
  }
  else {
    Write-Host ""
    Write-Host "[5/9] EKS cluster already exists. Skipping bootstrap creation."
  }

  Write-Host ""
  Write-Host "[6/9] Waiting for EKS cluster to become ACTIVE..."

  Invoke-NativeCommand `
    -Command {
      aws eks wait cluster-active `
        --name $ClusterName `
        --region $Region `
        --profile $Profile
    } `
    -ErrorMessage "EKS cluster did not become ACTIVE."

  Write-Host ""
  Write-Host "Updating kubeconfig..."

  Invoke-NativeCommand `
    -Command {
      aws eks update-kubeconfig `
        --name $ClusterName `
        --region $Region `
        --profile $Profile
    } `
    -ErrorMessage "Failed to update kubeconfig."

  Write-Host ""
  Write-Host "[7/9] Checking Kubernetes connection..."

  $Connected = $false

  for ($Attempt = 1; $Attempt -le 30; $Attempt++) {
    kubectl get nodes --request-timeout=10s | Out-Null

    if ($LASTEXITCODE -eq 0) {
      $Connected = $true
      break
    }

    Write-Host "Kubernetes API not ready. Retry $Attempt/30..."
    Start-Sleep -Seconds 10
  }

  if (-not $Connected) {
    throw "Could not connect to the EKS Kubernetes API."
  }

  Write-Host "Kubernetes connection succeeded."

  Write-Host ""
  Write-Host "[8/9] Installing platform resources and Argo CD..."

  if ($AutoApprove) {
    Invoke-NativeCommand `
      -Command {
        terraform apply -auto-approve
      } `
      -ErrorMessage "Terraform platform apply failed."
  }
  else {
    Invoke-NativeCommand `
      -Command {
        terraform apply
      } `
      -ErrorMessage "Terraform platform apply failed."
  }

  Write-Host ""
  Write-Host "Waiting for Argo CD server..."

  Invoke-NativeCommand `
    -Command {
      kubectl rollout status `
        deployment/argocd-server `
        -n argocd `
        --timeout=600s
    } `
    -ErrorMessage "Argo CD server did not become ready."

  Write-Host ""
  Write-Host "[9/9] Starting Argo CD port-forward..."

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

  Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList $ArgumentList

  Write-Host ""
  Write-Host "Bootstrap completed."
  Write-Host "Argo CD URL: http://127.0.0.1:$Port"
  Write-Host ""
}
catch {
  Write-Host ""
  Write-Host "ERROR:"
  Write-Host "Message: $($_.Exception.Message)"
  Write-Host "Type: $($_.Exception.GetType().FullName)"

  if ($_.InvocationInfo) {
    Write-Host "Script: $($_.InvocationInfo.ScriptName)"
    Write-Host "Line: $($_.InvocationInfo.ScriptLineNumber)"
    Write-Host "Code: $($_.InvocationInfo.Line)"
  }

  Write-Host ""
  Write-Host "Full error:"
  Write-Host ($_ | Out-String)

  Write-Host ""
  Write-Host "Check log file:"
  Write-Host $LogFile
  Write-Host ""

  exit 1
}