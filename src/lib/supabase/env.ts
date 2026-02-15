const SUPABASE_SETUP =
  "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example). " +
  "Get them from: https://supabase.com/dashboard/project/_/settings/api";

const PLACEHOLDER_HOST = "your-project-ref.supabase.co";

export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    throw new Error(
      `Supabase URL and anon key are required. ${SUPABASE_SETUP}`
    );
  }
  if (url.includes(PLACEHOLDER_HOST)) {
    throw new Error(
      "استبدل your-project-ref بعرّف مشروعك الحقيقي من لوحة Supabase. " +
      "في .env أو .env.local غيّر NEXT_PUBLIC_SUPABASE_URL إلى: https://YOUR-PROJECT-REF.supabase.co"
    );
  }
  return { url, anonKey };
}

export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server auth. Add it to .env.local (see .env.example)."
    );
  }
  return key.trim();
}

/** Supabase Storage bucket name (e.g. BACKEND_NAME or custom bucket) */
export function getSupabaseStorageBucket(): string {
  const bucket = process.env.BACKEND_NAME ?? process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket?.trim()) {
    throw new Error(
      "BACKEND_NAME or SUPABASE_STORAGE_BUCKET is required for Storage. Add it to .env (see .env.example)."
    );
  }
  return bucket.trim();
}

/** Key for Storage uploads (service role or storage secret). Prefer SECRET_KEY_STOREG for storage. */
export function getSupabaseStorageKey(): string {
  const key =
    process.env.SECRET_KEY_STOREG ?? process.env.SECRET_KEY_STORAGE ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "SECRET_KEY_STOREG (or SUPABASE_SERVICE_ROLE_KEY) is required for Storage uploads. Add it to .env."
    );
  }
  return key.trim();
}
