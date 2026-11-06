import { test } from "node:test";
import * as assert from "node:assert";
import { mountSidebarRail, type DiscordRail } from "../ui/sidebar-composition.js";

const STATE = Symbol.for("gentle-pi.experimental-sidebar.state");
const DISCORD_LINE = "🎙 Discord · canal General";

type Rail = Record<string, any>;
type Log = string[];

const makeRail = (log: Log): DiscordRail => ({
  render: () => [DISCORD_LINE],
  digest: () => "rail",
  handleMouse: () => undefined,
  invalidate: () => {},
  dispose: () => log.push("rail:dispose")
});

const makeFooter = (log: Log): Rail => ({
  render: () => ["Status: conectado"],
  digest: () => "status",
  handleMouse: () => undefined,
  invalidate: () => {},
  dispose: () => log.push("footer:dispose")
});

const terminalWith = (parts: Map<string, Rail>) => ({
  [STATE]: { active: true, ownsHost: () => true, parts }
});

/** Host con descubrimiento dinámico: pinta todas las partes registradas. */
const paintDynamicHost = (parts: Map<string, Rail>, width = 40): string[] => {
  const out: string[] = [];
  for (const key of parts.keys()) out.push(...(parts.get(key)?.render?.(width) ?? []));
  return out;
};

/** Host con filtro estático: solo pinta footer. */
const paintStaticHost = (parts: Map<string, Rail>, width = 40): string[] =>
  parts.get("footer")?.render?.(width) ?? [];

const countLines = (lines: string[], needle: string) => lines.filter((l) => l.includes(needle)).length;

/** Capa de otra extensión: reenvía hacia abajo y expone el enlace de delegación. */
const foreignWrapper = (inner: Rail): Rail => ({
  render: (w: number) => inner.render(w),
  digest: () => inner.digest(),
  handleMouse: (e: any) => inner.handleMouse?.(e),
  invalidate: () => inner.invalidate?.(),
  dispose: () => inner.dispose?.(),
  __originalRail: inner
});

const decoratorsInChain = (rail: Rail): number => {
  const seen = new Set<Rail>();
  let node: Rail | undefined = rail;
  let found = 0;
  while (node && !seen.has(node)) {
    seen.add(node);
    if (node.__discordAttached) found += 1;
    node = node.__originalRail;
  }
  return found;
};

test("SIDEBAR_COMPOSITION · la tarjeta se pinta una sola vez en host dinámico", () => {
  const log: Log = [];
  const parts = new Map<string, Rail>([["footer", makeFooter(log)]]);
  mountSidebarRail(terminalWith(parts), makeRail(log));

  const lines = paintDynamicHost(parts);
  assert.equal(countLines(lines, DISCORD_LINE), 1, "Un solo canal de pintado por host");
  assert.equal(countLines(lines, "Status: conectado"), 1);
});

test("SIDEBAR_COMPOSITION · el decorador expone la cadena de delegación", () => {
  const log: Log = [];
  const base = makeFooter(log);
  const parts = new Map<string, Rail>([["footer", base]]);
  mountSidebarRail(terminalWith(parts), makeRail(log));

  const footer = parts.get("footer") as Rail;
  assert.equal(footer.__discordAttached, true);
  assert.equal(footer.__originalRail, base, "Sin enlace, otras extensiones reinstalan su compositor");
});

test("SIDEBAR_COMPOSITION · no se apila bajo una capa extranjera", () => {
  const log: Log = [];
  const parts = new Map<string, Rail>([["footer", makeFooter(log)]]);
  mountSidebarRail(terminalWith(parts), makeRail(log));

  // Otra extensión pone su wrapper por encima y luego se vuelve a montar (turn_start/reload).
  const outer = foreignWrapper(parts.get("footer") as Rail);
  parts.set("footer", outer);
  mountSidebarRail(terminalWith(parts), makeRail(log));

  const rail = parts.get("footer") as Rail;
  assert.equal(decoratorsInChain(rail), 1, "Uno solo, sin importar las capas intermedias");
  assert.equal(countLines(rail.render(40), DISCORD_LINE), 1);
});

test("SIDEBAR_COMPOSITION · dispose no destruye un rail que no es propio", () => {
  const log: Log = [];
  const base = makeFooter(log);
  const parts = new Map<string, Rail>([["footer", base]]);
  mountSidebarRail(terminalWith(parts), makeRail(log));

  const decorated = parts.get("footer") as Rail;
  const outer = foreignWrapper(decorated);
  parts.set("footer", outer);

  decorated.dispose();

  assert.equal(parts.get("footer"), outer, "No despoja la capa ajena");
  assert.ok(!log.includes("footer:dispose"), "No dispone del rail base: pertenece a otra extensión");
});

test("SIDEBAR_COMPOSITION · sin footer usa el canal de parte y pinta una vez", () => {
  const log: Log = [];
  const parts = new Map<string, Rail>();
  mountSidebarRail(terminalWith(parts), makeRail(log));

  assert.equal(countLines(paintStaticHost(parts), DISCORD_LINE), 0);
  assert.equal(countLines(paintDynamicHost(parts), DISCORD_LINE), 1);
});
