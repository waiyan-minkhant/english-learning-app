export const CURSOR_IDLE_MS = 2000;

export function isCursorActive(
  lastActiveAt: number,
  now = Date.now(),
  idleMs = CURSOR_IDLE_MS
) {
  return now - lastActiveAt < idleMs;
}

export function normalizePointer(
  rect: DOMRect,
  clientX: number,
  clientY: number
) {
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y))
  };
}

export function shouldEmitCursorMove(
  lastPx: number | null,
  lastPy: number | null,
  nextPx: number,
  nextPy: number,
  thresholdPx = 3
) {
  if (lastPx === null || lastPy === null) return true;
  const dx = nextPx - lastPx;
  const dy = nextPy - lastPy;
  return dx * dx + dy * dy >= thresholdPx * thresholdPx;
}

export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms = 50
): (...args: Parameters<T>) => void {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const run = () => {
    if (!latestArgs) return;
    fn(...latestArgs);
    latestArgs = null;
    last = Date.now();
  };

  return (...args: Parameters<T>) => {
    latestArgs = args;
    const now = Date.now();
    const elapsed = now - last;

    if (elapsed >= ms) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      run();
      return;
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        run();
      }, ms - elapsed);
    }
  };
}

/** Stable HSL color per user for remote cursor dots. */
export function cursorColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}
