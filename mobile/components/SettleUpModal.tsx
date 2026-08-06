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
  prefill?: {
    fromUid: string;
    toUid: string;
    amount: number;
    currency?: string;
  } | null;
}

export default function SettleUpModal({ visible, onClose, groupId, prefill }: Props) {
  const colors = useColors();
  const { addSettlement, getGroupMembers, user } = useApp();
  const members = getGroupMembers(groupId);

  const [fromUid, setFromUid] = useState("");
  const [toUid, setToUid] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible && prefill) {
      setFromUid(prefill.fromUid);
      setToUid(prefill.toUid);
      setAmount(String(prefill.amount));
      setCurrency(prefill.currency || "USD");
    } else if (visible) {
      setFromUid(user?.uid || "");
      setToUid("");
      setAmount("");
      setCurrency("USD");
      setDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setError("");
    }
  }, [visible, prefill, user]);

  const getMemberName = (uid: string) => {
    if (uid === user?.uid) return "You";
    return members.find((m) => m.uid === uid)?.name || "Unknown";
  };

  const handleSubmit = async () => {
    if (!fromUid || !toUid || fromUid === toUid) {
      setError("Select different payer and recipient");
      return;
    }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addSettlement(groupId, fromUid, toUid, amt, currency, date, note);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      setError("Failed to record settlement");
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.overlay}
      >
        <View style={s.container}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Ionicons name="cash-outline" size={22} color={colors.success} />
              <Text style={s.title}>Settle Up</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Who paid?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.uid}
                  style={[s.chip, fromUid === m.uid && s.chipActive]}
                  onPress={() => {
                    setFromUid(m.uid);
                    if (toUid === m.uid) setToUid("");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[s.chipText, fromUid === m.uid && s.chipTextActive]}>
                    {m.uid === user?.uid ? "You" : m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Who received?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
              {members.filter((m) => m.uid !== fromUid).map((m) => (
                <TouchableOpacity
                  key={m.uid}
                  style={[s.chip, toUid === m.uid && s.chipActive]}
                  onPress={() => {
                    setToUid(m.uid);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[s.chipText, toUid === m.uid && s.chipTextActive]}>
                    {m.uid === user?.uid ? "You" : m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {fromUid && toUid && (
              <View style={s.summaryBox}>
                <Text style={s.summaryText}>
                  {getMemberName(fromUid)} paid {getMemberName(toUid)}
                </Text>
              </View>
            )}

            <View style={s.row}>
              <View style={{ flex: 2 }}>
                <Text style={s.label}>Amount</Text>
                <TextInput
                  style={s.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[s.currencyChip, currency === c && s.chipActive]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text style={[s.chipText, currency === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={s.label}>Date</Text>
            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={s.label}>Note (optional)</Text>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Venmo payment"
              placeholderTextColor={colors.mutedForeground}
            />

            {error ? <Text style={s.error}>{error}</Text> : null}
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitText}>Record Settlement</Text>
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
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    body: { padding: 16 },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 12,
    },
    chipRow: { marginBottom: 4 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: `${colors.primary}20`,
      borderColor: colors.primary,
    },
    chipText: { fontSize: 13, color: colors.muted },
    chipTextActive: { color: colors.primary, fontWeight: "600" },
    currencyChip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 6,
    },
    summaryBox: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
    },
    summaryText: { fontSize: 14, color: colors.foreground },
    row: { flexDirection: "row", gap: 12 },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.foreground,
    },
    error: { color: colors.danger, fontSize: 13, marginTop: 12 },
    footer: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    cancelText: { fontSize: 15, fontWeight: "600", color: colors.muted },
    submitBtn: {
      flex: 2,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    submitText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  });
}
