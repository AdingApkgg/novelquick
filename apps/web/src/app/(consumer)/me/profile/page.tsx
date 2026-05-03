"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Camera } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Label,
  Textarea,
  Spinner,
} from "@nq/ui";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function ProfileEditPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const router = useRouter();
  const session = useSession();
  const me = useQuery(trpc.me.whoami.queryOptions());

  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [image, setImage] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (me.data) {
      setDisplayName(me.data.displayName ?? me.data.name ?? "");
      setImage(me.data.image ?? "");
    }
  }, [me.data]);

  const update = useMutation({
    ...trpc.me.updateProfile.mutationOptions(),
    onSuccess: () => {
      toast.success("已保存");
      qc.invalidateQueries({ queryKey: trpc.me.whoami.queryKey() });
      router.push("/me");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("请选择图片");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("上传失败");
      const data = (await res.json()) as { url: string };
      setImage(data.url);
      toast.success("头像已更新，记得点保存");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (!session.data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <p className="text-sm text-white/60">请先登录</p>
        <Link href="/sign-in" className="rounded-full bg-primary px-5 py-2 text-sm">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-20">
      <Link href="/me" className="mb-4 inline-flex items-center gap-1 text-sm text-white/60">
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>

      <h1 className="text-xl font-bold">个人资料</h1>

      <div className="mt-5 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative"
          disabled={uploading || !me.data}
        >
          <Avatar className="h-24 w-24">
            <AvatarImage src={image} />
            <AvatarFallback className="text-2xl">
              {(displayName ?? me.data?.email ?? "U").slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {uploading ? <Spinner className="h-3 w-3" /> : <Camera className="h-3.5 w-3.5" />}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAvatar(f);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-white/40">点击头像更换</p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({
            displayName: displayName.trim() || undefined,
            bio: bio.trim() || null,
            image: image || null,
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" value={me.data?.email ?? ""} disabled className="bg-white/5" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display">昵称</Label>
          <Input
            id="display"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="给自己取个名字"
            maxLength={40}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">简介</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="一句话介绍自己…"
            rows={3}
            maxLength={200}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={update.isPending || uploading}>
          <Save className="mr-1 h-4 w-4" /> {update.isPending ? "保存中…" : "保存"}
        </Button>
      </form>
    </div>
  );
}
