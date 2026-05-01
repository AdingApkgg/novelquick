import { z } from "zod";
import { Id } from "./common";

export const EpisodeStatus = z.enum(["DRAFT", "TRANSCODING", "READY", "FAILED", "OFFLINE"]);

export const CreateEpisode = z.object({
  dramaId: Id,
  index: z.number().int().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  duration: z.number().int().min(0).default(0),
  isFree: z.boolean().default(true),
  unlockCoins: z.number().int().min(0).default(0),
  status: EpisodeStatus.default("DRAFT"),
});
export type CreateEpisode = z.infer<typeof CreateEpisode>;

export const UpdateEpisode = CreateEpisode.partial().extend({ id: Id });
export type UpdateEpisode = z.infer<typeof UpdateEpisode>;

export const StartUpload = z.object({
  dramaId: Id,
  index: z.number().int().min(1),
  filename: z.string(),
  size: z.number().int().min(1),
});

export const CompleteUpload = z.object({
  episodeId: Id,
  uploadId: z.string(),
});

export const ReportProgress = z.object({
  episodeId: Id,
  positionMs: z.number().int().min(0),
  durationMs: z.number().int().min(0),
});
