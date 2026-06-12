import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import CreateGroupModal from "@/components/CreateGroupModal";

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { groups, deleteGroup, getGroupUserBalance, getGroupExpenses } = useApp();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (groupId: string, groupName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Group",
      `Delete "${groupName}" and all its expenses? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert("Error", "Failed to delete group");
            }
          },
        },
      ]
    );
  };

  const formatBalance = (bal: number) => {
    if (bal > 0.01) return { text: `+$${bal.toFixed(2)}`, color: colors.success };
    if (bal < -0.01) return { text: `-$${Math.abs(bal).toFixed(2)}`, color: colors.danger };
    return { text: "Settled", color: colors.muted };
  };

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.title}>Groups</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setShowCreateGroup(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search groups..."
          placeholderTextColor={colors.mutedForeground}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const bal = getGroupUserBalance(item.id);
          const expCount = getGroupExpenses(item.id).length;
          const { text, color } = formatBalance(bal);
          return (
            <TouchableOpacity
              style={s.groupCard}
              onPress={() => router.push(`/group/${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.name)}
              activeOpacity={0.75}
            >
              <View style={s.groupAvatar}>
                <Text style={s.groupAvatarText}>
                  {item.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={s.groupInfo}>
                <Text style={s.groupName}>{item.name}</Text>
                <Text style={s.groupMeta}>
                  {item.members.length} members · {expCount} expenses
                </Text>
              </View>
              <View style={s.groupRight}>
                <Text style={[s.groupBalance, { color }]}>{text}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>
              {search ? "No groups match your search" : "No groups yet"}
            </Text>
            {!search && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreateGroup(true)}>
                <Text style={s.emptyBtnText}>Create your first group</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <CreateGroupModal visible={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
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
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    addBtn: {
      backgroundColor: colors.primary,
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground },
    groupCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    groupAvatar: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    groupAvatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
    groupInfo: { flex: 1 },
    groupName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
    groupMeta: { fontSize: 12, color: colors.muted, marginTop: 3 },
    groupRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    groupBalance: { fontSize: 14, fontWeight: "600" },
    empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 16, color: colors.muted, textAlign: "center" },
    emptyBtn: {
      marginTop: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    emptyBtnText: { color: "#fff", fontWeight: "600" },
  });
}
