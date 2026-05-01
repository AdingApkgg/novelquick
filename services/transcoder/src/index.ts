import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { prisma } from "@nq/db/client";
import { QUEUE_TRANSCODE, type TranscodePayload } from "@nq/api/queue";
import { VIDEO_VARIANTS } from "@nq/shared/constants";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const ROOT = resolve(process.env.VIDEO_LOCAL_DIR ?? "./storage/videos");
const PUBLIC_BASE = (process.env.VIDEO_PUBLIC_BASE_URL ?? "http://localhost:3000/api/media").replace(/\/$/, "");
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";

console.log(`[transcoder] starting · root=${ROOT} ffmpeg=${FFMPEG}`);

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

new Worker<TranscodePayload>(
  QUEUE_TRANSCODE,
  async (job) => {
    const { jobId, episodeId, inputKey, outputDir } = job.data;
    console.log(`[transcoder] job=${jobId} episode=${episodeId} input=${inputKey}`);

    await prisma.transcodeJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date(), progress: 1 },
    });

    try {
      const inputPath = join(ROOT, inputKey);
      const outAbs = join(ROOT, outputDir);
      await mkdir(outAbs, { recursive: true });

      // 1. Probe duration
      const durationMs = await probeDurationMs(inputPath);

      // 2. Generate variants in parallel-ish
      const variants = VIDEO_VARIANTS;
      let done = 0;
      for (const v of variants) {
        await runFfmpegHls(inputPath, outAbs, v);
        done++;
        await prisma.transcodeJob.update({
          where: { id: jobId },
          data: { progress: Math.floor((done / (variants.length + 1)) * 100) },
        });
      }

      // 3. Master playlist
      await writeMasterPlaylist(outAbs);

      // 4. Persist assets
      const masterUrl = `${PUBLIC_BASE}/${outputDir}/master.m3u8`;
      await prisma.videoAsset.deleteMany({ where: { episodeId } });
      await prisma.videoAsset.create({
        data: { episodeId, kind: "HLS_MASTER", url: masterUrl, durationMs },
      });
      for (const v of variants) {
        await prisma.videoAsset.create({
          data: {
            episodeId,
            kind: "HLS_VARIANT",
            url: `${PUBLIC_BASE}/${outputDir}/${v.name}/index.m3u8`,
            width: v.width,
            height: v.height,
            bitrate: v.bitrate,
          },
        });
      }

      // 5. Mark episode READY
      await prisma.episode.update({
        where: { id: episodeId },
        data: {
          status: "READY",
          duration: Math.floor(durationMs / 1000),
          publishedAt: new Date(),
        },
      });

      await prisma.transcodeJob.update({
        where: { id: jobId },
        data: { status: "SUCCEEDED", progress: 100, finishedAt: new Date() },
      });
    } catch (err) {
      console.error(`[transcoder] job=${jobId} failed:`, err);
      await prisma.transcodeJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: (err as Error).message ?? String(err),
          finishedAt: new Date(),
        },
      });
      await prisma.episode.update({ where: { id: episodeId }, data: { status: "FAILED" } });
      throw err;
    }
  },
  { connection, concurrency: 2 },
);

console.log("[transcoder] ready");

async function probeDurationMs(input: string): Promise<number> {
  return new Promise((resolveP, reject) => {
    const proc = spawn(FFPROBE, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      input,
    ]);
    let out = "";
    proc.stdout.on("data", (c) => (out += c.toString()));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited ${code}`));
      const sec = parseFloat(out.trim());
      resolveP(Math.floor(sec * 1000));
    });
    proc.on("error", reject);
  });
}

async function runFfmpegHls(
  input: string,
  outDir: string,
  variant: { name: string; width: number; height: number; bitrate: number },
) {
  const dir = join(outDir, variant.name);
  await mkdir(dir, { recursive: true });
  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    `scale=w=${variant.width}:h=${variant.height}:force_original_aspect_ratio=decrease,pad=${variant.width}:${variant.height}:(ow-iw)/2:(oh-ih)/2`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-b:v",
    `${variant.bitrate}k`,
    "-maxrate",
    `${variant.bitrate * 1.07}k`,
    "-bufsize",
    `${variant.bitrate * 1.5}k`,
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_segment_filename",
    join(dir, "seg_%03d.ts"),
    "-f",
    "hls",
    join(dir, "index.m3u8"),
  ];
  await runProc(FFMPEG, args);
}

async function writeMasterPlaylist(outDir: string) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const v of VIDEO_VARIANTS) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${v.bitrate * 1000},RESOLUTION=${v.width}x${v.height},NAME=${v.name}`,
    );
    lines.push(`${v.name}/index.m3u8`);
  }
  const fs = await import("node:fs/promises");
  await fs.writeFile(join(outDir, "master.m3u8"), lines.join("\n"));
}

function runProc(cmd: string, args: string[]) {
  return new Promise<void>((resolveP, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", (code) => (code === 0 ? resolveP() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}
