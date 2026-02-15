import { NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { normalizePhone } from "@/lib/validations/auth";
import { checkVerifyLimit, clearVerifyLimit, clearSignInCheckLimit } from "@/lib/auth/rate-limit";
import { findValidOtp, verifyOtpHash, markOtpUsed } from "@/lib/auth/otp";
import { getOrCreateSupabaseSession } from "@/lib/auth/session";
import { createSignUpToken } from "@/lib/auth/signup-token";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.code?.[0] ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { phone, code, name } = parsed.data;
    const phoneNormalized = normalizePhone(phone);

    if (process.env.NODE_ENV !== "production") {
      console.log("[OTP verify] phone:", phone, "| normalized:", phoneNormalized);
    }

    const limit = checkVerifyLimit(phoneNormalized);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please try again later.",
          retryAfterSeconds: limit.retryAfterMs ? Math.ceil(limit.retryAfterMs / 1000) : 60,
        },
        { status: 429 }
      );
    }

    const otpRecord = await findValidOtp(phone);
    if (process.env.NODE_ENV !== "production") {
      console.log("[OTP verify] found OTP:", !!otpRecord, "| code valid:", otpRecord ? verifyOtpHash(code, otpRecord.otpHash) : "N/A");
    }
    if (!otpRecord || !verifyOtpHash(code, otpRecord.otpHash)) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    await markOtpUsed(otpRecord.id);
    clearVerifyLimit(phoneNormalized);

    const user = await prisma.user.findFirst({
      where: { phoneNormalized },
    });

    if (!user) {
      const signUpToken = createSignUpToken(phone, name ?? null);
      return NextResponse.json({
        pendingSignUp: true,
        signUpToken,
      });
    }

    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    const session = await getOrCreateSupabaseSession(phoneNormalized);
    if ("error" in session) {
      return NextResponse.json({ error: session.error }, { status: 500 });
    }

    clearSignInCheckLimit(phoneNormalized);

    return NextResponse.json({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      user: session.user,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("OTP verify error:", err.message, err.stack);
    const message =
      process.env.NODE_ENV !== "production" ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
