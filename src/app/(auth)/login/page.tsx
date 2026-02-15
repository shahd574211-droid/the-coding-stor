"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { formatIraqPhoneForDisplay, toE164 } from "@/lib/validations/auth";
import { MessageCircle, ArrowLeft, Loader2, Lock } from "lucide-react";

type Mode = "signup" | "signin";
type StepSignUp = "phone" | "code" | "password";
type StepSignIn = "credentials" | "code";

const IRAQ_PREFIX = "+964";
const MIN_PASSWORD_LENGTH = 8;

async function setSessionAndRedirect(
  router: ReturnType<typeof useRouter>,
  accessToken: string,
  refreshToken: string
) {
  const supabase = createBrowserSupabaseClient();
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  router.push("/");
  router.refresh();
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("signup");
  const [stepSignUp, setStepSignUp] = useState<StepSignUp>("phone");
  const [stepSignIn, setStepSignIn] = useState<StepSignIn>("credentials");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [signUpToken, setSignUpToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const displayPhone = phone.trim()
    ? formatIraqPhoneForDisplay(toE164(phone.trim()))
    : "";
  const phoneE164 = phone.trim() ? toE164(phone.trim()) : "";

  useEffect(() => {
    if (stepSignUp === "code" || stepSignIn === "code") codeInputRef.current?.focus();
  }, [stepSignUp, stepSignIn]);

  // ——— Sign up: send OTP
  async function handleSendOtpSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneE164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 429 ? t("login.errorRateLimit") : (data.error ?? t("login.errorSend")));
        return;
      }
      setStepSignUp("code");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  // ——— Sign up: verify OTP → either pendingSignUp (go to password) or session
  async function handleVerifyOtpSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneE164,
          code: code.trim(),
          name: name.trim() || undefined,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 429 ? t("login.errorRateLimit") : (data.error ?? t("login.errorInvalid")));
        return;
      }
      if (data.pendingSignUp && data.signUpToken) {
        setSignUpToken(data.signUpToken);
        setStepSignUp("password");
        setPassword("");
        setConfirmPassword("");
        return;
      }
      await setSessionAndRedirect(router, data.accessToken, data.refreshToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("abort")) {
        setError("تأخر الاتصال. تحقق من الإنترنت وجرّب مرة أخرى.");
      } else {
        setError("فشل الاتصال. تحقق من الإنترنت وجرّب مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ——— Sign up: complete with password
  async function handleCompleteSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("login.errorPasswordShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("login.errorPasswordMismatch"));
      return;
    }
    if (!signUpToken) {
      setError(t("login.errorInvalid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signUpToken,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      await setSessionAndRedirect(router, data.accessToken, data.refreshToken);
    } catch (err) {
      setError("فشل الاتصال. تحقق من الإنترنت وإعدادات Supabase في .env وجرّب مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  // ——— Sign in: check credentials and send OTP
  async function handleSignInCheck(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneE164,
          name: name.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429 ? t("login.errorRateLimit") : (data.error ?? t("login.errorInvalid"))
        );
        return;
      }
      setStepSignIn("code");
      setCode("");
    } catch (err) {
      setError("فشل الاتصال. تحقق من الإنترنت وجرّب مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  // ——— Sign in: verify OTP and get session
  async function handleVerifyOtpSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneE164,
          code: code.trim(),
          name: name.trim() || undefined,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 429 ? t("login.errorRateLimit") : (data.error ?? t("login.errorInvalid")));
        return;
      }
      if (data.pendingSignUp) {
        setError(t("login.errorInvalid"));
        return;
      }
      await setSessionAndRedirect(router, data.accessToken, data.refreshToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("abort")) {
        setError("تأخر الاتصال. تحقق من الإنترنت وجرّب مرة أخرى.");
      } else {
        setError("فشل الاتصال. تحقق من الإنترنت وجرّب مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetToStart() {
    setError(null);
    setStepSignUp("phone");
    setStepSignIn("credentials");
    setSignUpToken(null);
    setCode("");
  }

  const isSignUp = mode === "signup";
  const title =
    isSignUp && stepSignUp === "password"
      ? t("login.setPasswordTitle")
      : t("login.title");
  const description =
    isSignUp && stepSignUp === "password"
      ? t("login.setPasswordDescription")
      : isSignUp
        ? t("login.descriptionSignUp")
        : t("login.descriptionSignIn");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0c12] relative">
      <div className="absolute inset-0 bg-wave-layer opacity-90 pointer-events-none" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full backdrop-blur-xl bg-black/30 border border-white/25 text-white shadow-2xl overflow-hidden">
          <CardHeader className="items-center space-y-4 pb-4 text-center">
            <Image
              src="/logos/logo.png"
              alt="the coding"
              width={420}
              height={144}
              quality={95}
              className="h-11 w-auto object-contain logo-wrap"
              sizes="140px"
            />
            <div className="flex items-center justify-center gap-2 text-[#28AC28]">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">WhatsApp</span>
            </div>
            {stepSignUp !== "password" && (
              <div className="flex rounded-lg bg-white/10 p-0.5 w-full max-w-[240px] mx-auto">
                <button
                  type="button"
                  onClick={() => { setMode("signup"); resetToStart(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    mode === "signup" ? "bg-[#28AC28] text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t("login.modeSignUp")}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signin"); resetToStart(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    mode === "signin" ? "bg-[#28AC28] text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {t("login.modeSignIn")}
                </button>
              </div>
            )}
            <CardTitle className="text-xl text-white">{title}</CardTitle>
            <CardDescription className="text-white/75 text-sm max-w-xs">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isSignUp && stepSignUp === "phone" && (
              <form onSubmit={handleSendOtpSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-name" className="text-sm font-medium text-white/90">
                    {t("login.nameLabel")}
                  </label>
                  <Input
                    id="login-name"
                    type="text"
                    placeholder={t("login.placeholderName")}
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 255))}
                    className="rounded-xl border-white/25 bg-white/10 placeholder:text-white/50"
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-phone" className="text-sm font-medium text-white/90 sr-only">
                    {t("login.placeholderPhone")}
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-white/25 bg-white/10 focus-within:border-[#28AC28]/60 focus-within:ring-2 focus-within:ring-[#28AC28]/30 transition-all">
                    <span className="flex items-center px-4 text-white/80 text-sm font-medium bg-white/5 border-r border-white/15">
                      {IRAQ_PREFIX}
                    </span>
                    <Input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="7XX XXX XXXX"
                      value={phone.replace(/\D/g, "").slice(0, 10)}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="border-0 bg-transparent focus-visible:ring-0 rounded-none placeholder:text-white/50"
                      required
                      disabled={loading}
                      aria-describedby="phone-hint"
                    />
                  </div>
                  <p id="phone-hint" className="text-xs text-white/60">
                    {t("login.phoneHint")}
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="accent" className="w-full h-11 font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("login.sending")}
                    </>
                  ) : (
                    t("login.sendOtp")
                  )}
                </Button>
              </form>
            )}

            {isSignUp && stepSignUp === "code" && (
              <form onSubmit={handleVerifyOtpSignUp} className="space-y-4">
                <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-center">
                  <p className="text-sm text-white/90">
                    {t("login.codeSent", { phone: displayPhone || phone })}
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-code" className="text-sm font-medium text-white/90 sr-only">
                    {t("login.placeholderCode")}
                  </label>
                  <Input
                    ref={codeInputRef}
                    id="login-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-lg tracking-[0.4em] font-mono placeholder:text-white/40"
                    required
                    disabled={loading}
                    aria-label={t("login.placeholderCode")}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full h-11 font-medium"
                  disabled={loading || code.length !== 6}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("login.verifying")}
                    </>
                  ) : (
                    t("login.verify")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => { setStepSignUp("phone"); setError(null); }}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 me-2 rtl:me-0 rtl:ms-2" />
                  {t("login.useAnotherNumber")}
                </Button>
              </form>
            )}

            {isSignUp && stepSignUp === "password" && (
              <form onSubmit={handleCompleteSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t("login.passwordLabel")}
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder={t("login.placeholderPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-white/25 bg-white/10 placeholder:text-white/50"
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-confirm-password" className="text-sm font-medium text-white/90">
                    {t("login.confirmPasswordLabel")}
                  </label>
                  <Input
                    id="login-confirm-password"
                    type="password"
                    placeholder={t("login.placeholderConfirmPassword")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl border-white/25 bg-white/10 placeholder:text-white/50"
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full h-11 font-medium"
                  disabled={loading || password.length < MIN_PASSWORD_LENGTH || password !== confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("login.creatingAccount")}
                    </>
                  ) : (
                    t("login.createAccount")
                  )}
                </Button>
              </form>
            )}

            {!isSignUp && stepSignIn === "credentials" && (
              <form onSubmit={handleSignInCheck} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="signin-name" className="text-sm font-medium text-white/90">
                    {t("login.nameLabel")}
                  </label>
                  <Input
                    id="signin-name"
                    type="text"
                    placeholder={t("login.placeholderName")}
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 255))}
                    className="rounded-xl border-white/25 bg-white/10 placeholder:text-white/50"
                    disabled={loading}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="signin-phone" className="text-sm font-medium text-white/90 sr-only">
                    {t("login.placeholderPhone")}
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-white/25 bg-white/10 focus-within:border-[#28AC28]/60 focus-within:ring-2 focus-within:ring-[#28AC28]/30 transition-all">
                    <span className="flex items-center px-4 text-white/80 text-sm font-medium bg-white/5 border-r border-white/15">
                      {IRAQ_PREFIX}
                    </span>
                    <Input
                      id="signin-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="7XX XXX XXXX"
                      value={phone.replace(/\D/g, "").slice(0, 10)}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="border-0 bg-transparent focus-visible:ring-0 rounded-none placeholder:text-white/50"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p id="phone-hint-signin" className="text-xs text-white/60">
                    {t("login.phoneHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="signin-password" className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t("login.passwordLabel")}
                  </label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={t("login.placeholderPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-white/25 bg-white/10 placeholder:text-white/50"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="accent" className="w-full h-11 font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("login.checkingCredentials")}
                    </>
                  ) : (
                    t("login.signInSubmit")
                  )}
                </Button>
              </form>
            )}

            {!isSignUp && stepSignIn === "code" && (
              <form onSubmit={handleVerifyOtpSignIn} className="space-y-4">
                <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-center">
                  <p className="text-sm text-white/90">
                    {t("login.codeSent", { phone: displayPhone || phone })}
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="signin-code" className="text-sm font-medium text-white/90 sr-only">
                    {t("login.placeholderCode")}
                  </label>
                  <Input
                    ref={codeInputRef}
                    id="signin-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-lg tracking-[0.4em] font-mono placeholder:text-white/40"
                    required
                    disabled={loading}
                    aria-label={t("login.placeholderCode")}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full h-11 font-medium"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("login.verifying")}
                    </>
                  ) : (
                    t("login.verify")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => { setStepSignIn("credentials"); setError(null); }}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 me-2 rtl:me-0 rtl:ms-2" />
                  {t("login.useAnotherNumber")}
                </Button>
              </form>
            )}

            <p className="text-center pt-2">
              <Link
                href="/"
                className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3 rtl:rotate-180" />
                {t("login.backToStore")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
