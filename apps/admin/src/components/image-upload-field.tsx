"use client";

import * as React from "react";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Input, Button } from "@nq/ui";
import { toast } from "sonner";

export function ImageUploadField({
  value,
  onChange,
  label,
  aspect = "3 / 4",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("上传失败");
      const data = (await res.json()) as { url: string };
      onChange(data.url);
      toast.success("上传成功");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-start gap-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-md border bg-muted"
          style={{ aspectRatio: aspect, width: 120 }}
        >
          {value ? (
            <>
              <img src={value} alt="preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
            {busy ? "上传中…" : "上传图片"}
          </Button>
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="或粘贴图片 URL"
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
