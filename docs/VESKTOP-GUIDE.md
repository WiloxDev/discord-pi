# 📖 Guía de Integración Oficial: Vesktop + Discord-PI

Esta guía detalla cómo instalar, configurar y verificar **Vesktop** (el cliente de Discord optimizado basado en Vencord) para que interactúe de forma automática con la tarjeta `discord-pi` en **Gentle-Pi** y **Pi Agent**, tanto en **Windows** como en **Linux**.

---

## 🚀 1. Resumen Rápido (Quick Path)

```text
┌─────────────────────────┐          ┌─────────────────────────┐
│     Vesktop Desktop     │          │  discord-pi (Extensión) │
│   (Windows / Linux)     │          │  (Gentle-Pi / Pi Agent) │
└────────────┬────────────┘          └────────────┬────────────┘
             │                                    │
             │   1. Servidor arRPC activo         │
             ├───────────────────────────────────►│ Detecta: "Discord Voice (Vesktop)"
             │   (Named Pipe / Unix Socket)       │ Estado:  "• Listo [Vesktop]"
             │                                    │
             │   2. Control de Mute               │
             │◄───────────────────────────────────┤ Mute asistido / Atajo global
```

1. **Instalar Vesktop** en Windows o Linux.
2. **Asegurar que `arRPC` esté habilitado** en los ajustes de Vesktop.
3. **Iniciar tu sesión de Pi / Gentle-Pi**: La tarjeta detectará automáticamente el cliente como `Discord Voice (Vesktop)` y mostrará `• Listo [Vesktop]`.

---

## 🪟 2. Procedimiento Paso a Paso en Windows

### Paso 2.1: Instalación de Vesktop en Windows
Elige el método de instalación preferido:

- **Opción A (Winget - Recomendada)**:
  Abre PowerShell y ejecuta:
  ```powershell
  winget install Vencord.Vesktop
  ```
- **Opción B (Instalador Oficial `.exe`)**:
  1. Descarga el instalador desde [https://vesktop.dev/install/windows/](https://vesktop.dev/install/windows/).
  2. Ejecuta `Vesktop-Setup-X.X.X.exe` y completa el asistente.

### Paso 2.2: Verificación del Servidor IPC (`arRPC`) en Vesktop
1. Abre Vesktop e inicia sesión con tu cuenta de Discord.
2. Ve a **Ajustes de Usuario (⚙️)** > apartado **Ajustes de Vesktop** (en la barra lateral izquierda).
3. Busca el interruptor **`arRPC`** y verifica que esté en **Activado** (viene habilitado por defecto).
   > *Nota*: Al activarse, Vesktop crea automáticamente la tubería del sistema `\\?\pipe\discord-ipc-0` en el kernel de Windows.

### Paso 2.3: Configuración del Atajo de Mute en Windows
Dado que `arRPC` emula presencia pero no incluye el motor binario de audio de Discord:
1. En Vesktop, ve a **Ajustes de Usuario (⚙️)** > **Atajos de teclado** (*Keybinds*).
2. Haz clic en **Añadir un atajo**.
3. Selecciona la acción **Silenciar micrófono** (*Toggle Mute*).
4. Asigna tu combinación preferida (por ejemplo, `Ctrl + F12` o `Alt + M`).
5. ¡Listo! Tendrás mute global instantáneo sin importar qué ventana tengas abierta.

---

## 🐧 3. Procedimiento Paso a Paso en Linux

### Paso 3.1: Instalación de Vesktop en Linux
Elige el paquete según tu distribución:

- **Ubuntu / Debian (Flatpak - Recomendado)**:
  ```bash
  flatpak install flathub dev.vencord.Vesktop
  ```
- **Ubuntu / Debian (Paquete `.deb`)**:
  Descarga el paquete desde los releases de GitHub (`Vencord/Vesktop`) e instálalo:
  ```bash
  sudo dpkg -i vesktop_*_amd64.deb
  ```
- **Arch Linux / Manjaro (AUR)**:
  ```bash
  yay -S vesktop-bin
  ```

### Paso 3.2: Verificación del Socket IPC en Linux
1. Abre Vesktop y verifica que **Ajustes de Vesktop > arRPC** esté activado.
2. Comprueba en tu terminal que el socket Unix existe ejecutando:
  ```bash
  ls -l $XDG_RUNTIME_DIR/discord-ipc-0
  # O bien en caso de fallback:
  ls -l /tmp/discord-ipc-0
  ```
3. Si el archivo de socket aparece, Vesktop está publicando correctamente el bus IPC para `discord-pi`.

---

## ⚙️ 4. Vinculación y Telemetría en `discord-pi`

### Paso 4.1: Configuración de Identidad (`.discord-pirc.json`)
Crea o edita tu archivo de configuración en tu directorio de usuario:
- **Windows**: `%USERPROFILE%\.discord-pirc.json`
- **Linux**: `~/.discord-pirc.json`

```json
{
  "enabled": true,
  "defaultUsername": "TuNombreEnDiscord",
  "defaultUserId": "1532522904032514197",
  "participantPreview": 3,
  "maxWidth": 52
}
```

### Paso 4.2: Telemetría de Canales y Participantes (Puente Opcional)
Si deseas que la tarjeta muestre los nombres exactos de los participantes de la sala de voz mientras usas Vesktop:
- Puedes volcar periódicamente el estado en el archivo puente:
  - Windows: `%USERPROFILE%\.discord-voice-state.json`
  - Linux: `~/.discord-voice-state.json`
- `discord-pi` fusiona la detección del cliente Vesktop con la telemetría detallada del canal.

---

## 💻 5. Comandos de Verificación en Pi / Gentle-Pi

Una vez que Vesktop esté abierto, abre tu sesión de terminal con Pi (`pi`) y ejecuta:

| Comando | Resultado esperado con Vesktop |
| :--- | :--- |
| `/discord status` | `[Discord-PI] OS: Windows/Linux \| Entorno: Gentle-Pi \| Discord: Vesktop (arRPC) \| Conexión: IPC Nativo [Vesktop] \| Canal: #...` |
| `/discord mute` | Te informa el estado actual y te recuerda el atajo de mute para Vesktop. |
| `/discord users` | Muestra el recuento de participantes y quién está en la sala. |
| `/discord refresh` | Fuerza la re-inspección de tuberías y sincronización inmediata. |

---

## 🛠️ 6. Matriz de Resolución de Problemas (Troubleshooting)

| Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| La card dice `• Desconectado` con Vesktop abierto | El interruptor `arRPC` en Vesktop está apagado. | Entra en **Ajustes de Vesktop > arRPC**, enciéndelo y escribe `/discord refresh` en Pi. |
| En Windows no conecta por IPC | Permisos o prefijo de pipe Win32. | Asegúrate de tener `v1.2.0` de `discord-pi`, que soporta `\\?\pipe\discord-ipc-*`. |
| En Linux Flatpak no detecta el socket | Sandbox de Flatpak aislando `$XDG_RUNTIME_DIR`. | Dar permiso con: `flatpak override dev.vencord.Vesktop --filesystem=xdg-run/discord-ipc-0` |
| El comando `/discord mute` no silencia en Vesktop | arRPC no implementa la API de audio de Discord. | Utiliza tu atajo global de teclado configurado en Vesktop o el archivo puente JSON. |
