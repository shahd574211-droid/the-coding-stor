/**
 * In-memory rate limiter for OTP send/verify.
 * Production: replace with Redis or DB-backed store for multi-instance deployments.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SEND_PER_PHONE = 3;
const MAX_VERIFY_ATTEMPTS = 5;

interface Entry {
  count: number;
  resetAt: number;
}

const sendStore = new Map<string, Entry>();
const verifyStore = new Map<string, Entry>();

function getOrCreate(store: Map<string, Entry>, key: string): Entry {
  let entry = store.get(key);
  const now = Date.now();
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }
  return entry;
}

function checkLimit(
  store: Map<string, Entry>,
  key: string,
  max: number
): { allowed: boolean; retryAfterMs?: number } {
  const entry = getOrCreate(store, key);
  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - Date.now() };
  }
  entry.count++;
  return { allowed: true };
}

export function checkSendLimit(phoneNormalized: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  return checkLimit(sendStore, `send:${phoneNormalized}`, MAX_SEND_PER_PHONE);
}

export function checkVerifyLimit(phoneNormalized: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  return checkLimit(verifyStore, `verify:${phoneNormalized}`, MAX_VERIFY_ATTEMPTS);
}

export function clearVerifyLimit(phoneNormalized: string): void {
  verifyStore.delete(`verify:${phoneNormalized}`);
}

const MAX_SIGNIN_CHECK_ATTEMPTS = 5;
const signInCheckStore = new Map<string, Entry>();

export function checkSignInCheckLimit(phoneNormalized: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  return checkLimit(signInCheckStore, `signin:${phoneNormalized}`, MAX_SIGNIN_CHECK_ATTEMPTS);
}

export function clearSignInCheckLimit(phoneNormalized: string): void {
  signInCheckStore.delete(`signin:${phoneNormalized}`);
}
