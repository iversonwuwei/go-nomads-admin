#!/usr/bin/env pwsh
<#!
.SYNOPSIS
  Build and push go-nomads-admin image to Huawei Cloud SWR.
.EXAMPLE
  ./build-and-push-to-swr.ps1 -Login -Tag v1.0.0
#>
[CmdletBinding()]
param(
  [switch]$Help,
  [switch]$Login,
  [switch]$BuildOnly,
  [switch]$PushOnly,
  [string]$Tag = "latest"
)

$ErrorActionPreference = 'Stop'

if ($Help) {
  Write-Host @"
Usage: ./build-and-push-to-swr.ps1 [-Login] [-BuildOnly] [-PushOnly] [-Tag <tag>] [-Help]
Env vars: SWR_REGISTRY (default swr.ap-southeast-3.myhuaweicloud.com), SWR_ORGANIZATION (default go-nomads), SWR_AK/SWR_SK, SWR_REGION (default ap-southeast-3)
"@
  exit 0
}

$SWR_REGISTRY = if ($env:SWR_REGISTRY) { $env:SWR_REGISTRY } else { "swr.ap-southeast-3.myhuaweicloud.com" }
$SWR_ORGANIZATION = if ($env:SWR_ORGANIZATION) { $env:SWR_ORGANIZATION } else { "go-nomads" }
$IMAGE_TAG = $Tag
$IMAGE_NAME = "$SWR_REGISTRY/$SWR_ORGANIZATION/go-nomads-admin:$IMAGE_TAG"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot

function Login-Swr {
  $region = if ($env:SWR_REGION) { $env:SWR_REGION } else { "ap-southeast-3" }
  if (-not $env:SWR_AK -or -not $env:SWR_SK) {
    throw "SWR_AK and SWR_SK are required for login"
  }
  $user = "$region@$($env:SWR_AK)"
  Write-Host "Logging in to $SWR_REGISTRY as $user" -ForegroundColor Cyan
  $env:SWR_SK | docker login -u $user --password-stdin $SWR_REGISTRY | Out-Null
}

function Build-Image {
  Write-Host "Building image: $IMAGE_NAME" -ForegroundColor Yellow
  Push-Location $PROJECT_ROOT
  try {
    docker build `
      --platform linux/amd64 `
      --provenance=false `
      --sbom=false `
      -t $IMAGE_NAME `
      -f "$PROJECT_ROOT/Dockerfile" `
      .
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
  }
  finally { Pop-Location }
  Write-Host "Build complete" -ForegroundColor Green
}

function Push-Image {
  Write-Host "Pushing image: $IMAGE_NAME" -ForegroundColor Yellow
  docker push $IMAGE_NAME
  if ($LASTEXITCODE -ne 0) { throw "Push failed" }
  Write-Host "Push complete" -ForegroundColor Green
}

if ($Login) { Login-Swr }

if ($PushOnly) {
  Push-Image
  exit 0
}

Build-Image

if ($BuildOnly) { exit 0 }

Push-Image
