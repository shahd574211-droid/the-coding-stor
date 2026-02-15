import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, getSupabaseStorageBucket, getSupabaseStorageKey } from "./env";

/** Server-only Supabase client for Storage uploads (uses SECRET_KEY_STOREG or service role) */
function getStorageClient() {
  const { url } = getSupabasePublicEnv();
  const key = getSupabaseStorageKey();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getBucket() {
  return getSupabaseStorageBucket();
}

/**
 * Upload a file to the Storage bucket and return the public URL.
 * Bucket must be public (Supabase Dashboard → Storage → bucket → Public).
 */
export async function uploadToStorage(
  path: string,
  body: Buffer | Uint8Array | Blob,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ publicUrl: string; error: Error | null }> {
  const supabase = getStorageClient();
  const bucket = getBucket();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      contentType: options?.contentType ?? "image/jpeg",
      upsert: options?.upsert ?? true,
    });
  if (error) return { publicUrl: "", error };
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { publicUrl: urlData.publicUrl, error: null };
}

/**
 * Get the public URL for a file in the Storage bucket (without uploading).
 */
export function getStoragePublicUrl(path: string): string {
  const supabase = getStorageClient();
  const bucket = getBucket();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
