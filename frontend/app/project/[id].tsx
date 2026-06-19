import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { formatINR } from "@/src/constants/design";
import { useTheme } from "@/src/contexts/ThemeContext";
import { colors, radii, space } from "@/src/theme/colors";

type Project = {
  id: string;
  name: string;
  room_type: string;
  budget: number;
  total_cost: number;
  color_palette: string;
  requirements: string;
  original_image: string;
  generated_image: string;
  furniture_estimate: { name: string; category: string; price_inr: number }[];
  vastu_score: number;
  vastu_report: any;
  space_analysis: any;
  created_at: string;
};

export default function ProjectDetail() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const { colors: tc } = useTheme();
  const [proj, setProj] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBefore, setShowBefore] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "vastu">(
    tab === "vastu" ? "vastu" : "design",
  );
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Project>(`/projects/${id}`);
        setProj(res.data);
        setName(res.data.name);
      } catch {
        Alert.alert("Not found", "Project not found.");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleDelete = () => {
    Alert.alert("Delete project?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/projects/${id}`);
          router.replace("/(tabs)/projects");
        },
      },
    ]);
  };

  const handleRename = async () => {
    if (!name.trim()) return;
    const res = await api.patch<Project>(`/projects/${id}`, { name: name.trim() });
    setProj(res.data);
    setRenameOpen(false);
  };

  const reanalyseVastu = async () => {
    setReanalyzing(true);
    try {
      const res = await api.post(`/vastu/analyze`, { project_id: id });
      if (proj) {
        setProj({ ...proj, vastu_score: res.data.vastu_score, vastu_report: res.data.vastu_report });
      }
    } catch {
      // ignore
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading || !proj) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const tone =
    proj.vastu_score >= 85 ? colors.scoreHigh : proj.vastu_score >= 70 ? colors.scoreMed : colors.scoreLow;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: tc.surface }]}>
            <Ionicons name="chevron-back" size={22} color={tc.textMain} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.headerTitle, { color: tc.textMain }]} numberOfLines={1}>{proj.name}</Text>
            <Text style={[styles.headerSub, { color: tc.textMuted }]}>{proj.room_type}</Text>
          </View>
          <TouchableOpacity onPress={() => setRenameOpen(true)} style={[styles.iconBtn, { backgroundColor: tc.surface }]}>
            <Ionicons name="create-outline" size={18} color={tc.textMain} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TabBtn label="Design" active={activeTab === "design"} onPress={() => setActiveTab("design")} />
          <TabBtn label="Vastu" active={activeTab === "vastu"} onPress={() => setActiveTab("vastu")} />
        </View>

        {activeTab === "design" ? (
          <>
            <View style={styles.imageCard}>
              <Image
                source={{
                  uri: `data:image/png;base64,${showBefore ? proj.original_image : proj.generated_image}`,
                }}
                style={styles.image}
                contentFit="cover"
              />
              <View style={styles.toggle}>
                <TouchableOpacity
                  onPress={() => setShowBefore(false)}
                  style={[styles.toggleBtn, !showBefore && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleText, !showBefore && { color: "#fff" }]}>After</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowBefore(true)}
                  style={[styles.toggleBtn, showBefore && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleText, showBefore && { color: "#fff" }]}>Before</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <Tile k="Budget" v={formatINR(proj.budget)} />
              <Tile k="Spent" v={formatINR(proj.total_cost)} />
              <Tile k="Palette" v={proj.color_palette} />
              <Tile k="Items" v={`${proj.furniture_estimate?.length || 0}`} />
            </View>

            <Text style={styles.sectionTitle}>Furniture & Cost</Text>
            <View style={styles.card}>
              {proj.furniture_estimate?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCat}>{item.category}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatINR(item.price_inr)}</Text>
                </View>
              ))}
              <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                <Text style={[styles.itemName, { fontWeight: "900" }]}>Total</Text>
                <Text style={[styles.itemPrice, { color: colors.primary, fontSize: 16 }]}>
                  {formatINR(proj.total_cost)}
                </Text>
              </View>
            </View>

            {proj.requirements ? (
              <>
                <Text style={styles.sectionTitle}>Requirements</Text>
                <View style={styles.card}>
                  <Text style={{ color: colors.textMain }}>{proj.requirements}</Text>
                </View>
              </>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.scoreBigCard}>
              <View style={[styles.scoreBigCircle, { borderColor: tone }]}>
                <Text style={[styles.scoreBigVal, { color: tone }]}>{proj.vastu_score}</Text>
                <Text style={styles.scoreBigTotal}>/100</Text>
              </View>
              <Text style={styles.scoreBigSummary}>
                {proj.vastu_report?.summary || "Vastu evaluation"}
              </Text>
              <TouchableOpacity
                testID="reanalyse-btn"
                onPress={reanalyseVastu}
                style={styles.reanalyseBtn}
                disabled={reanalyzing}
              >
                {reanalyzing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={styles.reanalyseText}>Re-analyse Vastu</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <VastuSection
              title="Positive Aspects"
              icon="checkmark-circle"
              color={colors.success}
              items={proj.vastu_report?.positive_aspects || []}
            />
            <VastuSection
              title="Potential Issues"
              icon="warning"
              color={colors.warning}
              items={proj.vastu_report?.issues || []}
            />
            <VastuSection
              title="Recommendations"
              icon="bulb"
              color={colors.primary}
              items={proj.vastu_report?.recommendations || []}
            />

            {proj.vastu_report?.energy_flow ? (
              <>
                <Text style={styles.sectionTitle}>Energy Flow</Text>
                <View style={styles.card}>
                  <Text style={{ color: colors.textMain }}>{proj.vastu_report.energy_flow}</Text>
                </View>
              </>
            ) : null}
          </>
        )}

        <TouchableOpacity testID="delete-project-btn" style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete Project</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={renameOpen} transparent animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename project</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity onPress={() => setRenameOpen(false)} style={[styles.modalBtn, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textMain, fontWeight: "800" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && { color: "#fff" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileK}>{k}</Text>
      <Text style={styles.tileV} numberOfLines={1}>{v}</Text>
    </View>
  );
}

