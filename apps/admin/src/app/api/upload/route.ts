import { NextRequest, NextResponse } from "next/server";
import { auth } from "@nq/api/auth";
import { getStorage, generateUploadKey } from "@nq/api/storage";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const key = generateUploadKey(file.name);
  const storage = getStorage();
  const saved = await storage.save(key, buf);

  return NextResponse.json({
    key: saved.key,
    url: saved.url,
    size: buf.byteLength,
    filename: file.name,
  });
}
