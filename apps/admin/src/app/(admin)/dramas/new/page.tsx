"use client";

import { DramaForm } from "../_components/drama-form";

export default function NewDramaPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">新增剧集</h1>
      <DramaForm />
    </div>
  );
}
