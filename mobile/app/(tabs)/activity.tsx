import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, groups, user, users } = useApp();

  const sortedExpenses = [...expenses].sort((a, b) => {
    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  });

  const getGroupName = (groupId: string) =>
    groups.find((g) => g.id === groupId)?.name || "Unknown Group";

  const getPaidByName = (uid: string) => {
    if (uid === user?.uid) return "You";
    return users.find((u) => u.uid === uid)?.name || "Someone";
  };

  const formatDate = (exp: any) => {
    if (exp.createdAt?.toDate) {
      return exp.createdAt.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    if (exp.date) return exp.date;
    return "";
  };

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.title}>Activity</Text>
        <Text style={s.subtitle}>{sortedExpenses.length} total expenses</Text>
      </View>

      <FlatList
        data={sortedExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const paidByName = getPaidByName(item.paidBy);
          const isYou = item.paidBy === user?.uid;
          return (
            <TouchableOpacity
              style={s.expenseCard}
              onPress={() => router.push(`/expense/${item.id}`)}
              activeOpacity={0.75}
            >
              <View style={[s.expenseIcon, { backgroundColor: isYou ? `${colors.primary}15` : `${colors.warning}15` }]}>
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={isYou ? colors.primary : colors.warning}
                />
              </View>
              <View style={s.expenseInfo}>
                <Text style={s.expenseDesc} numberOfLines={1}>
                  {item.description}
                </Text>
                <View style={s.expenseMeta}>
                  <View style={s.groupBadge}>
                    <Text style={s.groupBadgeText} numberOfLines={1}>
                      {getGroupName(item.groupId)}
                    </Text>
                  </View>
                  <Text style={s.paidByText}>
                    {paidByName} paid
                  </Text>
                </View>
              </View>
              <View style={s.expenseRight}>
                <Text style={s.expenseAmount}>
                  {item.currency || "USD"} {item.amount.toFixed(2)}
                </Text>
                <Text style={s.expenseDate}>{formatDate(item)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>No expenses yet</Text>
            <Text style={s.emptySubtitle}>
              Add an expense from a group to see it here
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
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Lexend_700Bold" },
    subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
    expenseCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expenseIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    expenseInfo: { flex: 1, marginRight: 8 },
    expenseDesc: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    expenseMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    groupBadge: {
      backgroundColor: `${colors.primary}15`,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      maxWidth: 120,
    },
    groupBadgeText: { fontSize: 11, color: colors.primary, fontWeight: "500" },
    paidByText: { fontSize: 11, color: colors.muted },
    expenseRight: { alignItems: "flex-end" },
    expenseAmount: { fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: "Lexend_700Bold" },
    expenseDate: { fontSize: 11, color: colors.muted, marginTop: 3 },
    empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.foreground },
    emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
  });
}
