<#
==============================================================================
Discord PI Voice Operations - Auto-Installer para Windows (Gentle-Pi / Pi Agent)
==============================================================================
#>
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/WiloxDev/discord-pi.git"
$HomeDir = [Environment]::GetFolderPath("UserProfile")

Write-Host "🎧 Instalando 'Discord PI Voice Operations' para Windows..." -ForegroundColor Cyan

# 1. Determinar dinámicamente el directorio de extensiones de Pi
$PiExtBase = ""
if ($env:PI_CODING_AGENT_DIR -and (Test-Path (Join-Path $env:PI_CODING_AGENT_DIR "extensions"))) {
    $PiExtBase = Join-Path $env:PI_CODING_AGENT_DIR "extensions"
} elseif ($env:PI_AGENT_DIR -and (Test-Path (Join-Path $env:PI_AGENT_DIR "extensions"))) {
    $PiExtBase = Join-Path $env:PI_AGENT_DIR "extensions"
} elseif (Test-Path (Join-Path $HomeDir ".gentle-shell\agent\extensions")) {
    $PiExtBase = Join-Path $HomeDir ".gentle-shell\agent\extensions"
} elseif (Test-Path (Join-Path $HomeDir ".pi\agent-wilox\extensions")) {
    $PiExtBase = Join-Path $HomeDir ".pi\agent-wilox\extensions"
} elseif (Test-Path (Join-Path $HomeDir ".pi\agent\extensions")) {
    $PiExtBase = Join-Path $HomeDir ".pi\agent\extensions"
} elseif (Test-Path (Join-Path $HomeDir ".pi\extensions")) {
    $PiExtBase = Join-Path $HomeDir ".pi\extensions"
} else {
    $PiExtBase = Join-Path $HomeDir ".pi\agent\extensions"
}

if (-not (Test-Path $PiExtBase)) {
    New-Item -ItemType Directory -Path $PiExtBase -Force | Out-Null
}

$DefaultExtDir = Join-Path $PiExtBase "discord-pi"

# 2. Detección informativa de cliente Discord en Windows
$DiscordFlavor = "No detectado en ejecución"
if (Get-Process -Name "Discord" -ErrorAction SilentlyContinue) {
    $DiscordFlavor = "Discord Oficial"
} elseif (Get-Process -Name "Vesktop" -ErrorAction SilentlyContinue) {
    $DiscordFlavor = "Vesktop"
}
Write-Host "🔍 Entorno Pi: $PiExtBase" -ForegroundColor Gray
Write-Host "🔍 Cliente Discord detectado: $DiscordFlavor" -ForegroundColor Cyan

# 3. Clonar o Actualizar el Repositorio
if (Test-Path (Join-Path $DefaultExtDir ".git")) {
    Write-Host "🔄 Actualizando versión existente en $DefaultExtDir..." -ForegroundColor Yellow
    git -C "$DefaultExtDir" pull --ff-only
} else {
    Write-Host "📥 Clonando extensión en $DefaultExtDir..." -ForegroundColor Yellow
    if (Test-Path $DefaultExtDir) {
        Remove-Item -Recurse -Force $DefaultExtDir
    }
    git clone $RepoUrl "$DefaultExtDir"
}

# 3. Compilar TypeScript
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "🔨 Compilando extensión con TypeScript..." -ForegroundColor Yellow
    Push-Location $DefaultExtDir
    try {
        npm install --silent --no-audit --no-fund
        npm run build --silent
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "npm no está en el PATH. Recuerda ejecutar 'npm install' y 'npm run build' manualmente."
}

# 4. Crear configuración por defecto si no existe
$UserConfig = Join-Path $HomeDir ".discord-pirc.json"
if (-not (Test-Path $UserConfig)) {
    Write-Host "⚙️  Creando archivo de configuración en $UserConfig..." -ForegroundColor Green
    $DefaultConfigContent = @'
{
  "enabled": true,
  "defaultUsername": "Wilson Lavio",
  "participantPreview": 3,
  "showSpeaking": true,
  "showBitrate": true,
  "showPing": true,
  "showAudioWhenIdle": true,
  "pollIntervalMs": 1500,
  "customStatePath": null,
  "maxWidth": 52,
  "uiPlacement": "sidebar_preferred"
}
'@
    Set-Content -Path $UserConfig -Value $DefaultConfigContent -Encoding UTF8
}

Write-Host ""
Write-Host "✅ ¡Instalación en Windows completada con éxito!" -ForegroundColor Green
Write-Host "📍 Ubicación: $DefaultExtDir"
Write-Host "⚙️ Configuración: $UserConfig"
Write-Host "✨ Al abrir tu próxima sesión de Gentle-Pi o Pi Agent, el widget se montará automáticamente."
