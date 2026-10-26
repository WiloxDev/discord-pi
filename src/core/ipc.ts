import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { buildDiscordVoiceProjection } from "./projection.js";
import { DiscordVoiceProjection, DiscordPiConfig, DiscordClientType } from "./types.js";
import { DiscordIpcConnection } from "./discord-ipc.js";

/**
 * Retorna las rutas candidatas donde puede residir el archivo de estado de Discord,
 * adaptándose a Linux y Windows.
 */
export function getStateCandidatePaths(config: Required<DiscordPiConfig>): string[] {
  const home = os.homedir();
  const paths: (string | null | undefined)[] = [
    config.customStatePath,
    path.join(home, ".discord-voice-state.json"),
  ];

  if (process.platform === "win32") {
    if (process.env.LOCALAPPDATA) {
      paths.push(path.join(process.env.LOCALAPPDATA, "wilox-tools", "discord-voice", "status.json"));
    }
  } else {
    const stateHome = process.env.XDG_STATE_HOME || path.join(home, ".local", "state");
    paths.push(path.join(stateHome, "wilox-tools", "discord-voice", "status.json"));
  }

  // Fixture de desarrollo/pruebas
  paths.push(path.join(process.cwd(), "fixtures", "sample-status.json"));

  return paths.filter((p): p is string => Boolean(p));
}

/**
 * Gestor de estado y puente local para Discord (Windows y Linux).
 * Conecta directamente vía Named Pipe / Unix Socket y soporta fallback a archivos de estado JSON.
 */
export class DiscordClient {
  private lastPoll = 0;
  private cachedProjection: DiscordVoiceProjection | null = null;
  private optimisticMute: boolean | null = null;
  private ipc: DiscordIpcConnection;
  private lastIpcAttempt = 0;

  constructor(private config: Required<DiscordPiConfig>) {
    this.ipc = new DiscordIpcConnection(config.clientId || "1290372891901239328");
    // Conexión estrictamente lazy/diferida para evitar intentos de conexión en comandos CLI como pi --help
  }

  public async tryConnectIpc(): Promise<boolean> {
    const now = Date.now();
    if (this.ipc.isConnected()) {
      return true;
    }
    // Evitar saturar intentos de conexión repetidos
    if (now - this.lastIpcAttempt < 5000) {
      return false;
    }
    this.lastIpcAttempt = now;

    try {
      return await this.ipc.connect();
    } catch {
      return false;
    }
  }

  public getIpc(): DiscordIpcConnection {
    return this.ipc;
  }

  public invalidate(): void {
    this.lastPoll = 0;
  }

  public setOptimisticMute(muted: boolean): void {
    this.optimisticMute = muted;
    if (this.cachedProjection) {
      this.cachedProjection.self.muted = muted;
    }
  }

  public getProjection(): DiscordVoiceProjection {
    const now = Date.now();
    if (this.cachedProjection && now - this.lastPoll < this.config.pollIntervalMs) {
      return this.cachedProjection;
    }
    this.lastPoll = now;

    // Disparar reconexión asíncrona de IPC si no está conectado
    if (!this.ipc.isConnected()) {
      void this.tryConnectIpc();
    }

    const rawStatus = this.readRawState();
    const detectedClient = this.ipc.getDetectedClient();
    const proj = buildDiscordVoiceProjection(rawStatus, this.config, detectedClient);

    if (this.optimisticMute !== null) {
      proj.self.muted = this.optimisticMute;
    }

    this.cachedProjection = proj;
    return proj;
  }

  private readRawState(): any {
    const candidatePaths = getStateCandidatePaths(this.config);

    for (const file of candidatePaths) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, "utf8");
          if (!content.trim()) continue;
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      } catch {
        // Continuar al siguiente fallback en caso de lectura o parse incompleto
      }
    }

    // Si el socket IPC nativo está conectado, proveer estado listo de Discord Desktop
    if (this.ipc.isConnected()) {
      const user = this.ipc.getCurrentUser();
      const detected = this.ipc.getDetectedClient();
      return {
        version: 1,
        app_open: true,
        confirmed: true,
        state: "ready",
        client_type: detected,
        channel: null,
        self: {
          displayName: user?.global_name || user?.username || this.config.defaultUsername,
          userId: user?.id || this.config.defaultUserId || null,
          muted: this.optimisticMute ?? false,
        },
        participants: [],
      };
    }

    // Fallback por defecto si no hay archivo ni socket disponible
    return {
      version: 1,
      app_open: false,
      confirmed: false,
      state: "offline",
      channel: null,
      participants: 0,
      error: "Sin conexión con Discord",
    };
  }

  public async toggleMute(): Promise<{ success: boolean; clientType: DiscordClientType; message?: string }> {
    const proj = this.getProjection();
    const targetMute = !proj.self.muted;
    this.setOptimisticMute(targetMute);

    const clientType = this.ipc.getDetectedClient();

    if (this.ipc.isConnected()) {
      if (clientType === "vesktop") {
        return {
          success: false,
          clientType: "vesktop",
          message: "Vesktop conectado (Mute en Vesktop se gestiona mediante atajo global o puente JSON)",
        };
      }

      const ok = await this.ipc.setMute(targetMute);
      return {
        success: ok,
        clientType: "discord_official",
        message: ok ? "Micrófono alternado en Discord Oficial vía IPC" : "No se pudo cambiar el micrófono por IPC",
      };
    }

    return {
      success: false,
      clientType: "unknown",
      message: "Micrófono alternado (modo local / simulado)",
    };
  }

  public dispose(): void {
    this.ipc.cleanup();
  }
}
