import { NextResponse } from "next/server";
import { completeSignUpSchema } from "@/lib/validations/auth";
import { normalizePhone } from "@/lib/validations/auth";
import { verifySignUpToken } from "@/lib/auth/signup-token";
import { prisma } from "@/lib/db";
import { createSupabaseUser } from "@/lib/supabase/server";
import { encrypt } from "@/lib/auth/encryption";
import { signInSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = completeSignUpSchema.safeParse(body);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      const msg =
        err.fieldErrors.confirmPassword?.[0] ??
        err.fieldErrors.password?.[0] ??
        err.fieldErrors.signUpToken?.[0] ??
        "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { signUpToken, password } = parsed.data;
    const payload = verifySignUpToken(signUpToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired link. Please sign up again." }, { status: 401 });
    }

    const phoneNormalized = normalizePhone(payload.phone);
    const existing = await prisma.user.findFirst({
      where: { phoneNormalized },
    });
    if (existing) {
      return NextResponse.json({ error: "This phone is already registered. Please sign in." }, { status: 409 });
    }

    const { userId: supabaseUserId, error: createError } = await createSupabaseUser(phoneNormalized, password);
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const encryptedPassword = encrypt(password);
    await prisma.user.create({
      data: {
        phone: payload.phone,
        phoneNormalized,
        name: payload.name,
        role: "USER",
        supabaseUserId,
        encryptedSupabasePassword: encryptedPassword,
      },
    });

    const session = await signInSupabase(phoneNormalized, password);
    if ("error" in session) {
      return NextResponse.json({ error: "Account created but login failed. Please sign in." }, { status: 500 });
    }

    const user = await prisma.user.findFirst({
      where: { phoneNormalized },
      select: { id: true, phone: true, name: true, role: true },
    });

    return NextResponse.json({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      user: user ?? { id: "", phone: payload.phone, name: payload.name, role: "USER" },
    });
  } catch (e) {
    console.error("Complete sign-up error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
