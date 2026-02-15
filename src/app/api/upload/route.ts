import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/get-current-user";
import { uploadToStorage } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload — upload image to Supabase Storage (admin only).
 * Body: FormData with field "file" (image file).
 * Returns: { url: string } public URL for use as product/category imageUrl.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const name = (file as File).name ?? "image";
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : ".jpg";
  const path = `products/${Date.now()}-${name.replace(/[^a-z0-9.-]/gi, "-")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/jpeg";

  const { publicUrl, error } = await uploadToStorage(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: publicUrl });
}
