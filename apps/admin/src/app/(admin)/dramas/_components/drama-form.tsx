"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea, Switch, Card, CardContent } from "@nq/ui";
import { ImageUploadField } from "@/components/image-upload-field";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { slugify } from "@nq/shared/utils";

export function DramaForm({ initial }: { initial?: any }) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const router = useRouter();

  const cats = useQuery(trpc.admin.taxonomy.listCategories.queryOptions());
  const tags = useQuery(trpc.admin.taxonomy.listTags.queryOptions());

  const [form, setForm] = React.useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    subtitle: initial?.subtitle ?? "",
    description: initial?.description ?? "",
    cover: initial?.cover ?? "",
    poster: initial?.poster ?? "",
    trailerUrl: initial?.trailerUrl ?? "",
    status: (initial?.status ?? "DRAFT") as "DRAFT" | "REVIEWING" | "PUBLISHED" | "OFFLINE",
    releaseStatus: (initial?.releaseStatus ?? "ONGOING") as "ONGOING" | "COMPLETED" | "PAUSED",
    isVip: initial?.isVip ?? false,
    freeEpisodes: initial?.freeEpisodes ?? 3,
    unlockCoins: initial?.unlockCoins ?? 10,
    sortWeight: initial?.sortWeight ?? 0,
    categoryIds: (initial?.categories?.map((c: any) => c.id) as string[]) ?? [],
    tagIds: (initial?.tags?.map((t: any) => t.id) as string[]) ?? [],
  });

  const create = useMutation({
    ...trpc.admin.drama.create.mutationOptions(),
    onSuccess: (d) => {
      toast.success("已创建");
      router.push(`/dramas/${d.id}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const update = useMutation({
    ...trpc.admin.drama.update.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.drama.byId.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Field label="剧名">
          <Input
            value={form.title}
            onChange={(e) => {
              const t = e.target.value;
              setForm((f) => ({ ...f, title: t, slug: f.slug || slugify(t) }));
            }}
          />
        </Field>
        <Field label="Slug">
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </Field>
        <Field label="副标题">
          <Input value={form.subtitle ?? ""} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
        </Field>
        <Field label="简介">
          <Textarea
            rows={4}
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            label="封面（竖版 3:4）"
            value={form.cover ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, cover: v }))}
            aspect="3 / 4"
          />
          <ImageUploadField
            label="海报（横版 16:9）"
            value={form.poster ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, poster: v }))}
            aspect="16 / 9"
          />
        </div>
        <Field label="预告片 URL">
          <Input
            value={form.trailerUrl ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, trailerUrl: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="状态">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
            >
              <option value="DRAFT">草稿</option>
              <option value="REVIEWING">审核中</option>
              <option value="PUBLISHED">已上架</option>
              <option value="OFFLINE">已下架</option>
            </select>
          </Field>
          <Field label="更新状态">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.releaseStatus}
              onChange={(e) => setForm((f) => ({ ...f, releaseStatus: e.target.value as any }))}
            >
              <option value="ONGOING">连载中</option>
              <option value="COMPLETED">已完结</option>
              <option value="PAUSED">已暂停</option>
            </select>
          </Field>
          <Field label="排序权重">
            <Input
              type="number"
              value={form.sortWeight}
              onChange={(e) => setForm((f) => ({ ...f, sortWeight: Number(e.target.value) }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="是否 VIP 剧">
            <Switch checked={form.isVip} onCheckedChange={(v) => setForm((f) => ({ ...f, isVip: v }))} />
          </Field>
          <Field label="免费集数">
            <Input
              type="number"
              value={form.freeEpisodes}
              onChange={(e) => setForm((f) => ({ ...f, freeEpisodes: Number(e.target.value) }))}
            />
          </Field>
          <Field label="解锁金币">
            <Input
              type="number"
              value={form.unlockCoins}
              onChange={(e) => setForm((f) => ({ ...f, unlockCoins: Number(e.target.value) }))}
            />
          </Field>
        </div>

        <Field label="分类">
          <div className="flex flex-wrap gap-2">
            {cats.data?.map((c) => {
              const on = form.categoryIds.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      categoryIds: on ? f.categoryIds.filter((x) => x !== c.id) : [...f.categoryIds, c.id],
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="标签">
          <div className="flex flex-wrap gap-2">
            {tags.data?.map((t) => {
              const on = form.tagIds.includes(t.id);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      tagIds: on ? f.tagIds.filter((x) => x !== t.id) : [...f.tagIds, t.id],
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="flex gap-2">
          {initial ? (
            <Button onClick={() => update.mutate({ id: initial.id, ...form })} disabled={update.isPending}>
              保存
            </Button>
          ) : (
            <Button onClick={() => create.mutate(form)} disabled={create.isPending}>
              创建
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
