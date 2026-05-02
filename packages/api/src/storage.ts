import { mkdir, writeFile, stat, readdir, unlink } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { randomUUID } from "node:crypto";

export interface StorageDriver {
  /** Save a buffer or stream and return a URL the player can use */
  save(key: string, data: Buffer | Uint8Array): Promise<{ key: string; url: string }>;
  /** Resolve a public URL for a stored key */
  url(key: string): string;
  /** Resolve absolute filesystem path (local driver only) */
  absPath?(key: string): string;
  /** Delete an object */
  remove(key: string): Promise<void>;
  /** Stream from disk (local) — used by /api/media route */
  read?(key: string): NodeJS.ReadableStream;
}

class LocalDriver implements StorageDriver {
  constructor(
    private rootDir: string,
    private publicBase: string,
  ) {}

  absPath(key: string) {
    return join(this.rootDir, key);
  }

  url(key: string) {
    return `${this.publicBase.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  }

  async save(key: string, data: Buffer | Uint8Array) {
    const full = this.absPath(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
    return { key, url: this.url(key) };
  }

  async remove(key: string) {
    try {
      await unlink(this.absPath(key));
    } catch {}
  }

  read(key: string) {
    return createReadStream(this.absPath(key));
  }
}

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  const driver = process.env.VIDEO_STORAGE_DRIVER ?? "local";
  if (driver === "local") {
    const dir = process.env.VIDEO_LOCAL_DIR ?? "./storage/videos";
    const base = process.env.VIDEO_PUBLIC_BASE_URL ?? "http://localhost:3000/api/media";
    cached = new LocalDriver(dir, base);
    return cached;
  }
  // S3 driver — TODO when needed
  throw new Error(`Unsupported VIDEO_STORAGE_DRIVER: ${driver}`);
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

export function generateUploadKey(filename: string) {
  const ext = (extname(filename) || ".mp4").toLowerCase();
  const id = randomUUID();
  const date = new Date().toISOString().slice(0, 10);
  const prefix = IMAGE_EXT.has(ext) ? "images" : "originals";
  return `${prefix}/${date}/${id}${ext}`;
}

export function generateHlsDir(episodeId: string) {
  return `hls/${episodeId}`;
}
