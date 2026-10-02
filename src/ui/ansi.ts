/**
 * Utilidades ANSI y cálculo visual de texto sin dependencias externas pesadas.
 */

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";

export const COLORS = {
  white: "\x1b[38;2;240;240;245m",
  muted: "\x1b[38;2;130;140;155m",
  mint: "\x1b[38;2;80;220;140m",
  coral: "\x1b[38;2;245;100;100m",
  amber: "\x1b[38;2;245;180;60m",
  cyan: "\x1b[38;2;80;190;240m",
  border: "\x1b[38;2;60;65;80m",
};

/**
 * Elimina secuencias de escape ANSI para calcular longitud visible.
 */
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Retorna el ancho visual en caracteres de la cadena.
 */
export function visibleWidth(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Recorta una cadena al ancho máximo respetando secuencias.
 */
export function fitText(text: string, maxWidth: number): string {
  const clean = stripAnsi(text);
  if (clean.length <= maxWidth) return text;
  return clean.slice(0, Math.max(0, maxWidth - 1)) + "…";
}

/**
 * Justifica dos bloques de texto en una sola línea a un ancho dado.
 */
export function padBetween(left: string, right: string, width: number): string {
  const leftLen = visibleWidth(left);
  const rightLen = visibleWidth(right);
  const spaces = Math.max(1, width - leftLen - rightLen);
  return `${left}${" ".repeat(spaces)}${right}`;
}

export function color(col: keyof typeof COLORS, text: string): string {
  return `${COLORS[col]}${text}${RESET}`;
}
