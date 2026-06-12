import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "MXN"];

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  preselectedGroupId?: string;
}

export default function AddExpenseModal({ visible, onClose, groupId }: Props) {
  const colors = useColors();
  const { addExpense, getGroupMembers, user } = useApp();
  const members = getGroupMembers(groupId);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidBy, setPaidBy] = useState(user?.uid || "");
  const [splitType, setSplitType] = useState<"equal" | "percentage">("equal");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    if (visible && members.length > 0) {
      const allUids = members.map((m) => m.uid);
      setSplitAmong(allUids);
      const equal = (100 / allUids.length).toFixed(1);
      const percs: Record<string, string> = {};
      allUids.forEach((uid) => (percs[uid] = equal));
      setPercentages(percs);
      setPaidBy(user?.uid || allUids[0]);
    }
  }, [visible, groupId]);

  const toggleMember = (uid: string) => {
    if (splitAmong.includes(uid)) {
      setSplitAmong(splitAmong.filter((id) => id !== uid));
    } else {
      setSplitAmong([...splitAmong, uid]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const percentTotal = Object.values(percentages).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );

  const handleSubmit = async () => {
    if (!description.trim()) { setError("Description is required"); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    if (splitAmong.length === 0) { setError("Select at least one member to split with"); return; }
    if (splitType === "percentage" && Math.abs(percentTotal - 100) > 0.5) {
      setError(`Percentages must total 100% (currently ${percentTotal.toFixed(1)}%)`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const details: Record<string, number> = {};
      if (splitType === "percentage") {
        splitAmong.forEach((uid) => {
          details[uid] = parseFloat(percentages[uid] || "0");
        });
      }
      await addExpense(groupId, description.trim(), amt, date, paidBy, splitAmong, splitType, details, currency);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDescription("");
      setAmount("");
      setError("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Expense</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Dinner, tickets, groceries..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />

            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <TouchableOpacity
                style={styles.currencyBtn}
                onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
              >
                <Text style={styles.currencyText}>{currency}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>

            {showCurrencyPicker && (
              <View style={styles.currencyPicker}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyOption, c === currency && styles.currencySelected]}
                    onPress={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                  >
                    <Text style={[styles.currencyOptionText, c === currency && { color: colors.primary, fontWeight: "700" }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={styles.label}>Paid By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.uid}
                  style={[styles.memberChip, paidBy === m.uid && styles.memberChipSelected]}
                  onPress={() => { setPaidBy(m.uid); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.memberChipText, paidBy === m.uid && styles.memberChipTextSelected]}>
                    {m.uid === user?.uid ? "You" : m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.splitRow}>
              <Text style={styles.label}>Split</Text>
              <View style={styles.splitToggle}>
                <TouchableOpacity
                  style={[styles.splitBtn, splitType === "equal" && styles.splitBtnActive]}
                  onPress={() => setSplitType("equal")}
                >
                  <Text style={[styles.splitBtnText, splitType === "equal" && styles.splitBtnTextActive]}>
                    Equal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.splitBtn, splitType === "percentage" && styles.splitBtnActive]}
                  onPress={() => setSplitType("percentage")}
                >
                  <Text style={[styles.splitBtnText, splitType === "percentage" && styles.splitBtnTextActive]}>
                    %
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {members.map((m) => (
              <View key={m.uid} style={styles.memberRow}>
                <TouchableOpacity
                  style={styles.memberCheckRow}
                  onPress={() => toggleMember(m.uid)}
                >
                  <View style={[styles.checkbox, splitAmong.includes(m.uid) && styles.checkboxChecked]}>
                    {splitAmong.includes(m.uid) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.memberName}>
                    {m.uid === user?.uid ? "You" : m.name}
                  </Text>
                </TouchableOpacity>
                {splitType === "percentage" && splitAmong.includes(m.uid) && (
                  <View style={styles.percentInputWrap}>
                    <TextInput
                      style={styles.percentInput}
                      value={percentages[m.uid] || ""}
                      onChangeText={(v) => setPercentages({ ...percentages, [m.uid]: v })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.mutedForeground}
                    />
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                )}
                {splitType === "equal" && splitAmong.includes(m.uid) && amount && (
                  <Text style={styles.equalShare}>
                    {currency} {(parseFloat(amount) / splitAmong.length).toFixed(2)}
                  </Text>
                )}
              </View>
            ))}

            {splitType === "percentage" && (
              <Text style={[styles.percentTotal, Math.abs(percentTotal - 100) > 0.5 && { color: colors.danger }]}>
                Total: {percentTotal.toFixed(1)}%
              </Text>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addBtn, loading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addBtnText}>Add Expense</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    closeBtn: { padding: 4 },
    body: { flex: 1, padding: 20 },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      marginBottom: 8,
      marginTop: 16,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.foreground,
      marginBottom: 0,
    },
    amountRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    currencyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      paddingVertical: 13,
    },
    currencyText: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    currencyPicker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    currencySelected: { backgroundColor: `${colors.primary}20` },
    currencyOptionText: { fontSize: 13, color: colors.foreground },
    chipRow: { marginBottom: 4 },
    memberChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    memberChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    memberChipText: { fontSize: 14, color: colors.muted, fontWeight: "500" },
    memberChipTextSelected: { color: "#fff" },
    splitRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      marginBottom: 8,
    },
    splitToggle: {
      flexDirection: "row",
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 2,
    },
    splitBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
    splitBtnActive: { backgroundColor: colors.surface },
    splitBtnText: { fontSize: 13, color: colors.muted, fontWeight: "600" },
    splitBtnTextActive: { color: colors.foreground },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    memberCheckRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    memberName: { fontSize: 15, color: colors.foreground },
    percentInputWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
    percentInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 14,
      color: colors.foreground,
      width: 60,
      textAlign: "right",
    },
    percentSign: { fontSize: 14, color: colors.muted },
    equalShare: { fontSize: 13, color: colors.muted, fontWeight: "500" },
    percentTotal: { fontSize: 13, color: colors.muted, marginTop: 12, textAlign: "right" },
    errorText: { fontSize: 13, color: colors.danger, marginTop: 12 },
    footer: {
      padding: 20,
      paddingBottom: 32,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: "center",
    },
    disabledBtn: { opacity: 0.6 },
    addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
}
