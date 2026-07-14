import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { registerForPushNotifications } from "@/lib/notifications";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, appUser, logout, groups, expenses } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);

  React.useEffect(() => {
    if (Platform.OS !== "web") {
      Notifications.getPermissionsAsync().then(({ status }) => {
        setNotificationsEnabled(status === "granted");
      });
    }
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (Platform.OS === "web") return;
    setTogglingNotif(true);
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === "granted" && user) {
          await registerForPushNotifications(user.uid);
          setNotificationsEnabled(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert(
            "Permission Denied",
            "Enable notifications in your device settings for Trackcents."
          );
        }
      } else {
        setNotificationsEnabled(false);
      }
    } finally {
      setTogglingNotif(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const displayName = user?.displayName || appUser?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          {user && !user.emailVerified && (
            <View style={s.unverifiedBadge}>
              <Ionicons name="warning-outline" size={14} color={colors.warning} />
              <Text style={s.unverifiedText}>Email not verified</Text>
            </View>
          )}
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{groups.length}</Text>
            <Text style={s.statLabel}>Groups</Text>
          </View>
          <View style={[s.statCard, s.statCardMiddle]}>
            <Text style={s.statValue}>{expenses.length}</Text>
            <Text style={s.statLabel}>Expenses</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>
              {expenses.filter((e) => e.paidBy === user?.uid).length}
            </Text>
            <Text style={s.statLabel}>Paid by you</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Settings</Text>

          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={s.settingLabel}>Push Notifications</Text>
                <Text style={s.settingSubtitle}>Get notified on new expenses</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={togglingNotif || Platform.OS === "web"}
              trackColor={{ false: colors.border, true: `${colors.primary}60` }}
              thumbColor={notificationsEnabled ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>

          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
            <Text style={s.infoText}>Trackcents — Split expenses with friends</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="code-slash-outline" size={18} color={colors.muted} />
            <Text style={s.infoText}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={[s.section, { marginBottom: 0 }]}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Lexend_700Bold" },
    avatarSection: { alignItems: "center", paddingVertical: 28, backgroundColor: colors.surface },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
    displayName: { fontSize: 20, fontWeight: "700", color: colors.foreground },
    email: { fontSize: 14, color: colors.muted, marginTop: 4 },
    unverifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
      backgroundColor: `${colors.warning}20`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    unverifiedText: { fontSize: 12, color: colors.warning, fontWeight: "500" },
    statsRow: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statCardMiddle: {},
    statValue: { fontSize: 24, fontWeight: "700", color: colors.foreground, fontFamily: "Lexend_700Bold" },
    statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
    section: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    settingLabel: { fontSize: 15, fontWeight: "500", color: colors.foreground },
    settingSubtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoText: { fontSize: 14, color: colors.muted },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    logoutText: { fontSize: 15, fontWeight: "600", color: colors.danger },
  });
}
