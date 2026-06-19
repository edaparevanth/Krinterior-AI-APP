import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DESIGN_IDEAS } from "@/src/constants/design";
import { useTheme } from "@/src/contexts/ThemeContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

export default function Ideas() {
  const router = useRouter();
  const { colors: tc } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: tc.textMain }]}>Design Ideas</Text>
        <Text style={[styles.subtitle, { color: tc.textMuted }]}>
          Curated inspirations for modern Indian homes.
        </Text>

        <View style={styles.grid}>
          {DESIGN_IDEAS.map((idea) => (
            <TouchableOpacity
              key={idea.id}
              testID={`idea-${idea.id}`}
              activeOpacity={0.85}
              onPress={() => router.push("/create")}
              style={[styles.card, { backgroundColor: tc.surface }]}
            >
              <Image source={{ uri: idea.image }} style={styles.img} contentFit="cover" />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: tc.textMain }]} numberOfLines={2}>
                  {idea.title}
                </Text>
                <Text style={styles.cardCta}>Get inspired →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, gap: space.lg },
  title: { fontFamily: fonts.serifBlack, fontSize: 34, color: colors.textMain, letterSpacing: -1 },
  subtitle: { fontFamily: fonts.sansReg, color: colors.textMuted, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  img: { width: "100%", height: 140 },
  cardBody: { padding: 12, gap: 4 },
  cardTitle: { fontFamily: fonts.serifBlack, fontSize: 15, color: colors.textMain },
  cardCta: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary, marginTop: 4 },
});
