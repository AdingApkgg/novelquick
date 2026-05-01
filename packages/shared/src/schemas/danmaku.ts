import { z } from "zod";
import { Id } from "./common";

export const DanmakuMode = z.enum(["SCROLL", "TOP", "BOTTOM"]);

export const SendDanmaku = z.object({
  episodeId: Id,
  timeMs: z.number().int().min(0),
  text: z.string().min(1).max(80),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/)
    .default("#ffffff"),
  fontSize: z.number().int().min(12).max(48).default(24),
  mode: DanmakuMode.default("SCROLL"),
});
export type SendDanmaku = z.infer<typeof SendDanmaku>;

export const ListDanmaku = z.object({
  episodeId: Id,
  fromMs: z.number().int().min(0).default(0),
  toMs: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(2000).default(500),
});
