import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { formatINRShort } from "@/src/constants/design";
import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

const HERO_IMG =
  "https://static.prod-images.emergentagent.com/jobs/44ee0fce-a68a-45fc-aa10-26ffee77de4f/images/d311bfc1ec2b88f34c9f1a6421bc4c09f61617182b93e09df97acf7cfdcaa3af.png";

type ProjectSummary = {
  id: string;
  name: string;
  room_type: string;
  budget: number;
  total_cost?: number;
  vastu_score?: number;
  created_at: string;
};

export default function Home() {
  const { user } = useAuth();
  const { colors: tc } = useTheme();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ProjectSummary[]>("/projects");
      setProjects(res.data);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = user?.full_name?.split(" ")[0] || "designer";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header greeting */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.namaste, { color: tc.textMuted }]}>
              Namaste, <Text style={[styles.namasteName, { color: tc.textMain }]}>{firstName}</Text>{" "}
              <Text style={{ fontSize: 18 }}>✨</Text>
            </Text>
            <Text style={[styles.brand, { color: tc.textMain }]}>
              KRINTERIOR <Text style={{ fontFamily: fonts.serifRegular }}>—</Text> AI
            </Text>
          </View>
          <TouchableOpacity
            testID="header-profile-btn"
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Image source={{ uri: HERO_IMG }} style={styles.heroImg} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.75)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroOver}>AI INTERIOR STUDIO</Text>
            <Text style={styles.heroTitle}>Design Your{"\n"}Dream Space</Text>
            <Text style={styles.heroSub}>
              Transform any empty room into a luxury Indian interior in 30 seconds.
            </Text>
            <TouchableOpacity
              testID="create-new-design-btn"
              style={styles.ctaBtn}
              onPress={() => router.push("/create")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.ctaText}>Create New Design</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Studio */}
        <Text style={[styles.sectionTitle, { color: tc.textMain }]}>Quick Studio</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsRow}
        >
          <ToolCard
            testID="tool-ai-generator"
            iconBg={tc.pastelOrange}
            iconColor={tc.primary}
            surface={tc.surface}
            textMain={tc.textMain}
            textMuted={tc.textMuted}
            icon="sparkles"
            title="AI Generator"
            subtitle="Empty room → furnished"
            onPress={() => router.push("/create")}
          />
          <ToolCard
            testID="tool-vastu"
            iconBg={tc.pastelGold}
            iconColor="#D4AF37"
            surface={tc.surface}
            textMain={tc.textMain}
            textMuted={tc.textMuted}
            icon="compass"
            title="Vastu Shastra"
            subtitle="Score + placements"
            onPress={() => router.push("/(tabs)/vastu")}
          />
          <ToolCard
            testID="tool-design-ideas"
            iconBg={tc.pastelLilac}
            iconColor="#9B7BE0"
            surface={tc.surface}
            textMain={tc.textMain}
            textMuted={tc.textMuted}
            icon="bulb"
            title="Design Ideas"
            subtitle="Curated inspirations"
            onPress={() => router.push("/(tabs)/ideas")}
          />
          <ToolCard
            testID="tool-projects"
            iconBg={tc.pastelMint}
            iconColor="#5DBF95"
            surface={tc.surface}
            textMain={tc.textMain}
            textMuted={tc.textMuted}
            icon="albums"
            title="Projects"
            subtitle={`${projects.length} saved`}
            onPress={() => router.push("/(tabs)/projects")}
          />
        </ScrollView>

        {/* Recent projects */}
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: tc.textMain }]}>Recent Projects</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/projects")}>
            <Text style={styles.link}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : projects.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: tc.surface }]} testID="recent-empty">
            <Text style={[styles.emptyTitle, { color: tc.textMain }]}>No projects yet</Text>
            <Text style={[styles.emptySub, { color: tc.textMuted }]}>
              Tap “Create New Design” to generate your first AI interior.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingRight: space.xl }}
          >
            {projects.slice(0, 6).map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                onPress={() => router.push(`/project/${p.id}`)}
              />
            ))}
          </ScrollView>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ToolCard({
  icon,
  title,
  subtitle,
  onPress,
  testID,
  iconBg,
  iconColor,
  surface,
  textMain,
  textMuted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
  iconBg: string;
  iconColor: string;
  surface: string;
  textMain: string;
  textMuted: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.toolCard, { backgroundColor: surface }]}
    >
      <View style={[styles.toolIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.toolTitle, { color: textMain }]}>{title}</Text>
      <Text style={[styles.toolSub, { color: textMuted }]} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function ProjectCard({ p, onPress }: { p: ProjectSummary; onPress: () => void }) {
  return (
    <TouchableOpacity
      testID={`recent-project-${p.id}`}
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.projCard}
    >
      <Image
        source={{
          uri: `https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=70`,
        }}
        style={styles.projImg}
        contentFit="cover"
      />
      <View style={styles.projBody}>
        <Text style={styles.projName} numberOfLines={1}>
          {p.name}
        </Text>
        <Text style={styles.projMeta} numberOfLines={1}>
          {p.room_type} · {formatINRShort(p.total_cost || p.budget)}
        </Text>
        <View style={styles.projFooter}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Completed</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, gap: 22 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  namaste: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.textMuted,
  },
  namasteName: { fontFamily: fonts.serif, color: colors.textMain },
  brand: {
    marginTop: 4,
    fontFamily: fonts.serifBlack,
    fontSize: 28,
    color: colors.textMain,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontFamily: fonts.sansBlack,
    fontSize: 16,
  },

  heroCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    height: 360,
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroImg: { width: "100%", height: "100%" },
  heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22 },
  heroOver: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: fonts.sansBlack,
    letterSpacing: 3,
  },
  heroTitle: {
    color: "#fff",
    fontFamily: fonts.serifBlack,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
    marginTop: 6,
  },
  heroSub: {
    color: "rgba(255,255,255,0.92)",
    marginTop: 10,
    fontSize: 14,
    fontFamily: fonts.sansReg,
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: radii.pill,
  },
  ctaText: { color: "#fff", fontFamily: fonts.sansBold, fontSize: 15 },

  sectionTitle: {
    fontFamily: fonts.serifBlack,
    fontSize: 24,
    color: colors.textMain,
    letterSpacing: -0.5,
  },
  toolsRow: { gap: 12, paddingRight: space.xl },
  toolCard: {
    width: 160,
    minHeight: 180,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
    justifyContent: "space-between",
  },
  toolIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  toolTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: 17,
    color: colors.textMain,
    lineHeight: 22,
  },
  toolSub: {
    fontFamily: fonts.sansReg,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  link: { color: colors.primary, fontFamily: fonts.sansBold, fontSize: 14 },

  projCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  projImg: { width: "100%", height: 170 },
  projBody: { padding: 14, gap: 4 },
  projName: { fontFamily: fonts.serifBlack, fontSize: 18, color: colors.textMain },
  projMeta: { fontFamily: fonts.sansReg, color: colors.textMuted, fontSize: 13 },
  projFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  statusPill: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { color: colors.primary, fontFamily: fonts.sansBold, fontSize: 11 },

  empty: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  emptyTitle: { fontFamily: fonts.sansBlack, color: colors.textMain, fontSize: 16 },
  emptySub: { fontFamily: fonts.sansReg, color: colors.textMuted, marginTop: 6, fontSize: 13, textAlign: "center" },
});
