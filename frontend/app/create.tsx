import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import {
  BUDGET_PRESETS,
  PALETTES,
  ROOM_TYPES,
  formatINR,
} from "@/src/constants/design";
import { useTheme } from "@/src/contexts/ThemeContext";
import { colors, radii, space } from "@/src/theme/colors";
import { fonts } from "@/src/theme/fonts";

const STAGES = [
  "Analysing your space",
  "Generating furniture",
  "Estimating costs",
  "Computing Vastu",
];

export default function CreateDesign() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const [step, setStep] = useState(0);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string>("");
  const [budget, setBudget] = useState<number>(100000);
  const [customBudget, setCustomBudget] = useState<string>("");
  const [palette, setPalette] = useState<string>("");
  const [requirements, setRequirements] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow gallery access to upload a photo.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow camera access to capture a photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 || null);
    }
  };

  const canNext = (): boolean => {
    if (step === 0) return !!imageBase64;
    if (step === 1) return !!roomType;
    if (step === 2) return budget > 0;
    if (step === 3) return !!palette;
    return true;
  };

  const onNext = () => {
    if (!canNext()) return;
    if (step === 4) {
      submit();
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!imageBase64) return;
    setGenerating(true);
    setStage(0);
    const interval = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 6000);
    try {
      const res = await api.post("/design/generate", {
        image_base64: imageBase64,
        room_type: roomType,
        budget,
        color_palette: palette,
        requirements,
      });
      clearInterval(interval);
      (globalThis as any).__krinteriorDraft = {
        ...res.data,
        original_image: imageBase64,
        room_type: roomType,
        budget,
        color_palette: palette,
        requirements,
      };
      router.replace(`/result?ts=${Date.now()}`);
    } catch (e: any) {
      clearInterval(interval);
      Alert.alert(
        "Generation failed",
        e?.response?.data?.detail || "Please try again with a clearer photo.",
      );
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator color={tc.primary} size="large" />
          <Text style={[styles.loadingTitle, { color: tc.textMain }]}>
            Designing your space
          </Text>
          <Text style={[styles.loadingSub, { color: tc.textMuted }]}>
            This usually takes 30–60 seconds
          </Text>
          <View style={[styles.stageCard, { backgroundColor: tc.surface }]}>
            {STAGES.map((s, i) => (
              <View key={s} style={styles.stageRow}>
                <View
                  style={[
                    styles.stageDot,
                    i < stage && { backgroundColor: colors.success },
                    i === stage && { backgroundColor: colors.primary },
                  ]}
                >
                  {i < stage ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : i === stage ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stageText,
                    i <= stage && { color: colors.textMain, fontFamily: fonts.sansBold },
                  ]}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
            style={[styles.backBtn, { backgroundColor: tc.surface }]}
          >
            <Ionicons name="chevron-back" size={22} color={tc.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textMain }]}>Create Design</Text>
          <Text style={[styles.stepCount, { color: tc.textMuted }]}>{step + 1} / 5</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                { backgroundColor: tc.border },
                i <= step && { backgroundColor: tc.primary },
              ]}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View style={{ gap: 16 }}>
              <Text style={[styles.title, { color: tc.textMain }]}>Upload your{"\n"}empty room</Text>
              <Text style={[styles.sub, { color: tc.textMuted }]}>
                Capture or select a photograph of the empty space you want to design.
              </Text>

              <View style={[styles.preview, { backgroundColor: tc.surface }]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImg} contentFit="cover" />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Ionicons name="image-outline" size={42} color={tc.textSubtle} />
                    <Text style={[styles.previewEmptyText, { color: tc.textSubtle }]}>
                      Photo preview
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                testID="take-photo-btn"
                style={[styles.uploadRow, { backgroundColor: tc.surface }]}
                onPress={takePhoto}
              >
                <View style={[styles.uploadIcon, { backgroundColor: tc.pastelOrange }]}>
                  <Ionicons name="camera" size={22} color={tc.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadRowTitle, { color: tc.textMain }]}>Take Photo</Text>
                  <Text style={[styles.uploadRowSub, { color: tc.textMuted }]}>
                    Capture the room with your camera
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={tc.textSubtle} />
              </TouchableOpacity>

              <TouchableOpacity
                testID="upload-area"
                style={[styles.uploadRow, { backgroundColor: tc.surface }]}
                onPress={pickFromGallery}
              >
                <View style={[styles.uploadIcon, { backgroundColor: tc.pastelMint }]}>
                  <Ionicons name="images" size={22} color="#5DBF95" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadRowTitle, { color: tc.textMain }]}>
                    Choose from Gallery
                  </Text>
                  <Text style={[styles.uploadRowSub, { color: tc.textMuted }]}>
                    Pick an existing photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={tc.textSubtle} />
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View style={{ gap: 16 }}>
              <Text style={[styles.title, { color: tc.textMain }]}>What room{"\n"}is this?</Text>
              <Text style={[styles.sub, { color: tc.textMuted }]}>
                Help our AI understand the space so it can design it perfectly.
              </Text>

              <View style={{ gap: 14, marginTop: 8 }}>
                {ROOM_TYPES.map((r) => {
                  const active = roomType === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      testID={`room-${r.id}`}
                      onPress={() => setRoomType(r.id)}
                      style={[
                        styles.roomCard,
                        { backgroundColor: tc.surface },
                        active && { borderColor: tc.primary },
                      ]}
                    >
                      <Image
                        source={{ uri: r.image }}
                        style={styles.roomImg}
                        contentFit="cover"
                      />
                      <View style={styles.roomBody}>
                        <Text style={[styles.roomLabel, { color: tc.textMain }]}>{r.label}</Text>
                        {active ? (
                          <View style={[styles.roomCheck, { backgroundColor: tc.primary }]}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 16 }}>
              <Text style={[styles.title, { color: tc.textMain }]}>Set your{"\n"}budget</Text>
              <Text style={[styles.sub, { color: tc.textMuted }]}>
                Indian Rupees · we tailor furniture quality accordingly.
              </Text>

              <Text style={[styles.bigBudget, { color: tc.primary }]}>{formatINR(budget)}</Text>

              <View style={styles.budgetGrid}>
                {BUDGET_PRESETS.map((b) => {
                  const active = budget === b.value;
                  return (
                    <Pressable
                      key={b.value}
                      testID={`budget-${b.value}`}
                      onPress={() => {
                        setBudget(b.value);
                        setCustomBudget("");
                      }}
                      style={[
                        styles.budgetPill,
                        { backgroundColor: tc.surface },
                        active && { backgroundColor: tc.primary },
                      ]}
                    >
                      <Text style={[styles.budgetText, { color: tc.textMain }, active && { color: "#fff" }]}>
                        {b.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: tc.textMuted }]}>CUSTOM BUDGET (₹)</Text>
              <TextInput
                testID="custom-budget-input"
                style={[styles.input, { backgroundColor: tc.surface, color: tc.textMain }]}
                placeholder="e.g. 150000"
                placeholderTextColor={tc.textSubtle}
                keyboardType="number-pad"
                value={customBudget}
                onChangeText={(t) => {
                  setCustomBudget(t);
                  const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
                  if (!isNaN(n) && n > 0) setBudget(n);
                }}
              />
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 16 }}>
              <Text style={[styles.title, { color: tc.textMain }]}>Pick your{"\n"}palette</Text>
              <Text style={[styles.sub, { color: tc.textMuted }]}>
                Sets the mood and warmth of your design.
              </Text>
              <View style={styles.paletteGrid}>
                {PALETTES.map((p) => {
                  const active = palette === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      testID={`palette-${p.id}`}
                      onPress={() => setPalette(p.id)}
                      style={[
                        styles.paletteCard,
                        { backgroundColor: tc.surface },
                        active && { borderColor: tc.primary, backgroundColor: tc.accentSoft },
                      ]}
                    >
                      <View style={styles.paletteSwatches}>
                        {p.swatch.map((c, i) => (
                          <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                        ))}
                      </View>
                      <Text style={[styles.paletteLabel, { color: tc.textMain }, active && { color: tc.primary }]}>
                        {p.id}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={{ gap: 16 }}>
              <Text style={[styles.title, { color: tc.textMain }]}>Tell us your{"\n"}requirements</Text>
              <Text style={[styles.sub, { color: tc.textMuted }]}>
                What do you envision? (optional)
              </Text>
              <TextInput
                testID="requirements-input"
                value={requirements}
                onChangeText={setRequirements}
                multiline
                numberOfLines={6}
                placeholder="e.g. Need luxury sofa, TV unit, traditional teak finish, family-friendly layout, more storage..."
                placeholderTextColor={tc.textSubtle}
                style={[styles.textarea, { backgroundColor: tc.surface, color: tc.textMain }]}
              />
              <View style={styles.suggestRow}>
                {[
                  "Luxury sofa",
                  "Modern luxury",
                  "Traditional teak",
                  "Family friendly",
                  "More storage",
                ].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setRequirements((prev) => (prev ? prev + ", " + s : s))}
                    style={[styles.suggestPill, { backgroundColor: tc.accentSoft }]}
                  >
                    <Text style={[styles.suggestText, { color: tc.primary }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.summaryCard, { backgroundColor: tc.surface }]}>
                <Text style={[styles.summaryTitle, { color: tc.textMain }]}>Design Summary</Text>
                <SummaryRow k="Room" v={roomType} kColor={tc.textMuted} vColor={tc.textMain} />
                <SummaryRow k="Budget" v={formatINR(budget)} kColor={tc.textMuted} vColor={tc.textMain} />
                <SummaryRow k="Palette" v={palette} kColor={tc.textMuted} vColor={tc.textMain} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            testID="wizard-next-btn"
            disabled={!canNext()}
            onPress={onNext}
            activeOpacity={0.9}
            style={[
              styles.primaryBtn,
              !canNext() && { backgroundColor: colors.accent },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {step === 4 ? "Generate Design" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({
  k,
  v,
  kColor,
  vColor,
}: {
  k: string;
  v: string;
  kColor?: string;
  vColor?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryK, kColor ? { color: kColor } : null]}>{k}</Text>
      <Text style={[styles.summaryV, vColor ? { color: vColor } : null]}>{v || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: fonts.sansBlack, fontSize: 15, color: colors.textMain },
  stepCount: { color: colors.textMuted, fontFamily: fonts.sansBold, fontSize: 13 },

  progressBar: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: space.xl,
    marginBottom: 4,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 999,
  },

  scroll: { padding: space.xl, paddingBottom: 60 },
  title: {
    fontFamily: fonts.serifBlack,
    fontSize: 38,
    color: colors.textMain,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.sansReg,
    fontSize: 15,
    lineHeight: 22,
  },

  preview: {
    height: 220,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  previewImg: { width: "100%", height: "100%" },
  previewEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  previewEmptyText: { color: colors.textSubtle, fontFamily: fonts.sansReg },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadRowTitle: { fontFamily: fonts.sansBlack, fontSize: 16, color: colors.textMain },
  uploadRowSub: { fontFamily: fonts.sansReg, color: colors.textMuted, fontSize: 13, marginTop: 2 },

  roomCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  roomCardActive: { borderColor: colors.primary },
  roomImg: { width: "100%", height: 160 },
  roomBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomLabel: { fontFamily: fonts.sansBlack, fontSize: 17, color: colors.textMain },
  roomCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  bigBudget: {
    fontFamily: fonts.serifBlack,
    fontSize: 54,
    color: colors.primary,
    letterSpacing: -2,
    textAlign: "center",
    marginVertical: 8,
  },
  budgetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  budgetPill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
  },
  budgetPillActive: { backgroundColor: colors.primary },
  budgetText: { fontFamily: fonts.sansBold, color: colors.textMain, fontSize: 15 },
  label: {
    marginTop: 18,
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.sansBlack,
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textMain,
    fontFamily: fonts.sansSemi,
  },

  paletteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  paletteCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paletteCardActive: { borderColor: colors.primary, backgroundColor: colors.accentSoft },
  paletteSwatches: { flexDirection: "row", gap: 6, marginBottom: 10 },
  swatch: { flex: 1, height: 40, borderRadius: 10 },
  paletteLabel: { fontFamily: fonts.sansBold, color: colors.textMain, fontSize: 14 },

  textarea: {
    minHeight: 140,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
    fontSize: 15,
    color: colors.textMain,
    fontFamily: fonts.sansReg,
    textAlignVertical: "top",
  },
  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
  },
  suggestText: { color: colors.primary, fontFamily: fonts.sansBold, fontSize: 12 },

  summaryCard: {
    marginTop: 8,
    padding: 18,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  summaryTitle: {
    fontFamily: fonts.serifBlack,
    fontSize: 18,
    color: colors.textMain,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  summaryK: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sansReg },
  summaryV: { color: colors.textMain, fontFamily: fonts.sansBold, fontSize: 14 },

  footer: { paddingHorizontal: space.xl, paddingTop: 8, paddingBottom: space.xl },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontFamily: fonts.sansBlack,
    fontSize: 18,
    letterSpacing: 0.3,
  },

  loading: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 },
  loadingTitle: {
    marginTop: 12,
    fontSize: 24,
    fontFamily: fonts.serifBlack,
    color: colors.textMain,
  },
  loadingSub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sansReg },
  stageCard: {
    marginTop: 24,
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 20,
    gap: 14,
  },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stageDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stageText: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.sansReg },
});
