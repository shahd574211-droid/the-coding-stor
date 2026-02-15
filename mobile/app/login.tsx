import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { sendOtp, verifyOtp } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Step = "phone" | "code";

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    setError(null);
    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(phone.trim(), code.trim());
      if ("error" in result) {
        setError(result.error);
        return;
      }
      await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.form}>
        {step === "phone" ? (
          <>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Sending…" : "Send OTP"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Code sent to {phone}</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Verifying…" : "Verify"}</Text>
            </Pressable>
            <Pressable style={styles.link} onPress={() => setStep("phone")} disabled={loading}>
              <Text style={styles.linkText}>Use another number</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: { color: "#b91c1c", fontSize: 14 },
  button: { backgroundColor: "#000", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center", paddingVertical: 8 },
  linkText: { fontSize: 14, color: "#666" },
});
