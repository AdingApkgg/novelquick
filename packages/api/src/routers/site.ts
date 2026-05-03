import { z } from "zod";
import { router, publicProcedure } from "../trpc";

const DEFAULT_CONFIG = {
  siteName: "短剧速看",
  description: "海量精品短剧，沉浸式竖屏播放",
  icp: "",
  contact: "",
  about: "短剧速看是一个面向短剧爱好者的内容平台，提供丰富的精品短剧资源。",
  termsUrl: "/terms",
  privacyUrl: "/privacy",
  helpUrl: "/help",
  qrDownloadImg: "",
  showAppDownload: false,
} as const;

export type SiteConfig = typeof DEFAULT_CONFIG;

export const siteRouter = router({
  config: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.siteSetting.findMany();
    const overrides = Object.fromEntries(
      rows.map((r) => [r.key, r.value as unknown]),
    ) as Partial<SiteConfig>;
    return { ...DEFAULT_CONFIG, ...overrides };
  }),
});
