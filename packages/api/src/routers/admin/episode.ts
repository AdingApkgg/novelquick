import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../../trpc";
import { CreateEpisode, UpdateEpisode } from "@nq/shared/schemas";
import { transcodeQueue } from "../../queue";
import { generateHlsDir } from "../../storage";

export const adminEpisodeRouter = router({
  list: adminProcedure.input(z.object({ dramaId: z.string() })).query(async ({ ctx, input }) => {
    return ctx.prisma.episode.findMany({
      where: { dramaId: input.dramaId },
      orderBy: { index: "asc" },
    });
  }),

  create: adminProcedure.input(CreateEpisode).mutation(async ({ ctx, input }) => {
    const ep = await ctx.prisma.episode.create({ data: input });
    await ctx.prisma.drama.update({
      where: { id: input.dramaId },
      data: { totalEpisodes: { increment: 1 } },
    });
    return ep;
  }),

  update: adminProcedure.input(UpdateEpisode).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    return ctx.prisma.episode.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.status === "READY" ? { publishedAt: new Date() } : {}),
      },
    });
  }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const ep = await ctx.prisma.episode.findUnique({ where: { id: input.id } });
    if (!ep) throw new TRPCError({ code: "NOT_FOUND" });
    await ctx.prisma.episode.delete({ where: { id: input.id } });
    await ctx.prisma.drama.update({
      where: { id: ep.dramaId },
      data: { totalEpisodes: { decrement: 1 } },
    });
    return { ok: true };
  }),

  /**
   * Triggered after a file has been uploaded via the REST endpoint.
   * Marks the episode TRANSCODING and enqueues a worker job.
   */
  enqueueTranscode: adminProcedure
    .input(z.object({ episodeId: z.string(), inputKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ep = await ctx.prisma.episode.findUnique({ where: { id: input.episodeId } });
      if (!ep) throw new TRPCError({ code: "NOT_FOUND" });

      const outputDir = generateHlsDir(ep.id);
      const job = await ctx.prisma.transcodeJob.create({
        data: {
          episodeId: ep.id,
          inputPath: input.inputKey,
          outputDir,
          status: "PENDING",
        },
      });

      await ctx.prisma.episode.update({
        where: { id: ep.id },
        data: { status: "TRANSCODING" },
      });

      await transcodeQueue.enqueue({
        jobId: job.id,
        episodeId: ep.id,
        inputKey: input.inputKey,
        outputDir,
      });

      return { jobId: job.id };
    }),

  jobs: adminProcedure
    .input(z.object({ episodeId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.transcodeJob.findMany({
        where: input.episodeId ? { episodeId: input.episodeId } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { episode: { select: { title: true, dramaId: true } } },
      });
    }),
});
