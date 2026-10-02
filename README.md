# 🎧 Discord PI Voice Operations

Card reactiva e interactiva de Discord Voice para el sidebar de **Gentle-Pi / Pi Agent**.

---

## ✨ Características

- 🎙 **Telemetría de Voz en Tiempo Real**: Visualización de canal activo, bitrate de sala y latencia (ping en ms).
- 🟢 **Prioridad de Hablantes**: Detección dinámica de participantes que están hablando en vivo (`🟢`), tu usuario (`Wilson Lavio`) y lista organizada alfabéticamente.
- 🔇 **Control Rápido de Micrófono**: Comandos interactivos y clic en tarjeta para silenciar/activar (`Mute / Unmute`).
- 👥 **Contador de Participantes**: Inspección rápida de la cantidad de usuarios presentes en la llamada.
- ⚡ **Desacoplado y 100% Autónomo**: Sin dependencias complejas ni ataduras a Windows/PowerShell ni ecosistemas externos heredados. Fallback elegante a modo desconectado cuando Discord no está en llamada.

---

## 🚀 Instalación Rápida (Cliente)

Para instalarlo de forma automática en tu entorno Gentle-Pi:

```bash
curl -sSL https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.sh | bash
```

O clonando manualmente el repositorio:

```bash
git clone https://github.com/WiloxDev/discord-pi.git ~/.pi/agent/extensions/discord-pi
cd ~/.pi/agent/extensions/discord-pi
npm install
npm run build
```

---

## ⚙️ Configuración (`~/.discord-pirc.json`)

El instalador genera automáticamente tu archivo de configuración en `~/.discord-pirc.json`:

```json
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
```

---

## 💻 Comandos en la Terminal de Gentle-Pi

Puedes interactuar con Discord mediante el comando `/discord`:

| Comando | Acción |
| :--- | :--- |
| `/discord mute` | Alterna entre silenciado y activo |
| `/discord users` | Muestra el resumen de participantes y quién habla |
| `/discord refresh` | Fuerza la actualización de telemetría |

---

## 📄 Licencia

MIT © [WiloxDev](https://github.com/WiloxDev)
