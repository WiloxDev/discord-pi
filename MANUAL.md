# 📖 Manual de Usuario e Integración: Discord-PI

Guía oficial para usuarios y desarrolladores sobre cómo instalar, configurar, usar e integrar **Discord-PI Voice Operations** en **Pi Agent** y **Gentle-Pi**, con soporte completo para **Windows y Linux**.

---

## 📑 Tabla de Contenidos

1. [¿Qué es Discord-PI?](#1-qué-es-discord-pi)
2. [Arquitectura Multiplataforma](#2-arquitectura-multiplataforma)
3. [Instalación Rápida (Windows y Linux)](#3-instalación-rápida)
4. [Vinculación de tu Cuenta de Discord](#4-vinculación-de-tu-cuenta-de-discord)
5. [Casos de Uso Reales](#5-casos-de-uso-reales)
6. [Comandos y Uso Diario](#6-comandos-y-uso-diario)
7. [Configuración Personalizada (`.discord-pirc.json`)](#7-configuración-personalizada)
8. [Integración para Desarrolladores y Bots](#8-integración-para-desarrolladores-y-bots)
9. [Resolución de Problemas (Troubleshooting)](#9-resolución-de-problemas-troubleshooting)

---

## 1. ¿Qué es Discord-PI?

**Discord-PI** es una extensión modular e interactiva para **Pi Agent** y **Gentle-Pi**. Proporciona una tarjeta de operaciones de voz (*Voice Operations Card*) montada de forma no invasiva en la interfaz de la terminal, permitiéndote:

- Monitorear en tiempo real el canal de voz en el que estás conectado.
- Ver quién está hablando mediante indicadores visuales (`🟢`).
- Identificar la latencia de la sala (ping) y la calidad de audio (bitrate).
- Silenciar o activar tu micrófono sin salir de la sesión de código ni tocar la ventana de Discord.

---

## 2. Arquitectura Multiplataforma

```text
┌────────────────────────────────────────────────────────┐
│                    Discord Desktop                     │
│  (Windows: \\.\pipe\discord-ipc-0..9)                 │
│  (Linux:   $XDG_RUNTIME_DIR/discord-ipc-0 / /run/user) │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
     [ IPC Nativo Directo ]    [ Archivo Puente JSON ]
               │                 (~/.discord-voice-state.json ó
               │                  %USERPROFILE%\.discord-voice-state.json)
               │                         │
               ▼                         ▼
   ┌───────────────────────────────────────────┐
   │         discord-pi (Extensión Pi)         │
   │  - Autodetección de Sistema Operativo     │
   │  - Mute bidireccional vía IPC nativo      │
   │  - Fallback a telemetría de archivo       │
   └─────────────────────┬─────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Interfaz TUI Adaptativa ]    [ Terminal Slash Commands ]
╭─ Discord Voice ─────────╮    /discord mute
│ #general (64k)     24ms │    /discord status
│ 🎙 Wilson Lavio [ 🔇 ]  │    /discord users
│ 👥 3 en canal   [ ↗ ]   │    /discord refresh
│   🟢 M@t3 Co$ido        │
│   ○  J0mendo-Dev        │
╰─────────────────────────╯
```

1. **Conexión Directa Multiplataforma**: La extensión se conecta al transporte IPC correspondiente a cada sistema:
   - **Windows**: Named Pipes nativos del kernel (`\\.\pipe\discord-ipc-0`).
   - **Linux**: UNIX Domain Sockets (`$XDG_RUNTIME_DIR/discord-ipc-0`, `/run/user/<uid>/discord-ipc-0`).
2. **Puente Desacoplado**: Si no hay conexión IPC directa, lee el archivo JSON de telemetría de forma atómica.
3. **Fail-Safe / A prueba de fallos**: Si Discord se cierra o la llamada termina, la card muestra de inmediato `[ • Desconectado ]` sin arrojar errores ni bloquear la interfaz.

---

## 3. Instalación Rápida

### Opción A: En Linux / macOS (Bash)
```bash
curl -sSL https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.sh | bash
```

### Opción B: En Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.ps1 | iex
```

### Opción C: Instalación Manual
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

Al abrir una nueva sesión de Pi (`pi`), la extensión se cargará de forma automática.

---

## 4. Vinculación de tu Cuenta de Discord

### Método A: Vinculación Rápida por Nick o ID (Recomendada)

1. **Obtén tu Discord User ID**:
   - En tu cliente de Discord, ve a **Ajustes de Usuario (⚙️)** > **Avanzado**.
   - Activa el interruptor **"Modo Desarrollador"**.
   - Haz clic derecho sobre tu propio avatar/nombre y selecciona **"Copiar ID de usuario"**.
2. **Configura tu archivo `.discord-pirc.json`**:
   - En Linux: `~/.discord-pirc.json`
   - En Windows: `%USERPROFILE%\.discord-pirc.json`
   ```json
   {
     "defaultUsername": "TuNombreEnDiscord",
     "defaultUserId": "1532522904032514197"
   }
   ```
3. ¡Listo! La extensión priorizará tu usuario en la cabecera interactiva y asociará el estado de tu micrófono.

### Método B: Puente de Datos (Bots o Daemons Externos)

Si utilizas un daemon en segundo plano o bot de Discord que monitorea tus canales, este puede volcar el estado en:
- Linux: `~/.discord-voice-state.json`
- Windows: `%USERPROFILE%\.discord-voice-state.json`

---

## 5. Casos de Uso Reales

### Caso 1: Pair Programming y Sesiones de Debugging
- **Escenario**: Estás programando en Pi junto a un compañero en un canal de voz de Discord.
- **Ventaja**: Ves quién está hablando (`🟢`), la latencia (`ping: 24ms`) y quién está en la sala sin cambiar de ventana.

### Caso 2: Mute Rápido Durante Reuniones
- **Escenario**: Necesitas silenciarte inmediatamente mientras estás escribiendo código.
- **Acción**: Haz clic en el botón `[ Mute ]` de la card o escribe `/discord mute`.
- **Ventaja**: Silenciamiento instantáneo sin cambiar de ventana (`Alt+Tab`).

---

## 6. Comandos y Uso Diario

En el prompt interactivo de Pi puedes escribir los siguientes comandos:

| Comando | Función |
| :--- | :--- |
| `/discord mute` ó `/discord toggle` | Alterna el micrófono entre silenciado (`🔇`) y activo (`🎙`). |
| `/discord status` | Muestra el tipo de conexión activa (IPC Nativo en Windows/Linux o Puente JSON) y canal actual. |
| `/discord users` | Muestra un resumen informativo en consola: usuarios en la llamada y quién habla. |
| `/discord refresh` | Fuerza la reconexión con el socket/pipe de Discord y lee el estado más fresco. |

---

## 7. Configuración Personalizada

Puedes editar el archivo de configuración en tu directorio de usuario:

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
  "maxWidth": 52
}
```

### Opciones explicadas:
- `defaultUsername`: Tu nombre o nick en Discord.
- `defaultUserId`: Tu ID numérico de usuario en Discord para reconocimiento exacto.
- `participantPreview`: Número máximo de compañeros visibles en la lista rápida (por defecto `3`).
- `pollIntervalMs`: Frecuencia de actualización en milisegundos (por defecto `1500ms`).
- `customStatePath`: Ruta personalizada absoluta si el estado se genera en otra ubicación.
- `maxWidth`: Ancho máximo en columnas de la tarjeta en la terminal (por defecto `52`).

---

## 8. Integración para Desarrolladores y Bots

Estructura del archivo JSON de telemetría esperado:

```json
{
  "app_open": true,
  "state": "live",
  "channel": "Sala de Trabajo",
  "bitrate_kbps": 64,
  "ping_ms": 28,
  "self": {
    "displayName": "Wilson Lavio",
    "muted": false,
    "deafened": false
  },
  "voice_states": [
    {
      "displayName": "Compañero Dev",
      "muted": false,
      "speaking": true
    },
    {
      "displayName": "Tech Lead",
      "muted": true,
      "speaking": false
    }
  ]
}
```

---

## 9. Resolución de Problemas (Troubleshooting)

### La tarjeta dice `• Desconectado`
- Verifica si Discord Desktop está abierto y en un canal de voz activo.
- Ejecuta `/discord status` para revisar el canal y el transporte IPC detectado.
- Puedes probar el archivo de ejemplo ejecutando:
  ```bash
  # Linux
  cp fixtures/sample-status.json ~/.discord-voice-state.json
  # Windows (PowerShell)
  Copy-Item fixtures\sample-status.json "$env:USERPROFILE\.discord-voice-state.json"
  ```
- Escribe `/discord refresh` en Pi.

### La extensión no aparece en Pi
- Verifica que la carpeta `dist/index.js` exista. Si no, compila con:
  ```bash
  npm run build
  ```
