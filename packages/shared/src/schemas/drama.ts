import { z } from "zod";
import { Id, Slug } from "./common";

export const DramaStatus = z.enum(["DRAFT", "REVIEWING", "PUBLISHED", "OFFLINE"]);
export const ReleaseStatus = z.enum(["ONGOING", "COMPLETED", "PAUSED"]);

const OptionalUrl = z
  .preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().url().optional(),
  )
  .nullable()
  .optional();

export const CreateDrama = z.object({
  slug: Slug,
  title: z.string().min(1).max(120),
  subtitle: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  cover: OptionalUrl,
  poster: OptionalUrl,
  trailerUrl: OptionalUrl,
  status: DramaStatus.default("DRAFT"),
  releaseStatus: ReleaseStatus.default("ONGOING"),
  region: z.string().max(40).optional().nullable(),
  language: z.string().max(40).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  isVip: z.boolean().default(false),
  freeEpisodes: z.number().int().min(0).max(100).default(3),
  unlockCoins: z.number().int().min(0).default(10),
  sortWeight: z.number().int().default(0),
  categoryIds: z.array(Id).default([]),
  tagIds: z.array(Id).default([]),
});
export type CreateDrama = z.infer<typeof CreateDrama>;

export const UpdateDrama = CreateDrama.partial().extend({ id: Id });
export type UpdateDrama = z.infer<typeof UpdateDrama>;

export const ListDrama = z.object({
  cursor: z.string().optional().nullable(),
  limit: z.number().int().min(1).max(50).default(20),
  status: DramaStatus.optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["new", "hot", "rating", "weight"]).default("weight"),
});
