export interface DiscordVoiceParticipant {
  userId: string;
  username?: string;
  displayName: string;
  nick?: string | null;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  isSelf: boolean;
}

export interface DiscordVoiceChannel {
  id?: string;
  name: string;
  guildId?: string;
  bitrateKbps: number | null;
  userLimit: number | null;
}

export interface DiscordVoiceSelfState {
  userId?: string | null;
  displayName: string;
  muted: boolean;
  deafened: boolean;
  inputVolume: number | null;
  outputVolume: number | null;
  inputMode: "VOICE_ACTIVITY" | "PUSH_TO_TALK" | string | null;
}

export interface DiscordVoiceProjection {
  connected: boolean;
  connectionState: "online" | "connecting" | "degraded" | "offline" | "ready";
  pingMs: number | null;
  channel: DiscordVoiceChannel | null;
  self: DiscordVoiceSelfState;
  participants: DiscordVoiceParticipant[];
  speakingCount: number;
}

export interface DiscordPiConfig {
  enabled?: boolean;
  defaultUsername?: string;
  participantPreview?: number;
  showSpeaking?: boolean;
  showBitrate?: boolean;
  showPing?: boolean;
  showAudioWhenIdle?: boolean;
  pollIntervalMs?: number;
  customStatePath?: string | null;
}
