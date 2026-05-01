import { z } from "zod";
import { Id } from "./common";

export const UpsertFeedSlot = z.object({
  id: Id.optional(),
  key: z.string().min(1).max(40),
  name: z.string().min(1),
  position: z.string().min(1),
  isActive: z.boolean().default(true),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
});

export const UpsertFeedSlotItem = z.object({
  id: Id.optional(),
  slotId: Id,
  dramaId: Id.optional().nullable(),
  bannerImg: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  title: z.string().max(80).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const RebuildLeaderboard = z.object({
  key: z.string().min(1),
  limit: z.number().int().min(1).max(200).default(50),
});
