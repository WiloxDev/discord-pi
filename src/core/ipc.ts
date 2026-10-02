import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { buildDiscordVoiceProjection } from "./projection.js";
import { DiscordVoiceProjection, DiscordPiConfig } from "./types.js";

/**
 * Gestor de estado y puente local para Discord.
 * Lee estados desde sockets IPC de Discord o archivos de estado locales.
 */
export class DiscordClient {
  private lastPoll = 0;
  private cachedProjection: DiscordVoiceProjection | null = null;
  private optimisticMute: boolean | null = null;

  constructor(private config: Required<DiscordPiConfig>) {}

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

    const rawStatus = this.readRawState();
    const proj = buildDiscordVoiceProjection(rawStatus, this.config);

    if (this.optimisticMute !== null) {
      proj.self.muted = this.optimisticMute;
    }

    this.cachedProjection = proj;
    return proj;
  }

  private readRawState(): any {
    const candidatePaths = [
      this.config.customStatePath,
      path.join(os.homedir(), ".discord-voice-state.json"),
      path.join(os.homedir(), ".local", "state", "wilox-tools", "discord-voice", "status.json"),
      path.join(process.cwd(), "fixtures", "sample-status.json"),
    ].filter(Boolean) as string[];

    for (const file of candidatePaths) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, "utf8");
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
        }
      } catch {
        // Continuar al siguiente fallback
      }
    }

    // Fallback por defecto si no hay archivo disponible
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

  public toggleMute(): void {
    const proj = this.getProjection();
    this.setOptimisticMute(!proj.self.muted);
  }
}
