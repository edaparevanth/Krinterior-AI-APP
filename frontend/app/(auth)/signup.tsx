import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

import { useAuth } from "@/src/contexts/AuthContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

export default function Signup() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim() || undefined);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not create account");
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
          <LinearGradient
            colors={[colors.accentSoft, colors.white]}
            style={styles.heroOrb}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Join KRINTERIOR AI and start designing today</Text>

          <View style={styles.card}>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="signup-name-input"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ananya Sharma"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>EMAIL</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                testID="signup-email-input"
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
                testID="signup-password-input"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {error ? (
              <Text testID="signup-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="signup-submit-button"
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.footerLink}>
                Already have an account?{" "}
                <Text style={{ color: colors.primary, fontWeight: "800" }}>Sign In</Text>
              </Text>
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
  heroOrb: {
    position: "absolute",
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    opacity: 0.7,
  },
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
  footerLink: { textAlign: "center", color: colors.textMuted, marginTop: 18, fontSize: 14 },
});
