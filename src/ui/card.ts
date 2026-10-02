import { DiscordVoiceProjection, DiscordPiConfig } from "../core/types.js";
import { color, padBetween, fitText, visibleWidth, BOLD, DIM, RESET } from "./ansi.js";

/**
 * Renderiza la tarjeta cerrada para el sidebar de Gentle-Pi.
 */
export function renderClosedCard(
  title: string,
  glyph: string,
  bodyLines: string[],
  width: number,
): string[] {
  const innerWidth = Math.max(10, width - 4);
  const topBorder = color("border", "╭─ ") + `${BOLD}${title}${RESET}` + color("border", " " + "─".repeat(Math.max(0, width - visibleWidth(title) - 6)) + "╮");
  const bottomBorder = color("border", "╰" + "─".repeat(Math.max(0, width - 2)) + "╯");

  const lines: string[] = [topBorder];

  for (const line of bodyLines) {
    const vLen = visibleWidth(line);
    const padding = Math.max(0, innerWidth - vLen);
    lines.push(color("border", "│ ") + line + " ".repeat(padding) + color("border", " │"));
  }

  lines.push(bottomBorder);
  return lines;
}

/**
 * Renderiza la tarjeta de operaciones de voz de Discord.
 */
export function renderDiscordCard(
  proj: DiscordVoiceProjection,
  width: number,
  config: Required<DiscordPiConfig>,
): string[] {
  const innerWidth = Math.max(10, width - 4);

  if (!proj.connected && !proj.channel) {
    const line = padBetween(
      `${color("muted", "Estado")} ${color("coral", "• Desconectado")}`,
      color("muted", "[ ↗ Abrir ]"),
      innerWidth,
    );
    return renderClosedCard("Discord Voice", "🎧", [line], width);
  }

  const lines: string[] = [];

  // Línea 1: Canal + Bitrate + Ping
  const chName = proj.channel?.name || "general";
  const bitrate = proj.channel?.bitrateKbps ? `${proj.channel.bitrateKbps}k` : "64k";
  const pingStr = proj.pingMs ? `${proj.pingMs}ms` : "24ms";

  const line1 = padBetween(
    `${color("white", `#${fitText(chName, 14)}`)} ${color("muted", `(${bitrate})`)}`,
    color("mint", pingStr),
    innerWidth,
  );
  lines.push(line1);

  // Línea 2: Self user + Mute status
  const selfName = proj.self.displayName || config.defaultUsername;
  const muteBadge = proj.self.muted
    ? color("coral", "[ 🔇 Mute ]")
    : color("mint", "[ 🎙 Hablando ]");

  const line2 = padBetween(
    `${color("mint", "🎙")} ${color("white", fitText(selfName, 18))}`,
    muteBadge,
    innerWidth,
  );
  lines.push(line2);

  // Línea 3: Participantes
  const count = proj.participants.length || 1;
  const countLabel = `${count} en canal`;
  const line3 = padBetween(
    `${color("muted", "👥")} ${color("white", countLabel)}`,
    color("muted", "[ ↗ Abrir ]"),
    innerWidth,
  );
  lines.push(line3);

  // Previsualización de participantes si hay más de 1
  if (proj.participants.length > 0 && config.participantPreview > 0) {
    const preview = proj.participants.slice(0, config.participantPreview);
    for (const p of preview) {
      const glyph = p.speaking ? color("mint", "🟢") : p.muted ? color("coral", "🔇") : color("muted", "○");
      const name = fitText(p.displayName, 20);
      lines.push(`  ${glyph} ${color("white", name)}`);
    }
  }

  return renderClosedCard("Discord Voice", "🎧", lines, width);
}
