import { prisma } from "@/lib/db";
import { createSupabaseUser, signInSupabase } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/auth/encryption";
import crypto from "crypto";
import { normalizePhone } from "@/lib/validations/auth";

function randomPassword(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    name: string | null;
    role: string;
  };
}

/**
 * After OTP verify: ensure we have a Supabase session for this user.
 * Creates Supabase user if needed, stores encrypted password for future logins.
 */
export async function getOrCreateSupabaseSession(phoneNormalized: string): Promise<SessionResult | { error: string }> {
  const user = await prisma.user.findFirst({
    where: { phoneNormalized },
    select: { id: true, phone: true, name: true, role: true, supabaseUserId: true, encryptedSupabasePassword: true },
  });

  if (!user) {
    return { error: "User not found" };
  }

  let password: string;

  if (user.supabaseUserId && user.encryptedSupabasePassword) {
    try {
      password = decrypt(user.encryptedSupabasePassword);
    } catch {
      return { error: "Session recovery failed" };
    }
  } else {
    password = randomPassword();
    const { userId: supabaseUserId, error: createError } = await createSupabaseUser(phoneNormalized, password);
    if (createError) {
      return { error: createError.message };
    }
    const encrypted = encrypt(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { supabaseUserId: supabaseUserId, encryptedSupabasePassword: encrypted },
    });
  }

  const session = await signInSupabase(phoneNormalized, password);
  if ("error" in session) {
    return { error: session.error.message };
  }

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
  };
}
