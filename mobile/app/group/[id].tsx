import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import AddExpenseModal from "@/components/AddExpenseModal";
import InviteMemberModal from "@/components/InviteMemberModal";
import SettleUpModal from "@/components/SettleUpModal";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    groups,
    user,
    getGroupExpenses,
    getGroupMembers,
    getGroupUserBalance,
    getGroupDebtsSummary,
    getGroupSettlements,
    deleteExpense,
    removeGroupMember,
  } = useApp();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [settleUpPrefill, setSettleUpPrefill] = useState<{
    fromUid: string;
    toUid: string;
    amount: number;
    currency?: string;
  } | null>(null);

  const group = groups.find((g) => g.id === id);
  const expenses = getGroupExpenses(id || "").sort((a, b) => {
    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || 0);
    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || 0);
    return bDate.getTime() - aDate.getTime();
  });
  const members = getGroupMembers(id || "");
  const groupBalance = getGroupUserBalance(id || "");
  const groupDebts = getGroupDebtsSummary(id || "");
  const groupSettlements = getGroupSettlements(id || "");

  const getMemberName = (uid: string) =>
    uid === user?.uid ? "You" : members.find((m) => m.uid === uid)?.name || "Someone";

  const openSettleUp = (debt?: typeof settleUpPrefill) => {
    setSettleUpPrefill(debt || null);
    setShowSettleUp(true);
  };

  if (!group) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatBalance = (bal: number) => {
    if (bal > 0.01) return { text: `You're owed $${bal.toFixed(2)}`, color: colors.success };
    if (bal < -0.01) return { text: `You owe $${Math.abs(bal).toFixed(2)}`, color: colors.danger };
    return { text: "All settled up", color: colors.muted };
  };

  const balInfo = formatBalance(groupBalance);

  const handleDeleteExpense = (expenseId: string, desc: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Expense", `Delete "${desc}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(expenseId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert("Error", "Failed to delete expense");
          }
        },
      },
    ]);
  };

  const handleRemoveMember = (uid: string, name: string) => {
    if (uid === user?.uid) {
      Alert.alert("Leave Group", "Remove yourself from this group?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await removeGroupMember(id!, uid);
            router.back();
          },
        },
      ]);
      return;
    }
    if (group.createdBy !== user?.uid) return;
    Alert.alert("Remove Member", `Remove ${name} from this group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeGroupMember(id!, uid),
      },
    ]);
  };

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{group.name}</Text>
        <TouchableOpacity onPress={() => setShowInvite(true)} style={s.inviteBtn}>
          <Ionicons name="person-add-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const paidByName = getMemberName(item.paidBy);
          const isYou = item.paidBy === user?.uid;
          return (
            <TouchableOpacity
              style={s.expenseCard}
              onPress={() => router.push(`/expense/${item.id}`)}
              onLongPress={() => handleDeleteExpense(item.id, item.description)}
              activeOpacity={0.8}
            >
              <View style={[s.expIcon, { backgroundColor: isYou ? `${colors.primary}15` : `${colors.warning}15` }]}>
                <Ionicons name="receipt-outline" size={18} color={isYou ? colors.primary : colors.warning} />
              </View>
              <View style={s.expInfo}>
                <Text style={s.expDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={s.expMeta}>
                  {paidByName} paid · {item.date || ""}
                </Text>
              </View>
              <View style={s.expRight}>
                <Text style={s.expAmount}>
                  {item.currency} {item.amount.toFixed(2)}
                </Text>
                {item.comments?.length > 0 && (
                  <View style={s.commentBadge}>
                    <Ionicons name="chatbubble-outline" size={11} color={colors.muted} />
                    <Text style={s.commentCount}>{item.comments.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          <View>
            <View style={s.balanceCard}>
              <Text style={[s.balanceText, { color: balInfo.color }]}>{balInfo.text}</Text>
              <TouchableOpacity style={s.settleBtn} onPress={() => openSettleUp()}>
                <Ionicons name="cash-outline" size={16} color={colors.primary} />
                <Text style={s.settleBtnText}>Settle Up</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.sectionTitle}>Balances</Text>
            {groupDebts.length === 0 ? (
              <View style={s.emptyDebts}>
                <Text style={s.emptyDebtsText}>
                  {expenses.length === 0
                    ? "Add expenses to see balances."
                    : "All settled up!"}
                </Text>
              </View>
            ) : (
              groupDebts.map((debt, i) => (
                <TouchableOpacity
                  key={`${debt.fromUid}-${debt.toUid}-${debt.currency}-${i}`}
                  style={s.debtCard}
                  onPress={() => openSettleUp(debt)}
                  activeOpacity={0.8}
                >
                  <View style={s.debtInfo}>
                    <Text style={s.debtText}>
                      <Text style={s.debtName}>{getMemberName(debt.fromUid)}</Text>
                      {" owes "}
                      <Text style={s.debtName}>{getMemberName(debt.toUid)}</Text>
                    </Text>
                    <Text style={s.debtAmount}>
                      {debt.currency} {debt.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={s.debtSettle}>
                    <Text style={s.debtSettleText}>Settle</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))
            )}

            {groupSettlements.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 16 }]}>Settlements</Text>
                {groupSettlements
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((settlement) => (
                    <View key={settlement.id} style={s.settlementCard}>
                      <View style={[s.expIcon, { backgroundColor: `${colors.success}15` }]}>
                        <Ionicons name="cash-outline" size={16} color={colors.success} />
                      </View>
                      <View style={s.expInfo}>
                        <Text style={s.expDesc}>
                          {getMemberName(settlement.fromUid)} paid {getMemberName(settlement.toUid)}
                        </Text>
                        <Text style={s.expMeta}>
                          {settlement.date}
                          {settlement.note ? ` · ${settlement.note}` : ""}
                        </Text>
                      </View>
                      <Text style={[s.expAmount, { color: colors.success }]}>
                        {settlement.currency} {settlement.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
              </>
            )}

            <Text style={s.sectionTitle}>Members</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.memberScroll}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.uid}
                  style={s.memberChip}
                  onLongPress={() => handleRemoveMember(m.uid, m.name)}
                >
                  <View style={s.memberAvatar}>
                    <Text style={s.memberAvatarText}>
                      {m.name.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={s.memberChipName} numberOfLines={1}>
                    {m.uid === user?.uid ? "You" : m.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.addMemberChip} onPress={() => setShowInvite(true)}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={s.addMemberText}>Invite</Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>Expenses</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.mutedForeground} />
            <Text style={s.emptyText}>No expenses yet</Text>
            <Text style={s.emptySubText}>Tap + to add the first expense</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => setShowAddExpense(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        groupId={id || ""}
      />
      <InviteMemberModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        groupId={id || ""}
        groupName={group.name}
      />
      <SettleUpModal
        visible={showSettleUp}
        onClose={() => { setShowSettleUp(false); setSettleUpPrefill(null); }}
        groupId={id || ""}
        prefill={settleUpPrefill}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Lexend_700Bold",
    },
    inviteBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    balanceText: { fontSize: 15, fontWeight: "700", fontFamily: "Lexend_700Bold", flex: 1 },
    settleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
    },
    settleBtnText: { fontSize: 13, fontWeight: "600", color: colors.primary },
    emptyDebts: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    emptyDebtsText: { fontSize: 13, color: colors.muted },
    debtCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    debtInfo: { flex: 1 },
    debtText: { fontSize: 14, color: colors.foreground },
    debtName: { fontWeight: "600" },
    debtAmount: { fontSize: 13, color: colors.danger, fontWeight: "700", marginTop: 4 },
    debtSettle: { flexDirection: "row", alignItems: "center", gap: 2 },
    debtSettleText: { fontSize: 13, fontWeight: "600", color: colors.primary },
    settlementCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    memberScroll: { marginBottom: 16 },
    memberChip: {
      alignItems: "center",
      marginRight: 16,
      width: 60,
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    memberAvatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
    memberChipName: { fontSize: 11, color: colors.muted, textAlign: "center" },
    addMemberChip: {
      alignItems: "center",
      marginRight: 16,
      width: 60,
    },
    addMemberText: { fontSize: 11, color: colors.primary, marginTop: 6 },
    expenseCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    expInfo: { flex: 1, marginRight: 8 },
    expDesc: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    expMeta: { fontSize: 12, color: colors.muted, marginTop: 3 },
    expRight: { alignItems: "flex-end" },
    expAmount: { fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: "Lexend_700Bold" },
    commentBadge: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
    commentCount: { fontSize: 11, color: colors.muted },
    empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
    emptyText: { fontSize: 16, fontWeight: "600", color: colors.foreground },
    emptySubText: { fontSize: 13, color: colors.muted },
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
