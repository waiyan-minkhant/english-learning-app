/** Shared dimensions so question cap, drop slot, and answer piece interlock. */
export const PUZZLE = {
  width: 200,
  /** Question header body height (notch cuts into the bottom of this). */
  capHeight: 96,
  /** Answer / slot body height below the tab baseline. */
  bodyHeight: 88,
  cornerRadius: 16,
  tabRadius: 20,
  strokeWidth: 1.75,
  dashArray: "5 4"
} as const;

export type PuzzleGeometry = typeof PUZZLE;

/** Total SVG height for slot / answer piece (tab protrudes above body). */
export function pieceHeight(g: PuzzleGeometry = PUZZLE): number {
  return g.bodyHeight + g.tabRadius;
}

/**
 * Filled question cap: rounded top, flat sides, semicircle notch cut into bottom center.
 */
export function questionCapPath(g: PuzzleGeometry = PUZZLE): string {
  const { width: w, capHeight: h, cornerRadius: r, tabRadius: tr } = g;
  const cx = w / 2;

  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h}`,
    `H ${cx + tr}`,
    // Notch: travel left, arc up into the cap through (cx, h - tr)
    `A ${tr} ${tr} 0 0 1 ${cx - tr} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z"
  ].join(" ");
}

/**
 * Male puzzle piece (upward tab + body). Used for drop-slot outline and answer cards.
 */
export function answerPiecePath(g: PuzzleGeometry = PUZZLE): string {
  const { width: w, bodyHeight: bh, cornerRadius: r, tabRadius: tr } = g;
  const cx = w / 2;
  const top = tr;
  const bottom = tr + bh;

  return [
    `M ${r} ${top}`,
    `H ${cx - tr}`,
    // Tab: travel right, arc up through (cx, 0)
    `A ${tr} ${tr} 0 0 1 ${cx + tr} ${top}`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${top + r}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${bottom}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${bottom - r}`,
    `V ${top + r}`,
    `A ${r} ${r} 0 0 1 ${r} ${top}`,
    "Z"
  ].join(" ");
}
