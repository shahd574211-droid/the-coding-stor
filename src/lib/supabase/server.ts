import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "./env";

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const { url: supabaseUrl } = getSupabasePublicEnv();
    const supabaseServiceKey = getSupabaseServiceRoleKey();
    _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

/** Create Supabase Auth user and return its id. Email format: phone@stor-ai.phone */
export async function createSupabaseUser(
  phoneNormalized: string,
  password: string
): Promise<{ userId: string; error: Error | null }> {
  const supabaseAdmin = getSupabaseAdmin();
  const email = `${phoneNormalized}@stor-ai.phone`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { userId: "", error };
  return { userId: data.user.id, error: null };
}

/** Sign in with email/password and return session (for server-side use, then pass to client) */
export async function signInSupabase(
  phoneNormalized: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | { error: Error }> {
  const supabaseAdmin = getSupabaseAdmin();
  const email = `${phoneNormalized}@stor-ai.phone`;
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) return { error };
  if (!data.session) return { error: new Error("No session") };
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token ?? "",
    expiresIn: data.session.expires_in ?? 3600,
  };
}
