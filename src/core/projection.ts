import {
  DiscordVoiceProjection,
  DiscordVoiceParticipant,
  DiscordVoiceChannel,
  DiscordVoiceSelfState,
  DiscordPiConfig,
} from "./types.js";

/**
 * Strips leading decorative emojis/pictographs from channel names to avoid redundant icons.
 * e.g., "🏨 Cafe Hotel Mustachi" -> "Cafe Hotel Mustachi"
 */
export function cleanChannelName(rawName: string): string {
  if (!rawName) return "general";
  const cleaned = rawName.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "").trim();
  return cleaned || rawName;
}

/**
 * Sorts participants according to the priority contract:
 * 1. Anyone speaking live (🟢)
 * 2. Self user
 * 3. Alphabetical by displayName
 */
export function sortParticipants(participants: DiscordVoiceParticipant[]): DiscordVoiceParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.speaking && !b.speaking) return -1;
    if (!a.speaking && b.speaking) return 1;

    if (a.isSelf && !b.isSelf) return -1;
    if (!a.isSelf && b.isSelf) return 1;

    return a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" });
  });
}

/**
 * Builds a structured, read-only DiscordVoiceProjection from raw status payloads.
 */
export function buildDiscordVoiceProjection(
  rawStatus: any,
  config: DiscordPiConfig = {},
): DiscordVoiceProjection {
  const fallbackUsername = config.defaultUsername || "Wilson Lavio";

  if (!rawStatus || typeof rawStatus !== "object") {
    return {
      connected: false,
      connectionState: "offline",
      pingMs: null,
      channel: null,
      self: {
        userId: null,
        displayName: fallbackUsername,
        muted: false,
        deafened: false,
        inputVolume: null,
        outputVolume: null,
        inputMode: null,
      },
      participants: [],
      speakingCount: 0,
    };
  }

  const isAppOpen = Boolean(rawStatus.app_open);
  const state = String(rawStatus.state || "unknown");

  let connectionState: DiscordVoiceProjection["connectionState"] = "offline";
  if (state === "changing") {
    connectionState = "connecting";
  } else if (state === "error") {
    connectionState = "degraded";
  } else if (state === "live" || state === "muted") {
    connectionState = "online";
  } else if (isAppOpen || state === "no_voice") {
    connectionState = "ready";
  }

  const rawSelf = rawStatus.self || {};
  const selfMuted = typeof rawSelf.muted === "boolean" ? rawSelf.muted : state === "muted";
  const selfDeafened = Boolean(rawSelf.deafened);
  const inputMode = rawSelf.inputMode || "VOICE_ACTIVITY";

  const self: DiscordVoiceSelfState = {
    userId: rawSelf.userId || null,
    displayName: rawSelf.displayName || fallbackUsername,
    muted: selfMuted,
    deafened: selfDeafened,
    inputVolume: typeof rawSelf.inputVolume === "number" ? rawSelf.inputVolume : 17,
    outputVolume: typeof rawSelf.outputVolume === "number" ? rawSelf.outputVolume : 94,
    inputMode,
  };

  let channel: DiscordVoiceChannel | null = null;
  if (rawStatus.channel && (connectionState === "online" || connectionState === "connecting")) {
    channel = {
      name: cleanChannelName(String(rawStatus.channel)),
      bitrateKbps: typeof rawStatus.bitrate_kbps === "number" ? rawStatus.bitrate_kbps : 64,
      userLimit: typeof rawStatus.user_limit === "number" ? rawStatus.user_limit : null,
    };
  }

  let participants: DiscordVoiceParticipant[] = [];
  if (Array.isArray(rawStatus.voice_states)) {
    participants = rawStatus.voice_states.map((v: any) => {
      const isSelf = Boolean(
        v.isSelf ||
          (self.userId && v.userId === self.userId) ||
          (v.displayName && v.displayName.toLowerCase() === fallbackUsername.toLowerCase()),
      );
      return {
        userId: String(v.userId || Math.random().toString(36).slice(2)),
        username: v.username || undefined,
        displayName: String(v.displayName || v.nick || v.username || "Usuario"),
        nick: v.nick || null,
        muted: Boolean(v.muted),
        deafened: Boolean(v.deafened),
        speaking: Boolean(v.speaking),
        isSelf,
      };
    });
  }

  const sortedParticipants = sortParticipants(participants);
  const speakingCount = participants.filter((p) => p.speaking).length;
  const pingMs = typeof rawStatus.ping_ms === "number" ? rawStatus.ping_ms : null;

  return {
    connected: connectionState === "online",
    connectionState,
    pingMs,
    channel,
    self,
    participants: sortedParticipants,
    speakingCount,
  };
}
