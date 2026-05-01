import { trpcServer } from "@/lib/trpc/server";
import { notFound } from "next/navigation";
import { WatchClient } from "./watch-client";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ dramaId: string; ep: string }>;
}) {
  const { dramaId, ep } = await params;
  const index = Number(ep);
  if (Number.isNaN(index)) notFound();

  const trpc = await trpcServer();
  const initial = await trpc.episode.watch({ dramaId, index });
  return <WatchClient dramaId={dramaId} initial={initial} />;
}
