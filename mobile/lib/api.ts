/**
 * API base URL — set via env (EXPO_PUBLIC_API_URL) or default to local/dev.
 */
const API_BASE =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL
    ? process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "")
    : "http://localhost:3000";

export async function sendOtp(phone: string): Promise<{ success?: boolean; error?: string; retryAfterSeconds?: number }> {
  const res = await fetch(`${API_BASE}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error ?? "Failed to send OTP", retryAfterSeconds: data.retryAfterSeconds };
  }
  return { success: true };
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; phone: string; name: string | null; role: string };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResult | { error: string; retryAfterSeconds?: number }> {
  const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error ?? "Invalid code", retryAfterSeconds: data.retryAfterSeconds };
  }
  return data as VerifyOtpResult;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  currency: string;
  type: string;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string } | null;
}

export async function getProducts(opts?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: ProductListItem[]; total: number }> {
  const params = new URLSearchParams();
  if (opts?.category) params.set("category", opts.category);
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  const res = await fetch(`${API_BASE}/api/products?${params}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  compareAtPrice: number | null;
  digitalAssets: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const res = await fetch(`${API_BASE}/api/products/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load product");
  return res.json();
}
