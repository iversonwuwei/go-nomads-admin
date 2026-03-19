#!/usr/bin/env pwsh
<#!
.SYNOPSIS
  Go-Nomads Admin - Local Docker Deploy (compose)
.EXAMPLE
  ./deploy-web-local.ps1
  ./deploy-web-local.ps1 -SkipBuild
  ./deploy-web-local.ps1 -ForceRecreate
#>
param(
  [switch]$SkipBuild,
  [switch]$ForceRecreate,
  [switch]$UseMirror,
  [switch]$Clean,
  [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
  Write-Host "Usage: ./deploy-web-local.ps1 [-SkipBuild] [-ForceRecreate] [-UseMirror] [-Clean] [-Help]"
  Write-Host "Note: this script now ALWAYS removes existing container/image and rebuilds." -ForegroundColor Yellow
  exit 0
}

function Select-ComposeCmd {
  $docker = if ($env:DOCKER_BINARY) { $env:DOCKER_BINARY } else { (Get-Command docker -ErrorAction SilentlyContinue).Path }
  if ($docker) { return @($docker, "compose") }
  $podman = if ($env:PODMAN_BINARY) { $env:PODMAN_BINARY } else { (Get-Command podman -ErrorAction SilentlyContinue).Path }
  if ($podman) { return @($podman, "compose") }
  throw "docker or podman not found"
}

# Ensure Docker Desktop (Windows) is running so compose does not fail early
function Assert-DockerReady {
  try {
    docker info | Out-Null
  }
  catch {
    Write-Host "Docker is not reachable. Please start Docker Desktop for Windows and retry." -ForegroundColor Red
    throw
  }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$ComposeFile = Join-Path $RootDir "docker-compose.yml"

if (-not (Test-Path $ComposeFile)) {
  throw "docker-compose.yml not found at $ComposeFile"
}

$ComposeCmd = Select-ComposeCmd
$MirrorPrefix = if ($env:MIRROR_PREFIX) { $env:MIRROR_PREFIX } else { 'docker.1ms.run' }

if ($UseMirror) {
  $env:NODE_IMAGE = "$MirrorPrefix/library/node:20.18.0-alpine"
  if (-not $env:NPM_REGISTRY_SERVER) {
    $env:NPM_REGISTRY_SERVER = 'https://registry.npmmirror.com'
  }
}

Write-Host "Using compose: $($ComposeCmd -join ' ')" -ForegroundColor Cyan
Write-Host "Project root: $RootDir" -ForegroundColor Cyan
Write-Host "Platform: linux/amd64" -ForegroundColor Cyan
if ($UseMirror) {
  Write-Host "Mirror mode: enabled" -ForegroundColor Yellow
  Write-Host "NODE_IMAGE: $env:NODE_IMAGE" -ForegroundColor Yellow
  Write-Host "NPM_REGISTRY_SERVER: $env:NPM_REGISTRY_SERVER" -ForegroundColor Yellow
}

if ($SkipBuild) {
  Write-Host "[Info] -SkipBuild is ignored. Script enforces clean rebuild deployment." -ForegroundColor Yellow
}

Assert-DockerReady

# 设置构建平台环境变量
$env:DOCKER_DEFAULT_PLATFORM = "linux/amd64"
$env:DOCKER_BUILDKIT = "1"
$env:COMPOSE_DOCKER_CLI_BUILD = "1"

# 目标容器/镜像
$ContainerName = "go-nomads-admin"
$ImageName = "go-nomads-admin:latest"

# 构建完整的参数列表（强制重建）
$upArgs = @('-f', $ComposeFile, 'up', '-d', '--build', '--force-recreate')
if ($Clean) { $upArgs += '--remove-orphans' }

Push-Location $RootDir
try {
  $nativeErrPref = $PSNativeCommandUseErrorActionPreference
  $PSNativeCommandUseErrorActionPreference = $false
  $errorActionPrefBeforeCleanup = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  Write-Host "Stopping existing stack..." -ForegroundColor Yellow
  & $ComposeCmd[0] $ComposeCmd[1] -f $ComposeFile --ansi never down --remove-orphans *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[Warn] compose down returned exit code $LASTEXITCODE, continue cleanup..." -ForegroundColor Yellow
  }

  Write-Host "Removing existing container (if present): $ContainerName" -ForegroundColor Yellow
  & $ComposeCmd[0] rm -f $ContainerName *> $null

  Write-Host "Removing existing image (if present): $ImageName" -ForegroundColor Yellow
  & $ComposeCmd[0] rmi -f $ImageName *> $null

  # 恢复严格模式，后续 build/up 失败时应直接终止。
  $ErrorActionPreference = $errorActionPrefBeforeCleanup
  $PSNativeCommandUseErrorActionPreference = $nativeErrPref

  Write-Host "Rebuilding and starting container..." -ForegroundColor Yellow
  & $ComposeCmd[0] $ComposeCmd[1] @upArgs
  if ($LASTEXITCODE -ne 0) {
    throw "compose up failed with exit code $LASTEXITCODE"
  }

  & $ComposeCmd[0] $ComposeCmd[1] -f $ComposeFile ps
  if ($LASTEXITCODE -ne 0) {
    throw "compose ps failed with exit code $LASTEXITCODE"
  }
}
finally {
  $ErrorActionPreference = $errorActionPrefBeforeCleanup
  $PSNativeCommandUseErrorActionPreference = $nativeErrPref
  Pop-Location
}

Write-Host "✅ go-nomads-admin is running at http://localhost:3002" -ForegroundColor Green
