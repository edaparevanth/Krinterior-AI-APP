import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { colors, mode, toggle } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.textMain }]}>Profile</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.full_name || user?.email || "K").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.textMain }]}>
            {user?.full_name || "Designer"}
          </Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
        </View>

        {/* Settings */}
        <Text style={[styles.section, { color: colors.textMuted }]}>SETTINGS</Text>
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]} testID="dark-mode-row">
            <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons
                name={mode === "dark" ? "moon" : "sunny"}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.textMain }]}>Dark mode</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                {mode === "dark" ? "On — easier on the eyes" : "Off — light & warm"}
              </Text>
            </View>
            <Switch
              testID="dark-mode-switch"
              value={mode === "dark"}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <Row
            icon="albums"
            label="My Projects"
            colors={colors}
            onPress={() => router.push("/(tabs)/projects")}
          />
          <Row
            icon="sparkles"
            label="Vastu Shastra"
            colors={colors}
            onPress={() => router.push("/(tabs)/vastu")}
          />
          <Row
            icon="add-circle"
            label="Create New Design"
            colors={colors}
            onPress={() => router.push("/create")}
            last
          />
        </View>

        <TouchableOpacity
          testID="signout-btn"
          onPress={handleSignOut}
          style={[styles.signOut, { backgroundColor: mode === "dark" ? "#3A1414" : "#FEE2E2" }]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.textSubtle }]}>KRINTERIOR AI · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  onPress,
  last,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        !last && { borderBottomColor: colors.borderLight, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
      activeOpacity={0.85}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.textMain, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: space.xl, gap: space.lg },
  title: { fontFamily: fonts.serifBlack, fontSize: 34, letterSpacing: -1 },
  card: {
    borderRadius: radii.xl,
    padding: space.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 32, fontFamily: fonts.sansBlack },
  name: { marginTop: 12, fontSize: 20, fontFamily: fonts.serifBlack },
  email: { marginTop: 4, fontFamily: fonts.sansReg },
  section: { fontSize: 11, fontFamily: fonts.sansBlack, letterSpacing: 2, marginTop: 4 },
  list: { borderRadius: radii.lg, overflow: "hidden", borderWidth: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontFamily: fonts.sansBold, fontSize: 15 },
  rowSub: { fontFamily: fonts.sansReg, fontSize: 12, marginTop: 2 },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.pill,
  },
  signOutText: { fontFamily: fonts.sansBlack },
  footer: { textAlign: "center", fontSize: 12, fontFamily: fonts.sansReg },
});
