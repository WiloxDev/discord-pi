#!/usr/bin/env bash
# ==============================================================================
# Discord PI Voice Operations - Auto-Installer para Gentle-Pi
# ==============================================================================
set -e

REPO_URL="https://github.com/WiloxDev/discord-pi.git"
DEFAULT_EXT_DIR="$HOME/.pi/agent/extensions/discord-pi"

echo "🎧 Instalando 'Discord PI Voice Operations' para Gentle-Pi..."

# 1. Determinar el directorio de extensiones de Pi
PI_EXT_BASE="$HOME/.pi/agent/extensions"
mkdir -p "$PI_EXT_BASE"

# 2. Clonar o Actualizar el Repositorio
if [ -d "$DEFAULT_EXT_DIR/.git" ]; then
    echo "🔄 Actualizando versión existente en $DEFAULT_EXT_DIR..."
    git -C "$DEFAULT_EXT_DIR" pull --ff-only
else
    echo "📥 Clonando extensión en $DEFAULT_EXT_DIR..."
    rm -rf "$DEFAULT_EXT_DIR"
    git clone "$REPO_URL" "$DEFAULT_EXT_DIR"
fi

# 3. Compilar TypeScript si npm está disponible
if command -v npm >/dev/null 2>&1; then
    echo "🔨 Compilando extensión..."
    cd "$DEFAULT_EXT_DIR"
    npm install --silent --no-audit --no-fund
    npm run build --silent
fi

# 4. Crear configuración por defecto si no existe
USER_CONFIG="$HOME/.discord-pirc.json"
if [ ! -f "$USER_CONFIG" ]; then
    echo "⚙️  Creando archivo de configuración personal en $USER_CONFIG..."
    cat << 'EOF' > "$USER_CONFIG"
{
  "enabled": true,
  "defaultUsername": "Wilson Lavio",
  "participantPreview": 3,
  "showSpeaking": true,
  "showBitrate": true,
  "showPing": true,
  "showAudioWhenIdle": true,
  "pollIntervalMs": 1500,
  "customStatePath": null
}
EOF
fi

echo ""
echo "✅ ¡Instalación completada con éxito!"
echo "📍 Ubicación: $DEFAULT_EXT_DIR"
echo "⚙️ Configuración: $USER_CONFIG (Totalmente personalizable)"
echo "✨ Al abrir tu próxima sesión de Gentle-Pi, el widget se montará en tu sidebar derecho."
