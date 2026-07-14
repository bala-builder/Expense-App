import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, user, users, addComment } = useApp();

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const expense = expenses.find((e) => e.id === id);

  if (!expense) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>Expense not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getUserName = (uid: string) => {
    if (uid === user?.uid) return "You";
    return users.find((u) => u.uid === uid)?.name || "Unknown";
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(expense.id, commentText.trim());
      setCommentText("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const s = makeStyles(colors);

  const header = (
    <View>
      <View style={s.expenseHeader}>
        <View style={[s.expenseIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="receipt" size={28} color={colors.primary} />
        </View>
        <Text style={s.expenseDescription}>{expense.description}</Text>
        <Text style={s.expenseAmount}>
          {expense.currency || "USD"} {expense.amount.toFixed(2)}
        </Text>
        <Text style={s.expenseDate}>{formatDate(expense.date)}</Text>
      </View>

      <View style={s.detailsCard}>
        <View style={s.detailRow}>
          <View style={s.detailIcon}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
          <Text style={s.detailLabel}>Paid by</Text>
          <Text style={s.detailValue}>{getUserName(expense.paidBy)}</Text>
        </View>

        <View style={[s.detailRow, s.detailBorder]}>
          <View style={s.detailIcon}>
            <Ionicons name="people" size={16} color={colors.primary} />
          </View>
          <Text style={s.detailLabel}>Split</Text>
          <Text style={s.detailValue}>
            {expense.splitType === "equal" ? "Equally" : "By percentage"} ({expense.splitAmong?.length || 0} people)
          </Text>
        </View>

        {expense.splitAmong?.map((uid) => {
          let share = "";
          if (expense.splitType === "percentage" && expense.splitDetails) {
            const pct = expense.splitDetails[uid] || 0;
            const amt = (expense.amount * pct) / 100;
            share = `${pct.toFixed(1)}% = ${expense.currency} ${amt.toFixed(2)}`;
          } else if (expense.splitAmong?.length) {
            const amt = expense.amount / expense.splitAmong.length;
            share = `${expense.currency} ${amt.toFixed(2)}`;
          }
          return (
            <View key={uid} style={[s.splitRow, s.detailBorder]}>
              <View style={s.splitAvatar}>
                <Text style={s.splitAvatarText}>
                  {getUserName(uid).substring(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={s.splitName}>{getUserName(uid)}</Text>
              <Text style={s.splitShare}>{share}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.commentsHeader}>
        <Ionicons name="chatbubble-outline" size={18} color={colors.foreground} />
        <Text style={s.commentsTitle}>
          Comments ({expense.comments?.length || 0})
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[s.navHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.navTitle} numberOfLines={1}>Expense Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={expense.comments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.userId === user?.uid;
          return (
            <View style={[s.comment, isMe && s.commentMe]}>
              {!isMe && (
                <View style={s.commentAvatar}>
                  <Text style={s.commentAvatarText}>
                    {item.userName.substring(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[s.commentBubble, isMe && s.commentBubbleMe]}>
                {!isMe && (
                  <Text style={s.commentName}>{item.userName}</Text>
                )}
                <Text style={[s.commentText, isMe && s.commentTextMe]}>
                  {item.text}
                </Text>
                <Text style={[s.commentTime, isMe && s.commentTimeMe]}>
                  {new Date(item.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          );
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={s.emptyComments}>
            <Text style={s.emptyCommentsText}>No comments yet. Be the first!</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={s.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!commentText.trim() || submitting) && s.sendBtnDisabled]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    navHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 4, width: 36 },
    navTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.foreground, textAlign: "center" },
    expenseHeader: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
    },
    expenseIcon: {
      width: 60,
      height: 60,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
      marginBottom: 12,
    },
    expenseDescription: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
      fontFamily: "Lexend_700Bold",
    },
    expenseAmount: {
      fontSize: 32,
      fontWeight: "800",
      color: "#fff",
      marginTop: 6,
      fontFamily: "Lexend_700Bold",
    },
    expenseDate: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      overflow: "hidden",
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    detailBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    detailIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    detailLabel: { flex: 1, fontSize: 14, color: colors.muted, fontWeight: "500" },
    detailValue: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    splitRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      paddingLeft: 14,
      gap: 12,
    },
    splitAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    splitAvatarText: { fontSize: 13, fontWeight: "700", color: colors.primary },
    splitName: { flex: 1, fontSize: 14, color: colors.foreground },
    splitShare: { fontSize: 13, color: colors.muted, fontWeight: "500" },
    commentsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    commentsTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    comment: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    commentMe: { flexDirection: "row-reverse" },
    commentAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: `${colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    commentAvatarText: { fontSize: 12, fontWeight: "700", color: colors.primary },
    commentBubble: {
      maxWidth: "75%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    commentBubbleMe: {
      backgroundColor: colors.primary,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
      borderColor: colors.primary,
    },
    commentName: { fontSize: 11, fontWeight: "600", color: colors.primary, marginBottom: 2 },
    commentText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
    commentTextMe: { color: "#fff" },
    commentTime: { fontSize: 10, color: colors.mutedForeground, marginTop: 3, textAlign: "right" },
    commentTimeMe: { color: "rgba(255,255,255,0.7)" },
    emptyComments: { alignItems: "center", paddingVertical: 24 },
    emptyCommentsText: { fontSize: 14, color: colors.mutedForeground, fontStyle: "italic" },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      padding: 12,
      paddingTop: 10,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.foreground,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.4 },
  });
}
