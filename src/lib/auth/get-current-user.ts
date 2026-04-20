import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { prisma } from "@/lib/db";

export interface CurrentUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser?.id) return null;

    const user = await prisma.user.findFirst({
      where: { supabaseUserId: supabaseUser.id },
      include: { admin: true },
    });
    if (!user) return null;

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isAdmin: user.role === "ADMIN" || user.admin != null,
    };
  } catch {
    // Missing Supabase env or temporary backend outage should not crash storefront render.
    return null;
  }
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  return user;
}