function VastuSection({
  title,
  icon,
  color,
  items,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((s, i) => (
          <View key={i} style={styles.bullet}>
            <Ionicons name={icon} size={16} color={color} />
            <Text style={styles.bulletText}>{s}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, gap: space.lg },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: { fontWeight: "900", color: colors.textMain, fontSize: 16 },
  headerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: "row", gap: 8, backgroundColor: colors.white, padding: 4, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderLight },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 999 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: "800", color: colors.textMain },

  imageCard: { borderRadius: radii.xl, overflow: "hidden", height: 260, position: "relative" },
  image: { width: "100%", height: "100%" },
  toggle: { position: "absolute", top: 12, right: 12, flexDirection: "row", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 999, padding: 4 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: "800", fontSize: 12, color: colors.textMain },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { flexBasis: "48%", flexGrow: 1, backgroundColor: colors.white, padding: 14, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderLight },
  tileK: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  tileV: { marginTop: 4, fontSize: 15, fontWeight: "800", color: colors.textMain },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: colors.textMain, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderLight, padding: 14 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  itemName: { fontWeight: "700", color: colors.textMain, fontSize: 14 },
  itemCat: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  itemPrice: { fontWeight: "800", color: colors.textMain, fontSize: 14 },

  scoreBigCard: { alignItems: "center", padding: 24, backgroundColor: colors.white, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderLight, gap: 12 },
  scoreBigCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, alignItems: "center", justifyContent: "center" },
  scoreBigVal: { fontSize: 48, fontWeight: "900" },
  scoreBigTotal: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  scoreBigSummary: { textAlign: "center", color: colors.textMain, fontSize: 14 },
  reanalyseBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.accentSoft, borderRadius: 999 },
  reanalyseText: { color: colors.primary, fontWeight: "800" },

  bullet: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 8 },
  bulletText: { flex: 1, color: colors.textMain, fontSize: 13, lineHeight: 19 },

  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: "#FEE2E2", borderRadius: radii.pill, marginTop: 8 },
  deleteText: { color: colors.error, fontWeight: "800" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: radii.xl, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.textMain, marginBottom: 12 },
  modalInput: { backgroundColor: colors.background, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, color: colors.textMain, fontSize: 15 },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: radii.pill, alignItems: "center" },
});
