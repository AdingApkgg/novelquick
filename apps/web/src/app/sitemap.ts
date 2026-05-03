import type { MetadataRoute } from "next";
import { prisma } from "@nq/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_WEB_URL ?? "https://novelquick.larx.cc";

  const dramas = await prisma.drama
    .findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { sortWeight: "desc" },
      take: 5000,
    })
    .catch(() => []);

  const cats = await prisma.category
    .findMany({ where: { isVisible: true }, select: { slug: true } })
    .catch(() => []);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0, changeFrequency: "hourly" },
    { url: `${base}/discover`, priority: 0.9, changeFrequency: "hourly" },
    { url: `${base}/search`, priority: 0.5 },
    { url: `${base}/about`, priority: 0.3 },
    { url: `${base}/help`, priority: 0.3 },
    { url: `${base}/privacy`, priority: 0.2 },
    { url: `${base}/terms`, priority: 0.2 },
  ];

  const catUrls: MetadataRoute.Sitemap = cats.map((c) => ({
    url: `${base}/c/${c.slug}`,
    priority: 0.6,
    changeFrequency: "daily",
  }));

  const dramaUrls: MetadataRoute.Sitemap = dramas.map((d) => ({
    url: `${base}/d/${d.id}`,
    lastModified: d.updatedAt,
    priority: 0.7,
    changeFrequency: "daily",
  }));

  return [...staticUrls, ...catUrls, ...dramaUrls];
}
