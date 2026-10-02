# 📖 Manual de Usuario e Integración: Discord-PI

Guía oficial para usuarios y desarrolladores sobre cómo instalar, configurar, usar e integrar **Discord-PI Voice Operations** en **Gentle-Pi / Pi Agent**.

---

## 📑 Tabla de Contenidos

1. [¿Qué es Discord-PI?](#1-qué-es-discord-pi)
2. [Arquitectura y Cómo Funciona](#2-arquitectura-y-cómo-funciona)
3. [Instalación Rápida](#3-instalación-rápida)
4. [Vinculación de tu Cuenta de Discord](#4-vinculación-de-tu-cuenta-de-discord)
5. [Casos de Uso Reales](#5-casos-de-uso-reales)
6. [Comandos y Uso Diario](#6-comandos-y-uso-diario)
7. [Configuración Personalizada (`~/.discord-pirc.json`)](#7-configuración-personalizada)
8. [Integración para Desarrolladores y Bots](#8-integración-para-desarrolladores-y-bots)
9. [Resolución de Problemas (Troubleshooting)](#9-resolución-de-problemas-troubleshooting)

---

## 1. ¿Qué es Discord-PI?

**Discord-PI** es una extensión modular e interactiva para **Gentle-Pi** y el arnés de agentes **Pi**. Proporciona una tarjeta de operaciones de voz (*Voice Operations Card*) montada directamente en el riel o sidebar derecho de la terminal, permitiéndote:

- Monitorear en tiempo real el canal de voz en el que estás conectado.
- Ver quién está hablando mediante indicadores visuales (`🟢`).
- Identificar la latencia de la sala (ping) y la calidad de audio (bitrate).
- Silenciar o activar tu micrófono sin salir de la sesión de código ni tocar la ventana de Discord.

---

## 2. Arquitectura y Cómo Funciona

```text
┌─────────────────────────┐       ┌───────────────────────────┐
│     Discord Desktop     │       │  Daemon / Puente / Script │
│  (Linux / Mac / Windows)│       │  (escribe status.json)    │
└────────────┬────────────┘       └─────────────┬─────────────┘
             │                                  │
             ▼                                  ▼
      ~/.discord-voice-state.json  ó  ~/.local/state/wilox-tools/.../status.json
                               │
                               ▼
                    ┌──────────────────────┐
                    │      discord-pi      │
                    │   (Extensión de Pi)  │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   [ Sidebar Derecho TUI ]              [ Terminal Slash Commands ]
╭─ Discord Voice ─────────╮             /discord mute
│ #general (64k)     24ms │             /discord users
│ 🎙 Wilson Lavio [ 🔇 ]  │             /discord refresh
│ 👥 3 en canal   [ ↗ ]   │
│   🟢 M@t3 Co$ido        │
│   ○  J0mendo-Dev        │
╰─────────────────────────╯
```

1. **Lectura No Bloqueante**: La extensión consulta el estado de voz de forma reactiva cada `1500ms` (configurable).
2. **Cero Dependencias Pesadas**: No satura la memoria ni ralentiza el agente de codificación.
3. **Fail-Safe / A prueba de fallos**: Si Discord se cierra o la llamada termina, la card muestra de inmediato `[ • Desconectado ]` sin arrojar errores ni bloquear la interfaz.

---

## 3. Instalación Rápida

### Opción A: Instalación Automática (Recomendada)
Ejecuta este comando en tu terminal Linux/macOS:

```bash
curl -sSL https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.sh | bash
```

El script se encarga de:
1. Clonar el repositorio en `~/.pi/agent/extensions/discord-pi`.
2. Instalar dependencias ligeras y compilar TypeScript (`npm run build`).
3. Crear tu archivo de configuración personal en `~/.discord-pirc.json`.

### Opción B: Instalación Manual
```bash
git clone https://github.com/WiloxDev/discord-pi.git ~/.pi/agent/extensions/discord-pi
cd ~/.pi/agent/extensions/discord-pi
npm install
npm run build
```

Al abrir una nueva sesión de Gentle-Pi (`pi`), la extensión se cargará de forma automática.

---

## 4. Vinculación de tu Cuenta de Discord

Para que la tarjeta identifique exactamente qué usuario eres tú, distinga tu micrófono (`isSelf`) y te coloque siempre en la cabecera interactiva, existen tres formas de vinculación según tu entorno:

### Método A: Vinculación Rápida por Nick/ID (Recomendada y más fácil)

Este método no requiere crear bots ni configurar tokens complejos:

1. **Obtén tu Discord User ID**:
   - En tu cliente de Discord, ve a **Ajustes de Usuario (⚙️)** > **Avanzado**.
   - Activa el interruptor **"Modo Desarrollador"**.
   - Haz clic derecho sobre tu propio avatar/nombre (en cualquier canal o en la lista de amigos) y selecciona **"Copiar ID de usuario"**.
2. **Configura tu archivo `~/.discord-pirc.json`**:
   Abre o crea el archivo `~/.discord-pirc.json` y coloca tu nombre o ID:
   ```json
   {
     "defaultUsername": "TuNombreEnDiscord",
     "defaultUserId": "1532522904032514197"
   }
   ```
3. ¡Listo! Cada vez que estés en un canal de voz, `discord-pi` sabrá que eres tú y priorizará tu estado de micrófono.

---

### Método B: Vinculación Oficial mediante Discord RPC (App de Desarrollador)

Si deseas sincronización bidireccional automática mediante los sockets IPC locales de Discord Desktop (`/run/user/1000/discord-ipc-0` o Named Pipe):

1. **Crear una Aplicación en Discord**:
   - Entra en [Discord Developer Portal](https://discord.com/developers/applications).
   - Haz clic en **"New Application"** y dale de nombre `Gentle-Pi` o `Discord-PI`.
   - Ve a la pestaña **OAuth2** y copia tu **Client ID** (Application ID).
2. **Habilitar Scopes de Voz y Actividad**:
   - En la sección **OAuth2** > **URL Generator**, marca las casillas:
     - `rpc` (acceso a la API RPC local).
     - `rpc.voice.read` (lectura de estado de voz y participantes).
     - `rpc.activities.write` (actualizar estado / rich presence si lo deseas).
3. **Guardar en tu Configuración**:
   Añade el `clientId` en tu archivo `~/.discord-pirc.json`:
   ```json
   {
     "clientId": "TU_APPLICATION_CLIENT_ID"
   }
   ```
4. Al abrir Discord Desktop y arrancar Gentle-Pi, Discord mostrará una ventana emergente: **"¿Autorizar a Gentle-Pi para acceder a tu Discord?"**. Pulsa **Autorizar**. A partir de ese momento, la vinculación es 100% nativa.

---

### Método C: Vinculación mediante Bot de Servidor (Para Teams / Canales Grupales)

Si estás en un servidor comunitario o de empresa y quieres que un bot reporte el estado de la sala:

1. Crea un Bot en el Developer Portal y obtén el `BOT_TOKEN`.
2. Otorga al bot el permiso de **Voice State Intent** (`GUILD_VOICE_STATES`).
3. El bot puede reportar el estado de los miembros directamente al archivo puente `~/.discord-voice-state.json`.

---

## 5. Casos de Uso Reales

### Caso de Uso 1: Pair Programming y Sesiones de Debugging
- **Escenario**: Estás programando en Gentle-Pi junto a un colega o equipo en un canal de voz de Discord.
- **Ventaja**: No necesitas tener la ventana pesada de Discord abierta en un segundo monitor. En la esquina derecha de tu terminal ves si tu compañero está hablando (`🟢`), si alguien entró a la sala o si tu audio tiene lag (`ping: 180ms`).

### Caso de Uso 2: Mute Rápido Durante Reuniones
- **Escenario**: Estás en una llamada grupal y necesitas toser o hablar con alguien en tu habitación.
- **Acción**: Haz clic directamente sobre el botón `[ Mute ]` de la card con el mouse, o escribe en la consola `/discord mute`.
- **Ventaja**: Silenciamiento instantáneo en 0 milisegundos sin cambiar de ventana (`Alt+Tab`).

### Caso de Uso 3: Streaming o Trabajo en Vivo (Live Coding)
- **Escenario**: Estás transmitiendo en vivo o grabando un tutorial de código.
- **Ventaja**: La tarjeta muestra una interfaz cyberpunk limpia, minimalista y estética que encaja perfectamente con el diseño de Gentle-Pi.

---

## 6. Comandos y Uso Diario

En el prompt interactivo de Pi puedes escribir los siguientes comandos:

| Comando | Función |
| :--- | :--- |
| `/discord mute` ó `/discord toggle` | Alterna el micrófono entre silenciado (`🔇`) y activo (`🎙`). |
| `/discord users` | Muestra un resumen informativo en consola: usuarios en la llamada, quién habla y en qué canal. |
| `/discord refresh` | Invalida la caché e inmediatamente lee el estado más fresco. |

---

## 7. Configuración Personalizada

Puedes editar el archivo `~/.discord-pirc.json` (o `.discord-pi.json` en la raíz de tu proyecto):

```json
{
  "enabled": true,
  "defaultUsername": "TuNombre",
  "participantPreview": 3,
  "showSpeaking": true,
  "showBitrate": true,
  "showPing": true,
  "showAudioWhenIdle": true,
  "pollIntervalMs": 1500,
  "customStatePath": null
}
```

### Opciones explicadas:
- `defaultUsername`: Tu nombre o nick en Discord para que la card te priorice y resalte.
- `participantPreview`: Número máximo de compañeros visibles en la lista rápida (por defecto `3`).
- `pollIntervalMs`: Frecuencia de actualización en milisegundos (por defecto `1500ms`).
- `customStatePath`: Ruta personalizada absoluta si usas un bot o daemon que escriba el estado en otra carpeta.

---

## 8. Integración para Desarrolladores y Bots

Si tienes un bot, script en Python o daemon local que monitoree Discord, puedes alimentar a `discord-pi` simplemente escribiendo un JSON en `~/.discord-voice-state.json`.

### Estructura del JSON esperado:

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
- Verifica que el archivo de estado esté presente o que Discord esté en un canal de voz activo.
- Puedes probar con el archivo de ejemplo incluido ejecutando:
  ```bash
  cp ~/.pi/agent/extensions/discord-pi/fixtures/sample-status.json ~/.discord-voice-state.json
  ```
- Escribe `/discord refresh` en Pi.

### La extensión no aparece en Gentle-Pi
- Verifica que la carpeta `dist/index.js` exista. Si no, compila con:
  ```bash
  cd ~/.pi/agent/extensions/discord-pi && npm run build
  ```
- Asegúrate de que tu terminal tenga al menos 80 columnas de ancho para que el sidebar tenga espacio de renderizado.
