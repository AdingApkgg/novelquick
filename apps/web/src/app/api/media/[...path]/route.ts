import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, normalize, resolve } from "node:path";
import { Readable } from "node:stream";

const ROOT = resolve(process.env.VIDEO_LOCAL_DIR ?? "./storage/videos");

const MIME: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = normalize(path.join("/")).replace(/^[/\\]+/, "");
  const full = resolve(ROOT, rel);
  if (!full.startsWith(ROOT)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let s;
  try {
    s = await stat(full);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (!s.isFile()) return new NextResponse("Not Found", { status: 404 });

  const ext = extname(full).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";

  // For .m3u8 / small files just return whole body
  if (ext === ".m3u8" || s.size < 256 * 1024) {
    const body = await readFile(full);
    return new NextResponse(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": ext === ".m3u8" ? "no-cache" : "public, max-age=3600",
      },
    });
  }

  // Range support for video streaming
  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : s.size - 1;
      if (start <= end && end < s.size) {
        const stream = createReadStream(full, { start, end });
        return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
          status: 206,
          headers: {
            "Content-Type": type,
            "Content-Range": `bytes ${start}-${end}/${s.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(end - start + 1),
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }
  }

  const stream = createReadStream(full);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(s.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
