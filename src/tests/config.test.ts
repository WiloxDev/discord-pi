import { test } from "node:test";
import * as assert from "node:assert";
import { loadConfig, getConfigCandidatePaths } from "../config.js";

test("getConfigCandidatePaths returns paths depending on platform", () => {
  const paths = getConfigCandidatePaths();
  assert.ok(Array.isArray(paths));
  assert.ok(paths.length >= 2);
  assert.ok(paths.some((p) => p.includes(".discord-pirc.json")));
});

test("loadConfig returns valid defaults", () => {
  const config = loadConfig();
  assert.strictEqual(config.enabled, true);
  assert.strictEqual(typeof config.defaultUsername, "string");
  assert.strictEqual(typeof config.pollIntervalMs, "number");
  assert.strictEqual(config.maxWidth, 54);
  assert.strictEqual(config.uiPlacement, "sidebar_preferred");
});
