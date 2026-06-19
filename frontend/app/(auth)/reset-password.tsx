import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const [email, setEmail] = useState<string>(params.email || "");
  const [token, setToken] = useState<string>(params.token || "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !token.trim()) {
      setError("Email and reset code are required");
      return;
    }
    if (pw.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (pw !== pw2) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        token: token.trim(),
        new_password: pw,
      });
      Alert.alert("Password reset", "You can now sign in with your new password.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Invalid or expired reset code");
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

          <Text style={styles.heading}>Reset password</Text>
          <Text style={styles.sub}>
            Enter the reset code and your new password.
          </Text>

          {params.token ? (
            <View style={styles.tokenCard}>
              <Ionicons name="key" size={16} color={colors.primary} />
              <Text style={styles.tokenText} numberOfLines={2}>
                Your one-time code has been pre-filled.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="reset-email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>RESET CODE</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="reset-token-input"
                value={token}
                onChangeText={setToken}
                placeholder="Paste reset code"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>NEW PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="reset-pw-input"
                value={pw}
                onChangeText={setPw}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry={!showPw}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)}>
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>CONFIRM PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="reset-pw2-input"
                value={pw2}
                onChangeText={setPw2}
                placeholder="Repeat password"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry={!showPw}
                style={styles.input}
              />
            </View>

            {error ? (
              <Text testID="reset-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="reset-submit-btn"
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
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
  tokenCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
  },
  tokenText: { flex: 1, color: colors.textMain, fontSize: 12, fontFamily: fonts.sansBold },
  card: {
    marginTop: 18,
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
});
