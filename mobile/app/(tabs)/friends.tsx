import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function FriendsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getFriends, getFriendBalance } = useApp();

  const friends = getFriends();
  const friendsWithBalance = friends
    .map((f) => ({ ...f, balance: getFriendBalance(f.uid) }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  const totalOwed = friendsWithBalance
    .filter((f) => f.balance > 0.01)
    .reduce((sum, f) => sum + f.balance, 0);
  const totalOwing = friendsWithBalance
    .filter((f) => f.balance < -0.01)
    .reduce((sum, f) => sum + Math.abs(f.balance), 0);

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.title}>Friends</Text>
      </View>

      {friends.length > 0 && (
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderColor: `${colors.success}30` }]}>
            <Text style={s.summaryLabel}>You're owed</Text>
            <Text style={[s.summaryValue, { color: colors.success }]}>
              ${totalOwed.toFixed(2)}
            </Text>
          </View>
          <View style={[s.summaryCard, { borderColor: `${colors.danger}30` }]}>
            <Text style={s.summaryLabel}>You owe</Text>
            <Text style={[s.summaryValue, { color: colors.danger }]}>
              ${totalOwing.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={friendsWithBalance}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => {
          const isOwed = item.balance > 0.01;
          const isOwing = item.balance < -0.01;
          const initials = item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          return (
            <View style={s.friendCard}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.friendInfo}>
                <Text style={s.friendName}>{item.name}</Text>
                <Text style={s.friendEmail}>{item.email}</Text>
              </View>
              <View style={s.balanceWrap}>
                {isOwed && (
                  <View>
                    <Text style={s.balanceLabel}>Owes you</Text>
                    <Text style={[s.balanceAmount, { color: colors.success }]}>
                      +${item.balance.toFixed(2)}
                    </Text>
                  </View>
                )}
                {isOwing && (
                  <View>
                    <Text style={s.balanceLabel}>You owe</Text>
                    <Text style={[s.balanceAmount, { color: colors.danger }]}>
                      -${Math.abs(item.balance).toFixed(2)}
                    </Text>
                  </View>
                )}
                {!isOwed && !isOwing && (
                  <View style={s.settledBadge}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                    <Text style={s.settledText}>Settled</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>No friends yet</Text>
            <Text style={s.emptySubtitle}>
              Add members to a group to see them here
            </Text>
          </View>
        }
      />
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
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    summaryRow: { flexDirection: "row", gap: 12, padding: 16, paddingBottom: 0 },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      alignItems: "center",
    },
    summaryLabel: { fontSize: 12, color: colors.muted, fontWeight: "500" },
    summaryValue: { fontSize: 22, fontWeight: "700", marginTop: 4, fontFamily: "Inter_700Bold" },
    friendCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    avatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
    friendInfo: { flex: 1 },
    friendName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    friendEmail: { fontSize: 12, color: colors.muted, marginTop: 2 },
    balanceWrap: { alignItems: "flex-end" },
    balanceLabel: { fontSize: 11, color: colors.muted, textAlign: "right" },
    balanceAmount: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    settledBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    settledText: { fontSize: 13, color: colors.success, fontWeight: "500" },
    empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.foreground },
    emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
  });
}
