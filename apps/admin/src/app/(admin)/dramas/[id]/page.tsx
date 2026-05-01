"use client";

import { useParams } from "next/navigation";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@nq/ui";
import { DramaForm } from "../_components/drama-form";
import { EpisodeManager } from "../_components/episode-manager";

export default function DramaEditPage() {
  const trpc = useTRPC();
  const { id } = useParams<{ id: string }>();
  const { data, isPending } = useQuery(trpc.admin.drama.byId.queryOptions({ id }));

  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p>未找到</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">编辑：{data.title}</h1>
      <DramaForm initial={data} />
      <hr />
      <EpisodeManager dramaId={data.id} freeEpisodes={data.freeEpisodes} />
    </div>
  );
}
