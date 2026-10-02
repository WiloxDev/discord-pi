import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { DiscordPiConfig } from "./core/types.js";

const DEFAULT_CONFIG: Required<DiscordPiConfig> = {
  enabled: true,
  defaultUsername: "Wilson Lavio",
  participantPreview: 3,
  showSpeaking: true,
  showBitrate: true,
  showPing: true,
  showAudioWhenIdle: true,
  pollIntervalMs: 1500,
  customStatePath: null,
};

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const val = source[key];
    if (val !== undefined) {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        output[key] = deepMerge(output[key] || ({} as any), val as any);
      } else {
        output[key] = val as any;
      }
    }
  }
  return output;
}

export function loadConfig(): Required<DiscordPiConfig> {
  const home = os.homedir();
  const candidatePaths = [
    path.join(process.cwd(), ".discord-pi.json"),
    path.join(home, ".discord-pirc.json"),
    path.join(home, ".config", "discord-pi", "config.json"),
  ];

  for (const configPath of candidatePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw);
        return deepMerge(DEFAULT_CONFIG, parsed);
      }
    } catch {
      // Ignorar fallos de parseo y continuar al siguiente
    }
  }

  return DEFAULT_CONFIG;
}
