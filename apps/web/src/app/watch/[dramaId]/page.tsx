import { redirect } from "next/navigation";
import { trpcServer } from "@/lib/trpc/server";

export const dynamic = "force-dynamic";

export default async function DramaWatchEntry({ params }: { params: Promise<{ dramaId: string }> }) {
  const { dramaId } = await params;
  const trpc = await trpcServer();
  const data = await trpc.episode.watch({ dramaId });
  redirect(`/watch/${dramaId}/${data.episode.index}`);
}
