import { loadConfig } from "./config.js";
import { DiscordClient } from "./core/ipc.js";
import { renderDiscordCard } from "./ui/card.js";

/**
 * Punto de entrada oficial de la extensión para Gentle-Pi / Pi Agent.
 */
export default function activate(pi: any) {
  const config = loadConfig();
  if (config.enabled === false) {
    return;
  }

  const client = new DiscordClient(config);

  // Registro del Widget en Pi Agent / Gentle-Pi
  pi.on("session_start", async (_event: any, ctx: any) => {
    if (!ctx?.hasUI || typeof ctx.ui?.setWidget !== "function") {
      return;
    }

    try {
      ctx.ui.setWidget("discord", (_tui: any, _theme: any) => {
        return {
          render: (width: number) => {
            const proj = client.getProjection();
            return renderDiscordCard(proj, width, config);
          },
          handleMouse: (evt: any) => {
            if (evt?.type === "click") {
              void client.toggleMute().then((ipcOk) => {
                const msg = ipcOk
                  ? "🎙 Micrófono alternado directamente en Discord."
                  : "🎙 Micrófono alternado (Modo local).";
                ctx.ui?.notify?.(msg);
              });
              return true;
            }
            return false;
          },
          digest: () => {
            const proj = client.getProjection();
            return `${proj.connectionState}_${proj.channel?.name}_${proj.self.muted}_${proj.participants.length}_${client.getIpc().isConnected()}`;
          },
          dispose: () => {
            client.dispose();
          },
        };
      });
    } catch (err) {
      console.error("[discord-pi] Error registrando widget:", err);
    }
  });

  // Registro del comando de consola /discord
  if (typeof pi.registerCommand === "function") {
    pi.registerCommand("discord", {
      description: "Gestiona Discord Voice Operations Card (mute, users, status, refresh)",
      handler: async (args: string[], ctx: any) => {
        const subcmd = (args[0] || "").toLowerCase();

        switch (subcmd) {
          case "mute":
          case "toggle": {
            const ipcOk = await client.toggleMute();
            const proj = client.getProjection();
            const stateLabel = proj.self.muted ? "Silenciado 🔇" : "Activo 🎙";
            const msg = ipcOk
              ? `Discord: Micrófono ${stateLabel} (vía IPC nativo).`
              : `Discord: Micrófono ${stateLabel} (local/simulado).`;
            ctx.ui?.notify?.(msg);
            break;
          }
          case "status":
          case "info": {
            const ipcConnected = client.getIpc().isConnected();
            const proj = client.getProjection();
            const osType = process.platform === "win32" ? "Windows" : "Linux/POSIX";
            const transport = ipcConnected
              ? `IPC Nativo (${osType})`
              : `Puente de Estado JSON / Fallback`;
            const ch = proj.channel?.name ? `#${proj.channel.name}` : "Sin canal de voz";
            ctx.ui?.notify?.(`[Discord-PI] OS: ${osType} | Conexión: ${transport} | Estado: ${proj.connectionState} | Canal: ${ch}`);
            break;
          }
          case "refresh":
            client.invalidate();
            await client.tryConnectIpc();
            ctx.ui?.notify?.("🔄 Estado de Discord y conexión IPC actualizados.");
            break;
          case "users":
          case "participantes": {
            const proj = client.getProjection();
            const total = proj.participants.length;
            const speaking = proj.speakingCount;
            const ch = proj.channel?.name || "sin canal";
            ctx.ui?.notify?.(`Discord: ${total} en llamada · ${speaking} hablando (#${ch})`);
            break;
          }
          default:
            ctx.ui?.notify?.("Uso: /discord [mute | status | users | refresh]");
            break;
        }
      },
    });
  }
}
