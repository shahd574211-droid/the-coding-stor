import { z } from "zod";

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/** Iraq country code; mobile is 07X XXX XXXX locally → +964 7XX XXXXXXX (9 digits after 964) */
const IRAQ_COUNTRY = "964";
const IRAQ_MOBILE_LEN = 9; // digits after 964 (7XX XXXXXXX)

/** Normalize phone to digits only for storage and lookups */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Normalize Iraqi mobile to E.164: 07XXXXXXXXX or 7XXXXXXXXX (9 or 10 digits) → +9647XXXXXXXXX */
function normalizeIraqMobile(digits: string): string | null {
  if (digits.startsWith("0") && digits.length === 10 && digits[1] === "7") {
    return "+" + IRAQ_COUNTRY + digits.slice(2); // 07XXXXXXXXX → +9647XXXXXXXXX
  }
  // 9 digits 7XXXXXXXXX → +9647XXXXXXXXX
  if (digits.startsWith("7") && digits.length === IRAQ_MOBILE_LEN) {
    return "+" + IRAQ_COUNTRY + digits;
  }
  // 10 digits 7765713455 → +9647765713455 (كما في استخدام واتساب/UltraMsg)
  if (digits.startsWith("7") && digits.length === 10) {
    return "+" + IRAQ_COUNTRY + digits;
  }
  if (digits.startsWith(IRAQ_COUNTRY) && digits.length === 12) {
    return "+" + digits; // 9647XXXXXXXXX → +9647XXXXXXXXX
  }
  return null;
}

/** Format as E.164. Prioritize Iraqi mobile (07X XXX XXXX / 7XX XXXXXXX). */
export function toE164(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length < 9) return phone;

  const iraq = normalizeIraqMobile(digits);
  if (iraq) return iraq;

  if (digits.startsWith("0")) return "+" + digits.slice(1);
  if (!phone.trim().startsWith("+")) return "+" + digits;
  return "+" + digits;
}

/** Format Iraqi number for display: +964 7XX XXX XXXX or +964 77 XXXX XXXX */
export function formatIraqPhoneForDisplay(e164: string): string {
  const d = normalizePhone(e164);
  if (d.startsWith("964") && d.length === 12) {
    return `+964 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  if (d.startsWith("964") && d.length === 13) {
    return `+964 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 11)} ${d.slice(11)}`;
  }
  return e164;
}

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(9, "Phone number is required")
    .max(20)
    .transform((v) => toE164(v))
    .refine((v) => E164_REGEX.test(v), "Invalid phone. Use Iraqi format: 07X XXX XXXX or +964 7XX XXX XXXX"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .min(10)
    .max(20)
    .transform((v) => toE164(v)),
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
  name: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const completeSignUpSchema = z
  .object({
    signUpToken: z.string().min(1, "Invalid sign-up token"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const signInCheckSchema = z.object({
  phone: z
    .string()
    .min(9)
    .max(20)
    .transform((v) => toE164(v))
    .refine((v) => E164_REGEX.test(v), "Invalid phone number"),
  name: z.string().min(1, "Name is required").max(255).transform((v) => v.trim()),
  password: z.string().min(1, "Password is required"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteSignUpInput = z.infer<typeof completeSignUpSchema>;
export type SignInCheckInput = z.infer<typeof signInCheckSchema>;
