import { test } from "node:test";
import * as assert from "node:assert";
import { buildDiscordVoiceProjection, sortParticipants, cleanChannelName } from "../core/projection.js";

test("cleanChannelName strips leading emojis", () => {
  assert.strictEqual(cleanChannelName("🏨 Cafe Hotel Mustachi"), "Cafe Hotel Mustachi");
  assert.strictEqual(cleanChannelName("general"), "general");
});

test("sortParticipants prioritizes speaking, then self, then alphabetical", () => {
  const participants = [
    { userId: "1", displayName: "Charlie", muted: false, deafened: false, speaking: false, isSelf: false },
    { userId: "2", displayName: "Alice", muted: false, deafened: false, speaking: false, isSelf: false },
    { userId: "3", displayName: "SelfUser", muted: false, deafened: false, speaking: false, isSelf: true },
    { userId: "4", displayName: "Bob", muted: false, deafened: false, speaking: true, isSelf: false },
  ];

  const sorted = sortParticipants(participants);
  assert.strictEqual(sorted[0].displayName, "Bob"); // Speaking first
  assert.strictEqual(sorted[1].displayName, "SelfUser"); // Self second
  assert.strictEqual(sorted[2].displayName, "Alice"); // Alphabetical
  assert.strictEqual(sorted[3].displayName, "Charlie");
});

test("buildDiscordVoiceProjection handles offline state", () => {
  const proj = buildDiscordVoiceProjection(null, { defaultUsername: "Wilox" });
  assert.strictEqual(proj.connected, false);
  assert.strictEqual(proj.connectionState, "offline");
  assert.strictEqual(proj.channel, null);
  assert.strictEqual(proj.self.displayName, "Wilox");
});

test("buildDiscordVoiceProjection identifies self by defaultUserId and clientType", () => {
  const rawStatus = {
    app_open: true,
    state: "live",
    client_type: "vesktop",
    channel: "dev-room",
    bitrate_kbps: 64,
    ping_ms: 20,
    voice_states: [
      { userId: "9999", displayName: "Colleague", muted: false, speaking: false },
      { userId: "1532522904032514197", displayName: "CustomNick", muted: true, speaking: false },
    ],
  };

  const proj = buildDiscordVoiceProjection(rawStatus, {
    defaultUsername: "Wilson Lavio",
    defaultUserId: "1532522904032514197",
  });

  assert.strictEqual(proj.connected, true);
  assert.strictEqual(proj.clientType, "vesktop");
  assert.strictEqual(proj.channel?.name, "dev-room");
  const selfParticipant = proj.participants.find((p) => p.isSelf);
  assert.ok(selfParticipant);
  assert.strictEqual(selfParticipant.userId, "1532522904032514197");
});
