import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
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

import { useAuth } from "@/src/contexts/AuthContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Invalid email or password");
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[colors.accentSoft, colors.white]}
            style={styles.heroOrb}
          />
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>K</Text>
            </View>
            <View>
              <Text style={styles.brand}>KRINTERIOR</Text>
              <Text style={styles.tag}>AI INTERIOR STUDIO</Text>
            </View>
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>
            Sign in to design your dream space with AI
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="login-email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="login-password-input"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry={!showPwd}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                <Ionicons
                  name={showPwd ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <Text testID="login-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="forgot-password-link"
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end", marginTop: 10 }}
            >
              <Text style={{ color: colors.primary, fontFamily: fonts.sansBold, fontSize: 13 }}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="login-submit-button"
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity testID="goto-signup-button" style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Create new account</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.footer}>
            By continuing you agree to our Terms & Privacy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: space.xl, paddingBottom: 60 },
  heroOrb: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    opacity: 0.7,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  brandMarkText: { color: "#fff", fontWeight: "900", fontSize: 20 },
  brand: { fontFamily: fonts.serifBlack, fontSize: 20, color: colors.textMain, letterSpacing: 1 },
  tag: { fontSize: 9, color: colors.textMuted, letterSpacing: 3, fontFamily: fonts.sansBold },
  heading: {
    marginTop: 44,
    fontSize: 38,
    fontFamily: fonts.serifBlack,
    color: colors.textMain,
    letterSpacing: -1.2,
  },
  subheading: { color: colors.textMuted, fontSize: 15, marginTop: 6 },
  card: {
    marginTop: 28,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, color: colors.textMain, fontSize: 15 },
  error: { color: colors.error, marginTop: 12, fontSize: 13 },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22 },
  line: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { color: colors.textSubtle, fontSize: 12 },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: radii.pill,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryBtnText: { color: colors.primary, fontWeight: "800", fontSize: 15 },
  footer: { textAlign: "center", color: colors.textSubtle, fontSize: 12, marginTop: 22 },
});
