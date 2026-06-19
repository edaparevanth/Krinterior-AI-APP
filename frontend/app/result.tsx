import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

type Draft = {
  generated_image: string;
  original_image: string;
  furniture_estimate: { name: string; category: string; price_inr: number }[];
  total_cost: number;
  space_analysis: any;
  vastu_report: any;
  vastu_score: number;
  room_type: string;
  budget: number;
  color_palette: string;
  requirements: string;
};

export default function ResultScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const draft = (globalThis as any).__krinteriorDraft as Draft | undefined;
  const [showBefore, setShowBefore] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [saving, setSaving] = useState(false);

  const tone = useMemo(() => {
    const s = draft?.vastu_score ?? 0;
    return s >= 85 ? colors.scoreHigh : s >= 70 ? colors.scoreMed : colors.scoreLow;
  }, [draft?.vastu_score]);

  if (!draft) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={styles.title}>Nothing to show</Text>
          <Text style={styles.sub}>Generate a design first.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/create")}>
            <Text style={styles.primaryBtnText}>Create Design</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const saveProject = async () => {
    if (!projName.trim()) {
      Alert.alert("Name required", "Please give your project a name.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/projects", {
        name: projName.trim(),
        original_image: draft.original_image,
        generated_image: draft.generated_image,
        room_type: draft.room_type,
        budget: draft.budget,
        color_palette: draft.color_palette,
        requirements: draft.requirements,
        furniture_estimate: draft.furniture_estimate,
        total_cost: draft.total_cost,
        vastu_score: draft.vastu_score,
        vastu_report: draft.vastu_report,
        space_analysis: draft.space_analysis,
      });
      setSaveOpen(false);
      setSaving(false);
      (globalThis as any).__krinteriorDraft = undefined;
      router.replace(`/project/${res.data.id}`);
    } catch (e: any) {
      setSaving(false);
      Alert.alert("Save failed", e?.response?.data?.detail || "Try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={[styles.backBtn, { backgroundColor: tc.surface }]}>
            <Ionicons name="close" size={22} color={tc.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textMain }]}>Design Ready</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.imageCard}>
          <Image
            source={{
              uri: `data:image/png;base64,${
                showBefore ? draft.original_image : draft.generated_image
              }`,
            }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.toggle}>
            <TouchableOpacity
              testID="toggle-after"
              onPress={() => setShowBefore(false)}
              style={[styles.toggleBtn, !showBefore && styles.toggleBtnActive]}
            >
              <Text
                style={[styles.toggleText, !showBefore && { color: "#fff" }]}
              >
                After
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="toggle-before"
              onPress={() => setShowBefore(true)}
              style={[styles.toggleBtn, showBefore && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, showBefore && { color: "#fff" }]}>
                Before
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryTile k="Room" v={draft.room_type} />
          <SummaryTile k="Budget" v={formatINR(draft.budget)} />
          <SummaryTile k="Palette" v={draft.color_palette} />
          <SummaryTile k="Items" v={`${draft.furniture_estimate?.length || 0}`} />
        </View>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>VASTU SCORE</Text>
            <Text style={[styles.scoreVal, { color: tone }]}>
              {draft.vastu_score}/100
            </Text>
            <Text style={styles.scoreSummary} numberOfLines={2}>
              {draft.vastu_report?.summary || "Vastu evaluation"}
            </Text>
          </View>
          <View style={[styles.scoreCircle, { borderColor: tone }]}>
            <Text style={[styles.scoreCircleText, { color: tone }]}>
              {draft.vastu_score}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Furniture & Cost</Text>
        <View style={styles.card}>
          {draft.furniture_estimate?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCat}>{item.category}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatINR(item.price_inr)}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 4 }]}>
            <Text style={[styles.itemName, { fontWeight: "900" }]}>Total</Text>
            <Text style={[styles.itemPrice, { color: colors.primary, fontSize: 16 }]}>
              {formatINR(draft.total_cost)}
            </Text>
          </View>
        </View>

        {draft.space_analysis?.design_opportunities?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Space Analysis</Text>
            <View style={styles.card}>
              {draft.space_analysis.estimated_size_sqft ? (
                <Text style={styles.dim}>
                  Estimated size: {draft.space_analysis.estimated_size_sqft} sq ft
                </Text>
              ) : null}
              {draft.space_analysis.design_opportunities?.map((o: string, i: number) => (
                <View key={i} style={styles.bullet}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={styles.bulletText}>{o}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          testID="save-project-btn"
          style={styles.saveBtn}
          activeOpacity={0.9}
          onPress={() => {
            setProjName(`${draft.room_type} - ${new Date().toLocaleDateString()}`);
            setSaveOpen(true);
          }}
        >
          <Ionicons name="bookmark" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Project</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/create")} style={styles.regenBtn}>
          <Text style={styles.regenText}>Discard & Try Again</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal visible={saveOpen} transparent animationType="fade" onRequestClose={() => setSaveOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name your project</Text>
            <TextInput
              testID="project-name-input"
              value={projName}
              onChangeText={setProjName}
              placeholder="My dream living room"
              placeholderTextColor={colors.textSubtle}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                onPress={() => setSaveOpen(false)}
                style={[styles.modalBtn, { backgroundColor: colors.background }]}
              >
                <Text style={{ color: colors.textMain, fontWeight: "800" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="save-confirm-btn"
                onPress={saveProject}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryTile({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileK}>{k}</Text>
      <Text style={styles.tileV} numberOfLines={1}>
        {v}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, gap: space.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: { fontWeight: "900", fontSize: 16, color: colors.textMain },
  title: { fontSize: 26, fontWeight: "900", color: colors.textMain },
  sub: { color: colors.textMuted, marginTop: 6 },
  imageCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    height: 280,
    backgroundColor: colors.white,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  toggle: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: 4,
  },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontWeight: "800", fontSize: 12, color: colors.textMain },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tileK: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  tileV: { marginTop: 4, fontSize: 15, fontWeight: "800", color: colors.textMain },

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scoreLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "800", letterSpacing: 1.8 },
  scoreVal: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  scoreSummary: { color: colors.textMuted, fontSize: 12, marginTop: 4, maxWidth: 200 },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircleText: { fontWeight: "900", fontSize: 22 },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: colors.textMain, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  itemName: { fontWeight: "700", color: colors.textMain, fontSize: 14 },
  itemCat: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  itemPrice: { fontWeight: "800", color: colors.textMain, fontSize: 14 },
  dim: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  bullet: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 8 },
  bulletText: { flex: 1, color: colors.textMain, fontSize: 13 },

  saveBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.pill,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  regenBtn: { alignSelf: "center", paddingVertical: 12 },
  regenText: { color: colors.textMuted, fontWeight: "700" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radii.pill,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 24 },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: radii.xl,
    padding: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.textMain, marginBottom: 12 },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textMain,
    fontSize: 15,
  },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: radii.pill, alignItems: "center" },
});
