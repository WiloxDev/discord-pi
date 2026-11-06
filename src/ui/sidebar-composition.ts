/**
 * Composición del rail de Discord en el sidebar de Gentle-Shell.
 *
 * Contrato (ADR-0001 de Wellness-Reloj-pi, R1–R3):
 *  · Un solo canal de pintado por host.
 *  · Todo lo que envuelve `footer` expone `__originalRail`, para que otras extensiones puedan
 *    recorrer la cadena en vez de mirar solo la capa visible.
 *  · `dispose` solo toca lo que es propio.
 */

const SIDEBAR_STATE_KEY = Symbol.for("gentle-pi.experimental-sidebar.state");

export interface DiscordRail {
  render: (width: number) => string[];
  digest: () => string;
  handleMouse?: (evt: any) => any;
  invalidate?: () => void;
  dispose?: () => void;
}

type Part = Record<string, any>;

/** Busca nuestro decorador recorriendo la cadena de delegación, con guarda anti-ciclos. */
function findDiscordDecorator(footer: Part | undefined): Part | null {
  const seen = new Set<Part>();
  let node: Part | undefined = footer;
  while (node && !seen.has(node)) {
    seen.add(node);
    if (node.__discordAttached) return node;
    node = node.__originalRail;
  }
  return null;
}

export function mountSidebarRail(terminal: any, railComponent: DiscordRail): any | null {
  const terminalState = terminal ? terminal[SIDEBAR_STATE_KEY] : null;
  if (!terminalState?.parts || typeof terminalState.parts.set !== "function") {
    return null;
  }

  const parts: Map<string, Part> = terminalState.parts;
  const originalFooter: Part | undefined = parts.get("footer");
  (railComponent as Part).__discordRail = true;

  // Host sin `footer` (descubrimiento dinámico de partes): la tarjeta va como parte propia.
  if (!originalFooter) {
    parts.set("discord", railComponent);
    return terminalState;
  }

  // Si antes se usó el canal de parte, se retira: la misma tarjeta no puede vivir en dos canales.
  const ownPart = parts.get("discord");
  if (ownPart?.__discordRail) parts.delete("discord");

  // Ya estamos montados en algún punto de la cadena → idempotente, no nos apilamos.
  if (findDiscordDecorator(originalFooter)) return terminalState;

  const decoratedFooter: Part = {
    __discordAttached: true,
    // Enlace de delegación: sin esto, los compositores de ranuras no nos ven y reinstalan el suyo.
    __originalRail: originalFooter,
    render: (width: number) => {
      const footerLines = originalFooter.render?.(width) ?? [];
      const discordLines = railComponent.render(width) ?? [];
      if (discordLines.length === 0) return footerLines;
      if (footerLines.length === 0) return discordLines;
      return [...footerLines, "", ...discordLines];
    },
    digest: () => {
      const fDigest = typeof originalFooter.digest === "function" ? originalFooter.digest() : "";
      return `${fDigest}_discord_${railComponent.digest()}`;
    },
    handleMouse: (evt: any) => {
      const handledByFooter = originalFooter.handleMouse?.(evt);
      if (handledByFooter) return handledByFooter;
      return railComponent.handleMouse?.(evt);
    },
    invalidate: () => {
      originalFooter.invalidate?.();
      railComponent.invalidate?.();
    },
    dispose: () => {
      // Solo restauramos si seguimos siendo el footer activo…
      if (parts.get("footer") === decoratedFooter) {
        parts.set("footer", originalFooter);
      }
      // …y nunca disponemos de `originalFooter`: pertenece a la extensión que lo creó.
      railComponent.dispose?.();
    },
  };
  parts.set("footer", decoratedFooter);

  return terminalState;
}
