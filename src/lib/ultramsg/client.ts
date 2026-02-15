/**
 * UltraMsg WhatsApp API client for sending OTP.
 * Uses .env: API_URL_WHATSAPP, API_TOKEN_WHATSAPP, API_INSTANCE_WHATSAPP
 * Docs: https://docs.ultramsg.com/api/post/messages/chat
 */

export interface SendMessageResult {
  sent: boolean;
  message?: string;
  id?: number;
  error?: string;
}

/** UltraMsg expects path like /instanceXXXXX/messages/chat — ensure instance id has "instance" prefix */
function normalizeInstanceId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^instance/i.test(trimmed) ? trimmed : `instance${trimmed}`;
}

function getUltraMsgConfig(): { baseUrl: string; instanceId: string; token: string } | null {
  const baseUrl = (process.env.API_URL_WHATSAPP || "https://api.ultramsg.com").replace(/\/$/, "");
  const raw = process.env.API_INSTANCE_WHATSAPP;
  const token = process.env.API_TOKEN_WHATSAPP;
  if (!raw || !token) return null;
  const instanceId = normalizeInstanceId(raw);
  return { baseUrl, instanceId, token };
}

/** Send WhatsApp message via UltraMsg (explicit params). */
export async function sendWhatsAppMessage(
  instanceId: string,
  token: string,
  to: string,
  body: string
): Promise<SendMessageResult> {
  const baseUrl = (process.env.API_URL_WHATSAPP || "https://api.ultramsg.com").replace(/\/$/, "");
  const url = `${baseUrl}/${normalizeInstanceId(instanceId)}/messages/chat`;
  // تنسيق الرقم: أرقام فقط (مثل 9647765713455) — غالباً ما تتوقعها واجهات الـ API
  const toDigits = to.replace(/\D/g, "");
  const form = new URLSearchParams({
    token,
    to: toDigits,
    body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = (await res.json()) as Omit<SendMessageResult, "sent"> & { sent?: boolean | string };
  const sent = data.sent === true || data.sent === "true";

  // للتشخيص: طباعة رد UltraMsg في الطرفية (ترمينال السيرفر)
  if (process.env.NODE_ENV !== "production") {
    console.log("[UltraMsg] to:", toDigits, "| sent:", sent, "| response:", JSON.stringify(data));
  }

  return {
    sent,
    message: data.message,
    id: data.id,
    error: data.error,
  };
}

/** Send OTP using .env: API_URL_WHATSAPP, API_TOKEN_WHATSAPP, API_INSTANCE_WHATSAPP */
export async function sendWhatsAppOtp(toPhone: string, messageBody: string): Promise<SendMessageResult> {
  const config = getUltraMsgConfig();
  if (!config) {
    return { sent: false, error: "WhatsApp service is not configured" };
  }
  return sendWhatsAppMessage(config.instanceId, config.token, toPhone, messageBody);
}

export function buildOtpMessage(code: string, appName: string = "the coding"): string {
  return `Your ${appName} verification code is: ${code}. It expires in 5 minutes. Do not share this code.`;
}
