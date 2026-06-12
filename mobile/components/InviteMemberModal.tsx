import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export default function InviteMemberModal({ visible, onClose, groupId, groupName }: Props) {
  const colors = useColors();
  const { inviteToGroup } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Enter an email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await inviteToGroup(groupId, trimmed, groupName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setEmail("");
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Invite Member</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.subtitle}>
              Invite someone to <Text style={{ color: colors.primary, fontWeight: "600" }}>{groupName}</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              placeholder="friend@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              onSubmitEditing={handleInvite}
              returnKeyType="send"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.successText}>Invitation sent!</Text>
              </View>
            ) : null}
            <Text style={styles.hint}>
              If this person isn't on Trackcents yet, they'll receive an email invitation.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.inviteBtn, (!email.trim() || loading) && styles.disabledBtn]}
              onPress={handleInvite}
              disabled={!email.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={18} color="#fff" />
                  <Text style={styles.inviteBtnText}>Send Invite</Text>
                </>
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
    subtitle: { fontSize: 15, color: colors.muted, marginBottom: 20 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.foreground,
    },
    errorText: { fontSize: 13, color: colors.danger, marginTop: 8 },
    successRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    successText: { fontSize: 13, color: colors.success, fontWeight: "500" },
    hint: { fontSize: 12, color: colors.mutedForeground, marginTop: 16, lineHeight: 18 },
    footer: {
      padding: 20,
      paddingBottom: 32,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inviteBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    disabledBtn: { opacity: 0.5 },
    inviteBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  });
}
