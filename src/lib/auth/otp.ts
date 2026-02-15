import crypto from "crypto";
import { prisma } from "@/lib/db";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const HASH_SECRET = process.env.OTP_HASH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback-change-in-production";

function generateCode(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(OTP_LENGTH, "0");
}

export function hashOtp(code: string): string {
  return crypto.createHmac("sha256", HASH_SECRET).update(code).digest("hex");
}

export function verifyOtpHash(code: string, hash: string): boolean {
  const computed = hashOtp(code);
  if (typeof hash !== "string" || hash.length !== computed.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(hash, "utf8")
    );
  } catch {
    return false;
  }
}

export async function createAndStoreOtp(phone: string): Promise<string> {
  const code = generateCode();
  const otpHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.oTP.create({
    data: {
      phone,
      otpHash,
      expiresAt,
    },
  });

  return code;
}

export async function findValidOtp(phone: string): Promise<{ id: string; otpHash: string } | null> {
  const otp = await prisma.oTP.findFirst({
    where: {
      phone,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    select: { id: true, otpHash: true },
    orderBy: { createdAt: "desc" },
  });
  return otp;
}

export async function markOtpUsed(otpId: string): Promise<void> {
  await prisma.oTP.update({
    where: { id: otpId },
    data: { usedAt: new Date() },
  });
}

export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.oTP.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
