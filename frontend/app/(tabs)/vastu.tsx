import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { useTheme } from "@/src/contexts/ThemeContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

type ProjectSummary = {
  id: string;
  name: string;
  room_type: string;
  budget: number;
  vastu_score?: number;
  total_cost?: number;
};

export default function VastuTab() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get<ProjectSummary[]>("/projects");
          setProjects(res.data);
        } catch {
          setProjects([]);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const reanalyse = async (id: string) => {
    setAnalyzingId(id);
    try {
      await api.post("/vastu/analyze", { project_id: id });
      const res = await api.get<ProjectSummary[]>("/projects");
      setProjects(res.data);
    } catch {
      // ignore
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: tc.textMain }]}>Vastu Shastra</Text>
        <Text style={[styles.subtitle, { color: tc.textMuted }]}>
          Ancient Indian principles applied to your modern interiors.
        </Text>

        <View style={styles.bannerCard}>
          <View style={styles.bannerIcon}>
            <Ionicons name="compass" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Energy & Direction</Text>
            <Text style={styles.bannerSub}>
              Score: 0–100. Discover positive zones, issues, and recommendations for every project.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Saved Projects</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : projects.length === 0 ? (
          <View style={styles.empty} testID="vastu-empty">
            <Ionicons name="leaf-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No projects to analyse yet</Text>
            <Text style={styles.emptySub}>Save a project to unlock its Vastu report.</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/create")}
            >
              <Text style={styles.primaryBtnText}>Create New Design</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {projects.map((p) => (
              <View key={p.id} style={styles.row} testID={`vastu-row-${p.id}`}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => router.push(`/project/${p.id}?tab=vastu`)}
                >
                  <Text style={styles.rowTitle}>{p.name}</Text>
                  <Text style={styles.rowSub}>{p.room_type}</Text>
                </TouchableOpacity>
                <ScoreCircle value={p.vastu_score ?? 0} />
                <TouchableOpacity
                  testID={`vastu-reanalyse-${p.id}`}
                  onPress={() => reanalyse(p.id)}
                  style={styles.reBtn}
                  disabled={analyzingId === p.id}
                >
                  {analyzingId === p.id ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreCircle({ value }: { value: number }) {
  const tone =
    value >= 85 ? colors.scoreHigh : value >= 70 ? colors.scoreMed : value > 0 ? colors.scoreLow : colors.border;
  return (
    <View style={[styles.scoreCircle, { borderColor: tone }]}>
      <Text style={[styles.scoreVal, { color: tone }]}>{value || "–"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, gap: space.lg },
  title: { fontFamily: fonts.serifBlack, fontSize: 34, color: colors.textMain, letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sansReg },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    marginTop: 8,
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  bannerSub: { color: "rgba(255,255,255,0.85)", marginTop: 2, fontSize: 12 },
  sectionTitle: { marginTop: 12, fontSize: 16, fontWeight: "900", color: colors.textMain },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowTitle: { fontWeight: "800", color: colors.textMain, fontSize: 14 },
  rowSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreVal: { fontWeight: "900", fontSize: 14 },
  reBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontWeight: "800", color: colors.textMain, fontSize: 15, marginTop: 6 },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
});
