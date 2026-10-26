import { test } from "node:test";
import * as assert from "node:assert";
import {
  encodeIpcPacket,
  decodeIpcPacket,
  IpcOpcode,
  getIpcCandidatePaths,
  DiscordIpcConnection,
} from "../core/discord-ipc.js";
import { getStateCandidatePaths, DiscordClient } from "../core/ipc.js";

test("encodeIpcPacket and decodeIpcPacket roundtrip correctly", () => {
  const payload = { cmd: "DISPATCH", evt: "READY", data: { v: 1 } };
  const encoded = encodeIpcPacket(IpcOpcode.FRAME, payload);

  assert.strictEqual(encoded.readUInt32LE(0), IpcOpcode.FRAME);
  const jsonBuf = Buffer.from(JSON.stringify(payload), "utf8");
  assert.strictEqual(encoded.readUInt32LE(4), jsonBuf.length);

  const decoded = decodeIpcPacket(encoded);
  assert.ok(decoded !== null);
  assert.strictEqual(decoded.packet.opcode, IpcOpcode.FRAME);
  assert.deepStrictEqual(decoded.packet.payload, payload);
  assert.strictEqual(decoded.remainder.length, 0);
});

test("decodeIpcPacket returns null on partial buffer", () => {
  const payload = { test: true };
  const encoded = encodeIpcPacket(IpcOpcode.FRAME, payload);

  // Less than header length
  assert.strictEqual(decodeIpcPacket(encoded.subarray(0, 4)), null);

  // Incomplete payload
  assert.strictEqual(decodeIpcPacket(encoded.subarray(0, encoded.length - 2)), null);
});

test("getIpcCandidatePaths returns non-empty list on Windows or candidate array", () => {
  const paths = getIpcCandidatePaths();
  assert.ok(Array.isArray(paths));
});

test("getStateCandidatePaths includes expected user paths", () => {
  const paths = getStateCandidatePaths({
    enabled: true,
    defaultUsername: "Test",
    defaultUserId: "123",
    participantPreview: 3,
    showSpeaking: true,
    showBitrate: true,
    showPing: true,
    showAudioWhenIdle: true,
    pollIntervalMs: 1500,
    customStatePath: null,
    clientId: "",
    maxWidth: 54,
    uiPlacement: "sidebar_preferred",
  });

  assert.ok(paths.length >= 2);
  assert.ok(paths.some((p) => p.includes(".discord-voice-state.json")));
  assert.ok(paths.some((p) => p.includes("sample-status.json")));
});

test("DiscordIpcConnection handles error event without unhandled crash", () => {
  const ipc = new DiscordIpcConnection();
  // Emitting error should not throw due to default passive handler
  assert.doesNotThrow(() => {
    ipc.emit("error", new Error("EPIPE simulated test error"));
  });
  ipc.cleanup();
});

test("DiscordClient initializes lazily without immediate IPC connection", () => {
  const client = new DiscordClient({
    enabled: true,
    defaultUsername: "Test",
    defaultUserId: "123",
    participantPreview: 3,
    showSpeaking: true,
    showBitrate: true,
    showPing: true,
    showAudioWhenIdle: true,
    pollIntervalMs: 1500,
    customStatePath: null,
    clientId: "",
    maxWidth: 54,
    uiPlacement: "sidebar_preferred",
  });

  // Client should not be connected immediately on instantiation
  assert.strictEqual(client.getIpc().isConnected(), false);
  client.dispose();
});
