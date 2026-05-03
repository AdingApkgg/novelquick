import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_WEB_URL ?? "https://novelquick.larx.cc";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/me/", "/sign-in", "/sign-up", "/watch/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
