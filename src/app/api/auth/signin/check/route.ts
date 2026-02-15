import crypto from "crypto";
import { NextResponse } from "next/server";
import { signInCheckSchema } from "@/lib/validations/auth";
import { normalizePhone } from "@/lib/validations/auth";
import { checkSignInCheckLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/auth/encryption";
import { createAndStoreOtp } from "@/lib/auth/otp";
import { sendWhatsAppOtp, buildOtpMessage } from "@/lib/ultramsg/client";

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signInCheckSchema.safeParse(body);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      const msg =
        err.fieldErrors.phone?.[0] ?? err.fieldErrors.name?.[0] ?? err.fieldErrors.password?.[0] ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { phone, name, password } = parsed.data;
    const phoneNormalized = normalizePhone(phone);

    const limit = checkSignInCheckLimit(phoneNormalized);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please try again later.",
          retryAfterSeconds: limit.retryAfterMs ? Math.ceil(limit.retryAfterMs / 1000) : 60,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { phoneNormalized },
      select: { id: true, name: true, encryptedSupabasePassword: true },
    });

    if (!user || !user.encryptedSupabasePassword) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }

    let storedPassword: string;
    try {
      storedPassword = decrypt(user.encryptedSupabasePassword);
    } catch {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }

    if (!timingSafeEqual(password, storedPassword)) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }

    const code = await createAndStoreOtp(phone);
    const message = buildOtpMessage(code);
    const result = await sendWhatsAppOtp(phone, message);

    if (!result.sent) {
      if (!process.env.API_INSTANCE_WHATSAPP || !process.env.API_TOKEN_WHATSAPP) {
        return NextResponse.json(
          { error: "WhatsApp service is not configured" },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: result.error ?? "Failed to send verification code" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Sign-in check error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
