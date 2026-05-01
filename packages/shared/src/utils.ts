export function formatPlayCount(n: number | bigint): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}亿`;
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}万`;
  return String(num);
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isVipActive(vipUntil: Date | null | undefined): boolean {
  if (!vipUntil) return false;
  return vipUntil.getTime() > Date.now();
}
