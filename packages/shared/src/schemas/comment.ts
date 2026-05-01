import { z } from "zod";
import { Id } from "./common";

export const CreateComment = z
  .object({
    dramaId: Id.optional(),
    episodeId: Id.optional(),
    parentId: Id.optional(),
    content: z.string().min(1).max(1000),
  })
  .refine((d) => d.dramaId || d.episodeId, "dramaId or episodeId required");
export type CreateComment = z.infer<typeof CreateComment>;

export const ListComments = z.object({
  cursor: z.string().optional().nullable(),
  limit: z.number().int().min(1).max(50).default(20),
  dramaId: Id.optional(),
  episodeId: Id.optional(),
  parentId: Id.optional(),
});

export const ModerateComment = z.object({
  id: Id,
  status: z.enum(["VISIBLE", "HIDDEN", "DELETED"]),
});
