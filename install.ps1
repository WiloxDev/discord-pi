<#
==============================================================================
Discord PI Voice Operations - Auto-Installer para Windows (Gentle-Pi / Pi Agent)
==============================================================================
#>
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/WiloxDev/discord-pi.git"
$HomeDir = [Environment]::GetFolderPath("UserProfile")
$PiExtBase = Join-Path $HomeDir ".pi\agent\extensions"
$DefaultExtDir = Join-Path $PiExtBase "discord-pi"

Write-Host "🎧 Instalando 'Discord PI Voice Operations' para Windows..." -ForegroundColor Cyan

# 1. Crear directorio base de extensiones si no existe
if (-not (Test-Path $PiExtBase)) {
    New-Item -ItemType Directory -Path $PiExtBase -Force | Out-Null
}

# 2. Clonar o Actualizar el Repositorio
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
  "maxWidth": 52
}
'@
    Set-Content -Path $UserConfig -Value $DefaultConfigContent -Encoding UTF8
}

Write-Host ""
Write-Host "✅ ¡Instalación en Windows completada con éxito!" -ForegroundColor Green
Write-Host "📍 Ubicación: $DefaultExtDir"
Write-Host "⚙️ Configuración: $UserConfig"
Write-Host "✨ Al abrir tu próxima sesión de Gentle-Pi o Pi Agent, el widget se montará automáticamente."
