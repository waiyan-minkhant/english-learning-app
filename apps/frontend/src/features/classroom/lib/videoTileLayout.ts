export const VIDEO_TILE_HEIGHT_PX = 160;
export const VIDEO_TILE_GAP_PX = 16;

export const VIDEO_TILE_SCROLL_MAX_HEIGHT_PX =
  VIDEO_TILE_HEIGHT_PX * 2 + VIDEO_TILE_GAP_PX;

export const VIDEO_TILE_HEIGHT_CLASS = "h-[160px]";

export function getVideoScrollViewportHeightPx(
  totalTileCount: number
): number | null {
  if (totalTileCount <= 0) return null;
  if (totalTileCount === 1) return VIDEO_TILE_HEIGHT_PX;
  return VIDEO_TILE_SCROLL_MAX_HEIGHT_PX;
}

export function getVideoScrollViewportStyle(
  totalTileCount: number
): { height: number } | null {
  const height = getVideoScrollViewportHeightPx(totalTileCount);
  return height == null ? null : { height };
}
