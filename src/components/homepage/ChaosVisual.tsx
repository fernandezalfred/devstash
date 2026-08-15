"use client";

import { useEffect, useRef } from "react";
import {
  AppWindow,
  Bookmark,
  Braces,
  FileText,
  GitBranch,
  MessageSquare,
  NotebookPen,
  Terminal,
  type LucideIcon,
} from "lucide-react";

// Tools developers scatter their knowledge across today. Decorative — these
// represent OTHER products, not DevStash's own item types, so the colors are
// arbitrary brand-ish accents rather than the real item-type palette.
const TOOLS: { Icon: LucideIcon; color: string }[] = [
  { Icon: NotebookPen, color: "#f4f4f6" },
  { Icon: GitBranch, color: "#f4f4f6" },
  { Icon: MessageSquare, color: "#e01e5a" },
  { Icon: Braces, color: "#3b82f6" },
  { Icon: AppWindow, color: "#22c55e" },
  { Icon: Terminal, color: "#06b6d4" },
  { Icon: FileText, color: "#f59e0b" },
  { Icon: Bookmark, color: "#6366f1" },
];

const ICON_SIZE = 60;
const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 0.28;
const MAX_SPEED = 0.55;
const MAX_REPEL_SPEED = MAX_SPEED * 4;

interface Icon {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotSeed: number;
  rotSpeed: number;
  scaleSeed: number;
  scaleSpeed: number;
}

// Floating tool icons: drift, bounce off the container walls, subtly rotate
// and scale-pulse, and repel from the cursor on hover. Runs a plain
// requestAnimationFrame loop mutating each icon's transform directly (not
// React state) to keep 8 animated elements at 60fps without a re-render per
// frame.
export function ChaosVisual() {
  const boxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const box = boxRef.current;
    const container = containerRef.current;
    if (!box || !container) return;

    let bounds = { width: 0, height: 0 };
    function measure() {
      bounds = { width: container!.clientWidth, height: container!.clientHeight };
    }
    measure();

    const icons: Icon[] = iconRefs.current
      .filter((el): el is HTMLDivElement => el !== null)
      .map((el) => ({
        el,
        x: Math.random() * 0.8 * (bounds.width || 260),
        y: Math.random() * 0.8 * (bounds.height || 200),
        vx: (Math.random() - 0.5) * MAX_SPEED,
        vy: (Math.random() - 0.5) * MAX_SPEED,
        rotSeed: Math.random() * Math.PI * 2,
        rotSpeed: 0.4 + Math.random() * 0.4,
        scaleSeed: Math.random() * Math.PI * 2,
        scaleSpeed: 0.6 + Math.random() * 0.5,
      }));

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    function handleMouseMove(event: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    }
    function handleMouseLeave() {
      mouseX = null;
      mouseY = null;
    }

    box.addEventListener("mousemove", handleMouseMove);
    box.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", measure);

    let lastTime = performance.now();
    let frameId: number;

    function tick(now: number) {
      const dt = Math.min(now - lastTime, 48); // clamp for tab-switch stalls
      lastTime = now;
      const t = now / 1000;

      if (bounds.width === 0) measure();
      const maxX = Math.max(0, bounds.width - ICON_SIZE);
      const maxY = Math.max(0, bounds.height - ICON_SIZE);

      for (const icon of icons) {
        if (mouseX !== null && mouseY !== null) {
          const cx = icon.x + ICON_SIZE / 2;
          const cy = icon.y + ICON_SIZE / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < REPEL_RADIUS) {
            const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
            icon.vx += (dx / dist) * force;
            icon.vy += (dy / dist) * force;
          }
        }

        // Cap how fast a single repel burst can fling an icon, then bleed
        // off only the excess speed above baseline so icons settle back to
        // a gentle drift instead of decaying to a standstill (or flying off).
        let speed = Math.hypot(icon.vx, icon.vy);
        if (speed > MAX_REPEL_SPEED) {
          const scale = MAX_REPEL_SPEED / speed;
          icon.vx *= scale;
          icon.vy *= scale;
          speed = MAX_REPEL_SPEED;
        }
        if (speed > MAX_SPEED) {
          const target = Math.max(MAX_SPEED, speed * 0.9);
          const scale = target / speed;
          icon.vx *= scale;
          icon.vy *= scale;
        }

        icon.x += icon.vx * (dt / 16);
        icon.y += icon.vy * (dt / 16);

        if (icon.x < 0) {
          icon.x = 0;
          icon.vx = Math.abs(icon.vx);
        } else if (icon.x > maxX) {
          icon.x = maxX;
          icon.vx = -Math.abs(icon.vx);
        }
        if (icon.y < 0) {
          icon.y = 0;
          icon.vy = Math.abs(icon.vy);
        } else if (icon.y > maxY) {
          icon.y = maxY;
          icon.vy = -Math.abs(icon.vy);
        }

        const rotation = Math.sin(t * icon.rotSpeed + icon.rotSeed) * 12;
        const scaleVal = 1 + Math.sin(t * icon.scaleSpeed + icon.scaleSeed) * 0.08;

        icon.el.style.transform =
          `translate(${icon.x}px, ${icon.y}px) rotate(${rotation.toFixed(2)}deg) scale(${scaleVal.toFixed(3)})`;
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      box.removeEventListener("mousemove", handleMouseMove);
      box.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative h-80 overflow-hidden rounded-xl border border-border bg-card/60 p-5"
    >
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Your knowledge today...
      </p>
      <div ref={containerRef} className="relative h-60 w-full">
        {TOOLS.map(({ Icon, color }, i) => (
          <div
            key={i}
            ref={(el) => {
              iconRefs.current[i] = el;
            }}
            className="pointer-events-none absolute top-0 left-0 flex size-[60px] items-center justify-center rounded-xl border border-white/10 bg-white/5 will-change-transform"
          >
            <Icon className="size-6" style={{ color }} />
          </div>
        ))}
      </div>
    </div>
  );
}
