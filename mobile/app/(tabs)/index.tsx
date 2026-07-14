import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import CreateGroupModal from "@/components/CreateGroupModal";
import AddExpenseModal from "@/components/AddExpenseModal";

const skeletonLine = (width: number, height: number, color: string) => ({
  width,
  height,
  borderRadius: height / 2,
  backgroundColor: color,
});

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, groups, dataLoading, getUserBalance, getGroupUserBalance, getGroupExpenses } = useApp();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const totalBalance = getUserBalance();

  const groupsWithMeta = groups
    .map((g) => {
      const bal = getGroupUserBalance(g.id);
      const expenses = getGroupExpenses(g.id);
      const latestDate = expenses.reduce((max, e) => {
        const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt || 0);
        return d > max ? d : max;
      }, new Date(0));
      return { ...g, balance: bal, latestDate };
    })
    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

  const unsettled = groupsWithMeta.filter((g) => Math.abs(g.balance) >= 0.01);
  const settled = groupsWithMeta.filter((g) => Math.abs(g.balance) < 0.01);

  const handleAddExpense = () => {
    if (groups.length === 0) {
      setShowCreateGroup(true);
    } else if (groups.length === 1) {
      setSelectedGroupId(groups[0].id);
      setShowAddExpense(true);
    } else {
      router.push("/(tabs)/groups");
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const formatBalance = (bal: number) => {
    const abs = Math.abs(bal).toFixed(2);
    if (bal > 0.01) return { label: `You're owed`, amount: `$${abs}`, color: colors.success };
    if (bal < -0.01) return { label: `You owe`, amount: `$${abs}`, color: colors.danger };
    return { label: "All settled", amount: "$0.00", color: colors.muted };
  };

  const balInfo = formatBalance(totalBalance);
  const s = makeStyles(colors);

  if (dataLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <View>
            <Text style={s.greeting}>Hi, {user?.displayName?.split(" ")[0] || "there"} 👋</Text>
            <Text style={s.headerSub}>Your expense overview</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <View style={s.balanceCard}>
            <View style={skeletonLine(90, 12, "rgba(255,255,255,0.3)")} />
            <View style={[skeletonLine(140, 30, "rgba(255,255,255,0.3)"), { marginTop: 8 }]} />
            <View style={[skeletonLine(110, 12, "rgba(255,255,255,0.3)"), { marginTop: 8 }]} />
          </View>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.groupCard, { marginTop: 10 }]}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.border, marginRight: 14 }} />
              <View style={s.groupInfo}>
                <View style={skeletonLine(120, 14, colors.border)} />
                <View style={[skeletonLine(70, 11, colors.border), { marginTop: 6 }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const renderGroup = ({ item }: { item: (typeof groupsWithMeta)[0] }) => {
    const { label, amount, color } = formatBalance(item.balance);
    const isSettled = Math.abs(item.balance) < 0.01;
    return (
      <TouchableOpacity
        style={[s.groupCard, isSettled && s.groupCardDim]}
        onPress={() => router.push(`/group/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={[s.groupAvatar, isSettled && s.groupAvatarDim]}>
          <Text style={[s.groupAvatarText, isSettled && { color: colors.mutedForeground }]}>
            {item.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={s.groupInfo}>
          <Text style={[s.groupName, isSettled && { color: colors.muted }]}>{item.name}</Text>
          <Text style={s.groupMembers}>{item.members.length} members</Text>
        </View>
        <View style={s.groupBalance}>
          {isSettled ? (
            <View style={s.settledBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.muted} />
              <Text style={s.settledText}>Settled</Text>
            </View>
          ) : (
            <Text style={[s.balanceAmount, { color }]}>{amount}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={s.greeting}>Hi, {user?.displayName?.split(" ")[0] || "there"} 👋</Text>
          <Text style={s.headerSub}>Your expense overview</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreateGroup(true)} style={s.newGroupBtn}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...unsettled, ...settled]}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            <View style={s.balanceCard}>
              <Text style={s.balanceLabel}>{balInfo.label}</Text>
              <Text style={[s.balanceValue, { color: balInfo.color }]}>{balInfo.amount}</Text>
              <Text style={s.balanceSubLabel}>across {groups.length} group{groups.length !== 1 ? "s" : ""}</Text>
            </View>

            {unsettled.length > 0 && (
              <Text style={s.sectionTitle}>Unsettled</Text>
            )}
          </View>
        }
        ListFooterComponent={
          settled.length > 0 ? (
            <Text style={[s.sectionTitle, { marginTop: 8 }]}>Settled</Text>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>No groups yet</Text>
            <Text style={s.emptySubtitle}>Create a group to start tracking expenses</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreateGroup(true)}>
              <Text style={s.emptyBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity style={[s.fab, { bottom: insets.bottom + 80 }]} onPress={handleAddExpense}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreateGroupModal visible={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
      {selectedGroupId && (
        <AddExpenseModal
          visible={showAddExpense}
          onClose={() => { setShowAddExpense(false); setSelectedGroupId(null); }}
          groupId={selectedGroupId}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    greeting: { fontSize: 20, fontWeight: "700", color: colors.foreground, fontFamily: "Lexend_700Bold" },
    headerSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
    newGroupBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    balanceCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      marginTop: 16,
      marginBottom: 20,
      alignItems: "center",
    },
    balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Lexend_500Medium" },
    balanceValue: { fontSize: 42, fontWeight: "800", color: "#fff", marginVertical: 4, fontFamily: "Lexend_700Bold" },
    balanceSubLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      fontFamily: "Lexend_600SemiBold",
    },
    groupCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    groupCardDim: { opacity: 0.65 },
    groupAvatar: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    groupAvatarDim: { backgroundColor: colors.border },
    groupAvatarText: { fontSize: 15, fontWeight: "700", color: colors.primary },
    groupInfo: { flex: 1 },
    groupName: { fontSize: 15, fontWeight: "600", color: colors.foreground, fontFamily: "Lexend_600SemiBold" },
    groupMembers: { fontSize: 12, color: colors.muted, marginTop: 2 },
    groupBalance: { alignItems: "flex-end" },
    balanceAmount: { fontSize: 14, fontWeight: "700", fontFamily: "Lexend_700Bold" },
    settledBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    settledText: { fontSize: 12, color: colors.muted },
    emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.foreground },
    emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
    emptyBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 12,
    },
    emptyBtnText: { color: "#fff", fontWeight: "600" },
    fab: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  });
}
