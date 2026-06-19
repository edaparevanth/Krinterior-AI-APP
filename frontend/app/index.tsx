import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { fonts } from "@/src/theme/fonts";

export default function SplashAnimated() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const iconScale = useSharedValue(0.2);
  const iconRotate = useSharedValue(-180);
  const iconOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const iconY = useSharedValue(0);

  useEffect(() => {
    // Icon: fade in, spin, scale up, then bounce slightly up
    iconOpacity.value = withTiming(1, { duration: 600 });
    iconRotate.value = withTiming(0, { duration: 1100, easing: Easing.out(Easing.cubic) });
    iconScale.value = withSequence(
      withTiming(1.15, { duration: 900, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 6, stiffness: 110 }),
    );
    iconY.value = withDelay(
      1100,
      withTiming(-12, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    // Title: slide up + fade in after icon settles
    titleOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(
      1200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    subtitleOpacity.value = withDelay(1700, withTiming(1, { duration: 500 }));
  }, [iconScale, iconRotate, iconOpacity, titleY, titleOpacity, subtitleOpacity, iconY]);

  // Route once auth is resolved + at least the splash beat has played
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace("/(tabs)");
      else router.replace("/(auth)/login");
    }, 2400);
    return () => clearTimeout(t);
  }, [user, loading, router]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { translateY: iconY.value },
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconScale.value, [0.2, 1, 1.15], [0, 0.25, 0.6]),
    transform: [{ scale: interpolate(iconScale.value, [0.2, 1.15], [0.4, 1.2]) }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="splash-screen">
      {/* glow ring behind icon */}
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          { backgroundColor: colors.orangeGlow },
        ]}
      />
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <SwirlMark color={colors.primary} accent={colors.accent} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.title,
          { color: colors.textMain },
          titleStyle,
        ]}
      >
        KRINTERIOR <Animated.Text style={{ color: colors.primary }}>·</Animated.Text> AI
      </Animated.Text>
      <Animated.Text
        style={[
          styles.sub,
          { color: colors.textMuted },
          subStyle,
        ]}
      >
        AI INTERIOR STUDIO
      </Animated.Text>
    </View>
  );
}

/** Stylised orange swirl mark drawn with overlapping rotated bars (no SVG). */
function SwirlMark({ color, accent }: { color: string; accent: string }) {
  return (
    <View style={styles.swirl}>
      <View
        style={[
          styles.swirlBlade,
          { backgroundColor: color, transform: [{ rotate: "0deg" }] },
        ]}
      />
      <View
        style={[
          styles.swirlBlade,
          { backgroundColor: accent, transform: [{ rotate: "120deg" }] },
        ]}
      />
      <View
        style={[
          styles.swirlBlade,
          { backgroundColor: color, transform: [{ rotate: "240deg" }] },
        ]}
      />
      <View style={styles.swirlCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 18 },
  ring: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: "32%",
  },
  iconWrap: { width: 130, height: 130, alignItems: "center", justifyContent: "center" },
  swirl: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  swirlBlade: {
    position: "absolute",
    width: 38,
    height: 90,
    borderRadius: 30,
    top: 6,
  },
  swirlCore: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFFEE",
  },
  title: {
    marginTop: 16,
    fontFamily: fonts.serifBlack,
    fontSize: 30,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 4,
  },
});
