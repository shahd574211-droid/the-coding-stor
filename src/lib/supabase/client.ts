import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getSupabasePublicEnv } from "./env";

const { url, anonKey } = getSupabasePublicEnv();

/** Browser Supabase client for auth (setSession, getSession, signOut). */
export const supabase = createClient<Database>(url, anonKey);
