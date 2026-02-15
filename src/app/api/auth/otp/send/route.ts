import { NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/validations/auth";
import { normalizePhone } from "@/lib/validations/auth";
import { checkSendLimit } from "@/lib/auth/rate-limit";
import { createAndStoreOtp } from "@/lib/auth/otp";
import { sendWhatsAppOtp, buildOtpMessage } from "@/lib/ultramsg/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.phone?.[0] ?? "Invalid input" },
        { status: 400 }
      );
    }

    const phone = parsed.data.phone;
    const phoneNormalized = normalizePhone(phone);

    const limit = checkSendLimit(phoneNormalized);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please try again later.",
          retryAfterSeconds: limit.retryAfterMs ? Math.ceil(limit.retryAfterMs / 1000) : 60,
        },
        { status: 429 }
      );
    }

    const code = await createAndStoreOtp(phone);
    const message = buildOtpMessage(code);
    if (process.env.NODE_ENV !== "production") {
      console.log("[OTP send] phone (E.164):", phone, "| normalized:", phoneNormalized);
    }
    const result = await sendWhatsAppOtp(phone, message);

    if (!result.sent) {
      if (!process.env.API_INSTANCE_WHATSAPP || !process.env.API_TOKEN_WHATSAPP) {
        return NextResponse.json(
          { error: "WhatsApp service is not configured" },
          { status: 503 }
        );
      }
      const errorMessage =
        process.env.NODE_ENV !== "production" && result.error
          ? `UltraMsg: ${result.error}`
          : result.error ?? "Failed to send OTP";
      return NextResponse.json(
        { error: errorMessage },
        { status: 502 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[OTP send] OK — تم إرسال الرمز إلى:", phone);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("OTP send error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
