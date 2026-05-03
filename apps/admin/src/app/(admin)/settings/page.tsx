"use client";

import * as React from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Switch, Textarea } from "@nq/ui";
import { toast } from "sonner";

const FIELDS: Array<{
  key: string;
  label: string;
  type: "text" | "textarea" | "switch";
  placeholder?: string;
  hint?: string;
}> = [
  { key: "siteName", label: "站点名称", type: "text", placeholder: "短剧速看" },
  { key: "description", label: "站点简介", type: "text", placeholder: "海量精品短剧" },
  { key: "icp", label: "ICP 备案号", type: "text", placeholder: "如：京ICP备12345678号" },
  { key: "contact", label: "联系方式", type: "text", placeholder: "support@example.com" },
  { key: "about", label: "关于页内容", type: "textarea", placeholder: "我们的故事…" },
  {
    key: "qrDownloadImg",
    label: "下载 App 二维码 URL",
    type: "text",
    placeholder: "https://...",
  },
  {
    key: "showAppDownload",
    label: "显示 App 下载提示",
    type: "switch",
    hint: "在前台展示扫码下载入口",
  },
];

export default function SettingsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const list = useQuery(trpc.admin.site.list.queryOptions());

  const valueMap = React.useMemo(() => {
    const m: Record<string, unknown> = {};
    for (const r of list.data ?? []) m[r.key] = r.value;
    return m;
  }, [list.data]);

  const set = useMutation({
    ...trpc.admin.site.set.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.admin.site.list.queryKey() });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">站点设置</h1>
      <p className="text-sm text-muted-foreground">这里的配置会被前台读取（缓存 5 分钟）</p>

      <Card>
        <CardHeader>
          <CardTitle>常规</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {FIELDS.map((f) => (
            <SettingRow
              key={f.key}
              field={f}
              value={valueMap[f.key]}
              busy={set.isPending}
              onSave={(v) => set.mutate({ key: f.key, value: v })}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({
  field,
  value,
  busy,
  onSave,
}: {
  field: (typeof FIELDS)[number];
  value: unknown;
  busy: boolean;
  onSave: (v: unknown) => void;
}) {
  const [draft, setDraft] = React.useState<string>(typeof value === "string" ? value : "");
  React.useEffect(() => {
    setDraft(typeof value === "string" ? value : "");
  }, [value]);

  if (field.type === "switch") {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Label>{field.label}</Label>
          {field.hint && <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>}
        </div>
        <Switch checked={value === true} onCheckedChange={(v) => onSave(v)} disabled={busy} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>{field.label}</Label>
      <div className="flex gap-2">
        {field.type === "textarea" ? (
          <Textarea
            id={field.key}
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={field.placeholder}
            className="flex-1"
          />
        ) : (
          <Input
            id={field.key}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={field.placeholder}
            className="flex-1"
          />
        )}
        <Button onClick={() => onSave(draft)} disabled={busy} variant="outline">
          保存
        </Button>
      </div>
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}
