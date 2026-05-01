import { z } from "zod";

export const Cursor = z.string().optional().nullable();

export const Pagination = z.object({
  cursor: Cursor,
  limit: z.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof Pagination>;

export const Id = z.string().min(1);
export const Slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "lowercase letters, digits, dashes only");
