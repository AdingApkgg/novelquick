import { z } from "zod";
import { router, publicProcedure, rateLimited } from "../trpc";

const FeedbackCategory = z.enum(["BUG", "SUGGESTION", "CONTENT", "PAYMENT", "OTHER"]);

export const feedbackRouter = router({
  send: rateLimited(publicProcedure, { name: "feedback", limit: 5, windowSec: 600 })
    .input(
      z.object({
        category: FeedbackCategory.default("OTHER"),
        content: z.string().min(5).max(2000),
        email: z.string().email().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.feedback.create({
        data: {
          userId: ctx.user?.id ?? null,
          email: input.email ?? ctx.user?.email ?? null,
          category: input.category,
          content: input.content,
          userAgent: ctx.headers.get("user-agent") ?? null,
          ip: ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        },
      });
      return { ok: true };
    }),
});
