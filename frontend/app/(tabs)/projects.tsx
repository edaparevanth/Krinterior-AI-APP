import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { formatINR } from "@/src/constants/design";
import { useTheme } from "@/src/contexts/ThemeContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

type ProjectSummary = {
  id: string;
  name: string;
  room_type: string;
  budget: number;
  total_cost?: number;
  vastu_score?: number;
  created_at: string;
};

export default function ProjectsTab() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ProjectSummary[]>("/projects");
      setProjects(res.data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onDelete = (id: string) => {
    Alert.alert("Delete project?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/projects/${id}`);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: tc.textMain }]}>My Projects</Text>
          <Text style={[styles.subtitle, { color: tc.textMuted }]}>
            {projects.length} saved designs
          </Text>
        </View>
        <TouchableOpacity
          testID="projects-create-btn"
          style={styles.fab}
          onPress={() => router.push("/create")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: space.xl, gap: 12 }}
          data={projects}
          keyExtractor={(p) => p.id}
          ListEmptyComponent={
            <View style={styles.empty} testID="projects-empty">
              <Ionicons name="albums-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptySub}>
                Start designing your first space with AI.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/create")}
              >
                <Text style={styles.primaryBtnText}>Create New Design</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`project-card-${item.id}`}
              activeOpacity={0.85}
              onPress={() => router.push(`/project/${item.id}`)}
              style={styles.card}
            >
              <View style={styles.thumb}>
                <Ionicons name="image" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {item.room_type} · {formatINR(item.total_cost || item.budget)}
                </Text>
                <Text style={styles.meta2}>
                  Vastu {item.vastu_score ?? "–"} · {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                testID={`project-delete-${item.id}`}
                onPress={() => onDelete(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: space.xl,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  title: { fontFamily: fonts.serifBlack, fontSize: 34, color: colors.textMain, letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontFamily: fonts.sansReg },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "800", color: colors.textMain, fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  meta2: { color: colors.textSubtle, fontSize: 11, marginTop: 2 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
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
