"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface ActiveBullet {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  mode: "SCROLL" | "TOP" | "BOTTOM";
  y: number;
  x: number;
  width: number;
  startedAt: number;
}

const ROWS = 8;
const SCROLL_DURATION = 8000;

export function DanmakuLayer({
  episodeId,
  videoRef,
  positionMs,
}: {
  episodeId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  positionMs: number;
}) {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.danmaku.list.queryOptions({ episodeId, limit: 1500 }, { staleTime: 60_000 }),
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState<ActiveBullet[]>([]);
  const firedRef = React.useRef<Set<string>>(new Set());
  const rowOccupancy = React.useRef<number[]>(new Array(ROWS).fill(0));

  // Reset when episode changes
  React.useEffect(() => {
    firedRef.current = new Set();
    setActive([]);
    rowOccupancy.current = new Array(ROWS).fill(0);
  }, [episodeId]);

  React.useEffect(() => {
    if (!data) return;
    const items = data;
    const window = 200;
    const fresh = items.filter(
      (d) => !firedRef.current.has(d.id) && d.timeMs >= positionMs - window && d.timeMs <= positionMs + window,
    );
    if (!fresh.length) return;

    const containerW = containerRef.current?.clientWidth ?? 360;
    const now = performance.now();

    setActive((prev) => {
      const next = [...prev];
      for (const d of fresh) {
        firedRef.current.add(d.id);
        // pick a row whose previous bullet has cleared the right edge
        let row = 0;
        let earliest = Infinity;
        for (let i = 0; i < ROWS; i++) {
          if (rowOccupancy.current[i]! < earliest) {
            earliest = rowOccupancy.current[i]!;
            row = i;
          }
        }
        rowOccupancy.current[row] = now + SCROLL_DURATION;

        next.push({
          id: d.id,
          text: d.text,
          color: d.color,
          fontSize: d.fontSize,
          mode: d.mode,
          y: 12 + row * 28,
          x: containerW,
          width: containerW,
          startedAt: now,
        });
      }
      return next.slice(-200);
    });
  }, [positionMs, data]);

  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      setActive((prev) => prev.filter((b) => now - b.startedAt < SCROLL_DURATION));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 top-12 z-20 h-[40%] overflow-hidden"
    >
      {active.map((b) => (
        <span
          key={b.id}
          className="absolute whitespace-nowrap font-medium text-shadow-strong"
          style={{
            top: b.y,
            left: 0,
            color: b.color,
            fontSize: b.fontSize,
            transform: `translateX(${b.width}px)`,
            animation: `dm-scroll ${SCROLL_DURATION}ms linear forwards`,
          }}
        >
          {b.text}
        </span>
      ))}
      <style>{`@keyframes dm-scroll { to { transform: translateX(-100%); } }`}</style>
    </div>
  );
}
