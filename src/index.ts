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

  // Registro del Widget en el sidebar derecho de Pi
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
              client.toggleMute();
              ctx.ui?.notify?.("Discord: Estado de micrófono alternado");
              return true;
            }
            return false;
          },
          digest: () => {
            const proj = client.getProjection();
            return `${proj.connectionState}_${proj.channel?.name}_${proj.self.muted}_${proj.participants.length}`;
          },
          dispose: () => {
            // Limpieza
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
      description: "Gestiona Discord Voice Operations Card (mute, users, refresh)",
      handler: async (args: string[], ctx: any) => {
        const subcmd = (args[0] || "").toLowerCase();

        switch (subcmd) {
          case "mute":
          case "toggle":
            client.toggleMute();
            ctx.ui?.notify?.("🎙 Estado de micrófono alternado en Discord.");
            break;
          case "refresh":
            client.invalidate();
            ctx.ui?.notify?.("🔄 Estado de Discord actualizado.");
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
            ctx.ui?.notify?.("Uso: /discord [mute | refresh | users]");
            break;
        }
      },
    });
  }
}
