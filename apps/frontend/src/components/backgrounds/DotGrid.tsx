"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/utils/cn";

const throttle = <T extends unknown[]>(
  func: (...args: T) => void,
  limit: number
) => {
  let lastCall = 0;
  return (...args: T) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
};

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _pulseActive: boolean;
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  maxDisplacement?: number;
  shockRadius?: number;
  shockStrength?: number;
  returnDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  };
}

function bulbOffset(
  dx: number,
  dy: number,
  dist: number,
  radius: number,
  maxDisplacement: number
) {
  if (dist <= 0 || dist >= radius) {
    return { x: 0, y: 0 };
  }
  const falloff = 1 - dist / radius;
  const strength = maxDisplacement * falloff * falloff;
  return {
    x: (dx / dist) * strength,
    y: (dy / dist) * strength
  };
}

export function DotGrid({
  dotSize = 16,
  gap = 32,
  baseColor = "#5227FF",
  activeColor = "#5227FF",
  proximity = 150,
  maxDisplacement = 12,
  shockRadius = 100,
  shockStrength = 1.2,
  returnDuration = 0.6,
  className = "",
  style
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const maxDisplacementRef = useRef(maxDisplacement);
  const proximityRef = useRef(proximity);

  maxDisplacementRef.current = maxDisplacement;
  proximityRef.current = proximity;

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) return null;

    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        dots.push({ cx, cy, xOffset: 0, yOffset: 0, _pulseActive: false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  const applyBulb = useCallback((px: number, py: number) => {
    const radius = proximityRef.current;
    const maxPush = maxDisplacementRef.current;

    for (const dot of dotsRef.current) {
      if (dot._pulseActive) continue;

      const dx = dot.cx - px;
      const dy = dot.cy - py;
      const dist = Math.hypot(dx, dy);
      const { x, y } = bulbOffset(dx, dy, dist, radius, maxPush);
      dot.xOffset = x;
      dot.yOffset = y;
    }
  }, []);

  useEffect(() => {
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let fillStyle = baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fillStyle = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fillStyle;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath]);

  useEffect(() => {
    buildGrid();
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const ro = new ResizeObserver(buildGrid);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [buildGrid]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
      applyBulb(pointerRef.current.x, pointerRef.current.y);
    };

    const onClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const pulseCap = maxDisplacementRef.current * 1.5;

      for (const dot of dotsRef.current) {
        const dx = dot.cx - cx;
        const dy = dot.cy - cy;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0 || dist >= shockRadius || dot._pulseActive) continue;

        const falloff = 1 - dist / shockRadius;
        const mag = Math.min(
          pulseCap,
          maxDisplacementRef.current * shockStrength * falloff * falloff
        );
        const pushX = (dx / dist) * mag;
        const pushY = (dy / dist) * mag;

        dot._pulseActive = true;
        gsap.killTweensOf(dot);
        gsap.to(dot, {
          xOffset: pushX,
          yOffset: pushY,
          duration: 0.15,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(dot, {
              xOffset: 0,
              yOffset: 0,
              duration: returnDuration,
              ease: "power2.out",
              onComplete: () => {
                dot._pulseActive = false;
                applyBulb(pointerRef.current.x, pointerRef.current.y);
              }
            });
          }
        });
      }
    };

    const throttledMove = throttle<[MouseEvent]>(onMove, 16);
    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", onClick);
    };
  }, [applyBulb, shockRadius, shockStrength, returnDuration]);

  return (
    <section
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        className
      )}
      style={style}
    >
      <div ref={wrapperRef} className="relative h-full w-full">
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>
    </section>
  );
}

export default DotGrid;
