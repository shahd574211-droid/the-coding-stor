/**
 * Short-lived HMAC-signed token for completing sign-up after OTP.
 * Prevents creating an account without verified phone.
 */

import crypto from "crypto";

const SIGNUP_TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const SEP = ".";
const ALG = "sha256";

function getSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.SIGNUP_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ENCRYPTION_KEY or SIGNUP_TOKEN_SECRET must be set (min 16 chars)");
  }
  return secret;
}

export interface SignUpPayload {
  phone: string;
  name: string | null;
  exp: number;
}

/** Create a one-time use token for completing sign-up (phone + name verified by OTP). */
export function createSignUpToken(phone: string, name: string | null): string {
  const secret = getSecret();
  const exp = Date.now() + SIGNUP_TOKEN_EXPIRY_MS;
  const payload = JSON.stringify({ phone, name: name ?? null, exp });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac(ALG, secret).update(payloadB64).digest("base64url");
  return `${payloadB64}${SEP}${sig}`;
}

/** Verify and decode token. Returns payload or null if invalid/expired. */
export function verifySignUpToken(token: string): SignUpPayload | null {
  try {
    const secret = getSecret();
    const idx = token.lastIndexOf(SEP);
    if (idx === -1) return null;
    const payloadB64 = token.slice(0, idx);
    const sig = token.slice(idx + 1);
    const expectedSig = crypto.createHmac(ALG, secret).update(payloadB64).digest("base64url");
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expectedSig, "utf8"))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SignUpPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.phone !== "string" || payload.phone.length < 10) return null;
    return payload;
  } catch {
    return null;
  }
}
