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

  const registerDiscordUI = (ctx: any) => {
    if (!ctx?.hasUI || typeof ctx.ui?.setWidget !== "function") {
      return;
    }

    // Conexión lazy: solo se intenta cuando hay una interfaz interactiva disponible
    void client.tryConnectIpc();

    try {
      ctx.ui.setWidget("discord", (tui: any, _theme: any) => {
        // Enlace al estado del sidebar de Gentle-Shell si está presente
        const SIDEBAR_STATE_KEY = Symbol.for("gentle-pi.experimental-sidebar.state");
        const terminalState = tui?.terminal ? (tui.terminal as any)[SIDEBAR_STATE_KEY] : null;

        const railComponent = {
          render: (railWidth: number) => {
            const proj = client.getProjection();
            return renderDiscordCard(proj, railWidth, config);
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
          invalidate: () => {},
          dispose: () => {},
        };

        // Si Gentle-Shell tiene el mapa de partes del sidebar, registramos discord
        if (terminalState?.parts && typeof terminalState.parts.set === "function") {
          terminalState.parts.set("discord", railComponent);
        }

        return {
          render: (width: number) => {
            // Supresión inteligente: si el sidebar de Gentle-Shell está activo y posee el host (>= 140 cols),
            // suprimimos la tarjeta sobre el editor para evitar duplicación visual.
            if (terminalState?.active && terminalState?.ownsHost?.()) {
              return [];
            }
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
            if (terminalState?.parts?.get?.("discord") === railComponent) {
              terminalState.parts.delete("discord");
            }
            client.dispose();
          },
        };
      });
    } catch (err) {
      console.error("[discord-pi] Error registrando widget:", err);
    }
  };

  // Registro del Widget en sesión nueva o reanudada
  pi.on("session_start", async (_event: any, ctx: any) => {
    registerDiscordUI(ctx);
  });

  // Respaldo para montaje instantáneo tras /reload o turnos en curso
  if (typeof pi.on === "function") {
    pi.on("turn_start", async (_event: any, ctx: any) => {
      registerDiscordUI(ctx);
    });
  }

  // Registro del comando de consola /discord
  if (typeof pi.registerCommand === "function") {
    pi.registerCommand("discord", {
      description: "Gestiona Discord Voice Operations Card (mute, users, status, refresh)",
      handler: async (args: string[], ctx: any) => {
        const subcmd = (args[0] || "").toLowerCase();

        switch (subcmd) {
          case "mute":
          case "toggle": {
            registerDiscordUI(ctx);
            const res = await client.toggleMute();
            const proj = client.getProjection();
            const stateLabel = proj.self.muted ? "Silenciado 🔇" : "Activo 🎙";
            const detail = res.message ? ` (${res.message})` : "";
            ctx.ui?.notify?.(`Discord: Micrófono ${stateLabel}${detail}`);
            break;
          }
          case "status":
          case "info": {
            registerDiscordUI(ctx);
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
            registerDiscordUI(ctx);
            client.invalidate();
            await client.tryConnectIpc();
            ctx.ui?.notify?.("🔄 Estado de Discord y conexión IPC actualizados.");
            break;
          case "users":
          case "participantes": {
            registerDiscordUI(ctx);
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
