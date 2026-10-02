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

### 🤖 Para Agentes AI (Copiar y Pegar)
Si estás usando un agente AI (Pi, Claude, Cursor), indícale:
```text
Instala y activa la extensión de Discord en mi Gentle-Pi ejecutando su instalador oficial:
curl -sSL https://raw.githubusercontent.com/WiloxDev/discord-pi/main/install.sh | bash
Verifica que dist/index.js se haya creado y avísame al terminar.
```

---

### En tu Terminal
Para instalarlo de forma manual o automática:

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

---

## 📚 Documentación Completa

Para ver el manual completo con arquitectura, integración para desarrolladores, diagramas y casos de uso detallados, consulta [MANUAL.md](./MANUAL.md).

