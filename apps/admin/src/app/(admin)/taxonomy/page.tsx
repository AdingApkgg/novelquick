"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Switch } from "@nq/ui";
import { toast } from "sonner";
import { slugify } from "@nq/shared/utils";

export default function TaxonomyPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CategoryPanel />
      <TagPanel />
    </div>
  );
}

function CategoryPanel() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useQuery(trpc.admin.taxonomy.listCategories.queryOptions());
  const upsert = useMutation({
    ...trpc.admin.taxonomy.upsertCategory.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.taxonomy.listCategories.queryKey() });
    },
  });
  const del = useMutation({
    ...trpc.admin.taxonomy.deleteCategory.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.taxonomy.listCategories.queryKey() }),
  });

  const [name, setName] = React.useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle>分类</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="新增分类" />
          <Button
            onClick={() => {
              if (!name) return;
              upsert.mutate({ slug: slugify(name), name, sortOrder: list.data?.length ?? 0, isVisible: true });
              setName("");
            }}
          >
            添加
          </Button>
        </div>
        <ul className="divide-y rounded-md border">
          {list.data?.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={c.isVisible}
                  onCheckedChange={(v) =>
                    upsert.mutate({ id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder, isVisible: v })
                  }
                />
                <button className="text-destructive text-xs" onClick={() => del.mutate({ id: c.id })}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TagPanel() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useQuery(trpc.admin.taxonomy.listTags.queryOptions());
  const upsert = useMutation({
    ...trpc.admin.taxonomy.upsertTag.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.taxonomy.listTags.queryKey() });
    },
  });
  const del = useMutation({
    ...trpc.admin.taxonomy.deleteTag.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.admin.taxonomy.listTags.queryKey() }),
  });
  const [name, setName] = React.useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>标签</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="新增标签" />
          <Button
            onClick={() => {
              if (!name) return;
              upsert.mutate({ slug: slugify(name), name });
              setName("");
            }}
          >
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {list.data?.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
              {t.name}
              <button className="text-destructive" onClick={() => del.mutate({ id: t.id })}>
                ×
              </button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
