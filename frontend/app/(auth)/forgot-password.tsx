import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      const token: string | null = res.data?.reset_token ?? null;
      router.push({
        pathname: "/(auth)/reset-password",
        params: {
          email: email.trim().toLowerCase(),
          token: token || "",
        },
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not request reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textMain} />
          </TouchableOpacity>

          <Text style={styles.heading}>Forgot password?</Text>
          <Text style={styles.sub}>
            Enter the email tied to your account and we'll issue a one-time reset code.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="forgot-email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            {error ? (
              <Text testID="forgot-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="forgot-submit-btn"
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.footerLink}>Back to sign in</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.noteText}>
              MVP: the reset code is delivered in-app. Email delivery (SendGrid/Resend) can be
              wired up later.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: space.xl, paddingBottom: 60 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    marginTop: 24,
    fontSize: 36,
    fontFamily: fonts.serifBlack,
    color: colors.textMain,
    letterSpacing: -1.2,
  },
  sub: { color: colors.textMuted, fontFamily: fonts.sansReg, fontSize: 15, marginTop: 8 },
  card: {
    marginTop: 28,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.sansBlack, letterSpacing: 2, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, color: colors.textMain, fontSize: 15, fontFamily: fonts.sansReg },
  error: { color: colors.error, marginTop: 12, fontSize: 13, fontFamily: fonts.sansReg },
  primaryBtn: {
    marginTop: 22,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontFamily: fonts.sansBlack, fontSize: 16 },
  footerLink: { textAlign: "center", color: colors.textMuted, marginTop: 18, fontFamily: fonts.sansBold },
  note: {
    marginTop: 24,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.accentSoft,
  },
  noteText: { flex: 1, color: colors.textMain, fontSize: 12, fontFamily: fonts.sansReg, lineHeight: 18 },
});
