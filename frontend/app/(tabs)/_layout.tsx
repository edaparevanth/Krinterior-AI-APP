import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { fonts } from "@/src/theme/fonts";

function CenterCreateButton({ onPress, bg, border }: { onPress: () => void; bg: string; border: string }) {
  return (
    <TouchableOpacity
      testID="tab-create-fab"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.fabWrap}
    >
      <View style={[styles.fab, { backgroundColor: bg, borderColor: border }]}>
        <Ionicons name="sparkles" size={26} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/(auth)/login");
  }, [user, loading, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          height: 78,
          paddingBottom: 12,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.sansSemi },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "albums" : "albums-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-tab"
        options={{
          title: "",
          tabBarButton: () => (
            <CenterCreateButton
              bg={colors.primary}
              border={colors.background}
              onPress={() => router.push("/create")}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: "Ideas",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bulb" : "bulb-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen name="vastu" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    top: -22,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
});
