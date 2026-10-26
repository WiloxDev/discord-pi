import { test } from "node:test";
import * as assert from "node:assert";
import { renderDiscordCard } from "../ui/card.js";
import { DiscordVoiceProjection, DiscordPiConfig } from "../core/types.js";

const baseConfig: Required<DiscordPiConfig> = {
  enabled: true,
  defaultUsername: "Wilson Lavio",
  defaultUserId: "1532522904032514197",
  participantPreview: 3,
  showSpeaking: true,
  showBitrate: true,
  showPing: true,
  showAudioWhenIdle: true,
  pollIntervalMs: 1500,
  customStatePath: null,
  clientId: "",
  maxWidth: 52,
};

test("renderDiscordCard renders disconnected state within maxWidth", () => {
  const proj: DiscordVoiceProjection = {
    connected: false,
    connectionState: "offline",
    clientType: "unknown",
    pingMs: null,
    channel: null,
    self: { displayName: "Wilson Lavio", muted: false, deafened: false, inputVolume: null, outputVolume: null, inputMode: null },
    participants: [],
    speakingCount: 0,
  };

  const lines = renderDiscordCard(proj, 160, baseConfig);
  assert.ok(lines.length >= 3);
  // Lines should not stretch to 160 columns because maxWidth is 52
  assert.ok(lines[0].length < 100);
  assert.ok(lines.some((l) => l.includes("Desconectado")));
});

test("renderDiscordCard shows ready state with Vesktop badge", () => {
  const proj: DiscordVoiceProjection = {
    connected: false,
    connectionState: "ready",
    clientType: "vesktop",
    pingMs: null,
    channel: null,
    self: { displayName: "Wilson Lavio", muted: false, deafened: false, inputVolume: null, outputVolume: null, inputMode: null },
    participants: [],
    speakingCount: 0,
  };

  const lines = renderDiscordCard(proj, 60, baseConfig);
  assert.ok(lines.some((l) => l.includes("Listo [Vesktop]")));
  assert.ok(lines[0].includes("Discord Voice (Vesktop)"));
});

test("renderDiscordCard shows ready state with Discord Oficial badge", () => {
  const proj: DiscordVoiceProjection = {
    connected: false,
    connectionState: "ready",
    clientType: "discord_official",
    pingMs: null,
    channel: null,
    self: { displayName: "Wilson Lavio", muted: false, deafened: false, inputVolume: null, outputVolume: null, inputMode: null },
    participants: [],
    speakingCount: 0,
  };

  const lines = renderDiscordCard(proj, 60, baseConfig);
  assert.ok(lines.some((l) => l.includes("Listo [Oficial]")));
  assert.ok(lines[0].includes("Discord Voice (Oficial)"));
});

test("renderDiscordCard renders live voice call details", () => {
  const proj: DiscordVoiceProjection = {
    connected: true,
    connectionState: "online",
    clientType: "discord_official",
    pingMs: 24,
    channel: { name: "general", bitrateKbps: 64, userLimit: null },
    self: { displayName: "Wilson Lavio", muted: true, deafened: false, inputVolume: 100, outputVolume: 100, inputMode: null },
    participants: [
      { userId: "1", displayName: "Wilson Lavio", muted: true, deafened: false, speaking: false, isSelf: true },
      { userId: "2", displayName: "Dev Friend", muted: false, deafened: false, speaking: true, isSelf: false },
    ],
    speakingCount: 1,
  };

  const lines = renderDiscordCard(proj, 52, baseConfig);
  assert.ok(lines.some((l) => l.includes("#general")));
  assert.ok(lines.some((l) => l.includes("Mute")));
  assert.ok(lines.some((l) => l.includes("Dev Friend")));
});
