# 🎧 Discord PI Voice Operations

Card reactiva e interactiva de Discord Voice para **Pi Agent** y **Gentle-Pi**, con soporte nativo de **Windows y Linux**.

---

## ✨ Características

- 🎙 **Telemetría de Voz en Tiempo Real**: Visualización de canal activo, bitrate de sala y latencia (ping en ms).
- 🔄 **Soporte Dinámico Dual (Discord Oficial + Vesktop)**:
  - Detección automática en runtime del cliente activo: **Discord Desktop Oficial** o **Vesktop** (vía arRPC).
  - Badge visual en tarjeta: `Discord Voice (Oficial)` o `Discord Voice (Vesktop)`.
- 🪟 **Soporte Multiplataforma Total (Windows + Linux)**:
  - **Windows**: Conexión nativa por Named Pipes estándar y extendidos (`\\.\pipe\discord-ipc-0..9` y `\\?\pipe\discord-ipc-0..9`) y rutas en `%APPDATA%` / `%USERPROFILE%`.
  - **Linux / macOS**: Conexión nativa por UNIX Domain Sockets (`$XDG_RUNTIME_DIR/discord-ipc-0`, Snap, Flatpak) y `$HOME`.
- 🎯 **Detección Dinámica de Entorno Pi**: Los instaladores reconocen perfiles personalizados (`agent-wilox`, `agent`, o global) configurándose en el entorno activo de Gentle-Pi o Pi nativo.
- 🟢 **Prioridad de Hablantes**: Detección dinámica de participantes que están hablando en vivo (`🟢`), tu usuario (`Wilson Lavio` o por ID de Discord) y lista alfabética.
- 🔇 **Control de Micrófono Inteligente**: Mute bidireccional nativo para Discord Oficial e instrucciones asistidas para Vesktop.
- 👥 **Contador de Participantes**: Inspección rápida de la cantidad de usuarios presentes en la llamada.
- 🛡️ **Arquitectura Híbrida a Prueba de Fallos**:
  1. Conexión IPC local directa si Discord Desktop o Vesktop está activo.
  2. Fallback a archivo de telemetría JSON (`~/.discord-voice-state.json` o `%USERPROFILE%\.discord-voice-state.json`) para daemons/bots.
  3. Estado desconectado elegante cuando Discord está cerrado o sin canal activo.

---

## 🚀 Instalación Rápida

### 🐧 En Linux / macOS (Bash)
```bash
curl -sSL https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.sh | bash
```

### 🪟 En Windows (PowerShell)
Ejecuta en una consola de PowerShell:
```powershell
irm https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.ps1 | iex
```

### 📦 Clonación Manual (Cualquier SO)
```bash
# Linux / macOS
git clone https://github.com/WiloxDev/discord-pi.git ~/.pi/agent/extensions/discord-pi
cd ~/.pi/agent/extensions/discord-pi
npm install && npm run build

# Windows (PowerShell)
git clone https://github.com/WiloxDev/discord-pi.git "$env:USERPROFILE\.pi\agent\extensions\discord-pi"
cd "$env:USERPROFILE\.pi\agent\extensions\discord-pi"
npm install; npm run build
```

---

## ⚙️ Configuración (`~/.discord-pirc.json` o `%USERPROFILE%\.discord-pirc.json`)

El instalador genera automáticamente tu archivo de configuración:

```json
{
  "enabled": true,
  "defaultUsername": "Wilson Lavio",
  "defaultUserId": "1532522904032514197",
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
```

### Opciones de visualización (`uiPlacement`):
- `"sidebar_preferred"` (Por defecto): Si el sidebar derecho de Gentle-Shell está activo ($\ge 140$ columnas), se monta en el sidebar y **mantiene el chat 100% limpio**. Si la terminal se reduce, usa fallback adaptativo.
- `"sidebar_only"`: Se monta **exclusivamente en el sidebar lateral**. Nunca invade el chat ni la barra de entrada de texto.
- `"chat_above"`: Fuerza el montaje sobre el editor de texto.
- `"disabled"`: Desactiva el renderizado visual (los comandos `/discord` siguen funcionando).

---

## 💻 Comandos en la Terminal de Pi

Puedes interactuar con Discord mediante el comando `/discord`:

| Comando | Acción |
| :--- | :--- |
| `/discord mute` (o clic) | Alterna el micrófono entre silenciado (`🔇`) y activo (`🎙`) |
| `/discord status` | Muestra el estado del transporte IPC, sistema operativo y canal |
| `/discord users` | Muestra el resumen de participantes y quién habla |
| `/discord refresh` | Fuerza la reconexión y actualización de telemetría |

---

## 📄 Licencia

MIT © [WiloxDev](https://github.com/WiloxDev)

---

## 📚 Documentación Completa

- [MANUAL.md](./MANUAL.md): Manual general de usuario, arquitectura, diagramas y casos de uso.
- [docs/VESKTOP-GUIDE.md](./docs/VESKTOP-GUIDE.md): Guía específica paso a paso para la integración con **Vesktop** en Windows y Linux.
