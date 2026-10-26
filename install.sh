#!/usr/bin/env bash
# ==============================================================================
# Discord PI Voice Operations - Auto-Installer para Gentle-Pi
# ==============================================================================
set -e

REPO_URL="https://github.com/WiloxDev/discord-pi.git"

echo "🎧 Instalando 'Discord PI Voice Operations' (Multiplataforma)..."

# 1. Determinar dinámicamente el directorio de extensiones de Pi
PI_EXT_BASE=""
if [ -n "$PI_CODING_AGENT_DIR" ] && [ -d "$PI_CODING_AGENT_DIR/extensions" ]; then
    PI_EXT_BASE="$PI_CODING_AGENT_DIR/extensions"
elif [ -n "$PI_AGENT_DIR" ] && [ -d "$PI_AGENT_DIR/extensions" ]; then
    PI_EXT_BASE="$PI_AGENT_DIR/extensions"
elif [ -d "$HOME/.gentle-shell/agent/extensions" ]; then
    PI_EXT_BASE="$HOME/.gentle-shell/agent/extensions"
elif [ -d "$HOME/.pi/agent-wilox/extensions" ]; then
    PI_EXT_BASE="$HOME/.pi/agent-wilox/extensions"
elif [ -d "$HOME/.pi/agent/extensions" ]; then
    PI_EXT_BASE="$HOME/.pi/agent/extensions"
elif [ -d "$HOME/.pi/extensions" ]; then
    PI_EXT_BASE="$HOME/.pi/extensions"
else
    PI_EXT_BASE="$HOME/.pi/agent/extensions"
fi

mkdir -p "$PI_EXT_BASE"
DEFAULT_EXT_DIR="$PI_EXT_BASE/discord-pi"

# 2. Detección informativa de Discord / Vesktop
DISCORD_FLAVOR="No detectado en ejecución"
if pgrep -x "Discord" >/dev/null 2>&1 || pgrep -x "discord" >/dev/null 2>&1; then
    DISCORD_FLAVOR="Discord Oficial"
elif pgrep -x "vesktop" >/dev/null 2>&1 || pgrep -f "dev.vencord.Vesktop" >/dev/null 2>&1; then
    DISCORD_FLAVOR="Vesktop"
fi
echo "🔍 Entorno Pi: $PI_EXT_BASE"
echo "🔍 Cliente Discord: $DISCORD_FLAVOR"

# 3. Clonar o Actualizar el Repositorio
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
  "customStatePath": null,
  "maxWidth": 52,
  "uiPlacement": "sidebar_preferred"
}
EOF
fi

echo ""
echo "✅ ¡Instalación completada con éxito!"
echo "📍 Ubicación: $DEFAULT_EXT_DIR"
echo "⚙️ Configuración: $USER_CONFIG (Totalmente personalizable)"
echo "✨ Al abrir tu próxima sesión de Gentle-Pi o Pi Agent, el widget se montará automáticamente."
