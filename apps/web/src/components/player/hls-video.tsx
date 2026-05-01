"use client";

import * as React from "react";
import Hls from "hls.js";

export interface HlsVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src"> {
  src: string | null;
  active?: boolean;
  onTimeUpdateMs?: (positionMs: number, durationMs: number) => void;
}

export const HlsVideo = React.forwardRef<HTMLVideoElement, HlsVideoProps>(function HlsVideo(
  { src, active = true, onTimeUpdateMs, className, autoPlay = true, muted = false, ...rest },
  ref,
) {
  const innerRef = React.useRef<HTMLVideoElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current!, []);
  const hlsRef = React.useRef<Hls | null>(null);

  React.useEffect(() => {
    const v = innerRef.current;
    if (!v || !src) return;

    const isHls = src.includes(".m3u8");
    if (isHls && v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
    } else if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(v);
      hlsRef.current = hls;
    } else {
      v.src = src;
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  React.useEffect(() => {
    const v = innerRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {
        // autoplay blocked — caller should show a tap-to-play UI
      });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, src]);

  React.useEffect(() => {
    if (!onTimeUpdateMs) return;
    const v = innerRef.current;
    if (!v) return;
    let raf = 0;
    const handler = () => {
      onTimeUpdateMs(Math.floor(v.currentTime * 1000), Math.floor((v.duration || 0) * 1000));
    };
    v.addEventListener("timeupdate", handler);
    return () => {
      v.removeEventListener("timeupdate", handler);
      cancelAnimationFrame(raf);
    };
  }, [onTimeUpdateMs]);

  return (
    <video
      ref={innerRef}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      preload="metadata"
      loop
      {...rest}
    />
  );
});
