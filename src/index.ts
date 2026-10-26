import { loadConfig } from "./config.js";
import { DiscordClient } from "./core/ipc.js";
import { renderDiscordCard } from "./ui/card.js";
import { PiEnvironment } from "./core/types.js";

/**
 * Detecta si la extensión se ejecuta en Gentle-Pi o en Pi Agent nativo.
 */
export function detectPiEnvironment(ctx?: any): PiEnvironment {
  try {
    if (ctx?.ui?.terminal) {
      const term = ctx.ui.terminal as any;
      const symbols = Object.getOwnPropertySymbols(term);
      const isGentle = symbols.some((s) => String(s).includes("gentle-pi"));
      if (isGentle) return "gentle-pi";
    }
    if (
      process.env.GENTLE_PI_CONFIG_HOME ||
      (process.env.PI_AGENT_DIR && process.env.PI_AGENT_DIR.includes("agent")) ||
      (process.env.PI_THEME && process.env.PI_THEME.toLowerCase().includes("gentle"))
    ) {
      return "gentle-pi";
    }
  } catch {
    // Continuar con fallback
  }
  return "pi-native";
}

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
              void client.toggleMute().then((res) => {
                const msg = res.message || "Estado de micrófono alternado";
                ctx.ui?.notify?.(`🎙 ${msg}`);
              });
              return true;
            }
            return false;
          },
          digest: () => {
            const proj = client.getProjection();
            return `${proj.connectionState}_${proj.clientType}_${proj.channel?.name}_${proj.self.muted}_${proj.participants.length}_${client.getIpc().isConnected()}`;
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
            const res = await client.toggleMute();
            const proj = client.getProjection();
            const stateLabel = proj.self.muted ? "Silenciado 🔇" : "Activo 🎙";
            const detail = res.message ? ` (${res.message})` : "";
            ctx.ui?.notify?.(`Discord: Micrófono ${stateLabel}${detail}`);
            break;
          }
          case "status":
          case "info": {
            const ipcConnected = client.getIpc().isConnected();
            const proj = client.getProjection();
            const osType = process.platform === "win32" ? "Windows" : "Linux/POSIX";
            const clientName =
              proj.clientType === "vesktop"
                ? "Vesktop (arRPC)"
                : proj.clientType === "discord_official"
                  ? "Discord Oficial"
                  : "Desconocido / Puente JSON";
            const transport = ipcConnected
              ? `IPC Nativo [${clientName}]`
              : `Puente de Estado JSON / Fallback`;
            const piEnv = detectPiEnvironment(ctx);
            const piLabel = piEnv === "gentle-pi" ? "Gentle-Pi / Gentle-Shell" : "Pi Agent Nativo";
            const ch = proj.channel?.name ? `#${proj.channel.name}` : "Sin canal de voz";
            ctx.ui?.notify?.(
              `[Discord-PI] OS: ${osType} | Entorno: ${piLabel} | Discord: ${clientName} | Conexión: ${transport} | Canal: ${ch}`
            );
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
